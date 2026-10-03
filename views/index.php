<?php
/** Verwaltung → Animationen: Anlegen (leer oder Vorlage) und Übersicht mit laufender Vorschau. @var array $items */
use Klxm\Motion\Render;
use Klxm\Motion\Templates;
?>
<header class="adm-head">
  <div><p class="adm-eyebrow"><?= e(__('Inhalte')) ?></p><h1><?= e(__('Animationen')) ?></h1>
    <p class="adm-muted"><?= e(__('Gestalten Sie Animationen aus Bausteinen, Formen, Text, Bildern und eigenen Zeichnungen – und zeigen Sie sie mit dem Block „Animation“ auf Ihren Seiten.')) ?></p></div>
</header>
<form class="adm-card mo-new" method="post" action="<?= e(url('/admin/motion/neu')) ?>">
  <?= csrf_field() ?>
  <div class="f"><label for="mo-title"><?= e(__('Neue Animation')) ?></label><input id="mo-title" name="title" maxlength="120" placeholder="<?= e(__('z. B. So funktioniert die Buchung')) ?>"></div>
  <div class="f"><label for="mo-tpl"><?= e(__('Beginnen mit')) ?></label><select id="mo-tpl" name="template"><?php foreach (Templates::list() as $k => $l): ?><option value="<?= e($k) ?>"><?= e($l) ?></option><?php endforeach; ?></select></div>
  <button class="adm-btn adm-btn--primary" type="submit"><?= icon('plus') ?> <?= e(__('Anlegen und gestalten')) ?></button>
</form>
<?php if ($items): ?>
<ul class="mo-grid" role="list">
  <?php foreach ($items as $it): ?>
  <li class="adm-card mo-item">
    <a class="mo-item__prev" href="<?= e(url('/admin/motion/' . (int) $it['id'])) ?>" aria-label="<?= e(__('„{title}“ bearbeiten', ['title' => $it['title']])) ?>">
      <link rel="stylesheet" href="<?= e(Render::cssUrl($it)) ?>"><?= Render::svg($it) ?></a>
    <div class="mo-item__foot">
      <a class="mo-item__title" href="<?= e(url('/admin/motion/' . (int) $it['id'])) ?>"><?= e($it['title']) ?></a>
      <small class="adm-muted"><?= e(fmt()->relative(strtotime((string) $it['updated_at']) ?: time())) ?></small>
      <form method="post" action="<?= e(url('/admin/motion/' . (int) $it['id'] . '/duplicate')) ?>"><?= csrf_field() ?><button class="adm-btn adm-btn--small adm-btn--ghost" type="submit"><?= e(__('Duplizieren')) ?></button></form>
      <form method="post" action="<?= e(url('/admin/motion/' . (int) $it['id'] . '/delete')) ?>" data-confirm="<?= e(__('„{title}“ löschen?', ['title' => $it['title']])) ?>"><?= csrf_field() ?><button class="adm-btn adm-btn--small adm-btn--ghost" type="submit"><?= e(__('Löschen')) ?></button></form>
    </div>
  </li>
  <?php endforeach; ?>
</ul>
<?php else: ?>
<p class="adm-muted"><?= e(__('Noch keine Animationen.')) ?></p>
<?php endif; ?>
