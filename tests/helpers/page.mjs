// Utilidades de lectura y parseo para los tests del slice 1 (videos.html).
// ponytail: parser a mano (indexOf + conteo de llaves + vm) en vez de un parser de HTML.
// Alcanza porque los archivos son de este repo y conocemos su forma exacta.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));

export function read(relPath) {
  return readFileSync(ROOT + relPath, 'utf8');
}

// ponytail: el needle nunca es vacio en este repo (si lo fuera, devolveria len+1).
export function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

// Claves que aparecen mas de una vez, sin repetir el nombre en la lista.
export function dupesOf(keys) {
  return [...new Set(keys.filter((k, i) => keys.indexOf(k) !== i))];
}

function indexOrThrow(haystack, needle) {
  const i = haystack.indexOf(needle);
  if (i === -1) throw new Error(`no se encontro ${JSON.stringify(needle)}`);
  return i;
}

// Devuelve el bloque `function initI18n() { ... }` contando llaves.
// ponytail: no ignora llaves dentro de strings/comentarios; el cuerpo copiado de
// casos.html no tiene ninguna, y si eso cambiara el test falla (que es lo deseado).
export function extractInitI18n(html) {
  const start = indexOrThrow(html, 'function initI18n() {');
  let depth = 0;
  for (let i = html.indexOf('{', start); i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error('initI18n sin llave de cierre');
}

// Devuelve el contenido del <script> que contiene `marker`.
export function scriptBlockWith(html, marker) {
  const idx = indexOrThrow(html, marker);
  const open = html.lastIndexOf('<script>', idx);
  const close = html.indexOf('</script>', idx);
  if (open === -1 || close === -1) throw new Error(`${marker} no vive en un <script>`);
  return html.slice(open, close);
}

// El `window.addEventListener('scroll', ...)` completo, hasta el </script>.
export function extractScrollEffect(html) {
  const i = indexOrThrow(html, "window.addEventListener('scroll'");
  return html.slice(i, html.indexOf('</script>', i)).trimEnd();
}

// Lee el `tailwind.config = {...}` inline del <script id="tailwind-config">.
export function tailwindConfig(html) {
  const m = html.match(/<script id="tailwind-config">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('no hay <script id="tailwind-config">');
  // ponytail: sandbox con solo `tailwind`; el codigo es del propio repo.
  return vm.runInNewContext(m[1], { tailwind: {} });
}

// Nombres de token de diseno definidos en el config (colores, espaciados, tipografia, radios).
export function configTokens(config) {
  const ext = config.theme.extend;
  const keys = new Set();
  for (const cat of ['colors', 'spacing', 'fontFamily', 'fontSize', 'borderRadius']) {
    for (const k of Object.keys(ext[cat] || {})) keys.add(k);
  }
  return keys;
}

const UTIL = /^(?:[a-z-]+:)*(bg|text|border|font|px|py|p|gap|max-w|min-h|w|h|rounded)-(.+)$/;

// Clases del HTML cuyo sufijo es un token de diseno conocido (segun el oracle).
// Filtra ruido: `bg-[#111111]`, `text-white`, `text-sm`, `bg-white/90` no son tokens.
export function configDependentClasses(html, oracleKeys) {
  const hits = [];
  for (const m of html.matchAll(/class="([^"]*)"/g)) {
    for (const raw of m[1].split(/\s+/)) {
      const u = raw.match(UTIL);
      if (u && oracleKeys.has(u[2])) hits.push({ raw, suffix: u[2] });
    }
  }
  return hits;
}

export function idsOf(html) {
  return new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
}

// --- helpers del slice 2 (i18n del hero de videos.html) ---------------------

// Desde el <section> cuyo tag de apertura es `marker` hasta su </section>.
// El marcador debe ser unico en el archivo (los tests lo verifican de hecho: si
// dejara de serlo, la seccion extraida no seria la esperada y los conteos cambian).
function extractSection(html, marker, nombre) {
  const start = indexOrThrow(html, marker);
  const end = html.indexOf('</section>', start);
  if (end === -1) throw new Error(`la seccion ${nombre} no cierra`);
  return html.slice(start, end + '</section>'.length);
}

// Los marcadores de cada seccion, exportados como VALOR: el descriptor de la
// suite de i18n los usa para su meta-test de unicidad (count === 1). Si el
// marcador dejara de ser unico, el extractor devolveria otra region.

// El hero: su <section> es unico en el archivo (la seccion del CTA final usa
// otra lista de clases).
export const HERO_MARKER =
  '<section class="relative w-full bg-inverse-surface text-inverse-on-surface overflow-hidden pt-12 md:pt-20 pb-20 md:pb-32">';

// La seccion 2 "PROBLEMA Y SOLUCION" (slice 3). Marcador unico: usa
// bg-surface-container-lowest, que ninguna otra <section> del archivo usa.
export const PROBLEM_MARKER =
  '<section class="w-full bg-surface-container-lowest text-on-surface py-section-gap-md">';

export function extractHero(html) {
  return extractSection(html, HERO_MARKER, 'del hero');
}

export function extractProblem(html) {
  return extractSection(html, PROBLEM_MARKER, 'del problema');
}

// La seccion 3 "QUE RECIBES" (slice 4). El marcador NO puede ser el tag <section>:
// en este archivo ese tag aparece DOS veces (secciones 3 y 5, ambas
// bg-surface-container-low + py-section-gap-md) y indexOf devolveria la 3 por
// casualidad, no por diseno. Se ancla al comentario de Stitch, que si es unico;
// el extra E_INCLUDES lo verifica de hecho.
export const INCLUDES_MARKER = '<!-- ' + '='.repeat(73) + '\n       3. QUÉ RECIBES';

export function extractIncludes(html) {
  return extractSection(html, INCLUDES_MARKER, 'de entregables');
}

// La seccion 4 "PLANES MENSUALES" (slice 5: encabezado + planes 1 y 2). El rango va
// del comentario de Stitch de la seccion hasta el comentario de la tarjeta 3: es
// frontera de tarjeta (la 2 cierra antes), no parte ninguna lista de bullets.
export const PLANS_MARKER = '<!-- ' + '='.repeat(73) + '\n       4. TABLA DE PLANES MENSUALES';

export const PLANS_CUT_MARKER = '<!-- PLAN 3: PREMIUM -->';

export function extractPlansA(html) {
  const start = indexOrThrow(html, PLANS_MARKER);
  const end = indexOrThrow(html, PLANS_CUT_MARKER);
  return html.slice(start, end);
}

// La seccion 4 "PLANES MENSUALES", parte 2 (slice 6: tarjeta Premium + nota al pie). Arranca en el
// mismo marcador donde corta la parte 1 (frontera de tarjeta) y cierra en el </section> de #planes.
// Reutiliza PLANS_CUT_MARKER, cuya unicidad el descriptor de plansA ya verifica (count === 1).
export function extractPlansB(html) {
  return extractSection(html, PLANS_CUT_MARKER, 'de planes parte 2');
}

// La seccion 5 "PRECIO POR TRABAJOS INDIVIDUALES" (slice 7). El marcador NO puede ser el
// tag <section>: es IDENTICO al de la seccion 3 (mismas clases), asi que indexOf devolveria
// la 3 por casualidad. Se ancla al comentario de Stitch, igual que INCLUDES_MARKER; el
// extra E_INCLUDES ya documenta por que el tag de esta seccion no sirve como marcador.
export const SINGLE_MARKER =
  '<!-- ' + '='.repeat(73) + '\n       5. PRECIO POR TRABAJOS INDIVIDUALES';

export function extractSingle(html) {
  return extractSection(html, SINGLE_MARKER, 'de trabajos individuales');
}

// La seccion 6 "COMO FUNCIONA" (slice 8). Marcador: comentario de Stitch, unico
// (el tag <section> de esta seccion lleva id="como-funciona" y podria servir, pero el
// comentario es el patron ya establecido y P4 verifica su unicidad de hecho).
export const HOW_MARKER = '<!-- ' + '='.repeat(73) + '\n       6. CÓMO FUNCIONA';

export function extractHow(html) {
  return extractSection(html, HOW_MARKER, 'de como funciona');
}

// La seccion 9, CTA final de Stitch (slice 8). Marcador: comentario de Stitch, unico.
export const CTA_MARKER = '<!-- ' + '='.repeat(73) + '\n       9. CIERRE FINAL DE ALTO IMPACTO';

export function extractCta(html) {
  return extractSection(html, CTA_MARKER, 'del CTA final');
}

// El boton fijo movil de WhatsApp (slice 8) NO es una <section>: vive fuera de <main>,
// despues del footer-placeholder, y es un unico <div> autocontenido. extractSection no
// sirve (no hay ningun </section> despues). El marcador es el MISMO string que vigila C5a
// en slice-1-videos.test.mjs: si cambia, los dos tests fallan a la vez.
export const MOBILE_MARKER = '<div class="fixed bottom-4 left-4 right-4 z-50 md:hidden">';

export function extractMobile(html) {
  const start = indexOrThrow(html, MOBILE_MARKER);
  const end = html.indexOf('</div>', start);
  if (end === -1) throw new Error('el boton movil no cierra con </div>');
  return html.slice(start, end + '</div>'.length);
}

// Las secciones de videos.html que YA estan traducidas. Es el punto de
// acoplamiento deliberado: cada slice de i18n agrega su extractor a esta lista
// (1 linea) y su descriptor en SECTIONS (tests/i18n-sections.test.mjs). El
// meta-test G7 vigila que las dos listas no se separen.
export const SECTION_EXTRACTORS = [
  extractHero,
  extractProblem,
  extractIncludes,
  extractPlansA,
  extractPlansB,
  extractSingle,
  extractHow,
  extractCta,
  extractMobile,
];

export function extractSections(html) {
  return SECTION_EXTRACTORS.map((f) => f(html)).join('');
}

// --- parser de tags (compartido por los tests de i18n de los slices 2 y 3) ---

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

// Todos los elementos con data-i18n de un fragmento: clave, tag, atributos e interior.
export function i18nElems(html) {
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

// Un elemento con data-i18n que ADEMAS tiene hijos: el motor hace textContent = y
// los borraria (perderia el icono).
export const hasChildTag = (inner) => /<[a-zA-Z]/.test(inner);

// El hero tiene UNA sola entidad: &amp; (linea 115). Se resuelve &amp; AL FINAL
// para no decodificar de mas un eventual "&amp;lt;" literal.
export function decodeEntities(s) {
  const MAP = { nbsp: ' ', quot: '"', lt: '<', gt: '>', '#39': "'" };
  return s
    .replace(/&(nbsp|quot|lt|gt|#39);/g, (_, e) => MAP[e])
    .replace(/&amp;/g, '&');
}

// Texto visible de un fragmento de HTML: sin tags, sin entidades, espacios colapsados.
export function visibleText(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function stripBom(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

// Lee un archivo tal como esta en un commit congelado (`sha`). Anclar a un SHA
// historico y NO a HEAD: tras commitear el slice, HEAD devolveria el archivo
// nuevo y el test pasaria trivialmente (perderia todo su poder).
// ponytail: depende de git en el PATH; si el repo se reescribe, falla ruidoso.
export function gitShowBaseline(sha, path) {
  return execFileSync('git', ['show', `${sha}:${path}`], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
}
