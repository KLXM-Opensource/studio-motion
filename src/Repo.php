<?php
// SPDX-License-Identifier: MIT
// KLXM Studio – Motion. Copyright (C) 2026 KLXM and contributors (see LICENSE)
declare(strict_types=1);

namespace Klxm\Motion;

/** Tabelle motion_animations: id, title, data (Szene als JSON), created_at, updated_at, user_id */
final class Repo
{
    public const TABLE = 'motion_animations';

    public static function all(): array
    {
        return app()->db->fetchAll('SELECT * FROM ' . self::TABLE . ' ORDER BY updated_at DESC, id DESC');
    }

    public static function find(int $id): ?array
    {
        return app()->db->fetch('SELECT * FROM ' . self::TABLE . ' WHERE id = ?', [$id]) ?: null;
    }

    /** [id => Titel] für die Blockauswahl */
    public static function options(): array
    {
        try {
            $out = [];
            foreach (app()->db->fetchAll('SELECT id, title FROM ' . self::TABLE . ' ORDER BY title') as $r) $out[(string) $r['id']] = (string) $r['title'];
            return $out;
        } catch (\Throwable) {
            return [];
        }
    }

    public static function create(string $title, ?array $scene = null): int
    {
        $now = now();
        return app()->db->insert(self::TABLE, ['title' => self::title($title), 'data' => json_encode(Scene::normalize($scene ?? Scene::blank()), JSON_UNESCAPED_UNICODE),
            'created_at' => $now, 'updated_at' => $now, 'user_id' => (int) (app()->auth->user()['id'] ?? 0)]);
    }

    public static function save(int $id, string $title, mixed $scene): array
    {
        $data = json_encode(Scene::normalize($scene), JSON_UNESCAPED_UNICODE);
        app()->db->update(self::TABLE, ['title' => self::title($title), 'data' => $data, 'updated_at' => now()], 'id = :id', ['id' => $id]);
        \Core\PageCache::clear();
        return self::find($id) ?? [];
    }

    public static function duplicate(int $id): ?int
    {
        $r = self::find($id);
        return $r ? self::create($r['title'] . ' ' . __('(Kopie)'), json_decode((string) $r['data'], true)) : null;
    }

    public static function delete(int $id): void
    {
        app()->db->query('DELETE FROM ' . self::TABLE . ' WHERE id = ?', [$id]);
        \Core\PageCache::clear();
    }

    /** Seiten, deren Blöcke diese Animation zeigen (Entwurf oder veröffentlicht) */
    public static function usages(int $id): array
    {
        $out = [];
        foreach (\Core\Pages::all() as $p) {
            foreach (\Core\Layout::flatten(array_merge(\Core\Pages::blocks($p, false), \Core\Pages::blocks($p, true))) as $b) {
                if (($b['type'] ?? '') === 'motion' && (int) ($b['data']['animation'] ?? 0) === $id) { $out[] = ['title' => $p['title'], 'url' => \Core\Pages::url($p)]; break; }
            }
        }
        return $out;
    }

    private static function title(string $t): string
    {
        return mb_substr(trim(strip_tags($t)), 0, 120) ?: __('Neue Animation');
    }
}
