<?php
/** Editor (Vollbild, public/js/motion-editor.js) – Daten als JSON (kein Inline-Skript, Admin-CSP). @var array $data */
?>
<div class="mo-app" data-mo-app>
  <noscript><p class="adm-flash adm-flash--error"><?= e(__('Der Editor braucht JavaScript.')) ?></p></noscript>
  <p class="mo-loading"><?= e(__('Editor wird geladen …')) ?></p>
</div>
<script type="application/json" id="mo-data"><?= json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP) ?></script>
