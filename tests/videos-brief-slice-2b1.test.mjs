// Contrato del sub-slice 2b1: hero base, timecode, REC y CTA.
// Ejecutar: node --test "tests/*.test.mjs"
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { read, count } from './helpers/page.mjs';
import { startServer } from './helpers/server.mjs';

const HTML = read('videos-v2.html');
const CSS = read('css/videos.css');
const JS = read('js/videos.js');
const TITLE = 'EDITAMOS. TÚ PUBLICAS.';
const norm = (s) => s.replace(/\s+/g, ' ').trim();

let srv;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });

// DOM minimo: tiempo de scroll + timecode. reduced=true evita el cableado de GSAP.
function timecodeDom() {
  const tc = { textContent: '' };
  const listeners = {};
  const win = {
    matchMedia: () => ({ matches: true }), scrollY: 0, innerHeight: 600,
    addEventListener: (evt, fn) => { listeners[evt] = fn; },
  };
  const doc = {
    documentElement: { classList: { contains: () => false, add: () => {}, remove: () => {} }, scrollHeight: 1200 },
    getElementById: (id) => (id === 'timecode' ? tc : null),
  };
  vm.runInNewContext(JS, { window: win, document: doc, requestAnimationFrame: () => {} });
  return { tc, listeners, win };
}

test('H1 hero full-bleed con placeholder y 4 marcas de crop', () => {
  assert.equal(count(HTML, '<section class="hero"'), 1, 'falta la seccion hero');
  assert.equal(count(HTML, 'class="ph-video hero__media"'), 1, 'falta el video placeholder');
  assert.equal(count(HTML, 'class="crop"'), 4, 'no hay exactamente 4 marcas de crop');
  assert.equal(count(HTML, 'VIDEO 16:9 - REEMPLAZAR'), 1, 'falta el label del placeholder');
  assert.equal(count(HTML, 'id="sala"'), 1, 'se perdio main#sala');
  assert.match(CSS, /\.crop:nth-child\(4\)/, 'la cuarta marca no tiene esquina');
});

test('H2 el H1 expone el titular completo y el tamano gigante del brief', () => {
  const m = HTML.match(/<h1([^>]*)>([\s\S]*?)<\/h1>/);
  assert.ok(m, 'no hay <h1>');
  assert.match(m[1], /aria-label="EDITAMOS\. TÚ PUBLICAS\."/, 'el H1 no expone su texto completo');
  assert.ok(m[1].includes('data-i18n="reels_hero_title"'), 'falta la clave reels_hero_title');
  assert.equal(norm(m[2].replace(/<[^>]*>/g, ' ')), TITLE, 'el texto visible no coincide con el label');
  assert.match(CSS, /clamp\(3\.5rem,\s*12vw,\s*11rem\)/, 'el titular no usa el clamp del brief');
});

test('H4 timecode vivo: arranca en cero y avanza con el scroll', () => {
  const d = timecodeDom();
  assert.equal(d.tc.textContent, '00:00:00:00', 'el timecode no arranca en cero');
  assert.ok(d.listeners.scroll, 'el timecode no escucha el scroll');
  d.win.scrollY = 600;
  d.listeners.scroll();
  assert.equal(d.tc.textContent, '00:01:00:00', `timecode inesperado: ${d.tc.textContent}`);
});

test('H5 timecode y REC son decorativos; REC usa --rec y parpadea', () => {
  assert.equal(count(HTML, 'id="timecode" aria-hidden="true"'), 1, 'timecode sin aria-hidden');
  assert.match(HTML, /<span class="rec"[^>]*aria-hidden="true"/, 'REC sin aria-hidden');
  assert.match(CSS, /@keyframes rec-blink/, 'REC no parpadea');
  assert.match(CSS, /var\(--rec\)/, 'REC no usa --rec');
});

test('H6 un solo CTA, a WhatsApp, con clave reels_hero_cta', () => {
  const links = [...HTML.matchAll(/<a\s[^>]*href="([^"]*)"/g)].map((m) => m[1]);
  assert.equal(links.length, 1, `se esperaba 1 enlace, hay ${links.length}`);
  assert.ok(links[0].startsWith('https://wa.me/56920948874'), `destino inesperado: ${links[0]}`);
  assert.ok(HTML.includes('data-i18n="reels_hero_cta"'), 'falta la clave del CTA');
  assert.ok(HTML.indexOf('class="rec"') < HTML.indexOf('href="https://wa.me/'), 'REC no esta junto al CTA');
});

test('H8 E2E 2b1: la pagina servida trae el hero y los assets responden 200', async () => {
  const res = await fetch(`${srv.base}/videos-v2.html`);
  assert.equal(res.status, 200, 'la pagina no responde 200');
  assert.ok((await res.text()).includes('hero__title'), 'el hero no viaja en el HTML servido');
  for (const a of ['css/videos.css', 'js/videos.js']) {
    assert.equal((await fetch(`${srv.base}/${a}`)).status, 200, `${a} no responde 200`);
  }
});

test('H9 el titular abre aire entre lineas (fix estructural de la tilde)', () => {
  const m = CSS.match(/\.hero__line \+ \.hero__line\{([^}]*)\}/);
  assert.ok(m, 'no hay regla de separacion entre lineas');
  const v = m[1].match(/margin-top:\s*([\d.]+)em/);
  assert.ok(v, 'la separacion no usa em');
  assert.ok(Number(v[1]) > 0, 'la separacion es cero');
});

test('H10 el hero usa svh con respaldo vh y no queda ningun dvh', () => {
  assert.match(CSS, /\.hero\{[^}]*min-height:100vh;\s*min-height:100svh/, 'falta el patron vh -> svh en .hero');
  assert.equal(count(CSS, '100dvh'), 0, 'quedan alturas dvh');
});

test('H11 los medios del placeholder usan object-fit:cover', () => {
  assert.match(CSS, /\.ph-video[^{]*\bvideo\b[^{]*\{[^}]*object-fit:\s*cover/, 'falta object-fit:cover para video');
});
