// Tests del contrato del slice 2 (i18n del hero de videos.html: 18 claves videos_hero_*).
// Cada test intenta ROMPER el slice: nombra la condicion exacta que lo haria fallar.
// Fase B: escritos ANTES de tocar videos.html y los JSON. Los que exigen el trabajo
// del slice nacen ROJOS a proposito; los que vigilan "nada mas cambio" nacen verdes.
// Ejecutar: node --test "tests/*.test.mjs"
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  read,
  count,
  extractHero,
  visibleText,
  stripBom,
  gitShowBaseline,
} from './helpers/page.mjs';
import { startServer } from './helpers/server.mjs';

const VIDEOS = read('videos.html');

// Base congelada del slice 1. NO usar HEAD (ver gitShowBaseline).
const BASE = '8a5fa69';
const LANGS = ['es', 'en', 'hi', 'zh', 'ur', 'ko'];

// Las 18 claves del hero, en el orden del contrato (Fase A aprobada).
const KEYS = [
  'videos_hero_badge',
  'videos_hero_title',
  'videos_hero_subtitle',
  'videos_hero_highlight',
  'videos_hero_cta_whatsapp',
  'videos_hero_cta_planes',
  'videos_hero_stat_delivery',
  'videos_hero_stat_format',
  'videos_hero_stat_ia',
  'videos_hero_stat_human',
  'videos_hero_reel1_handle',
  'videos_hero_reel1_caption',
  'videos_hero_reel1_sub',
  'videos_hero_reel1_audio',
  'videos_hero_reel2_handle',
  'videos_hero_reel2_caption',
  'videos_hero_reel2_format',
  'videos_hero_viral',
];

// Texto ES = el de Stitch (hero, lineas 6-131). "Barberia & Estilo" va con & y no
// con &amp;: el motor usa textContent, que NO decodifica entidades.
const ES = {
  videos_hero_badge: 'Edición de reels para profesionales locales',
  videos_hero_title: 'Publica videos profesionales sin quedarte editando',
  videos_hero_subtitle:
    'Tú entregas tus grabaciones en bruto y recibes reels editados listos para publicar. Entrega de tu primera versión en un máximo de 48 horas tras recibir todo el material e instrucciones.',
  videos_hero_highlight: 'Primera versión en 48 horas hábiles',
  videos_hero_cta_whatsapp: 'Quiero cotizar por WhatsApp',
  videos_hero_cta_planes: 'Ver planes mensuales',
  videos_hero_stat_delivery: 'Primera entrega',
  videos_hero_stat_format: 'Formato vertical',
  videos_hero_stat_ia: 'IA + EDIT',
  videos_hero_stat_human: 'Criterio humano',
  videos_hero_reel1_handle: 'Dr. Clínica Dental',
  videos_hero_reel1_caption: '¿BLANQUEAMIENTO LÁSER?',
  videos_hero_reel1_sub: '3 mitos frecuentes explicados en 45s',
  videos_hero_reel1_audio: 'Audio original optimizado',
  videos_hero_reel2_handle: 'Barbería & Estilo',
  videos_hero_reel2_caption: 'Fade Perfecto Paso a Paso',
  videos_hero_reel2_format: 'Reel Formato 9:16',
  videos_hero_viral: 'Viral',
};

// Los 3 unicos textos que van dentro de un <span> NUEVO (sin class), porque su
// contenedor tiene un icono adentro. Decision de Fase A: los spans nuevos van sin
// atributo class, y ese es el criterio que los distingue de los 6 data-i18n que ya
// viven en un <span class="..."> del diseno original.
const WRAPPED = ['videos_hero_cta_planes', 'videos_hero_cta_whatsapp', 'videos_hero_viral'];

// Claves que pueden legitimamente quedar iguales al espanol en algun idioma.
// Decision de Pablo: "IA + EDIT" se mantiene en los 6 (en: "AI + EDIT").
const WHITELIST_SIN_TRADUCIR = new Set(['videos_hero_stat_ia']);

