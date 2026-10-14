// Tests del contrato del slice 20: la landing de videos es el index (el QR impreso de las
// tarjetas apunta a la raiz del dominio), la pagina general pasa a servicios.html y
// /videos.html redirige a la raiz para no romper enlaces ya compartidos.
// Ejecutar: node --test "tests/*.test.mjs"
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { read, count, idsOf } from './helpers/page.mjs';
import { startServer } from './helpers/server.mjs';

const INDEX = read('index.html');
const SERV = read('servicios.html');
const VIDEOS = read('videos.html');
const NAV = read('components/navbar.html');

test('S20-1 index.html es la landing de videos (carrusel + CTA unico)', () => {
  assert.equal(count(INDEX, 'id="reel-carousel"'), 1, 'index.html no es la landing de videos');
  assert.ok(INDEX.includes('Quiero mi Pack de Reels'), 'index.html no trae el CTA de la landing');
});

test('S20-2 servicios.html es la pagina general de antes, con sus anclas', () => {
  for (const id of ['servicios', 'testimonio', 'proceso']) {
    assert.ok(idsOf(SERV).has(id), `servicios.html perdio el ancla #${id}`);
  }
  assert.equal(count(SERV, 'id="reel-carousel"'), 0, 'servicios.html es la landing, no la pagina general');
});

test('S20-3 videos.html solo redirige a la raiz (sin contenido duplicado para SEO)', () => {
  assert.match(VIDEOS, /<meta http-equiv="refresh" content="0; url=\/">/, 'falta el meta refresh a /');
  assert.match(VIDEOS, /<link rel="canonical" href="\/">/, 'falta el canonical a /');
  assert.match(VIDEOS, /<meta name="robots" content="noindex">/, 'videos.html seria indexable');
  assert.match(VIDEOS, /<a href="\/">/, 'falta el enlace manual por si el navegador no redirige');
  assert.equal(count(VIDEOS, 'reel-carousel'), 0, 'videos.html sigue siendo una copia de la landing');
});

test('S20-4 el navbar de las otras paginas ya no apunta al index viejo', () => {
  assert.equal(count(NAV, 'index.html#'), 0, 'quedan anclas index.html#... (ahora viven en servicios.html)');
  assert.equal(count(NAV, 'href="videos.html"'), 0, 'el item Videos sigue pasando por la redireccion');
  assert.equal(count(NAV, '<a href="servicios.html"><img'), 1, 'el logo no lleva a servicios.html');
  for (const m of NAV.matchAll(/href="servicios\.html#([^"]+)"/g)) {
    const ok = idsOf(SERV).has(m[1]) || m[1] === 'contacto'; // #contacto lo inyecta el footer
    assert.ok(ok, `el navbar apunta a servicios.html#${m[1]}, que no existe`);
  }
  assert.ok(NAV.includes('href="servicios.html#contacto"'), 'el CTA Contactame no apunta a servicios.html#contacto');
});

let srv;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });

test('S20-5 (E2E) las 3 paginas se sirven: index, servicios y la redireccion', async () => {
  for (const p of ['index.html', 'servicios.html', 'videos.html']) {
    const res = await fetch(`${srv.base}/${p}`);
    assert.equal(res.status, 200, `${p} no responde 200`);
  }
});
