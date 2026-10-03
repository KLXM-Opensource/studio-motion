<?php
// SPDX-License-Identifier: MIT
// KLXM Studio – Motion. Copyright (C) 2026 KLXM and contributors (see LICENSE)
declare(strict_types=1);

namespace Klxm\Motion;

/** php bin/console motion:selftest – Szene prüfen (Sicherheit), SVG und CSS erzeugen */
final class SelfTest
{
    public static function run(): int
    {
        $fail = 0;
        $eq = function (string $name, mixed $got, mixed $want) use (&$fail): void {
            $ok = $got === $want; if (!$ok) $fail++;
            echo ($ok ? '  ✓ ' : '  ✗ ') . $name . ($ok ? '' : ' – erwartet ' . var_export($want, true) . ', erhalten ' . var_export($got, true)) . "\n";
        };
        $raw = ['w' => 99999, 'dur' => -3, 'trigger' => 'evil', 'els' => [
            ['type' => 'rect', 'x' => 10, 'fill' => 'red;background:url(x)', 'kf' => [['t' => .9, 'o' => 1], ['t' => .1, 'o' => 0]]],
            ['type' => 'path', 'd' => 'M0 0 L10 10"/><script>alert(1)</script>'],
            ['type' => 'path', 'd' => 'M0 0 C10 0 20 10 30 10', 'stroke' => '#abc', 'sw' => 4, 'kf' => [['t' => 0, 'draw' => 0], ['t' => 1, 'draw' => 1]]],
            ['type' => 'text', 'text' => '<b>Hallo</b> & "du"'],
            ['type' => 'lib', 'lib' => 'gibt-es-nicht'],
            ['type' => 'lib', 'lib' => 'cursor', 'kf' => [['t' => 0, 'dx' => 50], ['t' => 1, 'dx' => 0]]],
            ['type' => 'iframe'],
        ]];
        $s = Scene::normalize($raw);
        $eq('Breite begrenzt', $s['w'], 4000);
        $eq('Dauer mindestens 0,5 s', $s['dur'], 0.5);
        $eq('Start nur view|load|hover', $s['trigger'], 'view');
        $eq('unbekannte Typen, fremder Pfad und unbekannter Baustein fallen weg', array_column($s['els'], 'type'), ['rect', 'path', 'text', 'lib']);
        $eq('Farbe nur als Hexwert', $s['els'][0]['fill'], 'none');
        $eq('Schlüsselbilder sortiert', array_column($s['els'][0]['kf'], 't'), [0.1, 0.9]);
        $row = ['id' => 7, 'title' => 'Test', 'data' => json_encode($raw)];
        $svg = Render::svg($row, 'Beschreibung <x>');
        $css = Render::css($row);
        $eq('SVG ohne style-Attribut', str_contains($svg, 'style='), false);
        $eq('SVG ohne Skript', stripos($svg, '<script') !== false, false);
        $eq('Text maskiert', str_contains($svg, '&lt;b&gt;Hallo&lt;/b&gt; &amp; &quot;du&quot;'), true);
        $eq('Beschreibung maskiert', str_contains($svg, 'aria-label="Beschreibung &lt;x&gt;"'), true);
        $eq('Zeichnen: pathLength und Strichversatz', str_contains($svg, 'pathLength="1"') && str_contains($css, 'stroke-dashoffset:1'), true);
        $eq('CSS: Keyframes, bereit/abspielen, reduzierte Bewegung', str_contains($css, '@keyframes mo-' . Render::key($row) . '-') && str_contains($css, '.is-armed') && str_contains($css, 'prefers-reduced-motion'), true);
        $eq('Bibliothek: Bausteine mit SVG', count(array_filter(Library::all(), fn($i) => str_starts_with($i['svg'], '<'))) === count(Library::all()), true);
        foreach (['click', 'checklist', 'draw'] as $t) $eq("Vorlage „{$t}“ gültig", count(Scene::normalize(Templates::get($t))['els']) === count(Templates::get($t)['els']), true);
        echo $fail ? "{$fail} Fehler\n" : "Alles in Ordnung.\n";
        return $fail ? 1 : 0;
    }
}
