// Tests del contrato del slice 4 (i18n de la seccion 3 "QUE RECIBES" de
// videos.html: 15 claves videos_includes_*).
// Cada test intenta ROMPER el slice: nombra la condicion exacta que lo haria fallar.
// Fase B: escritos ANTES de tocar videos.html y los JSON. Los que exigen el trabajo
// del slice nacen ROJOS a proposito; los que vigilan "nada mas cambio" nacen verdes.
// Ejecutar: node --test "tests/*.test.mjs"
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  read,
  count,
  extractIncludes,
  extractIncludesMarker,
  i18nElems,
  hasChildTag,
  visibleText,
  stripBom,
  gitShowBaseline,
} from './helpers/page.mjs';
import { startServer } from './helpers/server.mjs';

const VIDEOS = read('videos.html');

// Base congelada del slice 3. NO usar HEAD (ver gitShowBaseline): al commitear el
// slice 4, HEAD ya traeria el archivo nuevo y P9 pasaria trivialmente.
const BASE = '5105ab1';
const LANGS = ['es', 'en', 'hi', 'zh', 'ur', 'ko'];

// Las 15 claves de la seccion, en el orden del contrato (Fase A aprobada).
const KEYS = [
  'videos_includes_kicker',
  'videos_includes_title',
  'videos_includes_subtitle',
  'videos_includes_note_title',
  'videos_includes_note_body',
  'videos_includes_card1_title',
  'videos_includes_card1_body',
  'videos_includes_card2_title',
  'videos_includes_card2_body',
  'videos_includes_card3_title',
  'videos_includes_card3_body',
  'videos_includes_card4_title',
  'videos_includes_card4_body',
  'videos_includes_card5_title',
  'videos_includes_card5_body',
];

// Texto ES = el de Stitch. OJO con card3_title: el HTML dice `Subtítulos &amp; Gráficos`
// pero aca va `&` LITERAL, porque el motor usa textContent, que NO decodifica entidades.
// Mismo caso ya aprobado en el hero: `Barbería & Estilo`.
const ES = {
  videos_includes_kicker: 'Entregables Claros',
  videos_includes_title: '¿Qué incluye exactamente el servicio?',
  videos_includes_subtitle:
    'Cero ambigüedades. Cada video se procesa bajo estándares de ritmo rápido, audio depurado y gráficos optimizados para retención de audiencia en plataformas verticales.',
  videos_includes_note_title: 'Nota de alcance transparente',
  videos_includes_note_body:
    'Grabación presencial en tu local, publicación de videos en tus redes, gestión de comentarios/mensajes y videos generados 100% con IA no están incluidos en estos planes (se pueden cotizar por separado).',
  videos_includes_card1_title: 'Formato 9:16 vertical',
  videos_includes_card1_body:
    'Videos de hasta 60 segundos listos para Instagram Reels, TikTok y YouTube Shorts con encuadre dinámico.',
  videos_includes_card2_title: 'Edición desde tu bruto',
  videos_includes_card2_body:
    'Cortes de silencios, eliminación de titubeos, estabilización y selección del mejor ritmo de oratoria.',
  videos_includes_card3_title: 'Subtítulos & Gráficos',
  videos_includes_card3_body:
    'Subtítulos dinámicos de alta legibilidad, tipografía y elementos visuales acordes al plan elegido.',
  videos_includes_card4_title: 'Archivo listo para subir',
  videos_includes_card4_body:
    'Entrega en archivo MP4 Full HD optimizado para que no pierda resolución al cargarlo desde tu celular.',
  videos_includes_card5_title: 'Rondas de revisión incluidas',
  videos_includes_card5_body:
    'Entre 1 y 2 rondas de ajustes menores según el plan contratado para asegurar que cada video quede a tu entera conformidad antes del lanzamiento.',
};

// Decision de Fase A: en esta seccion NINGUN texto necesita <span> envolvente.
// Los 6 iconos (info + los 5 de las tarjetas) son HERMANOS de los textos, no hijos:
// el icono vive en su propio <span>/<div> contenedor y el texto en otro tag.
const WRAPPED = [];