// --- parser de tags (local a este archivo; el repo ya tiene un parser a mano) ---

const tagRe = () => /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
const VOID = new Set(['br', 'img', 'input', 'hr', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'track', 'wbr']);

// Interior de un elemento: avanza contando anidamiento del MISMO tag hasta su cierre
// REAL. Esto es lo que hace que el detector de hijos no sea vacuo: mide hasta el cierre
// propio, no hasta el primer "<" (que es justo donde el extractor se detendria).
function innerOf(html, from, name) {
  const R = tagRe();
  R.lastIndex = from;
  let depth = 1;
  let m;
  while ((m = R.exec(html))) {
    const n = m[2].toLowerCase();
    if (m[1] === '/') {
      if (n === name && --depth === 0) return html.slice(from, m.index);
    } else if (n === name && m[4] !== '/') {
      depth++;
    }
  }
  throw new Error(`<${name}> con data-i18n sin cierre`);
}

function i18nElems(html) {
  const R = tagRe();
  const out = [];
  let m;
  while ((m = R.exec(html))) {
    if (m[1] === '/' || VOID.has(m[2].toLowerCase())) continue;
    const key = m[3].match(/\bdata-i18n="([^"]*)"/);
    if (!key) continue;
    const name = m[2].toLowerCase();
    out.push({
      key: key[1],
      tag: name,
      attrs: m[3].trim(),
      inner: innerOf(html, m.index + m[0].length, name),
    });
  }
  return out;
}

const hasChildTag = (inner) => /<[a-zA-Z]/.test(inner);

// --- JSON -------------------------------------------------------------------

const RAW = Object.fromEntries(LANGS.map((l) => [l, read(`i18n/${l}.json`)]));
const JSONS = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(stripBom(RAW[l]))]));
const BASELINE = Object.fromEntries(
  LANGS.map((l) => [l, JSON.parse(stripBom(gitShowBaseline(BASE, `i18n/${l}.json`)))]),
);

// --- C1/C2 — inventario y unicidad en el HTML --------------------------------

test('C1 el hero tiene exactamente las 18 claves, todas con prefijo videos_hero_', () => {
  const found = i18nElems(VIDEOS).map((e) => e.key);
  assert.deepEqual(
    [...found].sort(),
    [...KEYS].sort(),
    `las claves del HTML no son las 18 del contrato (hay ${found.length}): ${found.join(', ')}`,
  );
  for (const k of found) {
    assert.match(k, /^videos_hero_/, `la clave "${k}" no usa el prefijo videos_hero_`);
  }
});

test('C2 no hay claves repetidas en el HTML (el motor aplicaria la ultima y taparia un error)', () => {
  const found = i18nElems(VIDEOS).map((e) => e.key);
  const dupes = found.filter((k, i) => found.indexOf(k) !== i);
  assert.deepEqual([...new Set(dupes)], [], `claves duplicadas en el hero: ${dupes.join(', ')}`);
});

test('C3 los 18 data-i18n viven DENTRO del hero (C8 del slice 1 lo re-verifica)', () => {
  const hero = extractHero(VIDEOS);
  assert.equal(count(hero, 'data-i18n="'), count(VIDEOS, 'data-i18n="'), 'hay data-i18n fuera del hero');
});

// --- C4/C5/C6 — los 6 JSON --------------------------------------------------

test('C4 los 6 JSON tienen 142 claves y exactamente el mismo conjunto de nombres', () => {
  for (const l of LANGS) {
    const ks = Object.keys(JSONS[l]);
    assert.equal(ks.length, 142, `${l}.json tiene ${ks.length} claves, se esperaban 142 (124 + 18)`);
  }
  const ref = Object.keys(JSONS.es).sort();
  for (const l of LANGS.slice(1)) {
    assert.deepEqual(
      Object.keys(JSONS[l]).sort(),
      ref,
      `${l}.json no tiene el mismo conjunto de claves que es.json`,
    );
  }
});

