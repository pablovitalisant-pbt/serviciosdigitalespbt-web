// Tests del contrato del slice 16: CTA unico "Quiero mi Pack de Reels", botones de compra
// verdes con brillo y punto del badge que parpadea. Cada test nombra lo que lo romperia.
// Ejecutar: node --test "tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, count, stripBom, extractHero, extractCta, extractMobile } from './helpers/page.mjs';

const V = read('videos.html');
const HEAD = V.slice(0, V.indexOf('</head>'));
const LANGS = ['es', 'en', 'hi', 'zh', 'ur', 'ko'];
const J = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(stripBom(read(`i18n/${l}.json`)))]));

const CTA_TEXT = 'Quiero mi Pack de Reels';
const CTA_KEYS = ['videos_hero_cta_whatsapp', 'videos_cta_whatsapp', 'videos_mobile_whatsapp'];
const REMOVED_KEYS = ['videos_hero_cta_planes', 'videos_cta_compare'];
const GREEN = '#15803d';

const anchors = (html) => [...html.matchAll(/<a\s[^>]*>/g)].map((m) => m[0]);

test('S16-1 el hero tiene UN solo boton y es el CTA principal', () => {
  const as = anchors(extractHero(V));
  assert.equal(as.length, 1, `el hero tiene ${as.length} botones (se esperaba 1)`);
  assert.equal(count(extractHero(V), 'href="#planes"'), 0, 'sigue el boton "Ver planes mensuales" en el hero');
  assert.equal(count(extractHero(V), 'data-i18n="videos_hero_cta_whatsapp"'), 1, 'el boton del hero no es el CTA');
});

test('S16-2 el cierre final tiene UN solo boton (se elimino "Comparar planes")', () => {
  const as = anchors(extractCta(V));
  assert.equal(as.length, 1, `el cierre tiene ${as.length} botones (se esperaba 1)`);
  assert.equal(count(extractCta(V), 'href="#planes"'), 0, 'sigue el boton "Comparar planes"');
});

test('S16-3 hero, cierre y barra movil dicen "Quiero mi Pack de Reels" (y es la misma frase en los 6 idiomas)', () => {
  for (const k of CTA_KEYS) assert.equal(J.es[k], CTA_TEXT, `es.json["${k}"] no es el CTA aprobado`);
  for (const l of LANGS) {
    const vals = new Set(CTA_KEYS.map((k) => J[l][k]));
    assert.equal(vals.size, 1, `${l}.json: el CTA no es identico en hero/cierre/movil: ${[...vals].join(' | ')}`);
    if (l !== 'es') assert.notEqual(J[l][CTA_KEYS[0]], CTA_TEXT, `${l}.json: el CTA quedo sin traducir`);
  }
  assert.ok(extractMobile(V).includes(CTA_TEXT), 'el HTML de la barra movil no trae el texto del CTA');
});

test('S16-4 las claves de los botones eliminados no quedan en el HTML ni en los 6 JSON', () => {
  for (const k of REMOVED_KEYS) {
    assert.equal(count(V, `data-i18n="${k}"`), 0, `videos.html aun usa "${k}"`);
    for (const l of LANGS) assert.ok(!Object.hasOwn(J[l], k), `${l}.json aun tiene "${k}"`);
  }
});

test('S16-5 los 8 botones de compra (WhatsApp) son btn-cta con texto blanco, y btn-cta no se usa en otro lado', () => {
  const wa = anchors(V).filter((a) => a.includes('href="https://wa.me/'));
  assert.equal(wa.length, 8, `se esperaban 8 botones de WhatsApp, hay ${wa.length}`);
  for (const a of wa) {
    const cls = a.match(/class="([^"]*)"/)?.[1] ?? '';
    assert.ok(cls.split(' ').includes('btn-cta'), `boton sin btn-cta: ${a.slice(0, 90)}`);
    assert.ok(cls.split(' ').includes('text-on-primary'), `boton sin texto blanco: ${a.slice(0, 90)}`);
    for (const viejo of ['bg-primary-container', 'bg-on-background', 'bg-surface-container', 'text-on-surface']) {
      assert.ok(!cls.split(' ').includes(viejo), `el boton conserva el color viejo ${viejo}`);
    }
  }
  assert.equal(count(V, 'btn-cta '), 8, 'btn-cta aparece en algo que no es un boton de compra');
});

test('S16-6 el CSS del boton: verde aprobado, brillo animado y respeta prefers-reduced-motion', () => {
  assert.match(HEAD, new RegExp(`\\.btn-cta\\{[^}]*background:${GREEN}`), 'el verde del boton no es el aprobado');
  assert.match(HEAD, /\.btn-cta\{[^}]*overflow:hidden/, 'sin overflow:hidden el brillo se sale del boton');
  assert.match(HEAD, /\.btn-cta::after\{[^}]*animation:cta-shine/, 'el boton no tiene el brillo animado');
  assert.match(HEAD, /@keyframes cta-shine\{/, 'falta la animacion cta-shine');
  assert.match(
    HEAD,
    /@media \(prefers-reduced-motion:reduce\)\{[^}]*\.btn-cta::after[^}]*animation:none/,
    'el brillo no se apaga con prefers-reduced-motion',
  );
});

test('S16-7 texto blanco sobre el verde aprobado cumple contraste AA (>= 4.5)', () => {
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = 1.05 / (lum(GREEN) + 0.05);
  assert.ok(ratio >= 4.5, `contraste ${ratio.toFixed(2)} < 4.5`);
});

test('S16-8 el punto del badge parpadea lento (dot-blink) en vez de animate-pulse', () => {
  const hero = extractHero(V);
  const badge = hero.slice(0, hero.indexOf('data-i18n="videos_hero_badge"'));
  const dot = badge.match(/<span class="[^"]*rounded-full[^"]*"><\/span>/g) || [];
  assert.equal(dot.length, 1, 'no se encontro el punto del badge');
  assert.ok(dot[0].includes('dot-blink'), 'el punto no usa dot-blink');
  assert.ok(!dot[0].includes('animate-pulse'), 'el punto conserva animate-pulse (dos animaciones peleando)');
  const kf = HEAD.match(/@keyframes dot-blink\{.*?\}\}/)?.[0];
  assert.ok(kf, 'falta la animacion dot-blink');
  assert.match(HEAD, /\.dot-blink\{animation:dot-blink (\d(\.\d+)?)s/, 'dot-blink sin duracion');
  const secs = Number(HEAD.match(/\.dot-blink\{animation:dot-blink (\d(?:\.\d+)?)s/)[1]);
  assert.ok(secs >= 2, `parpadeo de ${secs}s: no es "lento"`);
  assert.match(
    HEAD,
    /@media \(prefers-reduced-motion:reduce\)\{[^}]*\.dot-blink[^}]*animation:none/,
    'el parpadeo no se apaga con prefers-reduced-motion',
  );
});
