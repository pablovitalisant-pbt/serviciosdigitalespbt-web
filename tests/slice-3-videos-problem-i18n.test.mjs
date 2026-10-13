// Tests del contrato del slice 3 (i18n de la seccion 2 "PROBLEMA Y SOLUCION" de
// videos.html: 16 claves videos_problem_*).
// Cada test intenta ROMPER el slice: nombra la condicion exacta que lo haria fallar.
// Fase B: escritos ANTES de tocar videos.html y los JSON. Los que exigen el trabajo
// del slice nacen ROJOS a proposito; los que vigilan "nada mas cambio" nacen verdes.
// Ejecutar: node --test "tests/*.test.mjs"
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  read,
  count,
  extractProblem,
  i18nElems,
  hasChildTag,
  visibleText,
  stripBom,
  gitShowBaseline,
} from './helpers/page.mjs';
import { startServer } from './helpers/server.mjs';

const VIDEOS = read('videos.html');

// Base congelada del slice 2. NO usar HEAD (ver gitShowBaseline): al commitear el
// slice 3, HEAD ya traeria el archivo nuevo y P12 pasaria trivialmente.
const BASE = '7f61f4e';
const LANGS = ['es', 'en', 'hi', 'zh', 'ur', 'ko'];

// Las 16 claves de la seccion, en el orden del contrato (Fase A aprobada).
const KEYS = [
  'videos_problem_kicker',
  'videos_problem_title',
  'videos_problem_subtitle',
  'videos_problem_block1_step',
  'videos_problem_block1_title',
  'videos_problem_block1_body',
  'videos_problem_block1_result',
  'videos_problem_formula_badge',
  'videos_problem_block2_step',
  'videos_problem_block2_title',
  'videos_problem_block2_body',
  'videos_problem_block2_result',
  'videos_problem_block3_step',
  'videos_problem_block3_title',
  'videos_problem_block3_body',
  'videos_problem_block3_result',
];

// Texto ES = el de Stitch (seccion 2). Sin entidades: la seccion no tiene ninguna
// (el unico & del archivo esta en el hero), asi que aca no hay caso "&amp;".
const ES = {
  videos_problem_kicker: 'Diagnóstico Claro',
  videos_problem_title: 'Tu tiempo vale más atendiendo clientes que peleando con software de edición',
  videos_problem_subtitle:
    'La mayoría de médicos, abogados, esteticistas y prestadores de servicios quieren una presencia activa en redes sociales. El obstáculo nunca es la cámara: es perder horas valiosas cortando silencios, afinando subtítulos y buscando música sin derechos.',
  videos_problem_block1_step: '01 / El Problema',
  videos_problem_block1_title: 'El dilema del tiempo',
  videos_problem_block1_body:
    'Grabas una explicación en 5 minutos entre citas, pero terminas perdiendo todo el fin de semana probando filtros, sincronizando subtítulos y exportando videos que no quedan como imaginabas.',
  videos_problem_block1_result: 'Resultado: Cuentas inactivas por semanas',
  videos_problem_formula_badge: 'Fórmula PBT',
  videos_problem_block2_step: '02 / La Metodología',
  videos_problem_block2_title: 'Edición híbrida IA + Humano',
  videos_problem_block2_body:
    'Aprovechamos la aceleración computacional de agentes de IA para transcripción y b-roll selectivo, combinada con la revisión meticulosa y criterio estético de un editor profesional.',
  videos_problem_block2_result: 'Calidad editorial + entrega en 48 horas',
  videos_problem_block3_step: '03 / El Resultado',
  videos_problem_block3_title: 'Enfócate en tu profesión',
  videos_problem_block3_body:
    'Tú atiendes tu consulta, local o estudio jurídico sin desviarte de lo que genera ingresos reales. Nosotros nos encargamos de que tu material crudo se convierta en reels impecables que atraigan nuevos clientes.',
  videos_problem_block3_result: 'Presencia constante y profesional',
};

// Decision de Fase A: en esta seccion NINGUN texto necesita <span> envolvente.
// Los 3 iconos (schedule, smart_toy, payments) son HERMANOS de los textos, no hijos:
// viven en un <div> contenedor propio, y el texto tiene su propio tag.
const WRAPPED = [];

// El unico texto que puede legitimamente quedar igual al espanol en algun idioma.
// "Fórmula PBT": PBT es marca. Igual que "IA + EDIT" en el hero, no es una excepcion
// abierta: se declara para que el conteo de C7/P7 siga siendo estricto en el resto.
const WHITELIST_SIN_TRADUCIR = new Set([]);

const SEC = extractProblem(VIDEOS);

// --- P1/P2/P3 — inventario y ubicacion en el HTML ----------------------------

test('P1 la seccion tiene exactamente las 16 claves, todas con prefijo videos_problem_', () => {
  const found = i18nElems(SEC).map((e) => e.key);
  assert.deepEqual(
    [...found].sort(),
    [...KEYS].sort(),
    `las claves de la seccion no son las 16 del contrato (hay ${found.length}): ${found.join(', ')}`,
  );
  for (const k of found) {
    assert.match(k, /^videos_problem_/, `la clave "${k}" no usa el prefijo videos_problem_`);
  }
});

