// Tests del contrato del slice 1 (videos.html: placeholders + loader + motor initI18n).
// Cada test intenta ROMPER el slice: nombra la condicion exacta que lo haria fallar.
// Ejecutar: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  read,
  count,
  idsOf,
  tailwindConfig,
  configTokens,
  configDependentClasses,
  extractInitI18n,
  extractScrollEffect,
  scriptBlockWith,
  extractSections,
  gitShowBaseline,
} from './helpers/page.mjs';

const VIDEOS = read('videos.html');
// Base congelada del slice 1: los conteos globales se derivan de ahi, no de numeros
// fijos (un slice de i18n no puede cambiarlos, pero un slice futuro si podria: que falle
// entonces, y no en cada slice nuevo por un numero cableado).
const VIDEOS_BASE = gitShowBaseline('8a5fa69', 'videos.html');
const CASOS = read('casos.html');
const NAVBAR = read('components/navbar.html');
const FOOTER = read('components/footer.html');

const NAV = '<div id="navbar-placeholder"></div>';
const FOOT = '<div id="footer-placeholder"></div>';
const WA_BAR = '<div class="fixed bottom-4 left-4 right-4 z-50 md:hidden">';

const HEAD = VIDEOS.slice(0, VIDEOS.indexOf('</head>'));
const BODY = VIDEOS.slice(VIDEOS.indexOf('<body'), VIDEOS.indexOf('</body>'));

// Los finales de linea son un detalle de ARCHIVO, no de codigo: casos.html es CRLF
// (unico del repo) y videos.html es LF, como Stitch y el resto. C10/C10b comparan
// codigo, asi que normalizan; y el test de LF aparte vigila el archivo.
const norm = (s) => s.replace(/\r\n/g, '\n');

// --- C1/C2 — navbar ---------------------------------------------------------

test('C1 el navbar-placeholder existe una sola vez y es el primer hijo de <body>', () => {
  assert.equal(count(VIDEOS, NAV), 1, `se esperaba 1 navbar-placeholder, hay ${count(VIDEOS, NAV)}`);
  const afterBodyTag = VIDEOS.indexOf('>', VIDEOS.indexOf('<body')) + 1;
  assert.ok(
    VIDEOS.slice(afterBodyTag).startsWith(NAV),
    'el navbar-placeholder no es el primer hijo de <body>; ahi sigue el header de Stitch',
  );
});

test('C2 el <header> propio de Stitch fue eliminado (no comentado)', () => {
  assert.equal(count(VIDEOS, '<header'), 0, 'queda el header de Stitch en videos.html');
});

// --- C3/C4/C5 — footer y boton fijo movil ----------------------------------

test('C3 el footer-placeholder existe una sola vez, tras </main> y antes del boton movil', () => {
  assert.equal(count(VIDEOS, FOOT), 1, `se esperaba 1 footer-placeholder, hay ${count(VIDEOS, FOOT)}`);
  assert.ok(VIDEOS.indexOf(FOOT) > VIDEOS.indexOf('</main>'), 'el footer-placeholder quedo antes de </main>');
  assert.ok(VIDEOS.indexOf(FOOT) < VIDEOS.indexOf(WA_BAR), 'el footer-placeholder quedo despues del boton movil');
});

test('C4 el <footer> propio de Stitch fue eliminado (no comentado)', () => {
  assert.equal(count(VIDEOS, '<footer'), 0, 'queda el footer de Stitch en videos.html');
});

test('C5a el boton fijo movil de WhatsApp de Stitch sigue intacto', () => {
  assert.equal(count(VIDEOS, WA_BAR), 1, 'desaparecio el boton fijo movil de WhatsApp');
  assert.ok(VIDEOS.includes('href="https://wa.me/"'), 'cambio el href del boton fijo movil');
});