test('C5 las 124 claves existentes quedaron intactas y solo se agregaron las 18 del hero', () => {
  for (const l of LANGS) {
    const old = BASELINE[l];
    const cur = JSONS[l];
    for (const k of Object.keys(old)) {
      assert.equal(cur[k], old[k], `${l}.json: la clave existente "${k}" cambio de valor`);
    }
    const added = Object.keys(cur).filter((k) => !Object.hasOwn(old, k)).sort();
    assert.deepEqual(added, [...KEYS].sort(), `${l}.json: las claves agregadas no son las 18 del hero`);
  }
});

test('C6 los 6 JSON son validos y ninguna de las 18 claves nuevas esta vacia', () => {
  for (const l of LANGS) {
    for (const k of KEYS) {
      const v = JSONS[l][k];
      assert.equal(typeof v, 'string', `${l}.json: "${k}" no es string`);
      assert.notEqual(
        v.trim(),
        '',
        `${l}.json: "${k}" esta vacia (el motor hace if (translations[key]) y la ignoraria)`,
      );
    }
  }
});

test('C13 cada idioma traduce de verdad (no es el espanol copiado), con lista blanca', () => {
  for (const l of LANGS.filter((x) => x !== 'es')) {
    const missing = KEYS.filter((k) => !Object.hasOwn(JSONS[l], k));
    assert.deepEqual(missing, [], `${l}.json: faltan claves, comparar contra es seria un falso verde`);
    const same = KEYS.filter((k) => JSONS[l][k] === JSONS.es[k] && !WHITELIST_SIN_TRADUCIR.has(k));
    assert.ok(
      same.length <= 3,
      `${l}.json tiene ${same.length} claves identicas al espanol (max 3): ${same.join(', ')}`,
    );
  }
});

// --- C7 y su meta-test: el detector de hijos NO puede ser vacuo --------------

test('C7 ningun data-i18n vive en un elemento con hijos (el motor borraria el icono)', () => {
  const elems = i18nElems(VIDEOS);
  assert.equal(elems.length, 18, `se esperaban 18 elementos con data-i18n, hay ${elems.length}`);
  const malos = elems.filter((e) => hasChildTag(e.inner));
  assert.deepEqual(
    malos.map((m) => `${m.key} (<${m.tag}>)`),
    [],
    'estos elementos tienen hijos: el motor hace textContent = y los borraria',
  );
});

test('C7b (meta) el detector SI distingue un icono hijo de uno hermano: la version ingenua era vacua', () => {
  const hijo = '<span data-i18n="k">Texto <span class="material-symbols-outlined">chat</span></span>';
  const hermano = '<a href="#"><span data-i18n="k">Texto</span><span class="material-symbols-outlined">chat</span></a>';
  assert.equal(hasChildTag(i18nElems(hijo)[0].inner), true, 'no detecta un icono HIJO (el guard seria vacuo)');
  assert.equal(
    hasChildTag(i18nElems(hermano)[0].inner),
    false,
    'marca como violacion un icono HERMANO dentro del <a> (falso rojo)',
  );
});

// --- C8b — los spans envolventes --------------------------------------------

test('C8b los spans envolventes son exactamente los 3 declarados (tag de apertura sin class)', () => {
  const wrapped = i18nElems(VIDEOS)
    .filter((e) => e.attrs === `data-i18n="${e.key}"`)
    .map((e) => e.key)
    .sort();
  assert.deepEqual(
    wrapped,
    [...WRAPPED].sort(),
    'los spans nuevos (sin class) no son exactamente cta_whatsapp, cta_planes y viral',
  );
});

// --- C9 — nada visual cambio ------------------------------------------------

