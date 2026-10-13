// Tests del contrato del slice 5 (i18n de la parte 1 de la seccion 4 "PLANES
// MENSUALES" de videos.html: encabezado + planes Económica y Equilibrada, 30 claves
// videos_plans_*). La parte 2 (Plan Premium + nota comercial) es el slice 6.
// Cada test intenta ROMPER el slice: nombra la condicion exacta que lo haria fallar.
// Fase B: escritos ANTES de tocar videos.html y los JSON. Los que exigen el trabajo
// del slice nacen ROJOS a proposito; los que vigilan "nada mas cambio" nacen verdes.
// Ejecutar: node --test "tests/*.test.mjs"
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  read,
  count,
  extractPlansA,
  extractPlansMarker,
  extractPlansCutMarker,
  i18nElems,
  hasChildTag,
  visibleText,
  stripBom,
  gitShowBaseline,
} from './helpers/page.mjs';
import { startServer } from './helpers/server.mjs';

const VIDEOS = read('videos.html');

// Base congelada del slice 4. NO usar HEAD (ver gitShowBaseline): al commitear el
// slice 5, HEAD ya traeria el archivo nuevo y P9 pasaria trivialmente.
const BASE = '7a90186';
const LANGS = ['es', 'en', 'hi', 'zh', 'ur', 'ko'];

// Las 30 claves del contrato (Fase A aprobada), en el orden del HTML.
const KEYS = [
  'videos_plans_kicker',
  'videos_plans_title',
  'videos_plans_subtitle',
  'videos_plans_p1_kicker',
  'videos_plans_p1_title',
  'videos_plans_p1_unit',
  'videos_plans_p1_reel_price',
  'videos_plans_p1_b1_n',
  'videos_plans_p1_b1_s',
  'videos_plans_p1_b2',
  'videos_plans_p1_b3',
  'videos_plans_p1_b4',
  'videos_plans_p1_b5',
  'videos_plans_p1_b6',
  'videos_plans_p1_cta',
  'videos_plans_p2_badge',
  'videos_plans_p2_kicker',
  'videos_plans_p2_title',
  'videos_plans_p2_unit',
  'videos_plans_p2_reel_price',
  'videos_plans_p2_b1_n',
  'videos_plans_p2_b1_s',
  'videos_plans_p2_b2',
  'videos_plans_p2_b3',
  'videos_plans_p2_b4_pre',
  'videos_plans_p2_b4_strong',
  'videos_plans_p2_b4_post',
  'videos_plans_p2_b5',
  'videos_plans_p2_b6',
  'videos_plans_p2_cta',
];

// Texto ES = el de Stitch. Los numeros y "CLP" van LITERALES dentro de la frase
// (decision aprobada). Ortografia exacta: "1ª" (U+00AA), "máx.", "•" (U+2022).
const ES = {
  videos_plans_kicker: 'Suscripciones Mensuales',
  videos_plans_title: 'Planes Mensuales',
  videos_plans_subtitle:
    'Precios transparentes en pesos chilenos. Sin contratos forzosos ni letras chicas.',
  videos_plans_p1_kicker: 'Para comenzar',
  videos_plans_p1_title: 'Plan Económica',
  videos_plans_p1_unit: 'CLP / mes',
  videos_plans_p1_reel_price: '$20.000 CLP por reel',
  videos_plans_p1_b1_n: '4 reels al mes',
  videos_plans_p1_b1_s: '(hasta 60s cada uno)',
  videos_plans_p1_b2: 'Edición usando estilo base ya definido',
  videos_plans_p1_b3: 'Gráficos de plantilla visual existente',
  videos_plans_p1_b4: 'Sin b-roll generado por IA incluido',
  videos_plans_p1_b5: '1 ronda de cambios menores por reel',
  videos_plans_p1_b6: 'Entrega 1ª versión en máx. 48h hábiles',
  videos_plans_p1_cta: 'Elegir Económica',
  videos_plans_p2_badge: 'Más Popular • Recomendado',
  videos_plans_p2_kicker: 'El equilibrio perfecto',
  videos_plans_p2_title: 'Plan Equilibrada',
  videos_plans_p2_unit: 'CLP / mes',
  videos_plans_p2_reel_price: '$25.000 CLP por reel • Mayor presencia semanal',
  videos_plans_p2_b1_n: '8 reels al mes',
  videos_plans_p2_b1_s: '(hasta 60s cada uno)',
  videos_plans_p2_b2: 'Estilo adaptado a la identidad de tu negocio',
  videos_plans_p2_b3: 'Ajuste de colores, tipografía, logo y marca',
  videos_plans_p2_b4_pre: 'Hasta',
  videos_plans_p2_b4_strong: '2 clips breves de b-roll IA',
  videos_plans_p2_b4_post: 'por reel',
  videos_plans_p2_b5: '1 ronda de cambios menores por reel',
  videos_plans_p2_b6: 'Entrega 1ª versión en máx. 48h hábiles',
  videos_plans_p2_cta: 'Elegir Equilibrada',
};