test('P2 no hay claves repetidas en la seccion (el motor aplicaria la ultima y taparia un error)', () => {
  const found = i18nElems(SEC).map((e) => e.key);
  // Sin esto el test es vacuamente verde antes del slice: 0 claves, 0 duplicados.
  assert.equal(found.length, 16, `con ${found.length} claves el detector de duplicados no probaria nada`);
  const dupes = found.filter((k, i) => found.indexOf(k) !== i);
  assert.deepEqual([...new Set(dupes)], [], `claves duplicadas en la seccion: ${dupes.join(', ')}`);
});

test('P3 las 16 claves videos_problem_ viven solo dentro de la seccion', () => {
  assert.equal(count(VIDEOS, 'data-i18n="videos_problem_'), 16, 'hay claves videos_problem_ fuera de la seccion');
  assert.equal(count(SEC, 'data-i18n="videos_problem_'), 16, 'la seccion no tiene las 16 claves');
});

// --- P7/P8b — la forma del data-i18n (el motor hace textContent =) -----------

test('P7 ningun data-i18n de la seccion vive en un elemento con hijos (el motor borraria el icono)', () => {
  const elems = i18nElems(SEC);
  assert.equal(elems.length, 16, `se esperaban 16 elementos con data-i18n, hay ${elems.length}`);
  const malos = elems.filter((e) => hasChildTag(e.inner));
  assert.deepEqual(
    malos.map((m) => `${m.key} (<${m.tag}>)`),
    [],
    'estos elementos tienen hijos: el motor hace textContent = y los borraria',
  );
});

test('P8b la seccion no agrega NINGUN span envolvente (los 3 iconos son hermanos, no hijos)', () => {
  const elems = i18nElems(SEC);
  assert.equal(elems.length, 16, `con ${elems.length} elementos la lista vacia de spans no probaria nada`);
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

// --- P9 — nada visual cambio ------------------------------------------------

test('P9 la seccion conserva sus 3 iconos, sus 29 class y sigue sin href, id ni data-alt', () => {
  assert.equal(count(SEC, 'material-symbols-outlined'), 3, 'cambio la cantidad de iconos de la seccion');
  assert.equal(count(SEC, 'class="'), 29, 'cambio la cantidad de class de la seccion');
  assert.equal(count(SEC, 'data-alt='), 0, 'aparecio un data-alt en la seccion');
  assert.equal(count(SEC, 'href='), 0, 'aparecio un href en la seccion (no habia ninguno)');
  assert.equal(count(SEC, 'id='), 0, 'aparecio un id en la seccion (no habia ninguno)');
  assert.equal(count(SEC, '[LINK_WHATSAPP]'), 0, 'aparecio un placeholder de WhatsApp en la seccion');
});

// --- P10 — el espanol del JSON == el texto del HTML -------------------------

test('P10a es.json dice exactamente el texto ES del contrato (sin espacios de mas)', () => {
  const es = JSON.parse(stripBom(read('i18n/es.json')));
  for (const k of KEYS) {
    assert.equal(es[k], ES[k], `es.json["${k}"] no coincide con el texto de Stitch`);
  }
});

test('P10b ese texto existe de verdad en la seccion original (la tabla del contrato no se invento nada)', () => {
  const original = visibleText(extractProblem(gitShowBaseline(BASE, 'videos.html')));
  for (const k of KEYS) {
    assert.ok(
      original.includes(ES[k]),
      `"${ES[k]}" (${k}) no aparece en la seccion original: el contrato invento ese texto`,
    );
  }
});

// --- P11b — convenciones del JSON -------------------------------------------

test('P11b las 16 claves nuevas van una por linea con indentacion de 2 espacios', () => {
  const raw = read('i18n/es.json');
  const lines = stripBom(raw).split('\r\n');
  for (const k of KEYS) {
    const hits = lines.filter((ln) => ln.trimStart().startsWith(`"${k}":`));
    assert.equal(hits.length, 1, `es.json: "${k}" debe estar en exactamente 1 linea (hay ${hits.length})`);
    assert.match(hits[0], new RegExp(`^  "${k}": ".+",?$`), `es.json: formato de la linea de "${k}"`);
  }
});

test('P13 cada idioma traduce de verdad (no es el espanol copiado), con lista blanca', () => {
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
  }
});

// --- P12 — equivalencia byte a byte de la seccion ---------------------------

test('P12 la seccion es byte a byte el original + los 16 atributos data-i18n (nada mas)', () => {
  const base = extractProblem(gitShowBaseline(BASE, 'videos.html'));
  const nuevo = extractProblem(VIDEOS);
  const attrs = [...nuevo.matchAll(/ data-i18n="[^"]*"/g)];
  assert.equal(attrs.length, 16, `se esperaban 16 data-i18n en la seccion, hay ${attrs.length}`);
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

test('E2E la seccion servida por HTTP trae las 16 claves', async () => {
  const html = await (await fetch(`${srv.base}/videos.html`)).text();
  const sec = extractProblem(html);
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
