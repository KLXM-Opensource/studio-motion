/* KLXM Motion – Editor (Verwaltung → Animationen → Animation). Vollbild-App ohne Abhängigkeiten.
   Links Werkzeuge und Bibliothek (ziehen oder klicken), Mitte Zeichenfläche (SVG, Szenenkoordinaten), rechts Eigenschaften
   und fertige Bewegungen, unten Zeitleiste mit Schlüsselbildern. Szene = JSON wie Klxm\Motion\Scene (Server prüft erneut).
   Bewegung: Schlüsselbilder {t 0..1, dx, dy, s, r, o, draw} relativ zur Grundposition; Kurven je Abschnitt wie CSS.
   Steht der Abspielkopf nicht auf 0 und hat das Element Schlüsselbilder, ändern Ziehen/Drehen das Schlüsselbild an dieser
   Stelle (Animationsmodus), sonst die Grundform. MIT */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var root = document.querySelector('[data-mo-app]'), dataEl = document.getElementById('mo-data');
  if (!root || !dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var T = function (s, p) { return window.CMSAdmin && CMSAdmin.t ? CMSAdmin.t(s, p || {}) : String(s).replace(/\{(\w+)\}/g, function (m, k) { return p && k in p ? p[k] : m; }); };
  var LIB = {}; D.library.forEach(function (it) { LIB[it.id] = it; });
  var MEDIA = D.media || {};
  var scene = D.scene, title = D.title, sel = null, tool = 'select', time = 0, playing = false, dirty = false;
  var undo = [], redo = [];

  // ------------------------------------------------------------------ Hilfen
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var h = function (tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) { if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]); } if (html !== undefined) e.innerHTML = html; return e; };
  var s = function (tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs || {}) { if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]); } return e; };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var r3 = function (n) { return Math.round(n * 1000) / 1000; };
  var uid = function () { return 'e' + Math.random().toString(36).slice(2, 8); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var byId = function (id) { return scene.els.find(function (e) { return e.id === id; }) || null; };
  var cur = function () { return sel ? byId(sel) : null; };
  var ico = function (n) { return window.CMSAdmin && CMSAdmin.ico ? CMSAdmin.ico(n) : ''; };

  // Kurven wie CSS (cubic-bezier, Newton-Verfahren)
  var EASE = { linear: [0, 0, 1, 1], ease: [.25, .1, .25, 1], 'ease-in': [.42, 0, 1, 1], 'ease-out': [0, 0, .58, 1], 'ease-in-out': [.42, 0, .58, 1], spring: [.34, 1.56, .64, 1] };
  function bez(p, x) {
    var cx = 3 * p[0], bx = 3 * (p[2] - p[0]) - cx, ax = 1 - cx - bx, cy = 3 * p[1], by = 3 * (p[3] - p[1]) - cy, ay = 1 - cy - by, t = x;
    for (var i = 0; i < 8; i++) { var fx = ((ax * t + bx) * t + cx) * t - x, d = (3 * ax * t + 2 * bx) * t + cx; if (Math.abs(fx) < 1e-5 || !d) break; t -= fx / d; }
    t = Math.max(0, Math.min(1, t));
    return ((ay * t + by) * t + cy) * t;
  }
  var KEYS = ['dx', 'dy', 's', 'r', 'o', 'draw'];
  var REST = { dx: 0, dy: 0, s: 1, r: 0, o: 1, draw: 1 };
  /** Zustand eines Elements zum Zeitpunkt u (0..1) */
  function stateAt(el, u) {
    var kf = el.kf || [];
    if (!kf.length) return Object.assign({}, REST);
    if (u <= kf[0].t) return pick(kf[0]);
    var last = kf[kf.length - 1];
    if (u >= last.t) return pick(last);
    for (var i = 0; i < kf.length - 1; i++) {
      var a = kf[i], b = kf[i + 1];
      if (u >= a.t && u <= b.t) {
        var k = b.t === a.t ? 1 : bez(EASE[el.ease] || EASE['ease-in-out'], (u - a.t) / (b.t - a.t)), o = {};
        KEYS.forEach(function (key) { o[key] = a[key] + (b[key] - a[key]) * k; });
        return o;
      }
    }
    return pick(last);
  }
  function pick(k) { var o = {}; KEYS.forEach(function (key) { o[key] = k[key] == null ? REST[key] : k[key]; }); return o; }
  var u = function () { return scene.dur ? time / scene.dur : 0; };
  var animMode = function (el) { return el && el.kf && el.kf.length && time > 0.0001; };

  // ------------------------------------------------------------------ Gerüst
  root.innerHTML = '';
  root.classList.add('is-ready');
  document.documentElement.classList.add('mo-full');
  var top = h('header', { class: 'mo-top' });
  top.innerHTML = '<a class="mo-back" href="' + esc(D.urls.back) + '">← ' + esc(T('Animationen')) + '</a>'
    + '<input class="mo-title" maxlength="120" aria-label="' + esc(T('Titel')) + '" value="' + esc(title) + '">'
    + '<button type="button" class="mo-ib mo-ib--ghost" data-act="undo" title="' + esc(T('Rückgängig')) + ' (⌘Z)" aria-label="' + esc(T('Rückgängig')) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/></svg></button>'
    + '<button type="button" class="mo-ib mo-ib--ghost" data-act="redo" title="' + esc(T('Wiederholen')) + ' (⇧⌘Z)" aria-label="' + esc(T('Wiederholen')) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3"/></svg></button>'
    + '<span class="mo-grow"></span><span class="mo-status" aria-live="polite"></span>'
    + '<button type="button" class="adm-btn adm-btn--primary mo-save" data-act="save">' + esc(T('Speichern')) + '</button>';
  var lib = h('aside', { class: 'mo-lib', 'aria-label': T('Werkzeuge und Bibliothek') });
  var stage = h('main', { class: 'mo-stage' });
  var props = h('aside', { class: 'mo-props', 'aria-label': T('Eigenschaften') });
  var tl = h('footer', { class: 'mo-tl', 'aria-label': T('Zeitleiste') });
  root.append(top, lib, stage, props, tl);

  // Werkzeuge
  var TOOLS = [['select', 'V', T('Auswählen und bewegen'), 'M5 3l13 8-6 1.5L9 19z'], ['pen', 'P', T('Stift (frei zeichnen)'), 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3'],
    ['rect', 'R', T('Rechteck'), 'M4 6h16v12H4z'], ['ellipse', 'O', T('Kreis / Ellipse'), 'M12 5a8 7 0 1 0 0 14 8 7 0 1 0 0-14z'],
    ['line', 'L', T('Linie'), 'M5 19L19 5'], ['text', 'T', T('Text'), 'M5 6h14M12 6v13']];
  var toolsHtml = '<div class="mo-tools" role="toolbar" aria-label="' + esc(T('Werkzeuge')) + '">' + TOOLS.map(function (t) {
    return '<button type="button" class="mo-tool" data-tool="' + t[0] + '" title="' + esc(t[2]) + ' (' + t[1] + ')" aria-label="' + esc(t[2]) + '" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + t[3] + '"/></svg></button>';
  }).join('') + '<button type="button" class="mo-tool" data-act="image" title="' + esc(T('Bild aus der Mediathek')) + '" aria-label="' + esc(T('Bild aus der Mediathek')) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4"/></svg></button></div>';
  var groupsHtml = Object.keys(D.groups).map(function (g) {
    return '<h3 class="mo-h">' + esc(T(D.groups[g])) + '</h3><div class="mo-tiles">' + D.library.filter(function (it) { return it.group === g; }).map(function (it) {
      return '<button type="button" class="mo-tile" draggable="true" data-lib="' + esc(it.id) + '" title="' + esc(T(it.label)) + '" aria-label="' + esc(T('„{label}“ einfügen', { label: T(it.label) })) + '">'
        + '<svg viewBox="0 0 ' + it.w + ' ' + it.h + '" color="' + esc(it.color) + '" aria-hidden="true">' + it.svg + '</svg><span>' + esc(T(it.label)) + '</span></button>';
    }).join('') + '</div>';
  }).join('');
  lib.innerHTML = toolsHtml + '<input type="search" class="mo-search" placeholder="' + esc(T('Bausteine suchen …')) + '" aria-label="' + esc(T('Bausteine suchen')) + '">' + '<div class="mo-libscroll">' + groupsHtml + '<p class="mo-hint">' + esc(T('Bausteine auf die Fläche ziehen oder anklicken.')) + '</p></div>';

  // Zeichenfläche
  var wrap = h('div', { class: 'mo-canvaswrap' });
  var svg = s('svg', { class: 'mo-canvas', role: 'img', 'aria-label': T('Zeichenfläche') });
  var gBg = s('g'), gEls = s('g'), gUi = s('g', { class: 'mo-ui' });
  svg.append(gBg, gEls, gUi);
  wrap.append(svg);
  stage.append(wrap);

  // ------------------------------------------------------------------ Zeichnen der Szene
  function shapeOf(el) {
    var w = el.w, hh = el.h, paint = { fill: el.fill || 'none' };
    if (el.stroke && el.stroke !== 'none' && el.sw > 0) { paint.stroke = el.stroke; paint['stroke-width'] = el.sw; }
    var drawable = (el.kf || []).some(function (k) { return k.draw < 1; });
    if (drawable) paint.pathLength = 1;
    switch (el.type) {
      case 'rect': return s('rect', Object.assign({ width: w, height: hh, rx: el.r ? Math.min(el.r, w / 2, hh / 2) : null }, paint));
      case 'ellipse': return s('ellipse', Object.assign({ cx: w / 2, cy: hh / 2, rx: w / 2, ry: hh / 2 }, paint));
      case 'path': {
        var o = s('svg', { width: w, height: hh, viewBox: '0 0 ' + el.vw + ' ' + el.vh, preserveAspectRatio: 'none', overflow: 'visible' });
        o.append(s('path', Object.assign({ d: el.d, 'stroke-linecap': el.cap || 'round', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' }, paint)));
        return o;
      }
      case 'text': {
        var fam = { sans: 'system-ui, sans-serif', serif: 'Georgia, serif', mono: 'ui-monospace, monospace' }[el.font || 'sans'];
        var x = { start: 0, middle: w / 2, end: w }[el.align || 'start'];
        var t = s('text', { x: x, y: 0, 'font-family': fam, 'font-size': el.fs, 'font-weight': el.fw, 'text-anchor': el.align || 'start', fill: el.fill });
        String(el.text || '').split('\n').forEach(function (l, i) { var sp = s('tspan', { x: x, dy: i ? el.fs * 1.2 : el.fs * .9 }); sp.textContent = l || ' '; t.append(sp); });
        return t;
      }
      case 'image': {
        var src = MEDIA[el.mid];
        return src ? s('image', { href: src, width: w, height: hh, preserveAspectRatio: 'xMidYMid ' + (el.fit === 'contain' ? 'meet' : 'slice') }) : s('rect', { width: w, height: hh, fill: '#E4E7EE' });
      }
      case 'lib': {
        var it = LIB[el.lib]; if (!it) return s('g');
        var l = s('svg', { width: w, height: hh, viewBox: '0 0 ' + it.w + ' ' + it.h, preserveAspectRatio: 'none', color: el.fill && el.fill !== 'none' ? el.fill : it.color, overflow: 'visible' });
        l.innerHTML = it.svg;
        return l;
      }
    }
    return s('g');
  }
  var nodes = {};
  function render() {
    svg.setAttribute('viewBox', '0 0 ' + scene.w + ' ' + scene.h);
    gBg.innerHTML = '';
    gBg.append(s('rect', { width: scene.w, height: scene.h, fill: scene.bg && scene.bg !== 'none' ? scene.bg : '#FFFFFF', class: 'mo-paper' }));
    gEls.innerHTML = ''; nodes = {};
    scene.els.forEach(function (el) {
      var outer = s('g', { 'data-id': el.id, transform: 'translate(' + el.x + ' ' + el.y + ')' + (el.rot ? ' rotate(' + el.rot + ' ' + el.w / 2 + ' ' + el.h / 2 + ')' : ''), opacity: el.op < 1 ? el.op : null, class: 'mo-el' });
      var inner = s('g');
      inner.append(shapeOf(el));
      outer.append(inner);
      gEls.append(outer);
      nodes[el.id] = { outer: outer, inner: inner };
    });
    pose();
    fit();
  }
  /** Bewegung zum aktuellen Zeitpunkt anwenden (auch beim Abspielen, ohne neu zu zeichnen) */
  function pose() {
    var uu = u();
    scene.els.forEach(function (el) {
      var n = nodes[el.id]; if (!n) return;
      var st = stateAt(el, uu), cx = el.w / 2, cy = el.h / 2;
      var sc = playing ? st.s : Math.max(st.s, .15);
      n.inner.setAttribute('transform', 'translate(' + r3(st.dx + cx) + ' ' + r3(st.dy + cy) + ') rotate(' + r3(st.r) + ') scale(' + r3(sc) + ') translate(' + (-cx) + ' ' + (-cy) + ')');
      n.inner.setAttribute('opacity', r3(playing ? st.o : Math.max(st.o, .28)));   // im Stillstand nie ganz unsichtbar (Geister)
      n.outer.classList.toggle('is-ghost', !playing && (st.o < .28 || st.s < .15));
      if ((el.kf || []).some(function (k) { return k.draw < 1; })) { n.inner.setAttribute('stroke-dasharray', '1'); n.inner.setAttribute('stroke-dashoffset', r3(1 - st.draw)); }
    });
    drawUi();
    drawPlayhead();
  }

  // Auswahl: Rahmen, Anfasser (Ecken), Drehen (oben)
  var HS = 9;
  function box(el) {
    var st = animMode(el) ? stateAt(el, u()) : REST;
    return { x: el.x + st.dx, y: el.y + st.dy, w: el.w, h: el.h, rot: (el.rot || 0) + st.r, s: st.s };
  }
  function drawUi() {
    gUi.innerHTML = '';
    var el = cur(); if (!el) return;
    var b = box(el), k = 1 / zoom, cx = b.x + b.w / 2, cy = b.y + b.h / 2, w = b.w * b.s, hh = b.h * b.s;
    var g = s('g', { transform: 'rotate(' + b.rot + ' ' + cx + ' ' + cy + ')' });
    g.append(s('rect', { x: cx - w / 2, y: cy - hh / 2, width: w, height: hh, class: 'mo-selbox', 'stroke-width': 1.5 * k }));
    [['nw', -1, -1], ['ne', 1, -1], ['se', 1, 1], ['sw', -1, 1]].forEach(function (c) {
      g.append(s('rect', { x: cx + c[1] * w / 2 - HS * k / 2, y: cy + c[2] * hh / 2 - HS * k / 2, width: HS * k, height: HS * k, class: 'mo-handle', 'data-h': c[0], 'stroke-width': 1.5 * k }));
    });
    g.append(s('line', { x1: cx, y1: cy - hh / 2, x2: cx, y2: cy - hh / 2 - 26 * k, class: 'mo-rotline', 'stroke-width': 1.5 * k }));
    g.append(s('circle', { cx: cx, cy: cy - hh / 2 - 26 * k, r: 6 * k, class: 'mo-handle mo-handle--rot', 'data-h': 'rot', 'stroke-width': 1.5 * k }));
    if (animMode(el)) g.append(s('rect', { x: cx - w / 2, y: cy - hh / 2, width: w, height: hh, class: 'mo-selbox mo-selbox--anim', 'stroke-width': 1.5 * k }));
    gUi.append(g);
  }

  // Einpassen in die Fläche
  var zoom = 1;
  function fit() {
    var r = stage.getBoundingClientRect(), pad = 48;
    zoom = Math.max(.05, Math.min((r.width - pad) / scene.w, (r.height - pad) / scene.h, 2));
    svg.setAttribute('width', Math.round(scene.w * zoom)); svg.setAttribute('height', Math.round(scene.h * zoom));
    drawUi();
  }
  addEventListener('resize', fit);
  function pt(ev) { var m = svg.getScreenCTM().inverse(), p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; p = p.matrixTransform(m); return { x: p.x, y: p.y }; }

  // ------------------------------------------------------------------ Änderungen, Rückgängig
  function commit(keepProps) {
    undo.push(JSON.stringify(scene)); if (undo.length > 100) undo.shift(); redo = [];
    setDirty(true);
    render(); if (!keepProps) panel(); timeline();
  }
  var before = null;
  function snapshot() { before = JSON.stringify(scene); }
  function done() { if (before !== null && before !== JSON.stringify(scene)) { undo.push(before); if (undo.length > 100) undo.shift(); redo = []; setDirty(true); } before = null; panel(); timeline(); }
  function restore(json) { scene = JSON.parse(json); if (sel && !byId(sel)) sel = null; render(); panel(); timeline(); setDirty(true); }
  function doUndo() { if (!undo.length) return; redo.push(JSON.stringify(scene)); restore(undo.pop()); }
  function doRedo() { if (!redo.length) return; undo.push(JSON.stringify(scene)); restore(redo.pop()); }
  function setDirty(d) { dirty = d; $('.mo-status').textContent = d ? T('Nicht gespeichert') : T('Gespeichert'); root.classList.toggle('is-dirty', d); }
  addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  function select(id) { sel = id; drawUi(); panel(); timeline(); }
  function add(el, at) {
    el.id = uid(); el.kf = el.kf || []; el.op = el.op == null ? 1 : el.op; el.rot = el.rot || 0; el.ease = el.ease || 'ease-in-out';
    if (at) { el.x = r3(at.x - el.w / 2); el.y = r3(at.y - el.h / 2); }
    scene.els.push(el); sel = el.id; commit();
  }
  function addLib(id, at) {
    var it = LIB[id]; if (!it) return;
    var k = Math.min(1, (scene.w * .5) / it.w, (scene.h * .6) / it.h), w = r3(it.w * k), hh = r3(it.h * k);
    add({ type: 'lib', lib: id, name: T(it.label), w: w, h: hh, fill: it.color, stroke: 'none', sw: 0 }, at || { x: scene.w / 2, y: scene.h / 2 });
  }

  // ------------------------------------------------------------------ Zeichenfläche: Zeiger
  var drag = null;
  svg.addEventListener('pointerdown', function (ev) {
    if (ev.button !== 0) return;
    var p = pt(ev), hEl = ev.target.closest && ev.target.closest('[data-h]'), gEl = ev.target.closest && ev.target.closest('[data-id]');
    svg.setPointerCapture(ev.pointerId);
    if (tool === 'select') {
      if (hEl && cur()) { snapshot(); drag = { mode: hEl.getAttribute('data-h'), p0: p, el0: clone(cur()), st0: stateAt(cur(), u()) }; return; }
      if (gEl) { select(gEl.getAttribute('data-id')); snapshot(); drag = { mode: 'move', p0: p, el0: clone(cur()), st0: stateAt(cur(), u()) }; return; }
      select(null); return;
    }
    if (tool === 'pen') { drag = { mode: 'pen', pts: [p] }; var tmp = s('path', { class: 'mo-ink', d: 'M' + p.x + ' ' + p.y }); gUi.append(tmp); drag.tmp = tmp; return; }
    if (tool === 'text') {
      add({ type: 'text', name: T('Text'), text: T('Ihr Text'), fs: 40, fw: 700, font: 'sans', align: 'start', fill: '#1D2230', stroke: 'none', sw: 0, w: 260, h: 50 }, { x: p.x + 130, y: p.y + 25 });
      setTool('select'); setTimeout(function () { var ta = $('[data-p=text]', props); if (ta) { ta.focus(); ta.select(); } }, 30); return;
    }
    drag = { mode: 'create', p0: p, tmp: s(tool === 'ellipse' ? 'ellipse' : tool === 'line' ? 'line' : 'rect', { class: 'mo-ink' }) };
    gUi.append(drag.tmp);
  });
  svg.addEventListener('pointermove', function (ev) {
    if (!drag) return;
    var p = pt(ev), el = cur();
    if (drag.mode === 'pen') {
      var l = drag.pts[drag.pts.length - 1];
      if (Math.hypot(p.x - l.x, p.y - l.y) > 1.5 / zoom) { drag.pts.push(p); drag.tmp.setAttribute('d', 'M' + drag.pts.map(function (q) { return r3(q.x) + ' ' + r3(q.y); }).join('L')); }
      return;
    }
    if (drag.mode === 'create') {
      var x0 = Math.min(drag.p0.x, p.x), y0 = Math.min(drag.p0.y, p.y), w = Math.abs(p.x - drag.p0.x), hh = Math.abs(p.y - drag.p0.y);
      if (tool === 'line') { drag.tmp.setAttribute('x1', drag.p0.x); drag.tmp.setAttribute('y1', drag.p0.y); drag.tmp.setAttribute('x2', p.x); drag.tmp.setAttribute('y2', p.y); }
      else if (tool === 'ellipse') { drag.tmp.setAttribute('cx', x0 + w / 2); drag.tmp.setAttribute('cy', y0 + hh / 2); drag.tmp.setAttribute('rx', w / 2); drag.tmp.setAttribute('ry', hh / 2); }
      else { drag.tmp.setAttribute('x', x0); drag.tmp.setAttribute('y', y0); drag.tmp.setAttribute('width', w); drag.tmp.setAttribute('height', hh); }
      drag.p1 = p; return;
    }
    if (!el) return;
    var dx = p.x - drag.p0.x, dy = p.y - drag.p0.y, e0 = drag.el0;
    if (drag.mode === 'move') {
      if (ev.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      if (animMode(el)) { setKey(el, { dx: r3(drag.st0.dx + dx), dy: r3(drag.st0.dy + dy) }); }
      else { el.x = r3(e0.x + dx); el.y = r3(e0.y + dy); }
    } else if (drag.mode === 'rot') {
      var b = box(e0), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      var a = Math.atan2(p.y - cy, p.x - cx) * 180 / Math.PI + 90, a0 = (e0.rot || 0) + (animMode(el) ? drag.st0.r : 0);
      if (ev.shiftKey) a = Math.round(a / 15) * 15;
      if (animMode(el)) setKey(el, { r: r3(drag.st0.r + (a - a0)) }); else el.rot = r3(((a % 360) + 360) % 360 > 180 ? (a % 360) - 360 : a % 360);
    } else {
      // Ecke ziehen (im gedrehten Raum): Größe ändern, gegenüberliegende Ecke bleibt; ⇧ = Seitenverhältnis frei (Bausteine/Bilder halten es sonst)
      var rad = -(e0.rot || 0) * Math.PI / 180, lx = dx * Math.cos(rad) - dy * Math.sin(rad), ly = dx * Math.sin(rad) + dy * Math.cos(rad);
      var sx = drag.mode.indexOf('e') > -1 ? 1 : -1, sy = drag.mode.indexOf('s') > -1 ? 1 : -1;
      var nw = Math.max(4, e0.w + sx * lx), nh = Math.max(4, e0.h + sy * ly);
      var keep = (e0.type === 'lib' || e0.type === 'image') !== ev.shiftKey;
      if (keep) { var k = Math.max(nw / e0.w, nh / e0.h); nw = e0.w * k; nh = e0.h * k; }
      el.w = r3(nw); el.h = r3(nh);
      if (sx < 0) el.x = r3(e0.x + (e0.w - nw)); else el.x = e0.x;
      if (sy < 0) el.y = r3(e0.y + (e0.h - nh)); else el.y = e0.y;
      if (el.type === 'text') el.fs = r3(Math.max(4, e0.fs * nh / e0.h));
    }
    render();
  });
  svg.addEventListener('pointerup', function () {
    if (!drag) return;
    var d = drag; drag = null;
    if (d.mode === 'pen') { d.tmp.remove(); if (d.pts.length > 2) addPath(d.pts, false); return; }
    if (d.mode === 'create') {
      d.tmp.remove();
      var p = d.p1 || d.p0, x0 = Math.min(d.p0.x, p.x), y0 = Math.min(d.p0.y, p.y), w = Math.abs(p.x - d.p0.x), hh = Math.abs(p.y - d.p0.y);
      if (tool === 'line') { if (Math.hypot(w, hh) > 4) addPath([d.p0, p], true); }
      else {
        if (w < 4 || hh < 4) { w = hh = 120; x0 = d.p0.x - 60; y0 = d.p0.y - 60; }
        add({ type: tool, name: tool === 'rect' ? T('Rechteck') : T('Kreis'), x: r3(x0), y: r3(y0), w: r3(w), h: r3(hh), r: tool === 'rect' ? 12 : 0, fill: '#581D47', stroke: 'none', sw: 0 });
      }
      setTool('select'); return;
    }
    done();
  });

  /** Freihand bzw. Linie → Pfad (vereinfacht nach Ramer-Douglas-Peucker, geglättet über Catmull-Rom) */
  function addPath(pts, straight) {
    if (!straight) pts = rdp(pts, 1.6 / zoom * 1.2);
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(function (q) { minX = Math.min(minX, q.x); minY = Math.min(minY, q.y); maxX = Math.max(maxX, q.x); maxY = Math.max(maxY, q.y); });
    var w = Math.max(1, maxX - minX), hh = Math.max(1, maxY - minY), P = pts.map(function (q) { return { x: r3(q.x - minX), y: r3(q.y - minY) }; });
    var d = 'M' + P[0].x + ' ' + P[0].y;
    if (straight || P.length < 3) d += P.slice(1).map(function (q) { return ' L' + q.x + ' ' + q.y; }).join('');
    else for (var i = 0; i < P.length - 1; i++) {
      var p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      d += ' C' + r3(p1.x + (p2.x - p0.x) / 6) + ' ' + r3(p1.y + (p2.y - p0.y) / 6) + ' ' + r3(p2.x - (p3.x - p1.x) / 6) + ' ' + r3(p2.y - (p3.y - p1.y) / 6) + ' ' + p2.x + ' ' + p2.y;
    }
    add({ type: 'path', name: straight ? T('Linie') : T('Zeichnung'), x: r3(minX), y: r3(minY), w: r3(w), h: r3(hh), vw: r3(w), vh: r3(hh), d: d, fill: 'none', stroke: lastStroke, sw: lastWidth, cap: 'round' });
  }
  var lastStroke = '#1D2230', lastWidth = 6;
  function rdp(P, eps) {
    if (P.length < 3) return P;
    var a = P[0], b = P[P.length - 1], idx = 0, max = 0;
    for (var i = 1; i < P.length - 1; i++) {
      var d = Math.abs((b.y - a.y) * P[i].x - (b.x - a.x) * P[i].y + b.x * a.y - b.y * a.x) / (Math.hypot(b.y - a.y, b.x - a.x) || 1);
      if (d > max) { max = d; idx = i; }
    }
    return max > eps ? rdp(P.slice(0, idx + 1), eps).slice(0, -1).concat(rdp(P.slice(idx), eps)) : [a, b];
  }

  // Bibliothek: ziehen oder klicken; Suche
  lib.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-lib]'); if (t) { addLib(t.getAttribute('data-lib')); return; }
    var tb = ev.target.closest('[data-tool]'); if (tb) { setTool(tb.getAttribute('data-tool')); return; }
    if (ev.target.closest('[data-act=image]')) pickImage();
  });
  lib.addEventListener('dragstart', function (ev) { var t = ev.target.closest('[data-lib]'); if (t) { ev.dataTransfer.setData('text/x-mo-lib', t.getAttribute('data-lib')); ev.dataTransfer.effectAllowed = 'copy'; } });
  stage.addEventListener('dragover', function (ev) { if ([].indexOf.call(ev.dataTransfer.types, 'text/x-mo-lib') > -1) { ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; stage.classList.add('is-drop'); } });
  stage.addEventListener('dragleave', function () { stage.classList.remove('is-drop'); });
  stage.addEventListener('drop', function (ev) { var id = ev.dataTransfer.getData('text/x-mo-lib'); stage.classList.remove('is-drop'); if (id) { ev.preventDefault(); addLib(id, pt(ev)); } });
  $('.mo-search', lib).addEventListener('input', function () {
    var q = this.value.trim().toLowerCase();
    lib.querySelectorAll('.mo-tile').forEach(function (t) { t.hidden = q && t.textContent.toLowerCase().indexOf(q) < 0; });
  });
  function setTool(t) {
    tool = t;
    lib.querySelectorAll('[data-tool]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-tool') === t)); });
    stage.dataset.tool = t;
  }
  function pickImage() {
    if (!window.CMSMedia || !CMSMedia.pick) return;
    Promise.resolve(CMSMedia.pick('image')).then(function (m) {
      if (!m) return;
      MEDIA[m.id] = m.large || m.url;
      var ar = m.width && m.height ? m.height / m.width : .66, w = Math.min(scene.w * .5, 400);
      add({ type: 'image', name: m.display || T('Bild'), mid: m.id, w: r3(w), h: r3(w * ar), fit: 'cover', fill: 'none', stroke: 'none', sw: 0 }, { x: scene.w / 2, y: scene.h / 2 });
    });
  }

  // ------------------------------------------------------------------ Schlüsselbilder
  function setKey(el, vals) {
    var t = r3(u()), k = el.kf.find(function (q) { return Math.abs(q.t - t) < .004; });
    if (!k) { k = Object.assign({ t: t }, stateAt(el, t)); el.kf.push(k); el.kf.sort(function (a, b) { return a.t - b.t; }); }
    Object.keys(vals).forEach(function (key) { k[key] = vals[key]; });
  }
  /** Fertige Bewegungen: Schlüsselbilder ab Beginn (s) über Dauer (s) – ersetzen die bisherige Bewegung des Elements */
  var PRESETS = {
    fade: [T('Einblenden'), [{ o: 0 }, { o: 1 }]], left: [T('Von links'), [{ dx: -160, o: 0 }, { dx: 0, o: 1 }]], right: [T('Von rechts'), [{ dx: 160, o: 0 }, { dx: 0, o: 1 }]],
    up: [T('Von unten'), [{ dy: 120, o: 0 }, { dy: 0, o: 1 }]], down: [T('Von oben'), [{ dy: -120, o: 0 }, { dy: 0, o: 1 }]],
    zoom: [T('Heranzoomen'), [{ s: .3, o: 0 }, { s: 1, o: 1 }], 'ease-out'], pop: [T('Aufploppen'), [{ s: 0 }, { s: 1 }], 'spring'],
    spin: [T('Drehen'), [{ r: 0 }, { r: 360 }], 'linear'], pulse: [T('Pulsieren'), [{ s: 1 }, { s: 1.12 }, { s: 1 }]],
    shake: [T('Wackeln'), [{ r: 0 }, { r: -8 }, { r: 8 }, { r: -5 }, { r: 0 }]], float: [T('Schweben'), [{ dy: 0 }, { dy: -14 }, { dy: 0 }]],
    draw: [T('Linie zeichnen'), [{ draw: 0 }, { draw: 1 }], 'ease-in-out'], out: [T('Ausblenden'), [{ o: 1 }, { o: 0 }]],
  };
  var PRESET_ICON = { fade: '◐', left: '→', right: '←', up: '↑', down: '↓', zoom: '⤢', pop: '✦', spin: '↻', pulse: '◉', shake: '〰', float: '⇕', draw: '✎', out: '◑' };
  function applyPreset(key, startS, lenS) {
    var el = cur(), p = PRESETS[key]; if (!el || !p) return;
    var a = Math.max(0, Math.min(1, startS / scene.dur)), b = Math.max(a + .01, Math.min(1, (startS + lenS) / scene.dur)), n = p[1].length;
    el.kf = p[1].map(function (v, i) { return Object.assign({}, REST, v, { t: r3(a + (b - a) * (n > 1 ? i / (n - 1) : 0)) }); });
    if (p[2]) el.ease = p[2];
    el._preset = key;
    commit(true); panel();
    playFrom(Math.max(0, startS - .2));
  }

  // ------------------------------------------------------------------ Eigenschaften
  var field = function (label, html) { return '<label class="mo-f"><span>' + esc(label) + '</span>' + html + '</label>'; };
  var fmtN = function (v, step) { return (step || 1) >= 1 ? Math.round(v) : Math.round(v * 100) / 100; };
  var num = function (key, val, step, min) { return '<input type="number" data-p="' + key + '" value="' + esc(fmtN(val, step)) + '" step="' + (step || 1) + '"' + (min != null ? ' min="' + min + '"' : '') + '>'; };
  var color = function (key, val) {
    var none = !val || val === 'none';
    return '<span class="mo-color"><input type="color" data-p="' + key + '" value="' + esc(none ? '#000000' : val.slice(0, 7)) + '"' + (none ? ' disabled' : '') + '>'
      + '<label class="mo-none"><input type="checkbox" data-none="' + key + '"' + (none ? ' checked' : '') + '> ' + esc(T('keine')) + '</label></span>';
  };
  function panel() {
    var el = cur();
    if (!el) {
      props.innerHTML = '<div class="mo-sec"><h3 class="mo-h">' + esc(T('Fläche')) + '</h3>'
        + '<div class="mo-grid2">' + field(T('Breite'), num('sw_w', scene.w, 10, 80)) + field(T('Höhe'), num('sw_h', scene.h, 10, 60)) + '</div>'
        + '<div class="mo-seg">' + [['16:9', 800, 450], ['4:3', 800, 600], ['1:1', 600, 600], [T('Banner'), 1200, 400], [T('Hochformat'), 450, 800]].map(function (f) {
          return '<button type="button" class="mo-chip' + (scene.w === f[1] && scene.h === f[2] ? ' is-on' : '') + '" data-size="' + f[1] + 'x' + f[2] + '">' + esc(f[0]) + '</button>'; }).join('') + '</div>'
        + field(T('Hintergrund'), color('sc_bg', scene.bg))
        + '<div class="mo-grid2">' + field(T('Dauer (Sekunden)'), num('sc_dur', scene.dur, .1, .5)) + field(T('Start'), '<select data-p="sc_trigger">'
          + [['view', T('sobald sichtbar')], ['load', T('sofort')], ['hover', T('beim Überfahren')]].map(function (o) { return '<option value="' + o[0] + '"' + (scene.trigger === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>') + '</div>'
        + '<label class="mo-check"><input type="checkbox" data-p="sc_loop"' + (scene.loop ? ' checked' : '') + '> ' + esc(T('In Schleife abspielen')) + '</label>'
        + '<p class="mo-hint">' + esc(T('Element anklicken, um es zu bearbeiten und zu animieren. Bausteine links auf die Fläche ziehen.')) + '</p>'
        + (D.usages && D.usages.length ? '<p class="mo-hint">' + esc(T('Verwendet auf: {pages}', { pages: D.usages.map(function (x) { return x.title; }).join(', ') })) + '</p>' : '') + '</div>';
      return;
    }
    var kfHere = (el.kf || []).find(function (q) { return Math.abs(q.t - u()) < .004; });
    var canDraw = ['path', 'rect', 'ellipse'].indexOf(el.type) > -1, hasKf = (el.kf || []).length > 0;
    var I = function (d) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>'; };
    var html = '<div class="mo-sec mo-sec--head"><input class="mo-name" data-p="name" value="' + esc(el.name || '') + '" aria-label="' + esc(T('Name des Elements')) + '">'
      + '<div class="mo-acts" role="group" aria-label="' + esc(T('Anordnen')) + '">'
      + '<button type="button" class="mo-ib mo-ib--ghost" data-act="front" title="' + esc(T('Nach vorn')) + '" aria-label="' + esc(T('Nach vorn')) + '">' + I('M12 19V5M6 11l6-6 6 6') + '</button>'
      + '<button type="button" class="mo-ib mo-ib--ghost" data-act="back" title="' + esc(T('Nach hinten')) + '" aria-label="' + esc(T('Nach hinten')) + '">' + I('M12 5v14M6 13l6 6 6-6') + '</button>'
      + '<button type="button" class="mo-ib mo-ib--ghost" data-act="dup" title="' + esc(T('Duplizieren')) + ' (⌘D)" aria-label="' + esc(T('Duplizieren')) + '">' + I('M8 8h11v11H8zM5 16V5h11') + '</button>'
      + '<button type="button" class="mo-ib mo-ib--ghost mo-ib--danger" data-act="del" title="' + esc(T('Löschen')) + ' (⌫)" aria-label="' + esc(T('Löschen')) + '">' + I('M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13') + '</button></div></div>';
    // Bewegung zuerst – das Wichtigste dieses Werkzeugs
    html += '<div class="mo-sec"><h3 class="mo-h">' + esc(T('Bewegung')) + (hasKf ? ' <span class="mo-badge">' + esc(T('{n} Schlüsselbilder', { n: el.kf.length })) + '</span>' : '') + '</h3>'
      + '<div class="mo-presets">' + Object.keys(PRESETS).filter(function (k) { return k !== 'draw' || canDraw; }).map(function (k) {
          return '<button type="button" class="mo-preset' + (el._preset === k ? ' is-on' : '') + '" data-preset="' + k + '"><span aria-hidden="true">' + PRESET_ICON[k] + '</span>' + esc(PRESETS[k][0]) + '</button>'; }).join('') + '</div>'
      + '<div class="mo-grid2">' + field(T('Beginn (s)'), '<input type="number" data-pre="start" value="' + (Math.round(time * 10) / 10) + '" step="0.1" min="0">')
      + field(T('Dauer (s)'), '<input type="number" data-pre="len" value="' + (Math.round(Math.min(1, scene.dur) * 10) / 10) + '" step="0.1" min="0.1">') + '</div>'
      + field(T('Verlauf'), '<select data-p="ease">' + [['ease-in-out', T('sanft')], ['ease-out', T('abbremsen')], ['ease-in', T('beschleunigen')], ['linear', T('gleichmäßig')], ['spring', T('federnd')]].map(function (o) { return '<option value="' + o[0] + '"' + (el.ease === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>')
      + '<div class="mo-row"><button type="button" class="mo-btn mo-btn--key" data-act="key">◆ ' + esc(kfHere ? T('Schlüsselbild aktualisieren') : T('Schlüsselbild bei {t} s', { t: Math.round(time * 100) / 100 })) + '</button>'
      + (kfHere ? '<button type="button" class="mo-btn" data-act="unkey">' + esc(T('Schlüsselbild löschen')) + '</button>' : '')
      + (hasKf ? '<button type="button" class="mo-btn mo-btn--danger" data-act="clearkf">' + esc(T('Bewegung entfernen')) + '</button>' : '') + '</div>';
    if (kfHere) html += '<div class="mo-grid2 mo-kf">' + field(T('Versatz X'), num('k_dx', kfHere.dx)) + field(T('Versatz Y'), num('k_dy', kfHere.dy)) + field(T('Skalierung'), num('k_s', kfHere.s, .05, 0))
      + field(T('Drehung °'), num('k_r', kfHere.r)) + field(T('Deckkraft'), num('k_o', kfHere.o, .05, 0)) + (canDraw ? field(T('Gezeichnet'), num('k_draw', kfHere.draw, .05, 0)) : '') + '</div>';
    html += '<p class="mo-hint">' + esc(hasKf ? T('Abspielkopf unten verschieben und das Element ziehen oder drehen – so entsteht dort ein Schlüsselbild.') : T('Fertige Bewegung wählen – oder unten die Zeit wählen und ein Schlüsselbild setzen.')) + '</p></div>';
    // Form
    html += '<div class="mo-sec"><h3 class="mo-h">' + esc(T('Form')) + '</h3><div class="mo-grid2">' + field('X', num('x', el.x)) + field('Y', num('y', el.y)) + field(T('Breite'), num('w', el.w, 1, 1)) + field(T('Höhe'), num('h', el.h, 1, 1))
      + field(T('Drehung °'), num('rot', el.rot || 0)) + field(T('Deckkraft'), num('op', el.op, .05, 0)) + '</div>';
    if (el.type !== 'image') html += '<div class="mo-grid2">' + field(el.type === 'lib' ? T('Farbe') : T('Füllung'), color('fill', el.fill)) + (el.type !== 'lib' ? field(T('Kontur'), color('stroke', el.stroke)) : '') + '</div>';
    if (el.type !== 'lib' && el.type !== 'image') html += '<div class="mo-grid2">' + field(T('Konturstärke'), num('sw', el.sw || 0, 1, 0)) + (el.type === 'rect' ? field(T('Ecken'), num('r', el.r || 0, 1, 0)) : '') + '</div>';
    if (el.type === 'text') html += field(T('Text'), '<textarea data-p="text" rows="3">' + esc(el.text) + '</textarea>')
      + '<div class="mo-grid2">' + field(T('Größe'), num('fs', el.fs, 1, 4)) + field(T('Stärke'), '<select data-p="fw">' + [300, 400, 500, 600, 700, 800, 900].map(function (w) { return '<option' + (+el.fw === w ? ' selected' : '') + '>' + w + '</option>'; }).join('') + '</select>')
      + field(T('Schrift'), '<select data-p="font">' + [['sans', T('Ohne Serifen')], ['serif', T('Mit Serifen')], ['mono', T('Schreibmaschine')]].map(function (o) { return '<option value="' + o[0] + '"' + (el.font === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>')
      + field(T('Ausrichtung'), '<select data-p="align">' + [['start', T('links')], ['middle', T('Mitte')], ['end', T('rechts')]].map(function (o) { return '<option value="' + o[0] + '"' + (el.align === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>') + '</div>';
    if (el.type === 'image') html += '<div class="mo-grid2">' + field(T('Bild'), '<button type="button" class="mo-btn" data-act="reimage">' + esc(T('Wechseln …')) + '</button>')
      + field(T('Einpassen'), '<select data-p="fit"><option value="cover"' + (el.fit !== 'contain' ? ' selected' : '') + '>' + esc(T('füllen')) + '</option><option value="contain"' + (el.fit === 'contain' ? ' selected' : '') + '>' + esc(T('ganz zeigen')) + '</option></select>') + '</div>';
    html += '</div>';
    props.innerHTML = html;
  }
  props.addEventListener('change', onProp); props.addEventListener('input', function (ev) { if (ev.target.matches('input[type=number],input[type=color],textarea,.mo-name')) onProp(ev, true); });
  function onProp(ev, live) {
    var t = ev.target, key = t.getAttribute('data-p'), el = cur();
    if (t.hasAttribute('data-none')) {
      var k2 = t.getAttribute('data-none'), inp = props.querySelector('[data-p="' + k2 + '"]');
      inp.disabled = t.checked;
      var v2 = t.checked ? 'none' : inp.value;
      if (k2 === 'sc_bg') scene.bg = t.checked ? '' : v2; else if (el) { el[k2] = v2; if (k2 === 'stroke' && !t.checked && !el.sw) el.sw = 4; }
      commit(true); panel(); return;
    }
    if (!key) return;
    var v = t.type === 'checkbox' ? t.checked : t.type === 'number' ? parseFloat(t.value) : t.value;
    if (t.type === 'number' && isNaN(v)) return;
    if (live && !before) snapshot();
    if (key.indexOf('sc_') === 0) { scene[key.slice(3)] = v; if (key === 'sc_dur') { scene.dur = Math.max(.5, v); time = Math.min(time, scene.dur); } }
    else if (key.indexOf('sw_') === 0) { scene[key.slice(3)] = Math.max(key === 'sw_w' ? 80 : 60, v); }
    else if (key.indexOf('k_') === 0 && el) { setKey(el, (function () { var o = {}; o[key.slice(2)] = v; return o; })()); }
    else if (el) {
      if (key === 'fs' && el.type === 'text') { el.h = r3(el.h * v / el.fs); }
      el[key] = v;
      if (key === 'stroke') lastStroke = v; if (key === 'sw') lastWidth = v;
    }
    if (live) { render(); if (key.indexOf('k_') !== 0 && key !== 'name' && key !== 'text') return; return; }
    if (before) done(); else { commit(true); panel(); }
    render(); timeline();
  }
  props.addEventListener('focusout', function () { if (before) done(); });
  props.addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    var el = cur(), act = b.getAttribute('data-act');
    if (b.hasAttribute('data-size')) { var wh = b.getAttribute('data-size').split('x'); scene.w = +wh[0]; scene.h = +wh[1]; commit(true); panel(); return; }
    if (b.hasAttribute('data-preset')) { applyPreset(b.getAttribute('data-preset'), parseFloat($('[data-pre=start]', props).value) || 0, parseFloat($('[data-pre=len]', props).value) || 1); return; }
    if (!el) return;
    var i = scene.els.indexOf(el);
    if (act === 'front' && i < scene.els.length - 1) { scene.els.splice(i, 1); scene.els.splice(i + 1, 0, el); commit(true); }
    else if (act === 'back' && i > 0) { scene.els.splice(i, 1); scene.els.splice(i - 1, 0, el); commit(true); }
    else if (act === 'dup') { var c = clone(el); c.id = uid(); c.x += 20; c.y += 20; c.name = (c.name || '') + ' ' + T('(Kopie)'); scene.els.splice(i + 1, 0, c); sel = c.id; commit(); }
    else if (act === 'del') { scene.els.splice(i, 1); sel = null; commit(); }
    else if (act === 'key') { setKey(el, stateAt(el, u())); commit(true); panel(); }
    else if (act === 'unkey') { el.kf = el.kf.filter(function (q) { return Math.abs(q.t - u()) >= .004; }); commit(true); panel(); }
    else if (act === 'clearkf') { el.kf = []; commit(true); panel(); }
    else if (act === 'reimage') { Promise.resolve(window.CMSMedia && CMSMedia.pick('image')).then(function (m) { if (m) { MEDIA[m.id] = m.large || m.url; el.mid = m.id; commit(true); } }); }
  });

  // ------------------------------------------------------------------ Zeitleiste
  tl.innerHTML = '<div class="mo-tlgrip" data-tlgrip role="separator" aria-orientation="horizontal" aria-label="' + esc(T('Höhe der Zeitleiste')) + '" tabindex="0"></div><div class="mo-tlbar"><button type="button" class="mo-ib mo-play" data-act="play" aria-label="' + esc(T('Abspielen')) + '">▶</button>'
    + '<button type="button" class="mo-btn mo-btn--key" data-act="tlkey" title="' + esc(T('Schlüsselbild für das gewählte Element am Abspielkopf')) + '">◆ ' + esc(T('Schlüsselbild')) + '</button>'
    + '<span class="mo-time" aria-live="off"></span><span class="mo-grow"></span><span class="mo-hint">' + esc(T('Leertaste: abspielen · ⌫ löschen · ⌘D duplizieren · ⌘S speichern')) + '</span></div>'
    + '<div class="mo-tlbody"><div class="mo-ruler" data-ruler></div><div class="mo-rows" data-rows></div><div class="mo-head" data-head><i></i></div></div>';
  var rows = $('[data-rows]', tl), ruler = $('[data-ruler]', tl), head = $('[data-head]', tl), body = $('.mo-tlbody', tl);
  var LW = 150;   // Breite der Namensspalte
  var xOf = function (tt) { return LW + (body.clientWidth - LW - 16) * tt; };
  function timeline() {
    var w = body.clientWidth - LW - 16;
    ruler.innerHTML = '';
    var step = scene.dur > 20 ? 5 : scene.dur > 8 ? 1 : .5;
    for (var t = 0; t <= scene.dur + 1e-6; t += step) { var m = h('span', { class: 'mo-tick' }, r3(t) + 's'); m.style.left = xOf(t / scene.dur) + 'px'; ruler.append(m); }
    rows.innerHTML = '';
    scene.els.slice().reverse().forEach(function (el) {
      var r = h('div', { class: 'mo-trow' + (el.id === sel ? ' is-sel' : ''), 'data-row': el.id });
      r.innerHTML = '<button type="button" class="mo-tname" data-sel="' + esc(el.id) + '">' + esc(el.name || el.type) + '</button>';
      var kf = el.kf || [];
      if (kf.length > 1) { var bar = h('i', { class: 'mo-span' }); bar.style.left = xOf(kf[0].t) + 'px'; bar.style.width = Math.max(2, xOf(kf[kf.length - 1].t) - xOf(kf[0].t)) + 'px'; r.append(bar); }
      if (!kf.length && el.id === sel) { var hint = h('span', { class: 'mo-rowhint' }, esc(T('Bewegung rechts wählen oder ◆ setzen'))); hint.style.left = (LW + 8) + 'px'; r.append(hint); }
      kf.forEach(function (k, i) { var d = h('button', { type: 'button', class: 'mo-kd', 'data-kd': el.id + ':' + i, title: r3(k.t * scene.dur) + ' s', 'aria-label': T('Schlüsselbild bei {t} s', { t: r3(k.t * scene.dur) }) }); d.style.left = xOf(k.t) + 'px'; r.append(d); });
      rows.append(r);
    });
    void w;
    drawPlayhead();
  }
  function drawPlayhead() { if (!head) return; head.style.left = xOf(u()) + 'px'; $('.mo-time', tl).textContent = time.toFixed(2).replace('.', ',') + ' / ' + String(scene.dur).replace('.', ',') + ' s'; }
  var tdrag = null;
  body.addEventListener('pointerdown', function (ev) {
    var kd = ev.target.closest('[data-kd]'), sb = ev.target.closest('[data-sel]');
    if (sb) { select(sb.getAttribute('data-sel')); return; }
    var r = body.getBoundingClientRect(), toT = function (cx) { return Math.max(0, Math.min(1, (cx - r.left - LW) / (body.clientWidth - LW - 16))); };
    body.setPointerCapture(ev.pointerId);
    if (kd) { var p = kd.getAttribute('data-kd').split(':'); select(p[0]); snapshot(); tdrag = { el: byId(p[0]), i: +p[1], toT: toT }; seek(cur().kf[+p[1]].t * scene.dur); return; }
    tdrag = { toT: toT }; stop(); seek(toT(ev.clientX) * scene.dur);
  });
  body.addEventListener('pointermove', function (ev) {
    if (!tdrag) return;
    var t = tdrag.toT(ev.clientX);
    if (tdrag.el) { var k = tdrag.el.kf[tdrag.i]; k.t = r3(t); seek(t * scene.dur); timeline(); }
    else seek(t * scene.dur);
  });
  body.addEventListener('pointerup', function () { if (tdrag && tdrag.el) { tdrag.el.kf.sort(function (a, b) { return a.t - b.t; }); done(); } tdrag = null; });
  function seek(t) { time = Math.max(0, Math.min(scene.dur, t)); pose(); if (!playing) panel(); }

  // Abspielen
  var raf = 0, t0 = 0, from = 0;
  function frame(now) {
    if (!playing) return;
    var t = from + (now - t0) / 1000;
    if (t >= scene.dur) { if (scene.loop) { from = 0; t0 = now; t = 0; } else { time = scene.dur; pose(); stop(); return; } }
    time = t; pose();
    raf = requestAnimationFrame(frame);
  }
  function play() { if (playing) return; playing = true; from = time >= scene.dur - .01 ? 0 : time; t0 = performance.now(); root.classList.add('is-playing'); $('.mo-play', tl).textContent = '❚❚'; raf = requestAnimationFrame(frame); }
  function stop() { if (!playing) return; playing = false; cancelAnimationFrame(raf); root.classList.remove('is-playing'); $('.mo-play', tl).textContent = '▶'; panel(); }
  function playFrom(t) { stop(); time = t; play(); }

  // ------------------------------------------------------------------ Kopfleiste, Speichern, Tasten
  top.addEventListener('click', function (ev) {
    var a = ev.target.closest('[data-act]'); if (!a) return;
    var act = a.getAttribute('data-act');
    if (act === 'undo') doUndo(); else if (act === 'redo') doRedo(); else if (act === 'save') save();
  });
  tl.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-act=play]')) { playing ? stop() : play(); return; }
    if (ev.target.closest('[data-act=tlkey]')) { var el = cur(); if (!el) { $('.mo-status').textContent = T('Erst ein Element auswählen'); return; } stop(); setKey(el, stateAt(el, u())); commit(true); panel(); }
  });
  // Höhe der Zeitleiste ziehen (gemerkt)
  var grip = $('[data-tlgrip]', tl), tlh = 0;
  try { tlh = +localStorage.getItem('mo:tlh') || 0; } catch (e) { /* privat */ }
  var setTlh = function (px) { tlh = Math.max(120, Math.min(innerHeight * .6, px)); root.style.setProperty('--tl-h', Math.round(tlh) + 'px'); try { localStorage.setItem('mo:tlh', Math.round(tlh)); } catch (e) { /* privat */ } timeline(); };
  if (tlh) setTlh(tlh);
  grip.addEventListener('pointerdown', function (ev) {
    grip.setPointerCapture(ev.pointerId);
    var mv = function (e) { setTlh(innerHeight - e.clientY); }, up = function () { grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up); fit(); };
    grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up);
  });
  grip.addEventListener('keydown', function (ev) { var k = { ArrowUp: 30, ArrowDown: -30 }[ev.key]; if (k) { ev.preventDefault(); setTlh((tlh || tl.offsetHeight) + k); fit(); } });
  $('.mo-title', top).addEventListener('input', function () { title = this.value; setDirty(true); });
  function csrf() { var i = document.getElementById('adm-csrf'); return i ? i.value : (document.querySelector('input[name=_csrf]') || {}).value || ''; }
  function save() {
    var btn = $('.mo-save', top); btn.disabled = true; $('.mo-status').textContent = T('Speichert …');
    fetch(D.urls.save, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': csrf() }, body: JSON.stringify({ title: title, scene: scene }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || ('HTTP ' + r.status)); return j; }); })
      .then(function () { setDirty(false); })
      .catch(function (e) { $('.mo-status').textContent = T('Fehler: {msg}', { msg: e.message }); })
      .then(function () { btn.disabled = false; });
  }
  document.addEventListener('keydown', function (ev) {
    var typing = ev.target.closest && ev.target.closest('input,textarea,select,[contenteditable]');
    var mod = ev.metaKey || ev.ctrlKey;
    if (mod && ev.key.toLowerCase() === 's') { ev.preventDefault(); save(); return; }
    if (typing) return;
    if (mod && ev.key.toLowerCase() === 'z') { ev.preventDefault(); ev.shiftKey ? doRedo() : doUndo(); return; }
    if (mod && ev.key.toLowerCase() === 'd' && cur()) { ev.preventDefault(); props.querySelector('[data-act=dup]').click(); return; }
    if (ev.key === ' ') { ev.preventDefault(); playing ? stop() : play(); return; }
    if ((ev.key === 'Delete' || ev.key === 'Backspace') && cur()) { ev.preventDefault(); scene.els.splice(scene.els.indexOf(cur()), 1); sel = null; commit(); return; }
    if (ev.key === 'Escape') { select(null); setTool('select'); return; }
    var arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
    if (arrows && cur()) { ev.preventDefault(); var st = ev.shiftKey ? 10 : 1, el = cur(); snapshot(); if (animMode(el)) { var s0 = stateAt(el, u()); setKey(el, { dx: r3(s0.dx + arrows[0] * st), dy: r3(s0.dy + arrows[1] * st) }); } else { el.x += arrows[0] * st; el.y += arrows[1] * st; } render(); done(); return; }
    var tk = { v: 'select', p: 'pen', r: 'rect', o: 'ellipse', l: 'line', t: 'text' }[ev.key.toLowerCase()];
    if (tk && !mod) setTool(tk);
  });

  // Start
  setTool('select'); render(); panel(); timeline(); setDirty(false);
  if ('ResizeObserver' in window) new ResizeObserver(function () { fit(); timeline(); }).observe(stage);
})();
