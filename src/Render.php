<?php
// SPDX-License-Identifier: MIT
// KLXM Studio – Motion. Copyright (C) 2026 KLXM and contributors (see LICENSE)
declare(strict_types=1);

namespace Klxm\Motion;

use Core\Media;

/**
 * Szene → SVG (ohne style-Attribute) + CSS (Keyframes) für die Website – passend zur strengen CSP.
 *   <svg class="mo mo-{k}" data-mo data-trigger=… data-loop=…>
 *     <g transform="translate(x y) rotate(rot cx cy)" opacity=…><g class="mo-a mo-a{n}">Form</g></g>
 * Bewegung (dx, dy, Skalierung, Drehung, Deckkraft, Zeichnen) läuft über CSS auf .mo-a{n} (transform-box: fill-box).
 * Zustände: Ruhe = Ende der Animation (ohne JavaScript, „Bewegung reduzieren“, Druck); .is-armed = Anfang (wartet aufs
 * Abspielen); .is-play spielt; .is-play ohne .is-vis hält Schleifen außerhalb des Bildes an (public/js/motion.js).
 * CSS je Fassung einmal geschrieben: media/motion/m{id}-{hash}.css.
 */
final class Render
{
    /** Fassung der Ausgabe – mit jeder Änderung an SVG-Aufbau oder CSS erhöhen, damit alte Dateien in media/motion nicht greifen */
    public const VERSION = 2;

    public static function key(array $row): string
    {
        return 'm' . (int) $row['id'] . '-' . substr(sha1(self::VERSION . '|' . (string) $row['data']), 0, 8);
    }

    public static function svg(array $row, string $label = ''): string
    {
        $s = Scene::normalize(json_decode((string) $row['data'], true));
        $k = self::key($row);
        $lib = Library::all();
        $label = trim($label) !== '' ? $label : (string) $row['title'];
        $out = '<svg class="mo mo-' . $k . '" viewBox="0 0 ' . $s['w'] . ' ' . $s['h'] . '" role="img" aria-label="' . e($label) . '" data-mo data-trigger="' . $s['trigger'] . '"'
            . ($s['loop'] ? ' data-loop' : '') . ' preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">';
        if ($s['bg'] !== '' && $s['bg'] !== 'none') $out .= '<rect width="' . $s['w'] . '" height="' . $s['h'] . '" fill="' . $s['bg'] . '"/>';
        foreach ($s['els'] as $n => $el) {
            $w = $el['w']; $h = $el['h'];
            // Ebenen: Position → Bewegung (.mo-a, Schlüsselbilder in Szenenrichtung) → Grunddrehung → Form.
            // Die Grunddrehung liegt innen, damit ein Versatz „nach rechts“ auch bei gedrehten Elementen nach rechts läuft.
            $out .= '<g transform="translate(' . self::f($el['x']) . ' ' . self::f($el['y']) . ')"' . ($el['op'] < 1 ? ' opacity="' . self::f($el['op']) . '"' : '') . '><g class="mo-a mo-a' . $n . '">'
                . ($el['rot'] ? '<g transform="rotate(' . self::f($el['rot']) . ' ' . self::f($w / 2) . ' ' . self::f($h / 2) . ')">' : '<g>');
            $paint = ' fill="' . $el['fill'] . '"' . ($el['stroke'] !== 'none' && $el['sw'] > 0 ? ' stroke="' . $el['stroke'] . '" stroke-width="' . self::f($el['sw']) . '"' : '');
            $draw = self::hasDraw($el) ? ' pathLength="1"' : '';
            $out .= match ($el['type']) {
                'rect' => '<rect width="' . self::f($w) . '" height="' . self::f($h) . '"' . ($el['r'] ? ' rx="' . self::f(min($el['r'], $w / 2, $h / 2)) . '"' : '') . $paint . $draw . '/>',
                'ellipse' => '<ellipse cx="' . self::f($w / 2) . '" cy="' . self::f($h / 2) . '" rx="' . self::f($w / 2) . '" ry="' . self::f($h / 2) . '"' . $paint . $draw . '/>',
                'path' => '<svg width="' . self::f($w) . '" height="' . self::f($h) . '" viewBox="0 0 ' . self::f($el['vw']) . ' ' . self::f($el['vh']) . '" preserveAspectRatio="none" overflow="visible">'
                    . '<path d="' . e($el['d']) . '"' . $paint . ' stroke-linecap="' . $el['cap'] . '" stroke-linejoin="round" vector-effect="non-scaling-stroke"' . $draw . '/></svg>',
                'text' => self::text($el),
                'image' => self::image($el),
                'lib' => '<svg width="' . self::f($w) . '" height="' . self::f($h) . '" viewBox="0 0 ' . $lib[$el['lib']]['w'] . ' ' . $lib[$el['lib']]['h'] . '" preserveAspectRatio="none" color="'
                    . ($el['fill'] !== 'none' ? $el['fill'] : $lib[$el['lib']]['color']) . '" overflow="visible">' . $lib[$el['lib']]['svg'] . '</svg>',
            };
            $out .= '</g></g></g>';
        }
        return $out . '</svg>';
    }

