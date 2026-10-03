<?php
// SPDX-License-Identifier: MIT
// KLXM Studio – Motion. Copyright (C) 2026 KLXM and contributors (see LICENSE)
declare(strict_types=1);

namespace Klxm\Motion;

/**
 * Szene einer Animation (JSON in motion_animations.data) – prüfen und auf erlaubte Werte bringen.
 *   {w, h, bg, dur (s), loop, trigger: view|load|hover, els: [Element]}
 *   Element: {id, type: rect|ellipse|path|text|image|lib, x, y, w, h, rot, op, fill, stroke, sw, r (Ecken),
 *             d + vw/vh (Pfad im eigenen Raum), text, fs, fw, font (sans|serif|mono), align (start|middle|end),
 *             mid (Bild aus der Mediathek), lib (ID aus Library), name, ease, kf: [{t 0..1, dx, dy, s, r, o, draw}]}
 * Alles Unbekannte fällt weg; Farben nur #rgb/#rrggbb oder „none“, Pfade nur aus SVG-Pfadbefehlen und Zahlen.
 */
final class Scene
{
    public const TYPES = ['rect', 'ellipse', 'path', 'text', 'image', 'lib'];
    public const EASE = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'spring'];
    public const MAX_ELS = 120;

    public static function blank(): array
    {
        return ['w' => 800, 'h' => 450, 'bg' => '', 'dur' => 4, 'loop' => true, 'trigger' => 'view', 'els' => []];
    }

    public static function normalize(mixed $raw): array
    {
        $s = is_array($raw) ? $raw : [];
        $out = [
            'w' => self::int($s['w'] ?? 800, 80, 4000), 'h' => self::int($s['h'] ?? 450, 60, 4000),
            'bg' => self::color($s['bg'] ?? '', ''), 'dur' => self::num($s['dur'] ?? 4, .5, 120),
            'loop' => !empty($s['loop']), 'trigger' => in_array($s['trigger'] ?? '', ['view', 'load', 'hover'], true) ? $s['trigger'] : 'view',
            'els' => [],
        ];
        $ids = [];
        foreach (array_slice(array_values(array_filter((array) ($s['els'] ?? []), 'is_array')), 0, self::MAX_ELS) as $e) {
            $type = in_array($e['type'] ?? '', self::TYPES, true) ? $e['type'] : null;
            if ($type === null) continue;
            $id = preg_match('~^[a-z0-9]{1,16}$~i', (string) ($e['id'] ?? '')) && !isset($ids[$e['id']]) ? (string) $e['id'] : 'e' . count($ids);
            $ids[$id] = true;
            $el = ['id' => $id, 'type' => $type, 'name' => mb_substr(trim(strip_tags((string) ($e['name'] ?? ''))), 0, 60),
                'x' => self::num($e['x'] ?? 0, -8000, 8000), 'y' => self::num($e['y'] ?? 0, -8000, 8000),
                'w' => self::num($e['w'] ?? 100, 1, 8000), 'h' => self::num($e['h'] ?? 100, 1, 8000),
                'rot' => self::num($e['rot'] ?? 0, -3600, 3600), 'op' => self::num($e['op'] ?? 1, 0, 1),
                'fill' => self::color($e['fill'] ?? '#581D47', 'none'), 'stroke' => self::color($e['stroke'] ?? 'none', 'none'),
                'sw' => self::num($e['sw'] ?? 0, 0, 200), 'ease' => in_array($e['ease'] ?? '', self::EASE, true) ? $e['ease'] : 'ease-in-out'];
            switch ($type) {
                case 'rect': $el['r'] = self::num($e['r'] ?? 0, 0, 4000); break;
                case 'path':
                    $d = (string) ($e['d'] ?? '');
                    if (!preg_match('~^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s+\-]{1,60000}$~', $d)) continue 2;
                    $el['d'] = $d; $el['vw'] = self::num($e['vw'] ?? $el['w'], 1, 8000); $el['vh'] = self::num($e['vh'] ?? $el['h'], 1, 8000);
                    $el['cap'] = in_array($e['cap'] ?? '', ['round', 'butt', 'square'], true) ? $e['cap'] : 'round';
                    break;
                case 'text':
                    $el['text'] = mb_substr(str_replace("\r", '', (string) ($e['text'] ?? '')), 0, 500);
                    $el['fs'] = self::num($e['fs'] ?? 32, 4, 600); $fw = (int) ($e['fw'] ?? 700); $el['fw'] = in_array($fw, [300, 400, 500, 600, 700, 800, 900], true) ? $fw : 700;
                    $el['font'] = in_array($e['font'] ?? '', ['sans', 'serif', 'mono'], true) ? $e['font'] : 'sans';
                    $el['align'] = in_array($e['align'] ?? '', ['start', 'middle', 'end'], true) ? $e['align'] : 'start';
                    break;
                case 'image': $el['mid'] = max(0, (int) ($e['mid'] ?? 0)); $el['fit'] = ($e['fit'] ?? '') === 'contain' ? 'contain' : 'cover'; break;
                case 'lib':
                    if (!isset(Library::all()[$e['lib'] ?? ''])) continue 2;
                    $el['lib'] = (string) $e['lib'];
                    break;
            }
            $kf = [];
            foreach (array_slice(array_values(array_filter((array) ($e['kf'] ?? []), 'is_array')), 0, 40) as $k) {
                $kf[] = ['t' => self::num($k['t'] ?? 0, 0, 1), 'dx' => self::num($k['dx'] ?? 0, -8000, 8000), 'dy' => self::num($k['dy'] ?? 0, -8000, 8000),
                    's' => self::num($k['s'] ?? 1, 0, 40), 'r' => self::num($k['r'] ?? 0, -7200, 7200), 'o' => self::num($k['o'] ?? 1, 0, 1),
                    'draw' => self::num($k['draw'] ?? 1, 0, 1)];
            }
            usort($kf, fn($a, $b) => $a['t'] <=> $b['t']);
            $el['kf'] = $kf;
            $out['els'][] = $el;
        }
        return $out;
    }

    private static function num(mixed $v, float $min, float $max): float
    {
        $f = is_numeric($v) ? (float) $v : $min;
        return round(max($min, min($max, $f)), 3);
    }

    private static function int(mixed $v, int $min, int $max): int
    {
        return (int) max($min, min($max, is_numeric($v) ? (int) $v : $min));
    }

    private static function color(mixed $v, string $fallback): string
    {
        $v = strtolower(trim((string) $v));
        return preg_match('~^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$~', $v) || $v === 'none' ? $v : $fallback;
    }
}