test('C5b el boton movil sigue DESPUES del footer-placeholder (no se borro junto con el footer)', () => {
  assert.equal(count(VIDEOS, WA_BAR), 1, 'desaparecio el boton fijo movil de WhatsApp');
  assert.equal(count(VIDEOS, FOOT), 1, 'sin footer-placeholder no se puede ubicar el boton movil');
  assert.ok(
    VIDEOS.indexOf(WA_BAR) > VIDEOS.indexOf(FOOT),
    'el boton movil quedo antes del footer: el reemplazo se llevo puesto el final de la linea del footer',
  );
});

// --- C6/C7/C8 — lo que NO debe cambiar -------------------------------------

test('C6 el CTA final de Stitch sigue intacto (se conserva: es especifico de la oferta)', () => {
  assert.ok(VIDEOS.includes('Empieza hoy a publicar reels profesionales'), 'desaparecio el CTA de Stitch');
  assert.ok(VIDEOS.includes('Quiero cotizar por WhatsApp'), 'desaparecio el boton del CTA de Stitch');
  assert.ok(VIDEOS.includes('id="planes"'), 'desaparecio el ancla #planes que usa el CTA');
});

test('C7 los placeholders de WhatsApp de Stitch no se tocaron (conteos derivados de la base)', () => {
  for (const tok of ['[LINK_WHATSAPP]', 'href="https://wa.me/"']) {
    assert.equal(count(VIDEOS, tok), count(VIDEOS_BASE, tok), `cambio la cantidad de ${tok}`);
  }
});

// C8 original: "0 data-i18n en videos.html". Su intencion real era "no se adelanto
// trabajo de los slices siguientes", no "no hay i18n": cada slice traduce una seccion.
// Se mide contra `extractSections`, que es el registro de secciones ya traducidas. El
// detalle de QUE claves y QUE spans lleva cada seccion vive en tests/i18n-sections.test.mjs
// (P1/P3/P6/G3), que ademas cubre el archivo entero: aca queda solo el invariante.
test('C8 solo las secciones ya traducidas llevan i18n (los slices siguientes intactos)', () => {
  assert.equal(
    count(extractSections(VIDEOS), 'data-i18n="'),
    count(VIDEOS, 'data-i18n="'),
    'hay data-i18n fuera de las secciones traducidas: se adelanto trabajo de un slice futuro',
  );
});

// --- C9 — loader de componentes y bandera de carrera -----------------------

test('C9 el loader vive al final del <body>, con las dos banderas y las dos llamadas', () => {
  assert.ok(BODY.indexOf('function loadComponent(') > BODY.indexOf(WA_BAR), 'el loader no esta al final del <body>');
  assert.ok(BODY.includes("loadComponent('navbar-placeholder', 'components/navbar.html'"), 'no carga el navbar en su placeholder');
  assert.ok(BODY.includes("loadComponent('footer-placeholder', 'components/footer.html'"), 'no carga el footer en su placeholder');
  assert.ok(BODY.includes('var navbarDone = false;'), 'falta la bandera navbarDone');
  assert.ok(BODY.includes('var footerDone = false;'), 'falta la bandera footerDone');
  assert.match(
    BODY,
    /if \(navbarDone && footerDone && typeof initI18n === 'function'\)/,
    'tryInitI18n no exige AMBAS banderas: initI18n podria correr con un solo componente cargado',
  );
  assert.equal(count(BODY, 'tryInitI18n();'), 2, 'los dos callbacks deben llamar a tryInitI18n');
});

test('el head de Stitch queda sin los scripts del slice (decision aprobada: van al final del body)', () => {
  assert.ok(!HEAD.includes('loadComponent'), 'el loader se colo en el <head>');
  assert.ok(!HEAD.includes('function initI18n'), 'initI18n se colo en el <head>');
});

// --- C10 — motor i18n identico a casos.html -------------------------------

test('C10 initI18n de videos.html es el mismo codigo que el de casos.html (ignorando finales de linea)', () => {
  assert.equal(norm(extractInitI18n(VIDEOS)), norm(extractInitI18n(CASOS)), 'el motor initI18n diverge de casos.html');
});

