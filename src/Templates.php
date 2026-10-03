<?php
// SPDX-License-Identifier: MIT
// KLXM Studio – Motion. Copyright (C) 2026 KLXM and contributors (see LICENSE)
declare(strict_types=1);

namespace Klxm\Motion;

/** Startvorlagen beim Anlegen: leer oder ein fertiges Beispiel zum Abwandeln */
final class Templates
{
    public static function list(): array
    {
        return ['' => __('Leere Fläche'), 'click' => __('Klick & Erfolg (Browser, Mauszeiger, Hinweis)'), 'checklist' => __('Liste, die sich abhakt'), 'draw' => __('Linie zeichnet sich, Stern funkelt')];
    }

    public static function get(string $key): array
    {
        $k = fn(float $t, array $p = []) => $p + ['t' => $t, 'dx' => 0, 'dy' => 0, 's' => 1, 'r' => 0, 'o' => 1, 'draw' => 1];
        return match ($key) {
            'click' => ['w' => 800, 'h' => 450, 'bg' => '', 'dur' => 5, 'loop' => true, 'trigger' => 'view', 'els' => [
                ['id' => 'b1', 'type' => 'lib', 'lib' => 'browser', 'name' => 'Browser', 'x' => 160, 'y' => 60, 'w' => 480, 'h' => 330, 'fill' => '#581d47', 'kf' => [$k(0, ['o' => 0, 'dy' => 30]), $k(.12)]],
                ['id' => 'b2', 'type' => 'lib', 'lib' => 'button', 'name' => 'Button', 'x' => 420, 'y' => 300, 'w' => 170, 'h' => 52, 'fill' => '#314164', 'kf' => [$k(.45), $k(.5, ['s' => .9]), $k(.56, ['s' => 1])]],
                ['id' => 'c1', 'type' => 'lib', 'lib' => 'cursor', 'name' => 'Mauszeiger', 'x' => 520, 'y' => 320, 'w' => 34, 'h' => 42, 'fill' => '#111111', 'ease' => 'ease-in-out',
                    'kf' => [$k(0, ['dx' => 180, 'dy' => 110, 'o' => 0]), $k(.15, ['dx' => 180, 'dy' => 110]), $k(.45), $k(.5, ['s' => .85]), $k(.56)]],
                ['id' => 't1', 'type' => 'lib', 'lib' => 'toast', 'name' => 'Hinweis', 'x' => 275, 'y' => 380, 'w' => 250, 'h' => 54, 'fill' => '#2e7d52', 'ease' => 'spring',
                    'kf' => [$k(.55, ['o' => 0, 'dy' => 30]), $k(.66), $k(.9), $k(1, ['o' => 0])]],
            ]],
            'checklist' => ['w' => 600, 'h' => 400, 'bg' => '', 'dur' => 4, 'loop' => true, 'trigger' => 'view', 'els' => array_merge(...array_map(fn($i) => [
                ['id' => 'r' . $i, 'type' => 'rect', 'name' => 'Zeile ' . ($i + 1), 'x' => 100, 'y' => 70 + $i * 90, 'w' => 400, 'h' => 64, 'r' => 14, 'fill' => '#eef1f6', 'kf' => [$k(.05 + $i * .1, ['o' => 0, 'dx' => -30]), $k(.15 + $i * .1)]],
                ['id' => 'c' . $i, 'type' => 'lib', 'lib' => 'checkbox', 'name' => 'Häkchen ' . ($i + 1), 'x' => 120, 'y' => 84 + $i * 90, 'w' => 36, 'h' => 36, 'fill' => '#581d47', 'ease' => 'spring',
                    'kf' => [$k(.4 + $i * .15, ['s' => 0]), $k(.5 + $i * .15)]],
                ['id' => 'l' . $i, 'type' => 'rect', 'name' => 'Text ' . ($i + 1), 'x' => 176, 'y' => 96 + $i * 90, 'w' => 200 - $i * 30, 'h' => 12, 'r' => 6, 'fill' => '#c9ced8', 'kf' => []],
            ], range(0, 2)))],
            'draw' => ['w' => 800, 'h' => 400, 'bg' => '', 'dur' => 3, 'loop' => false, 'trigger' => 'view', 'els' => [
                ['id' => 'p1', 'type' => 'path', 'name' => 'Linie', 'x' => 80, 'y' => 120, 'w' => 560, 'h' => 180, 'vw' => 560, 'vh' => 180, 'd' => 'M0 150 C120 0 220 180 320 80 S500 20 560 120',
                    'fill' => 'none', 'stroke' => '#581d47', 'sw' => 8, 'kf' => [$k(0, ['draw' => 0]), $k(.7, ['draw' => 1])]],
                ['id' => 's1', 'type' => 'lib', 'lib' => 'spark', 'name' => 'Funkeln', 'x' => 640, 'y' => 200, 'w' => 56, 'h' => 56, 'fill' => '#f2b600', 'ease' => 'spring',
                    'kf' => [$k(.65, ['s' => 0, 'r' => -90]), $k(.85, ['s' => 1.15]), $k(1)]],
            ]],
            default => Scene::blank(),
        };
    }
}
