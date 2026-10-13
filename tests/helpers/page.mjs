// Utilidades de lectura y parseo para los tests del slice 1 (videos.html).
// ponytail: parser a mano (indexOf + conteo de llaves + vm) en vez de un parser de HTML.
// Alcanza porque los archivos son de este repo y conocemos su forma exacta.
import { readFileSync } from 'node:fs';
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
