<?php
// SPDX-License-Identifier: MIT
// KLXM Studio – Motion. Copyright (C) 2026 KLXM and contributors (see LICENSE)
declare(strict_types=1);

namespace Klxm\Motion;

use Core\Http\HttpException;
use Core\Http\Request;
use Core\Http\Response;
use Core\Media;
use Core\Theme;

/** Verwaltung → Animationen: Übersicht (Vorschau je Animation), Editor (Vollbild), JSON-Schnittstelle zum Speichern */
final class AdminController extends \Core\Http\Controllers\Admin\AdminController
{
    private function page(string $view, array $vars = [], int $status = 200): Response
    {
        $vars += ['errors' => []];
        $vars['flash'] = app()->session->takeFlash();
        $vars['css'] = [];
        $vars['user'] = app()->auth->user();
        $content = Theme::capture(dirname(__DIR__) . '/views/' . $view . '.php', $vars);
        $html = Theme::capture(ROOT . '/app/Admin/views/layout.php', $vars + ['content' => $content, 'view' => 'motion-' . $view, 'title' => $vars['title'] ?? __('Animationen')]);
        return self::secure(new Response($html, $status));
    }

    public function index(Request $r): Response
    {
        $this->auth($r, Motion::PERM);
        return $this->page('index', ['title' => __('Animationen'), 'items' => Repo::all()]);
    }

    public function create(Request $r): Response
    {
        $this->auth($r, Motion::PERM);
        $id = Repo::create($r->str('title') ?: __('Neue Animation'), Templates::get($r->str('template')));
        return Response::redirect(url('/admin/motion/' . $id));
    }

    public function editor(Request $r, string $id): Response
    {
        $this->auth($r, Motion::PERM);
        $row = Repo::find((int) $id) ?? throw new HttpException(404);
        $scene = Scene::normalize(json_decode((string) $row['data'], true));
        // Bilder der Szene: Adressen für den Editor (gespeichert wird nur die ID)
        $media = [];
        foreach ($scene['els'] as $el) {
            if ($el['type'] === 'image' && $el['mid'] && ($m = Media::find($el['mid']))) $media[$el['mid']] = Media::url($m, 1200);
        }
        $data = ['id' => (int) $row['id'], 'title' => (string) $row['title'], 'scene' => $scene, 'media' => (object) $media,
            'library' => Library::forEditor(), 'groups' => Library::groups(), 'usages' => Repo::usages((int) $row['id']),
            'urls' => ['save' => url('/admin/api/motion/' . (int) $row['id']), 'back' => url('/admin/motion')]];
        return $this->page('editor', ['title' => $row['title'] . ' · ' . __('Animation'), 'data' => $data]);
    }

    /** Speichern (JSON: {title, scene}) → {ok, updated_at} */
    public function save(Request $r, string $id): Response
    {
        $this->auth($r, Motion::PERM);
        if (!Repo::find((int) $id)) return Response::json(['ok' => false, 'error' => __('Animation nicht gefunden.')], 404);
        $row = Repo::save((int) $id, (string) ($r->post['title'] ?? ''), $r->post['scene'] ?? []);
        return Response::json(['ok' => true, 'updated_at' => $row['updated_at'] ?? '', 'title' => $row['title'] ?? '']);
    }

    public function duplicate(Request $r, string $id): Response
    {
        $this->auth($r, Motion::PERM);
        $new = Repo::duplicate((int) $id) ?? throw new HttpException(404);
        return $this->back('/admin/motion/' . $new, 'success', __('Kopie angelegt.'));
    }

    public function delete(Request $r, string $id): Response
    {
        $this->auth($r, Motion::PERM);
        if ($u = Repo::usages((int) $id)) {
            return $this->back('/admin/motion', 'error', __('Die Animation wird noch verwendet: {pages}. Bitte zuerst den Block dort entfernen.', ['pages' => implode(', ', array_column($u, 'title'))]));
        }
        Repo::delete((int) $id);
        return $this->back('/admin/motion', 'success', __('Animation gelöscht.'));
    }
}
