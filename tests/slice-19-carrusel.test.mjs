// Tests del contrato del slice 19: el hero muestra un carrusel de 3 reels de YouTube. El del
// frente se reproduce en bucle, sin controles y silenciado, con un boton para activar el
// sonido; tocar un reel de atras lo trae al frente. Los IDs son placeholders (se cambian
// sin tocar estos tests: solo se valida su forma).
// Ejecutar: node --test "tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { read, count, stripBom, extractHero, scriptBlockWith } from './helpers/page.mjs';

const V = read('index.html');
const HERO = extractHero(V);
const LANGS = ['es', 'en', 'hi', 'zh', 'ur', 'ko'];
const J = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(stripBom(read(`i18n/${l}.json`)))]));
const MOCKUP_KEYS = [
  'videos_hero_reel1_handle', 'videos_hero_reel1_caption', 'videos_hero_reel1_sub', 'videos_hero_reel1_audio',
  'videos_hero_reel2_handle', 'videos_hero_reel2_caption', 'videos_hero_reel2_format', 'videos_hero_viral',
];
const CARDS = [...HERO.matchAll(/<button type="button" class="reel-card" data-yt="([^"]*)"[^>]*>([\s\S]*?)<\/button>/g)];

test('S19-1 el hero tiene exactamente 3 reels con ID de YouTube valido y su miniatura', () => {
  assert.equal(count(V, 'id="reel-carousel"'), 1, 'falta el contenedor #reel-carousel (o esta repetido)');
  assert.equal(CARDS.length, 3, `se esperaban 3 reels, hay ${CARDS.length}`);
  for (const [, id, inner] of CARDS) {
    assert.match(id, /^[\w-]{11}$/, `ID de YouTube invalido: "${id}"`);
    assert.ok(inner.includes(`src="https://i.ytimg.com/vi/${id}/hqdefault.jpg"`), `el reel ${id} no muestra su miniatura`);
  }
});

test('S19-2 el boton de sonido arranca en silencio y su texto accesible es traducible', () => {
  const btn = HERO.match(/<button type="button" id="reel-sound"[^>]*>[\s\S]*?<\/button>/)?.[0];
  assert.ok(btn, 'falta el boton #reel-sound');
  assert.match(btn, /aria-pressed="false"/, 'el boton no arranca en "sin sonido"');
  assert.match(btn, />volume_off</, 'el icono inicial no es volume_off');
  assert.match(btn, /<span class="sr-only" data-i18n="videos_hero_sound">/, 'el boton no tiene texto accesible traducible');
  for (const l of LANGS) assert.ok(J[l].videos_hero_sound?.trim(), `${l}.json no traduce videos_hero_sound`);
});

test('S19-3 los mockups ficticios de Stitch desaparecieron del HTML y de los 6 JSON', () => {
  assert.equal(count(HERO, 'lh3.googleusercontent.com'), 0, 'quedan las imagenes de los mockups');
  for (const k of MOCKUP_KEYS) {
    assert.equal(count(V, `data-i18n="${k}"`), 0, `videos.html aun usa "${k}"`);
    for (const l of LANGS) assert.ok(!Object.hasOwn(J[l], k), `${l}.json aun tiene "${k}"`);
  }
});

test('S19-4 CSS: el iframe no captura toques (sin controles) y las 3 posiciones existen', () => {
  const head = V.slice(0, V.indexOf('</head>'));
  assert.match(head, /\.reel-card iframe\{[^}]*pointer-events:none/, 'el iframe captura toques: el usuario podria pausar/abrir YouTube');
  for (const p of [0, 1, 2]) assert.match(head, new RegExp(`\\.reel-card\\[data-pos="${p}"\\]\\{`), `falta la posicion ${p}`);
});

