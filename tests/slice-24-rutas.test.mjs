// Tests del contrato del slice 24: se restauran las rutas originales.
//   /               -> index.html     = sitio general (restaurado)
//   /videos.html    -> landing de reels (slices 21-23 intactos, sin navbar)
//   /servicios.html -> redireccion noindex a / (protege enlaces del 13-oct)
// Cada test nombra la condicion exacta que lo rompe.
// Ejecutar: node --test "tests/*.test.mjs"
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { read, count, idsOf } from './helpers/page.mjs';
import { startServer } from './helpers/server.mjs';

const INDEX = read('index.html');
const VIDEOS = read('videos.html');
const SERV = read('servicios.html');
const NAV = read('components/navbar.html');
const FOOT = read('components/footer.html');

test('S24-1 index.html es el sitio general original, sin rastro de la landing', () => {
  assert.equal(count(INDEX, 'id="reel-carousel"'), 0, 'index.html sigue siendo la landing');
  assert.equal(count(INDEX, 'Quiero mi Pack de Reels'), 0, 'index.html trae el CTA de reels');
  for (const id of ['servicios', 'testimonio', 'proceso']) {
    assert.ok(idsOf(INDEX).has(id), `index.html perdio el ancla #${id}`);
  }
  // #contacto lo inyecta el footer (no vive en el HTML del index, igual que antes del slice 20).
  assert.ok(idsOf(FOOT).has('contacto'), 'el footer perdio section#contacto');
});

test('S24-2 videos.html es la landing de reels, con su title propio', () => {
  assert.equal(count(VIDEOS, 'id="reel-carousel"'), 1, 'videos.html no es la landing');
  assert.ok(VIDEOS.includes('Quiero mi Pack de Reels'), 'videos.html no trae el CTA de la landing');
  assert.match(
    VIDEOS,
    /<title>Edición de Reels para Negocios \| Servicios Digitales PBT<\/title>/,
    'falta el title de la landing',
  );
});

test('S24-3 la landing no tiene navbar; lleva su propio footer inline (slice 25)', () => {
  assert.equal(count(VIDEOS, 'components/navbar.html'), 0, 'la landing carga el navbar');
  assert.equal(count(VIDEOS, 'navbar-placeholder'), 0, 'queda el navbar-placeholder');
  assert.equal(count(VIDEOS, '<header'), 0, 'hay un <header> en la landing');
  assert.equal(count(VIDEOS, 'components/footer.html'), 0, 'la landing volvio a cargar el footer compartido');
  assert.equal(count(VIDEOS, '<footer'), 1, 'la landing perdio su footer');
});

test('S24-4 servicios.html vuelve a ser solo la redireccion a /', () => {
  assert.match(SERV, /<meta http-equiv="refresh" content="0; url=\/">/, 'falta el meta refresh a /');
  assert.match(SERV, /<meta name="robots" content="noindex">/, 'servicios.html seria indexable');
  assert.match(SERV, /<link rel="canonical" href="\/">/, 'falta el canonical a /');
  assert.equal(count(SERV, 'reel-carousel'), 0, 'servicios.html es una copia de la landing');
  assert.equal(count(SERV, 'id="servicios"'), 0, 'servicios.html es una copia del sitio general');
});

test('S24-5 el navbar apunta al mapa nuevo (index general / videos landing)', () => {
  assert.equal(count(NAV, 'servicios.html'), 0, 'quedan enlaces al stub servicios.html');
  assert.equal(count(NAV, 'href="index.html"'), 1, 'se esperaba solo el logo apuntando a index.html');
  assert.equal(count(NAV, 'href="videos.html"'), 2, 'se esperaban 2 items Videos (desktop + movil)');
  for (const m of NAV.matchAll(/href="index\.html#([^"]+)"/g)) {
    // #contacto vive en el footer, que se inyecta en el index.
    const ok = idsOf(INDEX).has(m[1]) || (m[1] === 'contacto' && idsOf(FOOT).has('contacto'));
    assert.ok(ok, `el navbar apunta a index.html#${m[1]}, que no existe`);
  }
});

let srv;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });

test('S24-6 (E2E) las 3 paginas nuevas responden 200', async () => {
  for (const p of ['index.html', 'videos.html', 'servicios.html']) {
    const res = await fetch(`${srv.base}/${p}`);
    assert.equal(res.status, 200, `${p} no responde 200`);
  }
});