test('C9 el hero conserva sus iconos, data-alt, [LINK_WHATSAPP] y sus 64 class', () => {
  const hero = extractHero(VIDEOS);
  assert.equal(count(hero, 'material-symbols-outlined'), 9, 'cambio la cantidad de iconos del hero');
  assert.equal(count(VIDEOS, 'material-symbols-outlined'), 47, 'cambio la cantidad de iconos del archivo');
  assert.equal(count(hero, 'data-alt='), 2, 'cambio la cantidad de data-alt del hero');
  assert.equal(count(hero, '[LINK_WHATSAPP]'), 1, 'cambio el [LINK_WHATSAPP] del hero');
  assert.equal(count(VIDEOS, '[LINK_WHATSAPP]'), 7, 'cambio la cantidad de [LINK_WHATSAPP] del archivo');
  assert.equal(count(VIDEOS, 'href="https://wa.me/"'), 1, 'cambio el href="https://wa.me/" vacio');
  assert.equal(count(hero, 'class="'), 64, 'cambio la cantidad de class del hero (los 3 spans van SIN class)');
  assert.equal(new Set([...hero.matchAll(/class="([^"]*)"/g)].map((m) => m[1])).size, 55, 'cambio alguna class del hero');
});

// --- C10 — el espanol del JSON == el texto del HTML original ----------------

test('C10a es.json dice exactamente el texto ES del contrato (sin espacios de mas ni &amp;)', () => {
  for (const k of KEYS) {
    assert.equal(JSONS.es[k], ES[k], `es.json["${k}"] no coincide con el texto de Stitch`);
  }
});

test('C10b ese texto existe de verdad en el hero original (la tabla del contrato no se invento nada)', () => {
  const original = visibleText(extractHero(gitShowBaseline(BASE, 'videos.html')));
  for (const k of KEYS) {
    assert.ok(
      original.includes(ES[k]),
      `"${ES[k]}" (${k}) no aparece en el hero original: el contrato invento ese texto`,
    );
  }
});

// --- C11 — convenciones de los JSON ----------------------------------------

test('C11a los 6 JSON conservan BOM, CRLF y el } final sin salto', () => {
  for (const l of LANGS) {
    const raw = RAW[l];
    assert.equal(raw.charCodeAt(0), 0xfeff, `${l}.json perdio el BOM (decision aprobada: preservarlo)`);
    assert.equal(count(raw, '\n'), count(raw, '\r\n'), `${l}.json quedo con finales de linea mezclados`);
    assert.ok(raw.endsWith('}'), `${l}.json gano un salto de linea final`);
  }
});

test('C11b las 18 claves nuevas van una por linea con indentacion de 2 espacios', () => {
  for (const l of LANGS) {
    const lines = stripBom(RAW[l]).split('\r\n');
    for (const k of KEYS) {
      const hits = lines.filter((ln) => ln.trimStart().startsWith(`"${k}":`));
      assert.equal(hits.length, 1, `${l}.json: "${k}" debe estar en exactamente 1 linea (hay ${hits.length})`);
      assert.match(hits[0], new RegExp(`^  "${k}": ".+",?$`), `${l}.json: formato de la linea de "${k}"`);
    }
  }
});

// --- C12 — equivalencia byte a byte del hero --------------------------------

test('C12 el hero es byte a byte el original + los 18 atributos y los 3 spans (nada mas)', () => {
  const baseHero = extractHero(gitShowBaseline(BASE, 'videos.html'));
  let nuevo = extractHero(VIDEOS);
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
    norm(baseHero),
    'el hero cambio algo mas que los data-i18n: clases, orden, indentacion o texto',
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

test('E2E los 6 JSON se sirven y res.json() NO explota con el BOM', async () => {
  for (const l of LANGS) {
    const res = await fetch(`${srv.base}/i18n/${l}.json`);
    assert.equal(res.status, 200, `${l}.json no responde 200`);
    const parsed = await res.json();
    assert.equal(typeof parsed, 'object', `${l}.json: res.json() no devolvio un objeto`);
    assert.ok(Object.keys(parsed).length >= 124, `${l}.json servido llego incompleto`);
  }
});

test('E2E el hero servido por HTTP trae las 18 claves', async () => {
  const html = await (await fetch(`${srv.base}/videos.html`)).text();
  const hero = extractHero(html);
  for (const k of KEYS) {
    assert.ok(hero.includes(`data-i18n="${k}"`), `el hero servido no trae ${k}`);
  }
});
