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

export function count(haystack, needle) {
  let n = 0;
  let i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    n++;
    i += needle.length;
  }
  return n;
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

// El hero: desde su <section> (marcador unico en el archivo: la seccion del CTA
// final usa otra lista de clases) hasta su </section>.
export function extractHero(html) {
  return extractSection(
    html,
    '<section class="relative w-full bg-inverse-surface text-inverse-on-surface overflow-hidden pt-12 md:pt-20 pb-20 md:pb-32">',
    'del hero',
  );
}

// La seccion 2 "PROBLEMA Y SOLUCION" (slice 3). Marcador unico: usa
// bg-surface-container-lowest, que ninguna otra <section> del archivo usa.
export function extractProblem(html) {
  return extractSection(
    html,
    '<section class="w-full bg-surface-container-lowest text-on-surface py-section-gap-md">',
    'del problema',
  );
}

// La seccion 3 "QUE RECIBES" (slice 4). El marcador NO puede ser el tag <section>:
// en este archivo ese tag aparece DOS veces (secciones 3 y 5, ambas
// bg-surface-container-low + py-section-gap-md) y indexOf devolveria la 3 por
// casualidad, no por diseno. Se ancla al comentario de Stitch, que si es unico;
// el test P4 lo verifica de hecho.
export function extractIncludesMarker() {
  return '<!-- ' + '='.repeat(73) + '\n       3. QUÉ RECIBES';
}

export function extractIncludes(html) {
  return extractSection(html, extractIncludesMarker(), 'de entregables');
}

// La seccion 4 "PLANES MENSUALES" (slice 5: encabezado + planes 1 y 2). El rango va
// del comentario de Stitch de la seccion hasta el comentario de la tarjeta 3: es
// frontera de tarjeta (la 2 cierra antes), no parte ninguna lista de bullets.
// Los dos marcadores son unicos; el test P4 del slice 5 lo verifica de hecho.
export function extractPlansMarker() {
  return '<!-- ' + '='.repeat(73) + '\n       4. TABLA DE PLANES MENSUALES';
}

export function extractPlansCutMarker() {
  return '<!-- PLAN 3: PREMIUM -->';
}

export function extractPlansA(html) {
  const start = indexOrThrow(html, extractPlansMarker());
  const end = indexOrThrow(html, extractPlansCutMarker());
  return html.slice(start, end);
}

// Las secciones de videos.html que YA estan traducidas. Es el punto de
// acoplamiento deliberado: cada slice de i18n agrega su extractor aca (1 linea),
// y con eso el test C8 del slice 1 sigue vigilando que no se adelante trabajo
// de los slices siguientes.
export function extractSections(html) {
  return extractHero(html) + extractProblem(html) + extractIncludes(html) + extractPlansA(html);
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
