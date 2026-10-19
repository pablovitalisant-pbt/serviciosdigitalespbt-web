// Tests del contrato del slice 1 (videos.html: placeholders + loader + motor initI18n).
// Cada test intenta ROMPER el slice: nombra la condicion exacta que lo haria fallar.
// Ejecutar: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  read,
  count,
  tailwindConfig,
  configTokens,
  configDependentClasses,
  extractSections,
  gitShowBaseline,
} from './helpers/page.mjs';

const VIDEOS = read('videos.html');
// Base congelada del slice 1: los conteos globales se derivan de ahi, no de numeros
// fijos (un slice de i18n no puede cambiarlos, pero un slice futuro si podria: que falle
// entonces, y no en cada slice nuevo por un numero cableado).
const VIDEOS_BASE = gitShowBaseline('8a5fa69', 'videos.html');
const CASOS = read('casos.html');
const FOOTER = read('components/footer.html');

const FOOT = '<div id="footer-placeholder"></div>';
const WA_BAR = '<div class="fixed bottom-4 left-4 right-4 z-50 md:hidden">';

const HEAD = VIDEOS.slice(0, VIDEOS.indexOf('</head>'));

// --- C1/C2 — navbar ---------------------------------------------------------

// C1 (navbar-placeholder) se retiro en el slice 18: la landing no tiene navbar (S18-1).

test('C2 el <header> propio de Stitch fue eliminado (no comentado)', () => {
  assert.equal(count(VIDEOS, '<header'), 0, 'queda el header de Stitch en videos.html');
});

// --- C3/C4/C5 — footer y boton fijo movil ----------------------------------

// Slice 25: el placeholder y el loader se eliminan; el footer pasa a ser inline.
test('C3 no queda footer-placeholder: el footer vive inline tras </main>', () => {
  assert.equal(count(VIDEOS, FOOT), 0, `sigue el footer-placeholder (${count(VIDEOS, FOOT)})`);
  assert.ok(VIDEOS.indexOf('<footer') > VIDEOS.indexOf('</main>'), 'el footer inline quedo antes de </main>');
});

test('C4 hay exactamente un <footer> propio (el mini-footer del slice 25)', () => {
  assert.equal(count(VIDEOS, '<footer'), 1, `se esperaba 1 <footer>, hay ${count(VIDEOS, '<footer')}`);
});

const WA_HREF = 'https://wa.me/56920948874?text=';

// Slice 23: decision de Pablo, la barra fija movil con el CTA se elimino (C5a/C5b la vigilaban).
test('C5 no hay ningun boton flotante fijo en la landing (slice 23)', () => {
  assert.equal(count(VIDEOS, WA_BAR), 0, 'sigue la barra fija movil del CTA');
  const body = VIDEOS.slice(VIDEOS.indexOf('<body'));
  // La clase `fixed` suelta (no `text-primary-fixed`): separada por espacio o comillas.
  assert.doesNotMatch(body, /class="(?:[^"]*\s)?fixed[\s"]/, 'hay un elemento position:fixed en el body');
  assert.equal(count(VIDEOS, 'videos_mobile_whatsapp'), 0, 'queda la clave de la barra movil');
});

// --- C6/C8 — lo que NO debe cambiar (C7 cambio de sentido en el slice 14) ----

test('C6 el CTA final de Stitch sigue intacto (se conserva: es especifico de la oferta)', () => {
  assert.ok(VIDEOS.includes('Empieza hoy a publicar reels profesionales'), 'desaparecio el CTA de Stitch');
  assert.ok(VIDEOS.includes('Quiero mi Pack de Reels'), 'desaparecio el boton del CTA (slice 16)');
  assert.ok(VIDEOS.includes('id="planes"'), 'desaparecio el ancla #planes que usa el CTA');
});

// Slice 14: los placeholders de Stitch YA no existen, y exactamente 8 botones (los 7
// [LINK_WHATSAPP] + el href="https://wa.me/" vacio) apuntan al chat. Los conteos de la base
// van cableados a proposito: si la base congelada cambiara, este test mediria otra cosa y
// tiene que avisarlo.
test('C7 los placeholders de WhatsApp de Stitch ya no existen (los resolvio el slice 14)', () => {
  assert.equal(count(VIDEOS_BASE, '[LINK_WHATSAPP]'), 7, 'la base 8a5fa69 ya no tiene 7 [LINK_WHATSAPP]');
  assert.equal(count(VIDEOS_BASE, 'href="https://wa.me/"'), 1, 'la base 8a5fa69 ya no tiene 1 href="https://wa.me/" vacio');
  for (const tok of ['[LINK_WHATSAPP]', 'href="https://wa.me/"']) {
    assert.equal(count(VIDEOS, tok), 0, `quedan placeholders de WhatsApp sin resolver: ${tok}`);
  }
  assert.equal(
    count(VIDEOS, `href="${WA_HREF}`),
    7,
    'los botones de WhatsApp con chat no son 7 (la barra fija movil se elimino en el slice 23)',
  );
});

// C8 original: "0 data-i18n en videos.html". Su intencion real era "no se adelanto
// trabajo de los slices siguientes", no "no hay i18n": cada slice traduce una seccion.
// Se mide contra `extractSections`, que es el registro de secciones ya traducidas. El
// detalle de QUE claves y QUE spans lleva cada seccion vive en tests/i18n-sections.test.mjs
// (P1/P3/P6/G3), que ademas cubre el archivo entero: aca queda solo el invariante.
test('C8 solo las secciones ya traducidas llevan i18n (los slices siguientes intactos)', () => {
  // Slice 25: el mini-footer aporta footer_rights fuera de extractSections; se descuenta.
  const footer = VIDEOS.slice(VIDEOS.indexOf('<footer'), VIDEOS.indexOf('</footer>') + '</footer>'.length);
  assert.equal(
    count(extractSections(VIDEOS), 'data-i18n="'),
    count(VIDEOS, 'data-i18n="') - count(footer, 'data-i18n="'),
    'hay data-i18n fuera de las secciones traducidas y del mini-footer: se adelanto trabajo de un slice futuro',
  );
});