// El unico texto que puede legitimamente quedar igual al espanol en algun idioma.
// En esta seccion no hay ninguna marca que quede sola como valor completo (Instagram,
// TikTok, YouTube, MP4 y Full HD van dentro de frases traducibles): lista vacia.
const WHITELIST_SIN_TRADUCIR = new Set([]);

const SEC = extractIncludes(VIDEOS);

// --- P1/P2/P3 — inventario y ubicacion en el HTML ----------------------------

test('P1 la seccion tiene exactamente las 15 claves, todas con prefijo videos_includes_', () => {
  const found = i18nElems(SEC).map((e) => e.key);
  assert.deepEqual(
    [...found].sort(),
    [...KEYS].sort(),
    `las claves de la seccion no son las 15 del contrato (hay ${found.length}): ${found.join(', ')}`,
  );
  for (const k of found) {
    assert.match(k, /^videos_includes_/, `la clave "${k}" no usa el prefijo videos_includes_`);
  }
});

test('P2 no hay claves repetidas en la seccion (el motor aplicaria la ultima y taparia un error)', () => {
  const found = i18nElems(SEC).map((e) => e.key);
  // Sin esto el test es vacuamente verde antes del slice: 0 claves, 0 duplicados.
  assert.equal(found.length, 15, `con ${found.length} claves el detector de duplicados no probaria nada`);
  const dupes = found.filter((k, i) => found.indexOf(k) !== i);
  assert.deepEqual([...new Set(dupes)], [], `claves duplicadas en la seccion: ${dupes.join(', ')}`);
});

test('P3 las 15 claves videos_includes_ viven solo dentro de la seccion', () => {
  assert.equal(count(VIDEOS, 'data-i18n="videos_includes_'), 15, 'hay claves videos_includes_ fuera de la seccion');
  assert.equal(count(SEC, 'data-i18n="videos_includes_'), 15, 'la seccion no tiene las 15 claves');
});

// --- P4 (meta) — el marcador del extractor no puede ser ambiguo --------------

test('P4 (meta) el marcador del extractor es unico: el tag <section> NO servia, aparece 2 veces', () => {
  const tag = '<section class="w-full bg-surface-container-low text-on-surface py-section-gap-md">';
  assert.equal(
    count(VIDEOS, tag),
    2,
    'el tag de la seccion dejo de ser ambiguo: revisar si el marcador por comentario sigue siendo necesario',
  );
  assert.equal(
    count(VIDEOS, extractIncludesMarker()),
    1,
    'el marcador por comentario se volvio ambiguo: extractIncludes podria devolver la seccion equivocada',
  );
  // Y la seccion extraida es de verdad la 3 (la del checklist de entregables).
  assert.ok(
    visibleText(SEC).includes('Entregables Claros'),
    'extractIncludes no devolvio la seccion "QUE RECIBES"',
  );
  assert.equal(count(SEC, 'id="planes"'), 0, 'extractIncludes se paso a la seccion de planes');
});

// --- P5/P6 — la forma del data-i18n (el motor hace textContent =) ------------

test('P5 ningun data-i18n de la seccion vive en un elemento con hijos (el motor borraria el icono)', () => {
  const elems = i18nElems(SEC);
  assert.equal(elems.length, 15, `se esperaban 15 elementos con data-i18n, hay ${elems.length}`);
  const malos = elems.filter((e) => hasChildTag(e.inner));
  assert.deepEqual(
    malos.map((m) => `${m.key} (<${m.tag}>)`),
    [],
    'estos elementos tienen hijos: el motor hace textContent = y los borraria',
  );
});

