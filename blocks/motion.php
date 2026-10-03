<?php
/**
 * Block „Animation“ (Erweiterung motion): SVG der gespeicherten Szene + erzeugte CSS-Datei (Keyframes), dazu einmal je Seite
 * css/motion.css und js/motion.js (Abspielen, sobald sichtbar). Ohne JavaScript bzw. bei „Bewegung reduzieren“: Endzustand.
 * @var \Core\Block $b  @var array $d
 */
use Klxm\Motion\Motion;
use Klxm\Motion\Render;
use Klxm\Motion\Repo;

$row = Repo::find((int) ($d['animation'] ?? 0));
$size = in_array($d['size'] ?? '', ['full', 'wide', 'medium', 'small'], true) ? $d['size'] : 'wide';
?>
<div class="<?= e(app()->theme->def['container_class'] ?? 'wrap') ?>">
  <?php if (!$row): ?>
    <?php if (is_editing()): ?><p class="mo-empty"><?= e(__('Bitte in der Seitenleiste eine Animation wählen – angelegt wird sie unter Verwaltung → Animationen.')) ?></p><?php endif; ?>
  <?php else: ?>
  <?php if (empty($GLOBALS['klxm_motion_assets'])): $GLOBALS['klxm_motion_assets'] = true; ?>
  <link rel="stylesheet" href="<?= e(Motion::asset('css/motion.css')) ?>"><script src="<?= e(Motion::asset('js/motion.js')) ?>" defer></script>
  <?php endif; ?>
  <link rel="stylesheet" href="<?= e(Render::cssUrl($row)) ?>">
  <figure class="mo-fig mo-fig--<?= e($size) ?>">
    <?= Render::svg($row, (string) ($d['label'] ?? '')) ?>
    <?php if (trim((string) ($d['caption'] ?? '')) !== ''): ?><figcaption class="mo-cap"<?= $b->edit('caption') ?>><?= e($d['caption']) ?></figcaption><?php endif; ?>
  </figure>
  <?php endif; ?>
</div>