// --- el script real, sobre un DOM minimo --------------------------------------
function makeDom() {
  const mk = (attrs = {}) => {
    const el = {
      attrs: { ...attrs }, children: [], listeners: {}, textContent: '', parent: null,
      getAttribute(k) { return k in this.attrs ? String(this.attrs[k]) : null; },
      setAttribute(k, v) { this.attrs[k] = String(v); },
      addEventListener(t, fn) { this.listeners[t] = fn; },
      click() { this.listeners.click?.(); },
      appendChild(c) { c.parent = this; this.children.push(c); return c; },
      remove() { if (this.parent) this.parent.children = this.parent.children.filter((x) => x !== this); this.parent = null; },
      querySelector(sel) { return sel === '.material-symbols-outlined' ? this.icon : null; },
    };
    return el;
  };
  const ids = CARDS.map((m) => m[1]);
  const cards = ids.map((id) => mk({ 'data-yt': id }));
  const sound = mk({ 'aria-pressed': 'false' });
  sound.icon = mk();
  sound.icon.textContent = 'volume_off';
  const posted = [];
  const stack = mk();
  stack.querySelectorAll = (sel) => (sel === '.reel-card' ? cards : []);
  const document = {
    getElementById: (id) => ({ 'reel-carousel': stack, 'reel-sound': sound })[id] ?? null,
    createElement: () => {
      const f = mk();
      f.contentWindow = { postMessage: (m) => posted.push(JSON.parse(m).func) };
      return f;
    },
  };
  vm.runInNewContext(scriptBlockWith(V, "getElementById('reel-carousel')").replace('<script>', ''), { document });
  const frameOf = (c) => c.children.find((x) => 'src' in x);
  const front = () => cards.find((c) => c.getAttribute('data-pos') === '0');
  return { ids, cards, sound, posted, frameOf, front };
}

test('S19-5 al cargar, el reel 1 esta al frente y reproduce en bucle, silenciado y sin controles', () => {
  const { ids, cards, frameOf, front, sound } = makeDom();
  assert.equal(front(), cards[0], 'el reel 1 no quedo al frente');
  assert.deepEqual(cards.map((c) => c.getAttribute('data-pos')), ['0', '1', '2']);
  const frames = cards.map(frameOf).filter(Boolean);
  assert.equal(frames.length, 1, `hay ${frames.length} reproductores: solo el del frente debe cargar video`);
  const u = new URL(frames[0].src);
  assert.equal(u.pathname, `/embed/${ids[0]}`);
  const want = { autoplay: '1', mute: '1', controls: '0', loop: '1', playlist: ids[0], playsinline: '1', enablejsapi: '1' };
  for (const [k, v] of Object.entries(want)) assert.equal(u.searchParams.get(k), v, `parametro ${k} != ${v}`);
  assert.equal(sound.getAttribute('aria-pressed'), 'false');
});

test('S19-6 tocar un reel de atras lo trae al frente y mueve el reproductor', () => {
  const { ids, cards, frameOf, front } = makeDom();
  cards[2].click();
  assert.equal(front(), cards[2], 'el reel tocado no paso al frente');
  assert.deepEqual(cards.map((c) => c.getAttribute('data-pos')), ['1', '2', '0']);
  assert.equal(cards.map(frameOf).filter(Boolean).length, 1, 'quedaron 2 reproductores');
  assert.equal(new URL(frameOf(cards[2]).src).searchParams.get('playlist'), ids[2]);
  cards[2].click(); // tocar el del frente no recarga nada
  assert.equal(front(), cards[2]);
});

test('S19-7 el boton de sonido activa y vuelve a silenciar; cambiar de reel vuelve a silencio', () => {
  const { cards, sound, posted } = makeDom();
  sound.click();
  assert.ok(posted.includes('unMute'), 'no se envio unMute al reproductor');
  assert.equal(sound.getAttribute('aria-pressed'), 'true');
  assert.equal(sound.icon.textContent, 'volume_up');
  sound.click();
  assert.equal(posted.at(-1), 'mute', 'el segundo toque no silencio');
  assert.equal(sound.getAttribute('aria-pressed'), 'false');
  sound.click();
  cards[1].click();
  assert.equal(sound.getAttribute('aria-pressed'), 'false', 'el reel nuevo arranca con sonido (el navegador lo bloquearia)');
  assert.equal(sound.icon.textContent, 'volume_off');
});