test('P5b (meta) el icono info es HERMANO del titulo de la nota: el data-i18n va en el span, no en el div', () => {
  // Estructura real de la nota de alcance:
  //   <div class="flex items-center gap-2 text-primary mb-2">
  //     <span class="material-symbols-outlined text-[20px]">info</span>
  //     <span class="font-label-bold text-label-bold uppercase">Nota de alcance transparente</span>
  //   </div>
  // Poner el data-i18n en el <div> borraria el icono: por eso el riesgo es real y no teorico.
  const i = SEC.indexOf('>info</span>');
  assert.notEqual(i, -1, 'no se encontro el icono info en la seccion: cambio la estructura de la nota');
  const bloque = SEC.slice(i, SEC.indexOf('</div>', i));
  assert.ok(
    bloque.includes('<span class="font-label-bold text-label-bold uppercase"'),
    'el span del titulo de la nota no es hermano del icono info',
  );
  assert.equal(count(bloque, 'data-i18n='), 1, 'el data-i18n de la nota debe caer en el span del titulo');
  assert.ok(
    !/class="flex items-center gap-2 text-primary mb-2" data-i18n=/.test(SEC),
    'el data-i18n se puso en el <div> contenedor: el motor borraria el icono info',
  );
  // Y el detector SI distingue un icono HIJO de uno hermano (si no, el guard seria vacuo).
  const hijo = i18nElems('<span data-i18n="k">Texto <span class="material-symbols-outlined">chat</span></span>');
  assert.equal(hasChildTag(hijo[0].inner), true, 'no detecta un icono HIJO (el guard seria vacuo)');
});

test('P6 la seccion no agrega NINGUN span envolvente (los 6 iconos son hermanos, no hijos)', () => {
  const elems = i18nElems(SEC);
  assert.equal(elems.length, 15, `con ${elems.length} elementos la lista vacia de spans no probaria nada`);
  const wrapped = elems
    .filter((e) => e.attrs === `data-i18n="${e.key}"`)
    .map((e) => e.key)
    .sort();
  assert.deepEqual(
    wrapped,
    [...WRAPPED].sort(),
    'hay spans envolventes (tag de apertura sin class): en esta seccion no debe haber ninguno',
  );
  assert.equal(count(SEC, '<span data-i18n="'), 0, 'aparecio un <span data-i18n="..."> pelado');
});

// --- P7 — nada visual cambio ------------------------------------------------

