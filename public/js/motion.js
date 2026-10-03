/* KLXM Motion – Abspielen auf der Website: .is-armed (Anfangszustand) sobald geladen, .is-play beim ersten Sichtbarwerden
   (trigger view), sofort (load) oder beim Überfahren (hover, jedes Mal von vorn); .is-vis nur solange sichtbar (Schleifen
   halten außerhalb an). Bei „Bewegung reduzieren“ nichts – das SVG zeigt dann den Endzustand. MIT */
(function () {
  'use strict';
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var replay = function (el) { el.classList.remove('is-play'); void el.getBoundingClientRect(); el.classList.add('is-play'); };
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var el = e.target, on = e.isIntersecting && e.intersectionRatio >= .25;
      el.classList.toggle('is-vis', on);
      if (on && el.dataset.trigger === 'view' && !el.classList.contains('is-play')) el.classList.add('is-play');
    });
  }, { threshold: [0, .25, .5] }) : null;
  function init(el) {
    if (el.dataset.moInit) return;
    el.dataset.moInit = '1';
    el.classList.add('is-armed');
    if (el.dataset.trigger === 'load') el.classList.add('is-play');
    if (el.dataset.trigger === 'hover') {
      el.addEventListener('pointerenter', function () { replay(el); });
      el.addEventListener('focus', function () { replay(el); });
    }
    io ? io.observe(el) : el.classList.add('is-vis', 'is-play');
  }
  var scan = function (root) { (root || document).querySelectorAll('svg[data-mo]').forEach(init); };
  scan();
  // Editor-Vorschau lädt Blöcke nach: erneut suchen
  if ('MutationObserver' in window) new MutationObserver(function () { scan(); }).observe(document.documentElement, { childList: true, subtree: true });
})();
