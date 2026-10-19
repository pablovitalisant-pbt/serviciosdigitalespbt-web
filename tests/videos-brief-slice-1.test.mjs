// Contrato del slice 1 del brief videos: esqueleto de la nueva landing (videos-v2.html).
// Cada test nombra la condicion exacta que lo rompe.
// Ejecutar: node --test "tests/*.test.mjs"
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { read, count } from './helpers/page.mjs';
import { startServer } from './helpers/server.mjs';

const HTML = read('videos-v2.html');
const CSS = read('css/videos.css');
const JS = read('js/videos.js');
const NAV = read('components/navbar.html');
const FLAGS = JSON.parse(read('config/feature-flags.json'));

let srv;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });

const TOKENS = { ink: '#0A0A0D', 'ink-2': '#15151B', bone: '#F2EEE6', mute: '#8A8794',
  signal: '#D4FF3A', uv: '#7A5CFF', rec: '#FF3D2E' };

// Corre js/videos.js con un window simulado y devuelve las clases que aplico al root.
function runJs(win) {
  const classes = [];
  const ctx = { window: win, document: { documentElement: { classList: { add: (c) => classes.push(c) } } } };
  vm.runInNewContext(JS, ctx);
  return classes;
}

// Libs presentes: espia de Lenis/GSAP para verificar el cableado exacto.
function withLibs(reduce) {
  const calls = { lenis: 0, on: [], ticker: 0, lag: 0, plugin: 0 };
  const win = {
    matchMedia: () => ({ matches: reduce }), ScrollTrigger: { update: () => {} },
    gsap: { registerPlugin: () => calls.plugin++, ticker: { add: () => calls.ticker++, lagSmoothing: () => calls.lag++ } },
    Lenis: function () { calls.lenis++; this.on = (evt) => calls.on.push(evt); this.raf = () => {}; },
  };
  return { win, calls };
}

test('B1 standalone, en es, con noindex, sin componentes ni Tailwind', () => {
  assert.match(HTML, /<html lang="es">/, 'falta lang="es"');
  assert.equal(count(HTML, 'name="viewport"'), 1, 'falta el viewport');
  assert.equal(count(HTML, '<meta name="robots" content="noindex, nofollow">'), 1, 'falta noindex exacto');
  assert.equal(count(HTML, 'components/'), 0, 'carga un componente compartido');
  assert.equal(count(HTML, 'cdn.tailwindcss.com'), 0, 'metio Tailwind, que este diseno no usa');
  assert.equal(count(HTML, 'id="navbar-placeholder"'), 0, 'trae el placeholder de navbar');
});

test('B2 define los 7 tokens del brief con los hex exactos', () => {
  for (const [name, hex] of Object.entries(TOKENS)) {
    assert.match(CSS, new RegExp(`--${name}\\s*:\\s*${hex}`, 'i'), `falta --${name}: ${hex}`);
  }
});

test('B3 carga las 3 fuentes con sus pesos y preconnect', () => {
  assert.equal(count(HTML, 'https://fonts.googleapis.com" rel="preconnect"'), 1, 'falta preconnect a googleapis');
  assert.equal(count(HTML, 'https://fonts.gstatic.com" crossorigin'), 1, 'falta preconnect a gstatic');
  for (const spec of ['Unbounded:wght@700;900', 'Inter+Tight:wght@400;500;700', 'JetBrains+Mono:wght@400;600']) {
    assert.ok(HTML.includes(spec), `falta la fuente ${spec}`);
  }
});