test('P7 la seccion conserva sus 6 iconos, sus 38 class y sigue sin href, id ni data-alt', () => {
  assert.equal(count(SEC, 'material-symbols-outlined'), 6, 'cambio la cantidad de iconos de la seccion');
  assert.equal(count(SEC, 'class="'), 38, 'cambio la cantidad de class de la seccion');
  assert.equal(
    new Set([...SEC.matchAll(/class="([^"]*)"/g)].map((m) => m[1])).size,
    18,
    'cambio alguna class de la seccion',
  );
  assert.equal(count(SEC, 'data-alt='), 0, 'aparecio un data-alt en la seccion');
  assert.equal(count(SEC, 'href='), 0, 'aparecio un href en la seccion (no habia ninguno)');
  assert.equal(count(SEC, 'id='), 0, 'aparecio un id en la seccion (no habia ninguno)');
  assert.equal(count(SEC, '[LINK_WHATSAPP]'), 0, 'aparecio un placeholder de WhatsApp en la seccion');
});

// --- P8 — el espanol del JSON == el texto del HTML --------------------------

test('P8a es.json dice exactamente el texto ES del contrato (sin espacios de mas)', () => {
  const es = JSON.parse(stripBom(read('i18n/es.json')));
  for (const k of KEYS) {
    assert.equal(es[k], ES[k], `es.json["${k}"] no coincide con el texto de Stitch`);
  }
});

test('P8b ese texto existe de verdad en la seccion original (la tabla del contrato no se invento nada)', () => {
  const original = visibleText(extractIncludes(gitShowBaseline(BASE, 'videos.html')));
  for (const k of KEYS) {
    assert.ok(
      original.includes(ES[k]),
      `"${ES[k]}" (${k}) no aparece en la seccion original: el contrato invento ese texto`,
    );
  }
});

test('P8c el unico &amp; de la seccion se traduce a & literal (textContent no decodifica entidades)', () => {
  const original = extractIncludes(gitShowBaseline(BASE, 'videos.html'));
  assert.equal(count(original, '&amp;'), 1, 'cambio la cantidad de entidades &amp; de la seccion');
  assert.ok(original.includes('Subtítulos &amp; Gráficos'), 'no se encontro el &amp; de card3_title');
  assert.equal(ES.videos_includes_card3_title, 'Subtítulos & Gráficos', 'el contrato no usa & literal');
  assert.ok(!ES.videos_includes_card3_title.includes('&amp;'), 'el valor del JSON lleva la entidad sin decodificar');
  assert.ok(
    visibleText(original).includes(ES.videos_includes_card3_title),
    'visibleText no resuelve el &amp; al valor del contrato',
  );
});

// --- P10 — convenciones del JSON -------------------------------------------

test('P10 los 6 JSON conservan BOM, CRLF y el } final sin salto, y las 15 claves van una por linea', () => {
  for (const l of LANGS) {
    const raw = read(`i18n/${l}.json`);
    assert.equal(raw.charCodeAt(0), 0xfeff, `${l}.json perdio el BOM (decision aprobada: preservarlo)`);
    assert.equal(count(raw, '\n'), count(raw, '\r\n'), `${l}.json quedo con finales de linea mezclados`);
    assert.ok(raw.endsWith('}'), `${l}.json gano un salto de linea final`);
    const lines = stripBom(raw).split('\r\n');
    for (const k of KEYS) {
      const hits = lines.filter((ln) => ln.trimStart().startsWith(`"${k}":`));
      assert.equal(hits.length, 1, `${l}.json: "${k}" debe estar en exactamente 1 linea (hay ${hits.length})`);
      assert.match(hits[0], new RegExp(`^  "${k}": ".+",?$`), `${l}.json: formato de la linea de "${k}"`);
    }
  }
});

// --- P11 — cada idioma traduce de verdad ------------------------------------

test('P11 cada idioma traduce de verdad (no es el espanol copiado), con lista blanca', () => {
  const es = JSON.parse(stripBom(read('i18n/es.json')));
  for (const l of LANGS.filter((x) => x !== 'es')) {
    const j = JSON.parse(stripBom(read(`i18n/${l}.json`)));
    const missing = KEYS.filter((k) => !Object.hasOwn(j, k));
    assert.deepEqual(missing, [], `${l}.json: faltan claves, comparar contra es seria un falso verde`);
    const same = KEYS.filter((k) => j[k] === es[k] && !WHITELIST_SIN_TRADUCIR.has(k));
    assert.ok(
      same.length <= 3,
      `${l}.json tiene ${same.length} claves identicas al espanol (max 3): ${same.join(', ')}`,
    );
    for (const k of KEYS) {
      assert.notEqual(String(j[k]).trim(), '', `${l}.json: "${k}" esta vacia (el motor la ignoraria)`);
    }
  }
});

// --- P9 — equivalencia byte a byte de la seccion ----------------------------

test('P9 la seccion es byte a byte el original + los 15 atributos data-i18n (nada mas)', () => {
  const base = extractIncludes(gitShowBaseline(BASE, 'videos.html'));
  const nuevo = extractIncludes(VIDEOS);
  const attrs = [...nuevo.matchAll(/ data-i18n="[^"]*"/g)];
  assert.equal(attrs.length, 15, `se esperaban 15 data-i18n en la seccion, hay ${attrs.length}`);
  const norm = (s) => s.replace(/\r\n/g, '\n');
  assert.equal(
    norm(nuevo.replace(/ data-i18n="[^"]*"/g, '')),
    norm(base),
    'la seccion cambio algo mas que los data-i18n: clases, orden, indentacion o texto',
  );
});

// --- E2E por HTTP (los componentes y los JSON se cargan por fetch) ----------

let srv;
before(async () => {
  srv = await startServer();
});
after(async () => {
  await srv.close();
});

test('E2E la seccion servida por HTTP trae las 15 claves', async () => {
  const html = await (await fetch(`${srv.base}/videos.html`)).text();
  const sec = extractIncludes(html);
  for (const k of KEYS) {
    assert.ok(sec.includes(`data-i18n="${k}"`), `la seccion servida no trae ${k}`);
  }
});

test('E2E los 6 JSON servidos traen las claves de la seccion y res.json() no explota con el BOM', async () => {
  for (const l of LANGS) {
    const res = await fetch(`${srv.base}/i18n/${l}.json`);
    assert.equal(res.status, 200, `${l}.json no responde 200`);
    const parsed = await res.json();
    for (const k of KEYS) {
      assert.equal(typeof parsed[k], 'string', `${l}.json servido no trae "${k}" como string`);
    }
  }
});
