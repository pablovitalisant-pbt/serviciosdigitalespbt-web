// Smoke E2E del slice 1: sirve el repo por HTTP local (como lo usa Pablo en el navegador)
// y verifica que los recursos que el loader pide por fetch existen y responden 200.
// Si cualquiera de estos falla, initI18n nunca corre y la pagina queda sin navbar,
// sin footer y sin traductor (falla silenciosa: el loader no tiene .catch).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers/server.mjs';
import { count } from './helpers/page.mjs';

let srv;

before(async () => {
  srv = await startServer();
});
after(async () => {
  await srv.close();
});

const RESOURCES = [
  'videos.html',
  'casos.html',
  'components/navbar.html',
  'components/footer.html',
  'i18n/es.json',
  'i18n/en.json',
  'i18n/hi.json',
  'i18n/zh.json',
  'i18n/ur.json',
  'i18n/ko.json',
];

test('E2E: los 10 recursos que el loader necesita responden 200', async () => {
  const results = await Promise.all(
    RESOURCES.map(async (r) => {
      const res = await fetch(`${srv.base}/${r}`);
      return { r, status: res.status, type: res.headers.get('content-type') || '' };
    }),
  );
  const bad = results.filter((x) => x.status !== 200);
  assert.deepEqual(bad.map((b) => `${b.r}=${b.status}`), [], 'recursos que no responden 200');
  for (const r of results.filter((x) => x.r.endsWith('.json'))) {
    assert.match(r.type, /application\/json/, `${r.r} no se sirve como JSON`);
  }
});

test('E2E: el HTML servido por HTTP cumple el contrato de placeholders del slice', async () => {
  const html = await (await fetch(`${srv.base}/videos.html`)).text();
  assert.equal(count(html, '<div id="navbar-placeholder"></div>'), 1, 'falta el navbar-placeholder servido');
  assert.equal(count(html, '<div id="footer-placeholder"></div>'), 1, 'falta el footer-placeholder servido');
  assert.equal(count(html, '<header'), 0, 'el header de Stitch sigue en el HTML servido');
  assert.equal(count(html, '<footer'), 0, 'el footer de Stitch sigue en el HTML servido');
  assert.equal(count(html, 'fixed bottom-4 left-4 right-4 z-50 md:hidden'), 1, 'falta el boton fijo movil');
});

test('E2E: los componentes traen todo lo que initI18n toca (si falta, el motor revienta)', async () => {
  const nav = await (await fetch(`${srv.base}/components/navbar.html`)).text();
  const foot = await (await fetch(`${srv.base}/components/footer.html`)).text();

  assert.ok(nav.includes('id="lang-trigger"'), 'sin #lang-trigger initI18n revienta en trigger.addEventListener');
  assert.ok(nav.includes('id="current-lang-flag"'), 'sin #current-lang-flag updateLangSelector revienta');
  assert.ok(nav.includes('id="current-lang-code"'), 'sin #current-lang-code updateLangSelector revienta');
  assert.ok(nav.includes('id="mobile-menu"'), 'sin #mobile-menu el menu movil del navbar no funciona');
  assert.ok(nav.includes('toggleMobileMenu()'), 'el boton hamburguesa no llama a toggleMobileMenu');

  assert.ok(foot.includes('id="lang-menu"'), 'sin #lang-menu (footer no cargado) el selector de idioma no abre');
  assert.ok(foot.includes('id="contacto"'), 'el footer no trae section#contacto: no hay nada que ocultar');
  assert.ok(foot.includes('id="year"'), 'sin #year el loader no puede estampar el ano actual');
  for (const lang of ['es', 'en', 'hi', 'zh', 'ur', 'ko']) {
    assert.ok(foot.includes(`data-lang="${lang}"`), `falta el boton data-lang="${lang}"`);
  }
});

test('feature flag efectivo: navbar.html todavia no enlaza videos.html (hasta el slice 11)', async () => {
  const nav = await (await fetch(`${srv.base}/components/navbar.html`)).text();
  assert.equal(count(nav, 'videos.html'), 0, 'se enlazo videos.html antes del slice final');
});
