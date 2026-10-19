// Tests del contrato del slice 25: la landing deja de cargar components/footer.html y lleva
// su propio mini-footer inline. Cada test nombra la condicion exacta que lo rompe.
// Ejecutar: node --test "tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { read, count, scriptBlockWith, gitShowBaseline } from './helpers/page.mjs';

const V = read('videos.html');
const BODY = V.slice(V.indexOf('<body'), V.indexOf('</body>'));
// Base congelada del slice 24: el footer compartido tal como estaba cuando se desacoplo.
// Comparar contra el archivo vivo reintroduciria el acoplamiento que este slice elimina.
const FOOTER_BASE = gitShowBaseline('88b7eb5', 'components/footer.html');

// Bloque <footer>...</footer> de un HTML (el primero; los tests verifican que sea unico).
function footerBlock(html) {
  const start = html.indexOf('<footer');
  assert.notEqual(start, -1, 'no hay <footer>');
  const end = html.indexOf('</footer>', start);
  assert.notEqual(end, -1, 'el <footer> no cierra');
  return html.slice(start, end + '</footer>'.length);
}

const normalize = (s) => s.replace(/\s+/g, ' ').trim();

test('S25-1 videos.html no carga ningun componente compartido ni oculta section#contacto', () => {
  assert.equal(count(V, 'components/'), 0, 'videos.html sigue referenciando components/');
  assert.equal(count(V, 'footer-placeholder'), 0, 'queda el footer-placeholder');
  assert.equal(count(V, 'loadComponent'), 0, 'queda el loader loadComponent');
  assert.equal(count(V, 'section#contacto'), 0, 'queda el ocultamiento de section#contacto');
});

test('S25-2 el unico destino de la landing es el WhatsApp del negocio', () => {
  assert.equal(count(V, 'mailto:'), 0, 'aparecio un mailto: en la landing');
  const hrefs = [...V.matchAll(/<a\s[^>]*\bhref="([^"]*)"/g)].map((m) => m[1]);
  assert.equal(hrefs.length, 7, `se esperaban 7 <a href>, hay ${hrefs.length}`);
  for (const h of hrefs) {
    assert.ok(h.startsWith('https://wa.me/56920948874'), `hay un enlace con otro destino: ${h}`);
  }
});

test('S25-3 hay un solo <footer>, tras </main>, sin enlaces, con #year y footer_rights', () => {
  assert.equal(count(V, '<footer'), 1, `se esperaba 1 <footer>, hay ${count(V, '<footer')}`);
  assert.ok(V.indexOf('<footer') > V.indexOf('</main>'), 'el footer quedo antes de </main>');
  const block = footerBlock(V);
  assert.equal(count(block, '<a '), 0, 'el mini-footer tiene un <a> (la landing solo permite el CTA)');
  assert.equal(count(block, 'id="year"'), 1, 'falta id="year" en el mini-footer');
  assert.equal(count(block, 'data-i18n="footer_rights"'), 1, 'falta data-i18n="footer_rights"');
});

test('S25-4 el mini-footer es identico al footer compartido congelado en 88b7eb5', () => {
  assert.equal(
    normalize(footerBlock(V)),
    normalize(footerBlock(FOOTER_BASE)),
    'el mini-footer se separo del <footer> compartido: se veria distinto',
  );
});

test('S25-5 DOMContentLoaded estampa el ano y llama initI18n exactamente una vez', () => {
  const block = scriptBlockWith(V, 'DOMContentLoaded');
  const code = block.slice('<script>'.length);
  assert.match(code, /initI18n\(\)/, 'el listener no llama a initI18n');
  const yearEl = { textContent: '' };
  const handlers = [];
  let calls = 0;
  const ctx = {
    document: {
      getElementById: (id) => (id === 'year' ? yearEl : null),
      addEventListener: (ev, fn) => { if (ev === 'DOMContentLoaded') handlers.push(fn); },
      querySelectorAll: () => [],
      documentElement: {},
    },
    initI18n: () => { calls++; },
  };
  vm.runInNewContext(code, ctx);
  assert.equal(handlers.length, 1, 'se esperaba un listener de DOMContentLoaded');
  assert.equal(calls, 0, 'initI18n corrio antes de DOMContentLoaded');
  handlers[0]();
  assert.equal(yearEl.textContent, new Date().getFullYear(), 'no se estampo el ano en #year');
  assert.equal(calls, 1, `initI18n se llamo ${calls} veces (se esperaba 1)`);
});

test('S25-6 components/footer.html sigue sirviendo al sitio general (index y casos)', () => {
  // index.html lo carga indirectamente via components/shared.js; casos.html lo pide directo.
  assert.equal(count(read('index.html'), 'footer-placeholder'), 1, 'index.html perdio el footer-placeholder');
  assert.equal(count(read('components/shared.js'), 'components/footer.html'), 1, 'shared.js ya no carga el footer compartido');
  assert.equal(count(read('casos.html'), 'components/footer.html'), 1, 'casos.html ya no carga el footer compartido');
  assert.equal(count(BODY, 'components/footer.html'), 0, 'la landing volvio a cargar el footer compartido');
});