test('C10b el efecto de scroll del navbar es el mismo codigo que el de casos.html (ignorando finales de linea)', () => {
  assert.equal(
    norm(extractScrollEffect(VIDEOS)),
    norm(extractScrollEffect(CASOS)),
    'el efecto de scroll diverge de casos.html',
  );
});

// --- finales de linea del archivo -----------------------------------------
// Este test faltaba y por eso el defecto de la Fase C (104 CRLF importados de
// casos.html a un archivo LF) paso invisible: C10 solo mira el bloque copiado.
test('R6 videos.html no contiene ningun \\r (LF, como Stitch y el resto del repo)', () => {
  assert.equal(count(VIDEOS, '\r'), 0, 'videos.html quedo con finales de linea CRLF/mezclados');
});

// --- C11 — un solo CTA en la pagina ---------------------------------------

test('C11 el callback del footer oculta section#contacto con display:none (un solo CTA)', () => {
  const loader = scriptBlockWith(VIDEOS, 'function loadComponent(');
  const i = loader.indexOf("loadComponent('footer-placeholder'");
  assert.ok(i !== -1, 'no hay callback de footer en el loader');
  assert.ok(
    loader.includes("document.querySelector('#footer-placeholder section#contacto')"),
    'el callback del footer no busca #footer-placeholder section#contacto',
  );
  assert.match(loader, /\.style\.display\s*=\s*'none'/, "no oculta el CTA con style.display='none' (decision aprobada)");
  assert.ok(
    loader.indexOf(".style.display = 'none'") > i,
    'el ocultamiento no esta dentro del callback del footer',
  );
});

// --- C12/C13 — head y anclas de Stitch -----------------------------------

test('C12 el head de Stitch sigue intacto (CDN sin plugins, tailwind-config, fuentes)', () => {
  assert.ok(HEAD.includes('<script src="https://cdn.tailwindcss.com">'), 'el CDN cambio: no debe llevar ?plugins=');
  assert.ok(HEAD.includes('<script id="tailwind-config">'), 'falta el tailwind-config inline');
  assert.equal(count(HEAD, 'fonts.googleapis.com/css2'), 3, 'cambio la cantidad de links de fuentes');
  assert.equal(count(HEAD, 'fonts.gstatic.com'), 1, 'cambio el preconnect de fonts.gstatic.com');
});

test('C13 las anclas de Stitch siguen presentes (las usan el CTA y el navbar compartido)', () => {
  for (const id of ['planes', 'como-funciona', 'preguntas-frecuentes']) {
    assert.equal(count(VIDEOS, `id="${id}"`), 1, `falta el ancla #${id}`);
  }
});

// --- Riesgos R3/R4 del analisis (Fase B, paso 1) --------------------------

test('R4 sin colision de ids entre videos.html y los componentes inyectados', () => {
  const v = idsOf(VIDEOS);
  const comp = new Set([...idsOf(NAVBAR), ...idsOf(FOOTER)]);
  const clash = [...v].filter((id) => comp.has(id));
  assert.deepEqual(clash, [], `ids duplicados entre videos.html y los componentes: ${clash.join(', ')}`);
  assert.equal([...v].filter((id) => id === 'contacto').length, 0, 'videos.html ya tiene un #contacto propio');
});

test('R4 todas las clases de diseno que usan navbar/footer existen en el tailwind-config de videos.html', () => {
  // Oracle: los tokens que casos.html define (ahi el navbar/footer ya renderizan bien).
  const oracle = configTokens(tailwindConfig(CASOS));
  const videosKeys = configTokens(tailwindConfig(VIDEOS));
  const used = [...configDependentClasses(NAVBAR, oracle), ...configDependentClasses(FOOTER, oracle)];
  assert.ok(used.length >= 20, `el escaneo de clases fue vacuo (${used.length} tokens): revisar el helper`);
  const missing = used.filter((u) => !videosKeys.has(u.suffix));
  assert.deepEqual(
    missing.map((m) => m.raw),
    [],
    'clases sin token en el config de videos.html: el navbar o el footer quedarian sin estilo',
  );
});
