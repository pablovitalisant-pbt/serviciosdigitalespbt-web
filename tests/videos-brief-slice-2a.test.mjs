// Contrato del sub-slice 2a: preloader RENDER. Cada test nombra lo que lo rompe.
// Ejecutar: node --test "tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { read, count, scriptBlockWith } from './helpers/page.mjs';

const HTML = read('videos-v2.html');
const CSS = read('css/videos.css');
const JS = read('js/videos.js');

// Lazy a proposito: si falta el bootstrap, cada test falla por separado en vez de
// tumbar el modulo entero (que ocultaria los 8 fallos detras de uno solo).
function inlineScript() {
  return scriptBlockWith(HTML, 'reels_v2_preloaded')
    .replace(/^<script>/, '').replace(/<\/script>$/, '');
}

// Corre el bootstrap inline del <head> con un DOM simulado.
function runInline({ reduce = false, stored = null, blocked = false } = {}) {
  const added = [], removed = [], timers = [];
  const ctx = {
    window: { matchMedia: () => ({ matches: reduce }) },
    document: { documentElement: { classList: { add: (c) => added.push(c), remove: (c) => removed.push(c) } } },
    sessionStorage: { getItem: () => { if (blocked) throw new Error('blocked'); return stored; } },
    setTimeout: (fn, ms) => timers.push({ fn, ms }),
  };
  vm.runInNewContext(inlineScript(), ctx);
  return { added, removed, timers };
}

// Corre js/videos.js con el preloader activo y rAF manual.
function runPreloader({ writeThrows = false } = {}) {
  const removed = [], frames = [], stored = [];
  const pct = { textContent: '' };
  const ctx = {
    window: { matchMedia: () => ({ matches: false }) },
    document: {
      documentElement: { classList: { contains: () => true, add: () => {}, remove: (c) => removed.push(c) } },
      getElementById: (id) => (id === 'render-pct' ? pct : null),
    },
    sessionStorage: { setItem: (k, v) => { if (writeThrows) throw new Error('blocked'); stored.push([k, v]); } },
    requestAnimationFrame: (fn) => frames.push(fn),
  };
  vm.runInNewContext(JS, ctx);
  for (let i = 0; frames.length && i < 10; i++) frames.shift()((i + 1) * 600);
  return { removed, storage: stored, pct: pct.textContent };
}

test('P1 markup decorativo y CSS del preloader', () => {
  assert.equal(count(HTML, 'class="preload"'), 1, 'falta el contenedor .preload');
  assert.match(HTML, /class="preload"[^>]*aria-hidden="true"/, 'el preloader no es decorativo');
  assert.ok(HTML.includes('RENDERING'), 'falta el contador RENDERING');
  assert.match(HTML, /id="render-pct">000</, 'el contador no arranca en 000');
  assert.match(CSS, /\.is-loading\s+\.preload/, 'el preloader no se muestra solo con is-loading');
  assert.match(CSS, /\.preload__bar/, 'falta la barra');
  assert.match(CSS, /animation:[^;]*1\.2s/, 'la barra no dura 1.2 s');
});

test('P2 visita normal: activa is-loading y agenda el failsafe de 2.5 s', () => {
  const r = runInline();
  assert.deepEqual(r.added, ['is-loading'], 'no activo el preloader');
  assert.equal(r.timers.length, 1, 'no agendo exactamente un failsafe');
  assert.equal(r.timers[0].ms, 2500, 'el failsafe no es de 2500 ms');
  assert.ok(2500 > 1200, 'el failsafe cortaria el render normal');
  r.timers[0].fn();
  assert.deepEqual(r.removed, ['is-loading'], 'el failsafe no quita is-loading');
});

test('P3 videos.js caido: el inline libera la pagina a los 2.5 s por si solo', () => {
  // Este test NO ejecuta js/videos.js a proposito: simula 404 o error de parseo.
  const r = runInline();
  r.timers[0].fn();
  assert.deepEqual(r.removed, ['is-loading'], 'la pagina quedaria negra para siempre');
});

test('P4 sessionStorage bloqueado se trata como primera visita', () => {
  const r = runInline({ blocked: true });
  assert.deepEqual(r.added, ['is-loading'], 'un storage bloqueado rompio el arranque');
  r.timers[0].fn();
  assert.deepEqual(r.removed, ['is-loading'], 'sin failsafe tras storage bloqueado');
});

test('P5 sesion ya renderizada no muestra preloader', () => {
  const r = runInline({ stored: '1' });
  assert.deepEqual(r.added, [], 'volvio a mostrar el preloader');
  assert.equal(r.timers.length, 0, 'agendo un failsafe innecesario');
});

test('P6 reduced-motion no muestra preloader', () => {
  const r = runInline({ reduce: true });
  assert.deepEqual(r.added, [], 'mostro preloader con reduced-motion');
  assert.equal(r.timers.length, 0, 'agendo failsafe con reduced-motion');
});

test('P7 videos.js completa el contador en 100, guarda sesion y corta duro', () => {
  const r = runPreloader();
  assert.equal(r.pct, '100', `el contador quedo en ${r.pct}`);
  assert.deepEqual(r.storage, [['reels_v2_preloaded', '1']], 'no marco la sesion');
  assert.deepEqual(r.removed, ['is-loading'], 'no corto el preloader');
});

test('P8 si sessionStorage.setItem falla, igual libera la pagina', () => {
  const r = runPreloader({ writeThrows: true });
  assert.deepEqual(r.removed, ['is-loading'], 'un error de storage dejo la pagina negra');
});
