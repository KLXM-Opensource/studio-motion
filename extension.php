<?php
// SPDX-License-Identifier: MIT
// KLXM Studio – Motion. Copyright (C) 2026 KLXM and contributors (see LICENSE)
/**
 * Erweiterung „motion“: Animationen in der Verwaltung gestalten – Bausteine aus der Bibliothek per Drag & Drop, Formen,
 * Text, Bilder, Freihand zeichnen, fertige Bewegungen und Zeitleiste mit Schlüsselbildern – und als Block „Animation“ auf
 * Seiten zeigen (SVG + erzeugte CSS-Datei, ohne Inline-Styles/-Skripte; startet sichtbar, „Bewegung reduzieren“ = Standbild).
 *
 * Aktivieren je Website: Administration → Funktionen & Erweiterungen oder 'extensions' => ['motion'].
 * Recht: „Animationen gestalten“ (motion.edit). Doku: README.md.
 */
declare(strict_types=1);

spl_autoload_register(function (string $class): void {
    if (str_starts_with($class, 'Klxm\\Motion\\')) {
        $file = __DIR__ . '/src/' . substr($class, strlen('Klxm\\Motion\\')) . '.php';
        if (is_file($file)) require $file;
    }
});

use Klxm\Motion\AdminController;
use Klxm\Motion\Motion;
use Klxm\Motion\Repo;

return [
    'name' => 'motion',
    'label' => 'Motion – Animationen gestalten',
    'version' => '0.1.0',
    'requires' => '>=1.0.0',
    'description' => 'Animationen per Drag & Drop, Zeichnen und Bausteinen aus einer Bibliothek gestalten und als Block auf Seiten zeigen.',
    'author' => 'KLXM Crossmedia GmbH and contributors',
    'license' => 'MIT',
    'provides' => ['Menüpunkt „Animationen“ (Editor im Vollbild)', 'Block „Animation“', 'Recht „Animationen gestalten“'],
    'commands' => ['motion:list', 'motion:selftest'],
    'usage' => function (): ?string {
        try {
            $n = (int) app()->db->fetchValue('SELECT COUNT(*) FROM ' . Repo::TABLE);
        } catch (\Throwable) {
            return null;
        }
        return $n ? __('{n} Animationen', ['n' => $n]) : null;
    },
    'boot' => function (Core\Extension $x): void {
        $x->feature(Motion::FEATURE, 'Motion: Animationen gestalten', [Motion::PERM]);
        $x->permissions('Animationen', [Motion::PERM => 'Animationen gestalten']);
        $x->table(Repo::TABLE, fn(Core\Db\Table $t) => $t->id()
            ->column('title', 'string', ['length' => 120, 'default' => ''])
            ->column('data', 'longtext')
            ->column('user_id', 'int', ['default' => 0])
            ->column('created_at', 'datetime')->column('updated_at', 'datetime')
            ->index('updated_at'));
        $x->adminPage(['href' => '/admin/motion', 'label' => 'Animationen', 'kind' => 'content', 'icon' => 'sparkle', 'perm' => Motion::PERM,
            'feature' => Motion::FEATURE, 'description' => 'Animationen per Drag & Drop gestalten']);
        $x->routes(function (Core\Http\Router $r): void {
            $r->get('/admin/motion', [AdminController::class, 'index'], Motion::PERM);
            $r->post('/admin/motion/neu', [AdminController::class, 'create'], Motion::PERM);
            $r->get('/admin/motion/{id}', [AdminController::class, 'editor'], Motion::PERM);
            $r->post('/admin/motion/{id}/duplicate', [AdminController::class, 'duplicate'], Motion::PERM);
            $r->post('/admin/motion/{id}/delete', [AdminController::class, 'delete'], Motion::PERM);
            $r->post('/admin/api/motion/{id}', [AdminController::class, 'save'], Motion::PERM);
        });
        $x->blocks(['motion' => Motion::blockDefinition()]);
        $x->adminAssets(fn(string $view) => match ($view) {
            'motion-editor' => ['css/motion-editor.css', 'css/motion.css', 'js/motion-editor.js'],
            'motion-index' => ['css/motion-editor.css', 'css/motion.css', 'js/motion.js'],
            default => [],
        });
        $x->command('motion:list', 'Animationen auflisten', function (array $args): int {
            foreach (Repo::all() as $r) echo str_pad((string) $r['id'], 5) . $r['title'] . '  (' . $r['updated_at'] . ")\n";
            return 0;
        });
        $x->command('motion:selftest', 'Selbsttest: Szene prüfen, SVG/CSS erzeugen', fn(array $args): int => Klxm\Motion\SelfTest::run());
    },
];