// --- C9 — loader de componentes (retirado en el slice 25) ------------------

test('el head de Stitch queda sin los scripts del slice (decision aprobada: van al final del body)', () => {
  assert.ok(!HEAD.includes('loadComponent'), 'el loader se colo en el <head>');
  assert.ok(!HEAD.includes('function initI18n'), 'initI18n se colo en el <head>');
});

// C10/C10b (motor i18n y scroll copiados de casos.html) se retiraron en el slice 18: sin
// navbar el motor de casos revienta (no hay #lang-trigger). Lo reemplazan S18-4..7.

// --- finales de linea del archivo -----------------------------------------
// Este test faltaba y por eso el defecto de la Fase C (104 CRLF importados de
// casos.html a un archivo LF) paso invisible: C10 solo mira el bloque copiado.
test('R6 videos.html no contiene ningun \\r (LF, como Stitch y el resto del repo)', () => {
  assert.equal(count(VIDEOS, '\r'), 0, 'videos.html quedo con finales de linea CRLF/mezclados');
});

// --- C11 — un solo CTA en la pagina (retirado en el slice 25) --------------
// Ya no se inyecta section#contacto: no hay CTA compartido que ocultar (S25-1 lo vigila).

// --- C12/C13 — head y anclas de Stitch -----------------------------------

test('C12 el head de Stitch sigue intacto (CDN sin plugins, tailwind-config, fuentes)', () => {
  assert.ok(HEAD.includes('<script src="https://cdn.tailwindcss.com">'), 'el CDN cambio: no debe llevar ?plugins=');
  assert.ok(HEAD.includes('<script id="tailwind-config">'), 'falta el tailwind-config inline');
  assert.equal(count(HEAD, 'fonts.googleapis.com/css2'), 3, 'cambio la cantidad de links de fuentes');
  assert.equal(count(HEAD, 'fonts.gstatic.com'), 1, 'cambio el preconnect de fonts.gstatic.com');
  // Slice 15: UNICA adicion aprobada al head de Stitch (el <title> SEO, ver C12b). Cualquier
  // otro <meta>/<link>/<script> nuevo tiene que romper aca.
  assert.equal(count(HEAD, '<meta'), 3, 'cambio la cantidad de <meta> del head (solo el charset/viewport/shell-type de Stitch)');
  assert.equal(count(HEAD, '<link'), 5, 'cambio la cantidad de <link> del head (2 preconnect + 3 hojas de fuentes de Stitch)');
});

// Slice 15: SEO. videos.html no traia <title> (Stitch no lo genero); se agrega uno en espanol
// fijo, igual que index.html y casos.html, que tampoco lo traducen (initI18n solo escribe
// textContent de [data-i18n], no el titulo de la pestana).
test('C12b el head lleva exactamente 1 <title> SEO con el texto aprobado (slice 15)', () => {
  assert.equal(count(VIDEOS, '<title'), 1, `se esperaba 1 <title> en todo el archivo, hay ${count(VIDEOS, '<title')}`);
  const m = HEAD.match(/<title>([^<]*)<\/title>/);
  assert.ok(m, 'el <title> no esta en el <head> o no esta bien cerrado');
  assert.equal(m[1], 'Edición de Reels para Negocios | Servicios Digitales PBT', 'el texto del <title> no es el aprobado');
  assert.ok(m[1].length <= 60, `el <title> pasa los 60 caracteres de SERP: ${m[1].length}`);
  assert.ok(m[1].includes('Reels'), 'el <title> perdio la palabra clave "Reels"');
  assert.ok(m[1].includes('Servicios Digitales PBT'), 'el <title> perdio la marca');
  assert.ok(
    HEAD.includes('<meta charset="utf-8"><title>'),
    'el <title> no quedo inmediatamente despues de <meta charset="utf-8">',
  );
});

test('C13 las anclas de Stitch siguen presentes (las usan el CTA y el navbar compartido)', () => {
  for (const id of ['planes', 'como-funciona', 'preguntas-frecuentes']) {
    assert.equal(count(VIDEOS, `id="${id}"`), 1, `falta el ancla #${id}`);
  }
});

// --- Riesgos R3/R4 del analisis (Fase B, paso 1) --------------------------

test('R4 videos.html no tiene ids duplicados ni un #contacto propio', () => {
  // Slice 25: ya no se inyectan componentes, asi que no hay colision posible con
  // footer.html. El invariante que queda es el del propio archivo.
  const ids = [...VIDEOS.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  assert.deepEqual(dupes, [], `ids duplicados en videos.html: ${dupes.join(', ')}`);
  assert.equal(count(VIDEOS, 'id="contacto"'), 0, 'videos.html ya tiene un #contacto propio');
});

test('R4 todas las clases de diseno que usa el footer existen en el tailwind-config de videos.html', () => {
  // Oracle: los tokens que casos.html define (ahi el navbar/footer ya renderizan bien).
  const oracle = configTokens(tailwindConfig(CASOS));
  const videosKeys = configTokens(tailwindConfig(VIDEOS));
  const used = configDependentClasses(FOOTER, oracle);
  assert.ok(used.length >= 10, `el escaneo de clases fue vacuo (${used.length} tokens): revisar el helper`);
  const missing = used.filter((u) => !videosKeys.has(u.suffix));
  assert.deepEqual(
    missing.map((m) => m.raw),
    [],
    'clases sin token en el config de videos.html: el footer quedaria sin estilo',
  );
});
