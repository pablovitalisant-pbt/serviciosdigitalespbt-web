// Tests del contrato del slice 21: reels del hero tan altos como el bloque titular->CTA,
// sin el destacado "48 horas", planes con 3 colores (blanco / verde / naranja) e icono de
// video en el CTA principal.
// Ejecutar: node --test "tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, count, stripBom, extractHero } from './helpers/page.mjs';

const V = read('index.html');
const HEAD = V.slice(0, V.indexOf('</head>'));
const HERO = extractHero(V);
const LANGS = ['es', 'en', 'hi', 'zh', 'ur', 'ko'];
const J = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(stripBom(read(`i18n/${l}.json`)))]));
const cls = (tag) => (tag.match(/class="([^"]*)"/)?.[1] ?? '').split(' ');
// El <a ...> que contiene la clave (en el propio <a> o en un hijo).
const anchorOf = (key) => {
  const at = V.indexOf(`data-i18n="${key}"`);
  assert.ok(at > 0, `no se encontro "${key}"`);
  const open = V.lastIndexOf('<a ', at);
  return { tag: V.slice(open, V.indexOf('>', open) + 1), body: V.slice(open, V.indexOf('</a>', at)) };
};

test('S21-1 el destacado "Primera version en 48 horas habiles" ya no existe', () => {
  assert.equal(count(V, 'videos_hero_highlight'), 0, 'el HTML aun usa videos_hero_highlight');
  assert.equal(count(HERO, '>bolt<'), 0, 'queda el icono bolt en el hero');
  for (const l of LANGS) assert.ok(!Object.hasOwn(J[l], 'videos_hero_highlight'), `${l}.json aun tiene la clave`);
});

test('S21-2 en escritorio el carrusel ocupa la misma fila que el bloque titular -> CTA', () => {
  const tagWith = (marker) => {
    const at = HERO.indexOf(marker);
    assert.ok(at > 0, `no se encontro ${marker}`);
    return HERO.slice(HERO.lastIndexOf('<div', at), HERO.indexOf('>', HERO.lastIndexOf('<div', at)) + 1);
  };
  const block = HERO.match(/<div class="[^"]*" id="hero-copy">[\s\S]*?<\/a>\s*<\/div>\s*<\/div>/)?.[0];
  assert.ok(block, 'falta el bloque #hero-copy (titular -> CTA)');
  const firstTag = block.slice(block.indexOf('>') + 1).trimStart();
  assert.ok(firstTag.startsWith('<h1'), 'el bloque no arranca en el titular: el reel no alinearia con su linea superior');
  assert.match(block, /data-i18n="videos_hero_cta_whatsapp"/, 'el bloque no termina en el CTA');
  assert.ok(cls(tagWith('id="hero-copy"')).includes('lg:row-start-2'), '#hero-copy no esta en la fila 2');
  // El <div> padre del carrusel: el <div> inmediatamente anterior al tag del carrusel.
  const stackStart = HERO.lastIndexOf('<div', HERO.indexOf('id="reel-carousel"'));
  const wrapStart = HERO.lastIndexOf('<div', stackStart - 1);
  const wrapTag = HERO.slice(wrapStart, HERO.indexOf('>', wrapStart) + 1);
  assert.ok(cls(wrapTag).includes('lg:row-start-2'), 'la columna del carrusel no esta en la fila 2');
  const stack = cls(tagWith('id="reel-carousel"'));
  for (const c of ['lg:absolute', 'lg:inset-y-0', 'lg:w-auto']) {
    assert.ok(stack.includes(c), `#reel-carousel sin ${c}: no se estira al alto de la fila`);
  }
  assert.ok(stack.includes('aspect-[9/16]'), 'el carrusel perdio la proporcion 9:16');
});

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

test('S21-3 planes: Economica blanco, Equilibrada verde, Premium naranja #c2410c (todos legibles)', () => {
  const p1 = cls(anchorOf('videos_plans_p1_cta').tag);
  const p2 = cls(anchorOf('videos_plans_p2_cta').tag);
  const p3 = cls(anchorOf('videos_plans_p3_cta').tag);
  assert.ok(p1.includes('btn-white') && !p1.includes('btn-orange'), 'Economica no es blanco');
  assert.ok(!p2.includes('btn-white') && !p2.includes('btn-orange'), 'Equilibrada dejo de ser verde');
  assert.ok(p3.includes('btn-orange') && !p3.includes('btn-white'), 'Premium no es naranja');
  const body = V.slice(V.indexOf('<body'));
  assert.equal(count(body, 'btn-white'), 1, 'btn-white se usa en otro boton');
  assert.equal(count(body, 'btn-orange'), 1, 'btn-orange se usa en otro boton');
  const white = HEAD.match(/\.btn-cta\.btn-white\{background:(#[0-9a-f]{6});color:(#[0-9a-f]{6});/)?.slice(1);
  const orange = HEAD.match(/\.btn-cta\.btn-orange\{background:(#[0-9a-f]{6});/)?.[1];
  assert.ok(white, 'falta el CSS .btn-cta.btn-white{background;color}');
  assert.equal(orange, '#c2410c', 'el naranja no es el aprobado');
  assert.ok(ratio(white[0], white[1]) >= 4.5, 'el texto del boton blanco no se lee');
  assert.ok(ratio(orange, '#ffffff') >= 4.5, 'el texto del boton naranja no se lee');
});

// Slice 22: el icono de video pasa a ser la claqueta ABIERTA propia (SVG). Material Symbols
// no trae una claqueta abierta (verificado contra su lista de codepoints).
test('S21-4 / S22-1 los 3 CTA "Quiero mi Pack de Reels" usan la claqueta abierta, no chat ni movie', () => {
  for (const k of ['videos_hero_cta_whatsapp', 'videos_cta_whatsapp', 'videos_mobile_whatsapp']) {
    const { body } = anchorOf(k);
    assert.match(body, /<svg class="[^"]*" aria-hidden="true"><use href="#icon-claqueta"\/><\/svg>/, `el CTA ${k} no usa la claqueta abierta`);
    assert.doesNotMatch(body, />(chat|movie)</, `el CTA ${k} conserva un icono de Material Symbols`);
  }
});

test('S22-2 la claqueta abierta se define una sola vez, oculta y con trazo del color del texto', () => {
  const sprite = V.match(/<svg [^>]*><symbol id="icon-claqueta" viewBox="0 0 24 24"[^>]*>[\s\S]*?<\/symbol><\/svg>/)?.[0];
  assert.ok(sprite, 'falta el <symbol id="icon-claqueta"> con viewBox 24x24');
  assert.equal(count(V, 'id="icon-claqueta"'), 1, 'la claqueta esta definida mas de una vez');
  assert.match(sprite, /^<svg [^>]*aria-hidden="true"/, 'el sprite no esta oculto a lectores de pantalla');
  assert.match(sprite, /^<svg [^>]*width="0" height="0"/, 'el sprite ocupa espacio en la pagina');
  assert.match(sprite, /stroke="currentColor"/, 'la claqueta no toma el color del boton');
  assert.match(sprite, /<polygon /, 'falta la tapa (la parte abierta de la claqueta)');
  assert.equal(count(V, '<use href="#icon-claqueta"/>'), 3, 'la claqueta no esta en exactamente los 3 CTA');
});