test('B4 fija GSAP y Lenis por version exacta, con defer y en orden', () => {
  const urls = ['https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js',
    'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js',
    'https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.min.js'];
  for (const url of urls) {
    assert.equal(count(HTML, `src="${url}"`), 1, `falta ${url}`);
    assert.ok(HTML.includes(`src="${url}" defer`), `${url} sin defer`);
  }
  assert.ok(HTML.indexOf(urls[0]) < HTML.indexOf(urls[1]), 'ScrollTrigger antes que gsap');
  assert.ok(HTML.indexOf(urls[1]) < HTML.indexOf('src="js/videos.js"'), 'js/videos.js antes de las librerias');
  assert.equal(count(HTML, 'latest'), 0, 'hay una version flotante (latest)');
  assert.equal(count(HTML, 'href="css/videos.css"'), 1, 'no enlaza css/videos.css');
  assert.equal(count(HTML, 'src="js/videos.js" defer'), 1, 'no carga js/videos.js con defer');
});

test('B6 reduced-motion: CSS apaga animaciones y JS no inicializa Lenis', () => {
  assert.match(CSS, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(CSS, /animation:\s*none\s*!important/);
  assert.match(JS, /prefers-reduced-motion: reduce/);
  const { win, calls } = withLibs(true);
  assert.equal(calls.lenis, 0, 'inicializo Lenis con reduced-motion');
  assert.ok(runJs(win).includes('no-motion'), 'no marco el root como no-motion');
});

test('B7 sin CDN la pagina no rompe: sale limpia y estatica', () => {
  const classes = runJs({ matchMedia: () => ({ matches: false }) });
  assert.ok(classes.includes('no-motion'), 'sin librerias no aplico no-motion');
});

test('B8 con librerias cablea Lenis + ScrollTrigger una sola vez', () => {
  const { win, calls } = withLibs(false);
  const classes = runJs(win);
  assert.equal(calls.lenis, 1, `construyo Lenis ${calls.lenis} veces`);
  assert.ok(calls.on.includes('scroll'), 'no enlazo lenis.on("scroll")');
  assert.deepEqual([calls.ticker, calls.lag, calls.plugin], [1, 1, 1], 'cableado incompleto de gsap/lenis');
  assert.ok(classes.includes('motion'), 'no marco el root como motion');
});
test('B9 grain, placeholders base y labels estan definidos', () => {
  assert.match(CSS, /feTurbulence/, 'el grano no usa SVG turbulence');
  assert.match(CSS, /--noise/, 'el grano no esta tokenizado');
  assert.match(CSS, /\.ph-video/, 'falta .ph-video');
  assert.match(CSS, /\.ph-img/, 'falta .ph-img');
  assert.match(CSS, /aspect-ratio:\s*9\s*\/\s*16/, '9:16 no usa aspect-ratio');
  assert.ok(count(HTML, 'REEMPLAZAR') >= 1, 'no quedo ningun placeholder marcado');
});
test('B10 prefijo reels_ y flag apagado: la pagina no esta publicada', () => {
  const keys = [...HTML.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(keys.length > 0, 'no hay ningun data-i18n');
  for (const k of keys) assert.match(k, /^reels_/, `clave sin prefijo reels_: ${k}`);
  assert.equal(FLAGS.videos_v2, false, 'el flag videos_v2 no esta en false');
  assert.equal(count(NAV, 'videos-v2'), 0, 'el navbar ya enlaza la pagina sin publicar');
});

test('B11 E2E flujo principal: pagina y assets locales responden 200 por HTTP', async () => {
  const locals = [...HTML.matchAll(/(?:href|src)="((?!https?:|data:)[^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(locals.sort(), ['css/videos.css', 'js/videos.js'], 'assets locales inesperados');
  for (const u of ['videos-v2.html', 'config/feature-flags.json', ...locals]) {
    assert.equal((await fetch(`${srv.base}/${u}`)).status, 200, `${u} no respondio 200`);
  }
  assert.ok((await (await fetch(`${srv.base}/videos-v2.html`)).text()).includes('id="sala"'), 'la pagina servida no es la esperada');
  // Sub-slice 2a: el bootstrap del preloader viaja en el HTML servido, no en un asset aparte.
  assert.ok((await (await fetch(`${srv.base}/videos-v2.html`)).text()).includes('reels_v2_preloaded'), 'la pagina servida no trae el bootstrap del preloader');
});