// Los 4 textos que van dentro de un <span data-i18n> NUEVO (sin class): su contenedor
// tiene un <strong> adentro y el motor hace textContent =, que lo borraria. Los
// espacios que hoy rodean a esos textos quedan como nodos de texto FUERA del span.
const WRAPPED = [
  'videos_plans_p1_b1_s',
  'videos_plans_p2_b1_s',
  'videos_plans_p2_b4_post',
  'videos_plans_p2_b4_pre',
];

// Los 7 fragmentos de los 3 bullets que llevan <strong>: son los unicos textos de la
// seccion que NO son una frase completa. Si alguno quedara vacio en algun idioma, el
// motor hace `if (translations[key])`, no aplicaria nada y el espanol sobreviviria
// mezclado con el idioma elegido (defecto silencioso).
const FRAGMENTOS = [
  'videos_plans_p1_b1_n',
  'videos_plans_p1_b1_s',
  'videos_plans_p2_b1_n',
  'videos_plans_p2_b1_s',
  'videos_plans_p2_b4_pre',
  'videos_plans_p2_b4_strong',
  'videos_plans_p2_b4_post',
];

// El numero que cada fragmento con <strong> NO puede perder al traducirse.
const DIGITO_DE_FRAGMENTO = {
  videos_plans_p1_b1_n: '4',
  videos_plans_p2_b1_n: '8',
  videos_plans_p2_b4_strong: '2',
};

// Los precios PUROS no se traducen ni llevan clave: si alguno apareciera en el JSON
// o desapareciera del HTML, el contrato se rompio. Casillas de impuestos NO son.
const PRECIOS_PUROS = ['$80.000', '$200.000'];

// Nombres de plan (decision aprobada: SE TRADUCEN, y el slice 7 debe reutilizar
// exactamente estas mismas traducciones para "Nivel Económica/Equilibrada/Premium").
const NOMBRES_DE_PLAN = ['videos_plans_p1_title', 'videos_plans_p2_title'];

// El unico texto que puede legitimamente quedar igual al espanol en algun idioma.
// Decision de Pablo: los nombres de plan se traducen, asi que no hay lista blanca.
const WHITELIST_SIN_TRADUCIR = new Set([]);

const SEC = extractPlansA(VIDEOS);

const RAW = Object.fromEntries(LANGS.map((l) => [l, read(`i18n/${l}.json`)]));
const JSONS = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(stripBom(RAW[l]))]));
// Las claves viejas intactas las vigila C5 del slice 2 (contra su propia base): no se
// repite aca.

// --- P1/P2/P3 — inventario y ubicacion en el HTML ---------------------------

test('P1 la parte 1 de planes tiene exactamente las 30 claves, todas con prefijo videos_plans_', () => {
  const found = i18nElems(SEC).map((e) => e.key);
  assert.deepEqual(
    [...found].sort(),
    [...KEYS].sort(),
    `las claves de la seccion no son las 30 del contrato (hay ${found.length}): ${found.join(', ')}`,
  );
  for (const k of found) {
    assert.match(k, /^videos_plans_/, `la clave "${k}" no usa el prefijo videos_plans_`);
  }
});

test('P2 no hay claves repetidas en la seccion (el motor aplicaria la ultima y taparia un error)', () => {
  const found = i18nElems(SEC).map((e) => e.key);
  // Sin esto el test es vacuamente verde antes del slice: 0 claves, 0 duplicados.
  assert.equal(found.length, 30, `con ${found.length} claves el detector de duplicados no probaria nada`);
  const dupes = found.filter((k, i) => found.indexOf(k) !== i);
  assert.deepEqual([...new Set(dupes)], [], `claves duplicadas en la seccion: ${dupes.join(', ')}`);
  // Y son 30 claves distintas: ninguna compartida entre planes (decision aprobada).
  assert.equal(new Set(found).size, 30, 'hay claves compartidas entre ocurrencias repetidas');
});

