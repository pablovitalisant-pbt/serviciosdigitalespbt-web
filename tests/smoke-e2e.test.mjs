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
  'index.html',
  'servicios.html',
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

test('E2E: los 12 recursos que el loader necesita responden 200', async () => {
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
  const html = await (await fetch(`${srv.base}/index.html`)).text();
  assert.equal(count(html, 'navbar-placeholder'), 0, 'la landing sirve un navbar-placeholder (slice 18: sin navbar)');
  assert.equal(count(html, '<div id="footer-placeholder"></div>'), 1, 'falta el footer-placeholder servido');
  assert.equal(count(html, '<header'), 0, 'el header de Stitch sigue en el HTML servido');
  assert.equal(count(html, '<footer'), 0, 'el footer de Stitch sigue en el HTML servido');
  assert.equal(count(html, 'fixed bottom-4 left-4 right-4 z-50 md:hidden'), 0, 'sigue la barra fija movil (slice 23 la elimino)');
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

// --- Slice 11 (final): el navbar publica la landing ---------------------------
// El "feature flag efectivo" del PLAN (videos.html existia pero ninguna pagina la
// enlazaba) se RETIRA en el slice 11. El test viejo afirmaba 0 enlaces; ahora afirma
// el contrato opuesto, con conteo EXACTO: 1 item desktop + 1 item movil.
// Slice 20: la landing paso a ser index.html; el item apunta ahi directo.

test('feature flag retirado: navbar.html enlaza la landing exactamente 2 veces (desktop + movil)', async () => {
  const nav = await (await fetch(`${srv.base}/components/navbar.html`)).text();
  assert.equal(count(nav, 'href="index.html"'), 2, 'se esperaba 1 item desktop + 1 item movil, ni mas ni menos');
});

test('S11 los 2 items llevan la clave nav_videos y un href relativo index.html', async () => {
  const nav = await (await fetch(`${srv.base}/components/navbar.html`)).text();
  const items = [...nav.matchAll(/<a\b[^>]*href="index\.html"[^>]*>/g)].map((m) => m[0]);
  assert.equal(items.length, 2, `se esperaban 2 <a href="index.html">, hay ${items.length}`);
  for (const it of items) {
    assert.match(it, /data-i18n="nav_videos"/, `item sin la clave nav_videos: ${it}`);
  }
  const moviles = items.filter((it) => it.includes('closeMobileMenu()'));
  assert.equal(moviles.length, 1, 'el item del menu movil debe cerrar el menu, como sus hermanos');
});

test('S11 el item queda despues de Casos de Éxito y antes del CTA, en desktop y en movil (D2)', async () => {
  const nav = await (await fetch(`${srv.base}/components/navbar.html`)).text();
  // La 1.a ocurrencia de cada clave esta en el nav desktop; la ultima, en el menu movil.
  const casos = [nav.indexOf('data-i18n="nav_cases"'), nav.lastIndexOf('data-i18n="nav_cases"')];
  const vids = [nav.indexOf('data-i18n="nav_videos"'), nav.lastIndexOf('data-i18n="nav_videos"')];
  const cta = [nav.indexOf('data-i18n="nav_contact"'), nav.lastIndexOf('data-i18n="nav_contact"')];
  for (const [i, etq] of [[0, 'desktop'], [1, 'movil']]) {
    assert.ok(casos[i] !== -1 && vids[i] !== -1 && cta[i] !== -1, `en ${etq} falta alguno de los 3 items`);
    assert.ok(casos[i] < vids[i] && vids[i] < cta[i], `en ${etq} el item no quedo entre Casos de Éxito y el CTA`);
  }
});

test('S11 el nav desktop libera ancho en tablet: gap-4 lg:gap-8, sin gap-8 suelto (D1)', async () => {
  const nav = await (await fetch(`${srv.base}/components/navbar.html`)).text();
  const m = nav.match(/<nav class="([^"]*)"/);
  assert.ok(m, 'no se encontro el <nav> desktop');
  const cls = m[1].split(/\s+/);
  assert.ok(cls.includes('gap-4') && cls.includes('lg:gap-8'), `falta la mitigacion de ancho: ${m[1]}`);
  assert.ok(!cls.includes('gap-8'), 'quedo gap-8 sin prefijo lg: (no libera ancho entre 768 y 1024px)');
});

test('S11 nav_videos existe, es string y no esta vacia en los 6 JSON servidos', async () => {
  for (const l of ['es', 'en', 'hi', 'zh', 'ur', 'ko']) {
    const res = await fetch(`${srv.base}/i18n/${l}.json`);
    assert.equal(res.status, 200, `${l}.json no responde 200`);
    const j = await res.json();
    assert.equal(typeof j.nav_videos, 'string', `${l}.json: nav_videos no es string`);
    assert.ok(j.nav_videos.trim().length > 0, `${l}.json: nav_videos vacia (el motor hace if (translations[key]) y no la aplicaria)`);
  }
});

test('S11 el texto visible del item en el HTML es identico a es.json (D1)', async () => {
  const nav = await (await fetch(`${srv.base}/components/navbar.html`)).text();
  const es = await (await fetch(`${srv.base}/i18n/es.json`)).json();
  const textos = [...nav.matchAll(/<a\b[^>]*data-i18n="nav_videos"[^>]*>([^<]*)<\/a>/g)].map((m) => m[1].trim());
  assert.equal(textos.length, 2, `no se pudieron leer los 2 textos del item (${textos.length})`);
  for (const t of textos) assert.equal(t, es.nav_videos, 'el texto del HTML y es.json difieren');
});
