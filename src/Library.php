<?php
// SPDX-License-Identifier: MIT
// KLXM Studio – Motion. Copyright (C) 2026 KLXM and contributors (see LICENSE)
declare(strict_types=1);

namespace Klxm\Motion;

/**
 * Bibliothek: fertige Bausteine (UI, Zeichen, Formen) als SVG-Innenleben in einem eigenen Koordinatenraum (w × h).
 * Die Farbe des Elements wirkt über currentColor (Akzent), Rest neutral. Editor und Website rendern aus DIESER Liste –
 * gespeichert wird nur die ID, nie fremdes SVG (kein Einschleusen von Markup über gespeicherte Animationen).
 */
final class Library
{
    /** @return array<string, array{group: string, label: string, w: int, h: int, color: string, svg: string}> */
    public static function all(): array
    {
        static $items = null;
        if ($items !== null) return $items;
        $ink = '#1D2230'; $line = '#D8DCE4'; $paper = '#FFFFFF'; $soft = '#EEF1F6';
        $items = [
            // ---------------------------------------------------------------- Oberflächen
            'browser' => ['group' => 'ui', 'label' => 'Browserfenster', 'w' => 320, 'h' => 220, 'color' => '#581D47',
                'svg' => "<rect x='1' y='1' width='318' height='218' rx='12' fill='$paper' stroke='$line' stroke-width='2'/><path d='M1 13a12 12 0 0 1 12-12h294a12 12 0 0 1 12 12v19H1z' fill='$soft'/>"
                    . "<circle cx='18' cy='16' r='4.5' fill='#FF6B5F'/><circle cx='33' cy='16' r='4.5' fill='#FFBE2E'/><circle cx='48' cy='16' r='4.5' fill='#29C840'/>"
                    . "<rect x='70' y='9' width='180' height='14' rx='7' fill='$paper'/><rect x='20' y='50' width='150' height='14' rx='4' fill='currentColor'/>"
                    . "<rect x='20' y='74' width='280' height='8' rx='4' fill='$line'/><rect x='20' y='90' width='240' height='8' rx='4' fill='$line'/>"
                    . "<rect x='20' y='112' width='130' height='86' rx='8' fill='$soft'/><rect x='166' y='112' width='134' height='86' rx='8' fill='$soft'/>"],
            'phone' => ['group' => 'ui', 'label' => 'Smartphone', 'w' => 160, 'h' => 300, 'color' => '#581D47',
                'svg' => "<rect x='2' y='2' width='156' height='296' rx='26' fill='$ink'/><rect x='10' y='10' width='140' height='280' rx='19' fill='$paper'/>"
                    . "<rect x='58' y='16' width='44' height='10' rx='5' fill='$ink'/><rect x='24' y='46' width='90' height='12' rx='4' fill='currentColor'/>"
                    . "<rect x='24' y='68' width='112' height='7' rx='3.5' fill='$line'/><rect x='24' y='82' width='96' height='7' rx='3.5' fill='$line'/>"
                    . "<rect x='24' y='102' width='112' height='90' rx='10' fill='$soft'/><rect x='24' y='206' width='112' height='34' rx='10' fill='currentColor'/>"],
            'button' => ['group' => 'ui', 'label' => 'Button', 'w' => 170, 'h' => 52, 'color' => '#314164',
                'svg' => "<rect x='0' y='0' width='170' height='52' rx='12' fill='currentColor'/><rect x='34' y='21' width='102' height='10' rx='5' fill='#FFFFFF' opacity='.9'/>"],
            'card' => ['group' => 'ui', 'label' => 'Karte', 'w' => 220, 'h' => 150, 'color' => '#581D47',
                'svg' => "<rect x='1' y='1' width='218' height='148' rx='14' fill='$paper' stroke='$line' stroke-width='2'/><rect x='16' y='16' width='56' height='56' rx='12' fill='currentColor' opacity='.18'/>"
                    . "<rect x='86' y='22' width='110' height='12' rx='6' fill='$ink'/><rect x='86' y='44' width='90' height='8' rx='4' fill='$line'/>"
                    . "<rect x='16' y='92' width='188' height='8' rx='4' fill='$line'/><rect x='16' y='110' width='150' height='8' rx='4' fill='$line'/>"],
            'toggle' => ['group' => 'ui', 'label' => 'Schalter', 'w' => 70, 'h' => 38, 'color' => '#2E7D52',
                'svg' => "<rect x='0' y='0' width='70' height='38' rx='19' fill='currentColor'/><circle cx='51' cy='19' r='14' fill='#FFFFFF'/>"],
            'checkbox' => ['group' => 'ui', 'label' => 'Häkchen-Feld', 'w' => 36, 'h' => 36, 'color' => '#581D47',
                'svg' => "<rect x='0' y='0' width='36' height='36' rx='8' fill='currentColor'/><path d='M9 18.5l6 6L27 12' fill='none' stroke='#FFFFFF' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/>"],
            'input' => ['group' => 'ui', 'label' => 'Eingabefeld', 'w' => 240, 'h' => 46, 'color' => '#581D47',
                'svg' => "<rect x='1' y='1' width='238' height='44' rx='10' fill='$paper' stroke='$line' stroke-width='2'/><rect x='16' y='18' width='120' height='10' rx='5' fill='$line'/><rect x='140' y='13' width='2.5' height='20' fill='currentColor'/>"],
            'toast' => ['group' => 'ui', 'label' => 'Hinweis', 'w' => 250, 'h' => 54, 'color' => '#2E7D52',
                'svg' => "<rect x='0' y='0' width='250' height='54' rx='14' fill='$ink'/><circle cx='27' cy='27' r='12' fill='currentColor'/><path d='M21.5 27.5l3.8 3.8 7.2-7.6' fill='none' stroke='#FFFFFF' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/>"
                    . "<rect x='50' y='22' width='170' height='10' rx='5' fill='#FFFFFF' opacity='.85'/>"],
            'chart' => ['group' => 'ui', 'label' => 'Diagramm', 'w' => 220, 'h' => 140, 'color' => '#581D47',
                'svg' => "<rect x='1' y='1' width='218' height='138' rx='12' fill='$paper' stroke='$line' stroke-width='2'/>"
                    . "<rect x='22' y='78' width='22' height='44' rx='4' fill='$line'/><rect x='54' y='58' width='22' height='64' rx='4' fill='$line'/><rect x='86' y='70' width='22' height='52' rx='4' fill='$line'/>"
                    . "<rect x='118' y='42' width='22' height='80' rx='4' fill='$line'/><rect x='150' y='50' width='22' height='72' rx='4' fill='$line'/><rect x='182' y='24' width='22' height='98' rx='4' fill='currentColor'/>"],
            'avatar' => ['group' => 'ui', 'label' => 'Person', 'w' => 56, 'h' => 56, 'color' => '#314164',
                'svg' => "<circle cx='28' cy='28' r='28' fill='currentColor'/><circle cx='28' cy='22' r='10' fill='#FFFFFF' opacity='.9'/><path d='M10 46c4-9 11-13 18-13s14 4 18 13' fill='#FFFFFF' opacity='.9'/>"],
            'cursor' => ['group' => 'ui', 'label' => 'Mauszeiger', 'w' => 28, 'h' => 34, 'color' => '#111111',
                'svg' => "<path d='M3 2l22 15-9.5 2.2L11 30z' fill='currentColor' stroke='#FFFFFF' stroke-width='2.4' stroke-linejoin='round'/>"],
            'hand' => ['group' => 'ui', 'label' => 'Hand (Tippen)', 'w' => 34, 'h' => 40, 'color' => '#111111',
                'svg' => "<path d='M12 4a3.5 3.5 0 0 1 7 0v13l2-1.5a3 3 0 0 1 4.2.6l.3.4 1.5-.6a3 3 0 0 1 3.9 2l.1.5V26a12 12 0 0 1-12 12h-1a11 11 0 0 1-9.3-5.2L3.4 26a3.3 3.3 0 0 1 5.2-4L12 25.5z' fill='currentColor' stroke='#FFFFFF' stroke-width='2.2' stroke-linejoin='round'/>"],
            // ---------------------------------------------------------------- Zeichen
            'check' => ['group' => 'icon', 'label' => 'Erledigt', 'w' => 64, 'h' => 64, 'color' => '#2E7D52',
                'svg' => "<circle cx='32' cy='32' r='32' fill='currentColor'/><path d='M19 33l9 9 17-19' fill='none' stroke='#FFFFFF' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/>"],
            'bell' => ['group' => 'icon', 'label' => 'Glocke', 'w' => 60, 'h' => 64, 'color' => '#581D47',
                'svg' => "<path d='M30 4a4 4 0 0 1 4 4v2a18 18 0 0 1 14 17.5V40l6 9H6l6-9V27.5A18 18 0 0 1 26 10V8a4 4 0 0 1 4-4z' fill='currentColor'/><path d='M22 53a8 8 0 0 0 16 0z' fill='currentColor'/>"],
            'mail' => ['group' => 'icon', 'label' => 'Brief', 'w' => 80, 'h' => 56, 'color' => '#314164',
                'svg' => "<rect x='0' y='0' width='80' height='56' rx='8' fill='currentColor'/><path d='M6 8l34 24L74 8' fill='none' stroke='#FFFFFF' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/>"],
            'chat' => ['group' => 'icon', 'label' => 'Sprechblase', 'w' => 80, 'h' => 66, 'color' => '#581D47',
                'svg' => "<path d='M12 0h56a12 12 0 0 1 12 12v30a12 12 0 0 1-12 12H30L14 66V54h-2A12 12 0 0 1 0 42V12A12 12 0 0 1 12 0z' fill='currentColor'/><circle cx='24' cy='27' r='5' fill='#FFFFFF'/><circle cx='40' cy='27' r='5' fill='#FFFFFF'/><circle cx='56' cy='27' r='5' fill='#FFFFFF'/>"],
            'pin' => ['group' => 'icon', 'label' => 'Ort', 'w' => 48, 'h' => 64, 'color' => '#C0392B',
                'svg' => "<path d='M24 0a24 24 0 0 1 24 24c0 17-24 40-24 40S0 41 0 24A24 24 0 0 1 24 0z' fill='currentColor'/><circle cx='24' cy='24' r='9' fill='#FFFFFF'/>"],
            'bulb' => ['group' => 'icon', 'label' => 'Idee', 'w' => 48, 'h' => 68, 'color' => '#E6A700',
                'svg' => "<path d='M24 0a24 24 0 0 1 14 43.5V50H10v-6.5A24 24 0 0 1 24 0z' fill='currentColor'/><rect x='12' y='54' width='24' height='6' rx='3' fill='$ink'/><rect x='16' y='62' width='16' height='6' rx='3' fill='$ink'/>"],
            'rocket' => ['group' => 'icon', 'label' => 'Rakete', 'w' => 60, 'h' => 72, 'color' => '#581D47',
                'svg' => "<path d='M30 0c14 10 18 26 14 44H16C12 26 16 10 30 0z' fill='currentColor'/><circle cx='30' cy='24' r='7' fill='#FFFFFF'/><path d='M16 36L4 50l14-2zM44 36l12 14-14-2z' fill='currentColor' opacity='.75'/>"
                    . "<path d='M22 48h16l-8 22z' fill='#FFB020'/>"],
            'cloud' => ['group' => 'icon', 'label' => 'Wolke', 'w' => 96, 'h' => 60, 'color' => '#8FB3E0',
                'svg' => "<path d='M24 60a24 24 0 0 1-2-48A30 30 0 0 1 78 22a19 19 0 0 1-2 38z' fill='currentColor'/>"],
            'heart' => ['group' => 'icon', 'label' => 'Herz', 'w' => 64, 'h' => 58, 'color' => '#D64545',
                'svg' => "<path d='M32 58S0 38 0 17A17 17 0 0 1 32 9a17 17 0 0 1 32 8c0 21-32 41-32 41z' fill='currentColor'/>"],
            'star' => ['group' => 'icon', 'label' => 'Stern', 'w' => 64, 'h' => 62, 'color' => '#F2B600',
                'svg' => "<path d='M32 0l9.4 20.3 22.2 2.6-16.4 15.2 4.4 21.9L32 49 12.4 60l4.4-21.9L.4 22.9l22.2-2.6z' fill='currentColor'/>"],
            'spark' => ['group' => 'icon', 'label' => 'Funkeln', 'w' => 56, 'h' => 56, 'color' => '#F2B600',
                'svg' => "<path d='M28 0c2 16 12 26 28 28-16 2-26 12-28 28C26 40 16 30 0 28 16 26 26 16 28 0z' fill='currentColor'/>"],
            // ---------------------------------------------------------------- Formen und Linien
            'arrow' => ['group' => 'shape', 'label' => 'Pfeil', 'w' => 120, 'h' => 40, 'color' => '#1D2230',
                'svg' => "<path d='M4 20h100M88 6l16 14-16 14' fill='none' stroke='currentColor' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/>"],
            'arrow-curve' => ['group' => 'shape', 'label' => 'Bogenpfeil', 'w' => 120, 'h' => 80, 'color' => '#1D2230',
                'svg' => "<path d='M6 70C20 20 70 6 106 26M92 12l15 15-20 6' fill='none' stroke='currentColor' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/>"],
            'wave' => ['group' => 'shape', 'label' => 'Welle', 'w' => 200, 'h' => 40, 'color' => '#581D47',
                'svg' => "<path d='M4 20c16-16 32-16 48 0s32 16 48 0 32-16 48 0 32 16 48 0' fill='none' stroke='currentColor' stroke-width='6' stroke-linecap='round'/>"],
            'blob' => ['group' => 'shape', 'label' => 'Fläche', 'w' => 200, 'h' => 180, 'color' => '#E8D9E3',
                'svg' => "<path d='M106 4c40 4 84 30 90 70s-22 86-70 100S20 168 8 120 18 30 50 14 70 0 106 4z' fill='currentColor'/>"],
            'ring' => ['group' => 'shape', 'label' => 'Ring', 'w' => 100, 'h' => 100, 'color' => '#581D47',
                'svg' => "<circle cx='50' cy='50' r='44' fill='none' stroke='currentColor' stroke-width='10'/>"],
            'dots' => ['group' => 'shape', 'label' => 'Punkte', 'w' => 120, 'h' => 120, 'color' => '#581D47',
                'svg' => implode('', array_map(fn($i) => "<circle cx='" . (12 + ($i % 5) * 24) . "' cy='" . (12 + intdiv($i, 5) * 24) . "' r='4' fill='currentColor'/>", range(0, 24)))],
        ];
        return $items;
    }

    /** Gruppen der Bibliothek in Reihenfolge */
    public static function groups(): array
    {
        return ['ui' => 'Oberflächen', 'icon' => 'Zeichen', 'shape' => 'Formen & Linien'];
    }

    /** Für den Editor: [{id, group, label, w, h, color, svg}] */
    public static function forEditor(): array
    {
        $out = [];
        foreach (self::all() as $id => $it) $out[] = ['id' => $id] + $it;
        return $out;
    }
}