    private static function text(array $el): string
    {
        $fam = ['sans' => 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', 'serif' => 'Georgia, Times New Roman, serif', 'mono' => 'ui-monospace, Menlo, Consolas, monospace'][$el['font']];
        $x = ['start' => 0, 'middle' => $el['w'] / 2, 'end' => $el['w']][$el['align']];
        $lines = explode("\n", $el['text']);
        $out = '<text x="' . self::f($x) . '" y="0" font-family="' . $fam . '" font-size="' . self::f($el['fs']) . '" font-weight="' . $el['fw'] . '" text-anchor="' . $el['align'] . '" fill="' . $el['fill'] . '"'
            . ($el['stroke'] !== 'none' && $el['sw'] > 0 ? ' stroke="' . $el['stroke'] . '" stroke-width="' . self::f($el['sw']) . '" paint-order="stroke"' : '') . '>';
        foreach ($lines as $i => $l) $out .= '<tspan x="' . self::f($x) . '" dy="' . ($i ? self::f($el['fs'] * 1.2) : self::f($el['fs'] * .9)) . '">' . e($l) . '</tspan>';
        return $out . '</text>';
    }

    private static function image(array $el): string
    {
        $m = $el['mid'] ? Media::find($el['mid']) : null;
        if (!$m || !str_starts_with((string) ($m['mime'] ?? ''), 'image/')) return '<rect width="' . self::f($el['w']) . '" height="' . self::f($el['h']) . '" fill="#E4E7EE"/>';
        $src = Media::url($m, (int) min(2400, max(320, $el['w'] * 2)));
        return '<image href="' . e($src) . '" width="' . self::f($el['w']) . '" height="' . self::f($el['h']) . '" preserveAspectRatio="xMidYMid ' . ($el['fit'] === 'contain' ? 'meet' : 'slice') . '"/>';
    }

    public static function hasDraw(array $el): bool
    {
        foreach ($el['kf'] as $k) if ($k['draw'] < 1) return in_array($el['type'], ['path', 'rect', 'ellipse'], true);
        return false;
    }

    /** CSS der Szene (Ruhe = letztes Schlüsselbild, .is-armed = erstes, .is-play = Animation) */
    public static function css(array $row): string
    {
        $s = Scene::normalize(json_decode((string) $row['data'], true));
        $k = self::key($row);
        $c = "";
        $iter = $s['loop'] ? 'infinite' : '1';
        foreach ($s['els'] as $n => $el) {
            if (!$el['kf']) continue;
            $kf = $el['kf'];
            if ($kf[0]['t'] > 0) array_unshift($kf, ['t' => 0] + $kf[0]);
            if (end($kf)['t'] < 1) $kf[] = ['t' => 1] + end($kf);
            $draw = self::hasDraw($el);
            $sel = ".mo-$k .mo-a$n";
            // Drehpunkt = Mitte des Elementrahmens im eigenen Koordinatensystem (wie im Editor) – nicht die Mitte des
            // sichtbaren Inhalts (fill-box), die bei Bausteinen wie der Rakete (Flamme unten) daneben liegt
            $c .= "$sel{transform-box:view-box;transform-origin:" . self::f($el['w'] / 2) . 'px ' . self::f($el['h'] / 2) . "px}\n";
            $name = "mo-$k-$n";
            $state = fn(array $f) => 'transform:translate(' . self::f($f['dx']) . 'px,' . self::f($f['dy']) . 'px) rotate(' . self::f($f['r']) . 'deg) scale(' . self::f($f['s']) . ');opacity:' . self::f($f['o'])
                . ($draw ? ';stroke-dashoffset:' . self::f(1 - $f['draw']) : '');
            if ($draw) $c .= "$sel{stroke-dasharray:1}\n";   // stroke-dash* erben die Formen im Inneren (pathLength=1)
            // Ruhe (Ende), bereit (Anfang), abspielen
            $c .= "$sel{" . $state(end($kf)) . "}\n";
            $c .= ".mo-$k.is-armed:not(.is-play) .mo-a$n{" . $state($kf[0]) . "}\n";
            $ease = $el['ease'] === 'spring' ? 'cubic-bezier(.34,1.56,.64,1)' : $el['ease'];
            $c .= ".mo-$k.is-play .mo-a$n{animation:$name " . self::f($s['dur']) . "s $ease 0s $iter both}\n";
            $c .= "@keyframes $name{";
            foreach ($kf as $f) $c .= self::f($f['t'] * 100) . '%{' . $state($f) . '}';
            $c .= "}\n";
        }
        $c .= ".mo-$k.is-play:not(.is-vis) .mo-a,.mo-$k.is-play:not(.is-vis) .mo-a *{animation-play-state:paused}\n";
        $c .= "@media (prefers-reduced-motion:reduce){.mo-$k .mo-a,.mo-$k .mo-a *{animation:none!important}}\n";
        return $c;
    }

    /** URL der erzeugten CSS-Datei (einmal je Fassung geschrieben) */
    public static function cssUrl(array $row): string
    {
        $name = self::key($row) . '.css';
        $dir = site()->mediaDir('motion');
        if (!is_file("$dir/$name")) {
            @mkdir($dir, 0775, true);
            @file_put_contents("$dir/$name", "/* KLXM Motion – automatisch erzeugt: „" . str_replace('*/', '', (string) $row['title']) . "“ */\n" . self::css($row), LOCK_EX);
        }
        return site()->mediaUrl('motion/' . $name);
    }

    private static function f(float|int $n): string
    {
        $s = rtrim(rtrim(number_format((float) $n, 3, '.', ''), '0'), '.');
        return $s === '-0' || $s === '' ? '0' : $s;
    }
}