test('P3 las 30 claves videos_plans_ viven solo dentro de la seccion (el slice 6 no se adelanto)', () => {
  assert.equal(count(VIDEOS, 'data-i18n="videos_plans_'), 30, 'hay claves videos_plans_ fuera de la seccion');
  assert.equal(count(SEC, 'data-i18n="videos_plans_'), 30, 'la seccion no tiene las 30 claves');
});

// --- P4 (meta) — los marcadores del extractor no pueden ser ambiguos ---------

test('P4 (meta) los marcadores son unicos y extractPlansA devuelve la seccion 4, no la 3 ni la 5', () => {
  assert.equal(count(VIDEOS, extractPlansMarker()), 1, 'el marcador de la seccion 4 se volvio ambiguo');
  assert.equal(count(VIDEOS, extractPlansCutMarker()), 1, 'el corte en PLAN 3 se volvio ambiguo');
  assert.ok(
    visibleText(SEC).includes('Suscripciones Mensuales') && visibleText(SEC).includes('Plan Equilibrada'),
    'extractPlansA no devolvio el encabezado + los planes 1 y 2',
  );
  assert.equal(count(SEC, 'Plan Premium'), 0, 'extractPlansA se paso a la parte 2 (Plan Premium)');
  assert.equal(count(SEC, 'id="como-funciona"'), 0, 'extractPlansA se paso a la seccion siguiente');
  assert.equal(count(SEC, 'Entregables Claros'), 0, 'extractPlansA empezo en la seccion 3');
});

// --- P5/P6 — la forma del data-i18n (el motor hace textContent =) ------------

test('P5 ningun data-i18n de la seccion vive en un elemento con hijos (el motor borraria el icono o el strong)', () => {
  const elems = i18nElems(SEC);
  assert.equal(elems.length, 30, `se esperaban 30 elementos con data-i18n, hay ${elems.length}`);
  const malos = elems.filter((e) => hasChildTag(e.inner));
  assert.deepEqual(
    malos.map((m) => `${m.key} (<${m.tag}>)`),
    [],
    'estos elementos tienen hijos: el motor hace textContent = y los borraria',
  );
});

test('P5b (meta) el detector SI distingue un <strong> hijo de uno hermano: el guard no es vacuo', () => {
  const hijo = '<span data-i18n="k">Hasta <strong>2 clips</strong> por reel</span>';
  const hermano = '<span class=""><strong data-i18n="k">4 reels al mes</strong> <span data-i18n="k2">(x)</span></span>';
  assert.equal(hasChildTag(i18nElems(hijo)[0].inner), true, 'no detecta un <strong> HIJO (el guard seria vacuo)');
  const hermanoElems = i18nElems(hermano);
  assert.equal(hermanoElems.length, 2, 'el detector no encontro los 2 data-i18n hermanos');
  assert.deepEqual(
    hermanoElems.map((e) => hasChildTag(e.inner)),
    [false, false],
    'marca como violacion un <strong> HERMANO (falso rojo)',
  );
});

test('P6 los spans envolventes son exactamente los 4 declarados (tag de apertura sin class)', () => {
  const elems = i18nElems(SEC);
  assert.equal(elems.length, 30, `con ${elems.length} elementos la lista de spans no probaria nada`);
  // Solo los <span>: el <strong data-i18n> de los mismos bullets tampoco tiene class
  // (no puede tenerla: P7 fija el conteo de class de la seccion), asi que filtrar por
  // "attrs sin class" a secas lo contaria como span envolvente. El tag lo distingue.
  const wrapped = elems
    .filter((e) => e.tag === 'span' && e.attrs === `data-i18n="${e.key}"`)
    .map((e) => e.key)
    .sort();
  assert.deepEqual(wrapped, [...WRAPPED].sort(), 'los spans envolventes no son exactamente los 4 de los bullets con strong');
  assert.equal(count(SEC, '<span data-i18n="'), 4, 'aparecio o falta un <span data-i18n="..."> pelado');
  // Los 3 <strong> de la seccion conservan el elemento y reciben su propio data-i18n.
  const strongs = [...SEC.matchAll(/<strong data-i18n="([^"]+)">/g)].map((m) => m[1]).sort();
  assert.deepEqual(
    strongs,
    ['videos_plans_p1_b1_n', 'videos_plans_p2_b1_n', 'videos_plans_p2_b4_strong'],
    'los 3 <strong> de la seccion no llevan su propio data-i18n',
  );
});

