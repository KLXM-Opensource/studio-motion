<?php
// SPDX-License-Identifier: MIT
// KLXM Studio – Motion. Copyright (C) 2026 KLXM and contributors (see LICENSE)
declare(strict_types=1);

namespace Klxm\Motion;

/** Gemeinsames: Recht, Funktion, Adressen der Dateien, Block „Animation“ */
final class Motion
{
    public const NAME = 'motion';
    public const PERM = 'motion.edit';
    public const FEATURE = 'motion';

    public static function asset(string $path): string
    {
        $x = \Core\Extensions::active()[self::NAME] ?? null;
        return $x ? $x->asset($path) : '';
    }

    public static function blockDefinition(): array
    {
        return ['label' => __('Animation'), 'icon' => 'sparkle', 'group' => 'Medien',
            'help' => __('Zeigt eine Animation aus Verwaltung → Animationen. Sie startet, sobald sie sichtbar ist; bei „Bewegung reduzieren“ steht das fertige Bild.'),
            'fields' => [
                ['name' => 'animation', 'label' => __('Animation'), 'type' => 'select', 'required' => true, 'options' => Repo::options()],
                ['name' => 'label', 'label' => __('Beschreibung für Screenreader'), 'type' => 'text', 'max' => 200, 'width' => 'half',
                    'help' => __('Was zeigt die Animation? Leer = Titel der Animation.')],
                ['name' => 'size', 'label' => __('Breite'), 'type' => 'select', 'width' => 'half', 'default' => 'wide',
                    'options' => ['full' => __('Volle Breite'), 'wide' => __('Breit'), 'medium' => __('Mittel'), 'small' => __('Schmal')]],
                ['name' => 'caption', 'label' => __('Bildunterschrift (optional)'), 'type' => 'text', 'max' => 200],
            ]];
    }
}
