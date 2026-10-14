// Tests del contrato del slice 18: la landing no tiene navbar (solo CTAs) y el motor i18n
// funciona sin selector de idioma (guardado -> navegador -> es).
// Ejecutar: node --test "tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { read, count, extractInitI18n } from './helpers/page.mjs';

const V = read('index.html');
const BODY = V.slice(V.indexOf('<body'), V.indexOf('</body>'));

test('S18-1 sin navbar: ni placeholder, ni carga del componente, ni <header>', () => {
  assert.equal(count(V, 'navbar-placeholder'), 0, 'queda el navbar-placeholder');
  assert.equal(count(V, 'components/navbar.html'), 0, 'videos.html sigue cargando el navbar');
  assert.equal(count(V, '<header'), 0, 'hay un <header> en la landing');
  assert.equal(count(V, "querySelector('header')"), 0, 'queda el efecto de scroll de un header que no existe');
});

test('S18-2 <main> ya no reserva el alto del header fijo (pt-20)', () => {
  const main = V.match(/<main class="([^"]*)"/)?.[1];
  assert.ok(main, 'no se encontro <main>');
  assert.ok(!main.split(' ').includes('pt-20'), 'main conserva pt-20: queda una franja vacia arriba');
});

test('S18-3 el footer se sigue cargando y dispara initI18n', () => {
  assert.ok(BODY.includes("loadComponent('footer-placeholder', 'components/footer.html'"), 'no carga el footer');
  const cb = BODY.slice(BODY.indexOf("loadComponent('footer-placeholder'"));
  assert.ok(cb.indexOf('initI18n();') > 0, 'el callback del footer no llama a initI18n');
  assert.equal(count(BODY, 'navbarDone'), 0, 'queda la bandera del navbar: initI18n nunca correria');
});

// Ejecuta el motor real sobre un DOM minimo SIN navbar: es exactamente lo que rompia el
// initI18n copiado de casos.html (trigger.addEventListener sobre null).
async function runI18n({ saved, browser, failFetch = false }) {
  const el = { key: 'videos_hero_cta_whatsapp', textContent: 'original', getAttribute() { return this.key; } };
  const html = { dir: '', lang: '' };
  const fetched = [];
  const ctx = {
    document: {
      getElementById: () => null,
      querySelectorAll: (sel) => (sel === '[data-i18n]' ? [el] : []),
      addEventListener() {},
      documentElement: html,
    },
    localStorage: { getItem: () => saved ?? null, setItem() {} },
    navigator: { language: browser },
    console: { error() {} },
    fetch: async (url) => {
      fetched.push(url);
      if (failFetch) throw new Error('offline');
      return { json: async () => ({ videos_hero_cta_whatsapp: 'T:' + url }) };
    },
  };
  vm.runInNewContext(extractInitI18n(V) + '\ninitI18n();', ctx);
  await new Promise((r) => setTimeout(r, 10));
  return { el, html, fetched };
}

test('S18-4 initI18n corre sin navbar y aplica el idioma del navegador', async () => {
  const { el, html, fetched } = await runI18n({ browser: 'en-US' });
  assert.deepEqual(fetched, ['i18n/en.json']);
  assert.equal(el.textContent, 'T:i18n/en.json', 'no aplico la traduccion');
  assert.equal(html.lang, 'en');
  assert.equal(html.dir, 'ltr');
});

test('S18-5 el idioma guardado manda sobre el navegador; urdu va en RTL', async () => {
  const { fetched, html } = await runI18n({ saved: 'ur', browser: 'en-US' });
  assert.deepEqual(fetched, ['i18n/ur.json']);
  assert.equal(html.dir, 'rtl');
});

test('S18-6 idioma desconocido o guardado invalido cae a espanol', async () => {
  assert.deepEqual((await runI18n({ saved: 'xx', browser: 'fr-FR' })).fetched, ['i18n/es.json']);
});

test('S18-7 si el JSON no carga, la pagina queda en espanol sin reventar', async () => {
  const { el } = await runI18n({ browser: 'en', failFetch: true });
  assert.equal(el.textContent, 'original');
});