// --- P7 — nada visual cambio ------------------------------------------------

test('P7 la seccion conserva sus 12 iconos, sus 66 class, sus 2 href y los 2 precios puros', () => {
  assert.equal(count(SEC, 'material-symbols-outlined'), 12, 'cambio la cantidad de iconos de la seccion');
  assert.equal(count(SEC, 'class="'), 66, 'cambio la cantidad de class de la seccion');
  assert.equal(
    new Set([...SEC.matchAll(/class="([^"]*)"/g)].map((m) => m[1])).size,
    28,
    'cambio alguna class de la seccion',
  );
  assert.equal(count(SEC, 'data-alt='), 0, 'aparecio un data-alt en la seccion');
  assert.equal(count(SEC, 'href='), 2, 'cambio la cantidad de href de la seccion');
  assert.equal(count(SEC, '[LINK_WHATSAPP]'), 2, 'cambio el [LINK_WHATSAPP] de los botones de plan');
  assert.equal(count(SEC, '<strong'), 3, 'cambio la cantidad de <strong> de la seccion');
  for (const p of PRECIOS_PUROS) {
    assert.equal(count(SEC, p), 1, `el precio puro ${p} desaparecio o se duplico`);
    assert.ok(
      !KEYS.some((k) => ES[k] === p),
      `el precio puro ${p} recibio clave: los tokens puros no se traducen`,
    );
  }
});

// --- P8 — el espanol del JSON == el texto del HTML --------------------------

test('P8a es.json dice exactamente el texto ES del contrato (sin espacios de mas)', () => {
  for (const k of KEYS) {
    assert.equal(JSONS.es[k], ES[k], `es.json["${k}"] no coincide con el texto de Stitch`);
  }
});

test('P8b ese texto existe de verdad en la seccion original (la tabla del contrato no se invento nada)', () => {
  const original = visibleText(extractPlansA(gitShowBaseline(BASE, 'videos.html')));
  for (const k of KEYS) {
    assert.ok(
      original.includes(ES[k]),
      `"${ES[k]}" (${k}) no aparece en la seccion original: el contrato invento ese texto`,
    );
  }
});

test('P8c los precios y numeros de las frases traducidas quedan literales en los 6 idiomas', () => {
  const LITERALES = { videos_plans_p1_reel_price: '$20.000', videos_plans_p2_reel_price: '$25.000' };
  for (const l of LANGS) {
    for (const [k, lit] of Object.entries(LITERALES)) {
      assert.ok(
        String(JSONS[l][k]).includes(lit),
        `${l}.json: "${k}" perdio el precio literal ${lit} al traducirse`,
      );
    }
    for (const k of ['videos_plans_p1_unit', 'videos_plans_p2_unit']) {
      assert.ok(String(JSONS[l][k]).includes('CLP'), `${l}.json: "${k}" perdio la moneda CLP`);
    }
  }
});

// --- P10/P11/P12 — los 6 JSON ----------------------------------------------

test('P10 los 6 JSON conservan BOM, CRLF y el } final sin salto, y las 30 claves van una por linea', () => {
  for (const l of LANGS) {
    const raw = RAW[l];
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

test('P11 cada idioma traduce de verdad (no es el espanol copiado) y ninguna clave quedo vacia', () => {
  for (const l of LANGS.filter((x) => x !== 'es')) {
    const missing = KEYS.filter((k) => !Object.hasOwn(JSONS[l], k));
    assert.deepEqual(missing, [], `${l}.json: faltan claves, comparar contra es seria un falso verde`);
    const same = KEYS.filter((k) => JSONS[l][k] === JSONS.es[k] && !WHITELIST_SIN_TRADUCIR.has(k));
    assert.ok(
      same.length <= 3,
      `${l}.json tiene ${same.length} claves identicas al espanol (max 3): ${same.join(', ')}`,
    );
  }
  // Decision aprobada: el motor hace `if (translations[key])`, asi que "" queda
  // ignorado y dejaria el espanol a la vista. Vale para TODAS las claves y TODOS
  // los idiomas, incluido es (una clave vacia en es deja el HTML sin traducir).
  for (const l of LANGS) {
    for (const k of KEYS) {
      const v = JSONS[l][k];
      assert.equal(typeof v, 'string', `${l}.json: "${k}" no es string`);
      assert.notEqual(
        v.trim(),
        '',
        `${l}.json: "${k}" esta vacia o es solo espacios (el motor la ignoraria y quedaria el espanol)`,
      );
    }
  }
});

test('P12 los 7 fragmentos de los bullets con strong no quedan vacios ni pierden su numero', () => {
  for (const l of LANGS) {
    for (const k of FRAGMENTOS) {
      const v = JSONS[l][k];
      assert.equal(typeof v, 'string', `${l}.json: el fragmento "${k}" no es string`);
      assert.notEqual(
        v.trim(),
        '',
        `${l}.json: el fragmento "${k}" esta vacio o es solo espacios: la secuencia prefijo-negrita-sufijo se rompe`,
      );
    }
    for (const [k, digito] of Object.entries(DIGITO_DE_FRAGMENTO)) {
      assert.ok(
        String(JSONS[l][k]).includes(digito),
        `${l}.json: "${k}" perdio el numero ${digito} al traducirse (el bullet que lo contiene diria otra cosa)`,
      );
    }
    // El espanol de los fragmentos es el de Stitch: si alguien los "reformula" en es,
    // P8a lo caza, pero este test lo dice con el nombre del riesgo.
    for (const k of FRAGMENTOS) assert.equal(JSONS.es[k], ES[k], `es.json: "${k}" no es el texto de Stitch`);
  }
});

test('P12b los nombres de plan de los 6 idiomas quedan registrados para que el slice 7 los reutilice', () => {
  // No valida contenido (no hay forma de juzgar una traduccion desde un test): deja
  // constancia de que las 2 claves existen y son traducidas en los 6 idiomas, para que
  // "Nivel Económica/Equilibrada" (slice 7) copie EXACTAMENTE estos valores.
  for (const l of LANGS) {
    for (const k of NOMBRES_DE_PLAN) {
      assert.ok(!String(JSONS[l][k]).trim().startsWith('['), `${l}.json: "${k}" quedo como placeholder`);
    }
    assert.ok(
      JSONS[l].videos_plans_p1_title !== JSONS[l].videos_plans_p2_title,
      `${l}.json: los dos planes tienen el mismo nombre`,
    );
    if (l !== 'es') {
      // Decision aprobada: los nombres de plan SE TRADUCEN (precedente: en el hero se
      // tradujo hasta "Dr. Clínica Dental"). No se juzga la traduccion, solo que exista.
      for (const k of NOMBRES_DE_PLAN) {
        assert.notEqual(JSONS[l][k], JSONS.es[k], `${l}.json: "${k}" quedo igual al espanol (no se tradujo)`);
      }
    }
  }
});

// --- P9 — equivalencia byte a byte de la seccion ----------------------------

test('P9 la seccion es byte a byte el original + los 30 data-i18n y los 4 spans (nada mas)', () => {
  const base = extractPlansA(gitShowBaseline(BASE, 'videos.html'));
  let nuevo = extractPlansA(VIDEOS);
  // El conteo va ANTES de desenvolver: desenvolver borra el data-i18n de los 4 spans,
  // asi que despues quedan 26 y el total del contrato (30) ya no es observable.
  const attrs = [...nuevo.matchAll(/ data-i18n="[^"]*"/g)];
  assert.equal(attrs.length, 30, `se esperaban 30 data-i18n en la seccion, hay ${attrs.length}`);
  // ORDEN OBLIGATORIO: desenvolver ANTES de borrar los atributos. Al reves, el
  // borrado se lleva el data-i18n de los spans nuevos y el regex ya no matchea.
  for (const k of WRAPPED) {
    const re = new RegExp(`<span data-i18n="${k}">([^<]*)</span>`, 'g');
    const matched = nuevo.match(re) || [];
    assert.equal(matched.length, 1, `falta el <span data-i18n="${k}"> envolvente (o lleva atributos de mas)`);
    nuevo = nuevo.replace(re, '$1');
  }
  nuevo = nuevo.replace(/ data-i18n="[^"]*"/g, '');
  const norm = (s) => s.replace(/\r\n/g, '\n');
  assert.equal(
    norm(nuevo),
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

test('E2E la seccion servida por HTTP trae las 30 claves', async () => {
  const html = await (await fetch(`${srv.base}/videos.html`)).text();
  const sec = extractPlansA(html);
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
