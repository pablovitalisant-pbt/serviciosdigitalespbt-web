// Tests de i18n de las secciones YA traducidas de videos.html, guiados por la tabla
// SECTIONS de abajo. Fusiona los 4 archivos slice-2..5 (mismo esqueleto copiado 4 veces)
// sin perder deteccion: cada assert de aquellos tests vive en un test P* generico o en
// un `extra` del descriptor.
//
// Agregar una seccion nueva (slices 6-10) cuesta exactamente 2 lineas de codigo:
//   1) el extractor (o solo el marcador) en helpers/page.mjs + sumarlo a SECTION_EXTRACTORS
//   2) su descriptor en SECTIONS
// El meta-test G7 vigila que las dos listas no se separen.
//
// Ejecutar: node --test "tests/*.test.mjs"
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  read,
  count,
  dupesOf,
  i18nElems,
  hasChildTag,
  visibleText,
  stripBom,
  gitShowBaseline,
  extractHero,
  extractProblem,
  extractIncludes,
  extractPlansA,
  HERO_MARKER,
  PROBLEM_MARKER,
  INCLUDES_MARKER,
  PLANS_MARKER,
  PLANS_CUT_MARKER,
  SECTION_EXTRACTORS,
} from './helpers/page.mjs';
import { startServer } from './helpers/server.mjs';

// Base congelada: el commit del slice 1, donde las 4 secciones estan pristine (verificado).
// Una sola base sirve para los 4 descriptores. NO usar HEAD (ver gitShowBaseline).
const BASE = '8a5fa69';
const LANGS = ['es', 'en', 'hi', 'zh', 'ur', 'ko'];

const V = read('videos.html');
const VBASE = gitShowBaseline(BASE, 'videos.html');
const RAW = Object.fromEntries(LANGS.map((l) => [l, read(`i18n/${l}.json`)]));
const J = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(stripBom(RAW[l]))]));
const JBASE = Object.fromEntries(
  LANGS.map((l) => [l, JSON.parse(stripBom(gitShowBaseline(BASE, `i18n/${l}.json`)))]),
);

// --- tabla de descriptores ---------------------------------------------------

const SECTIONS = [
  {
    name: 'hero',
    extract: extractHero,
    markers: [HERO_MARKER],
    prefix: 'videos_hero_',
    keys: [
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
    ],
    // Texto ES = el de Stitch. "Barbería & Estilo" va con & y no con &amp;: el motor
    // usa textContent, que NO decodifica entidades.
    es: {
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
    },
    // Los 3 unicos textos dentro de un <span> NUEVO (sin class): su contenedor tiene un
    // icono adentro. Un tag span con class del diseno original no cuenta.
    wrapped: ['videos_hero_cta_planes', 'videos_hero_cta_whatsapp', 'videos_hero_viral'],
    strongKeys: [],
    // "IA + EDIT" se mantiene en los 6 idiomas (en: "AI + EDIT"): decision de Pablo.
    whitelist: new Set(['videos_hero_stat_ia']),
    mustInclude: [],
    mustExclude: [],
    extra: [
      {
        name: 'E_HERO (meta) el detector SI distingue un icono hijo de uno hermano: la version ingenua era vacua',
        fn: () => {
          const hijo = '<span data-i18n="k">Texto <span class="material-symbols-outlined">chat</span></span>';
          const hermano =
            '<a href="#"><span data-i18n="k">Texto</span><span class="material-symbols-outlined">chat</span></a>';
          assert.equal(hasChildTag(i18nElems(hijo)[0].inner), true, 'no detecta un icono HIJO (el guard seria vacuo)');
          assert.equal(
            hasChildTag(i18nElems(hermano)[0].inner),
            false,
            'marca como violacion un icono HERMANO dentro del <a> (falso rojo)',
          );
        },
      },
    ],
  },

  {
    name: 'problem',
    extract: extractProblem,
    markers: [PROBLEM_MARKER],
    prefix: 'videos_problem_',
    keys: [
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
    ],
    es: {
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
    },
    // Los 3 iconos (schedule, smart_toy, payments) son HERMANOS de los textos: viven en
    // su propio contenedor y el texto tiene su propio tag. Ningun span envolvente.
    wrapped: [],
    strongKeys: [],
    whitelist: new Set([]),
    mustInclude: [],
    mustExclude: [],
  },

  {
    name: 'includes',
    extract: extractIncludes,
    markers: [INCLUDES_MARKER],
    prefix: 'videos_includes_',
    keys: [
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
    ],
    // OJO con card3_title: el HTML dice `Subtítulos &amp; Gráficos` pero aca va `&`
    // LITERAL, porque el motor usa textContent, que NO decodifica entidades.
    es: {
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
    },
    // Los 6 iconos (info + los 5 de las tarjetas) son HERMANOS de los textos.
    wrapped: [],
    strongKeys: [],
    whitelist: new Set([]),
    mustInclude: ['Entregables Claros'],
    mustExclude: ['id="planes"'],
    extra: [
      {
        name: 'E_INCLUDES (meta) el icono info es hermano del titulo de la nota, y por eso el marcador es el comentario',
        fn: () => {
          assert.equal(
            count(V, '<section class="w-full bg-surface-container-low text-on-surface py-section-gap-md">'),
            2,
            'el tag de la seccion dejo de ser ambiguo: revisar si el marcador por comentario sigue siendo necesario',
          );
          // Estructura real de la nota de alcance:
          //   <div class="flex items-center gap-2 text-primary mb-2">
          //     <span class="material-symbols-outlined text-[20px]">info</span>
          //     <span class="font-label-bold text-label-bold uppercase">Nota de alcance...</span>
          //   </div>
          // Poner el data-i18n en el <div> borraria el icono: el riesgo es real, no teorico.
          const sec = secOf(D.includes);
          const i = sec.indexOf('>info</span>');
          assert.notEqual(i, -1, 'no se encontro el icono info en la seccion: cambio la estructura de la nota');
          const bloque = sec.slice(i, sec.indexOf('</div>', i));
          assert.ok(
            bloque.includes('<span class="font-label-bold text-label-bold uppercase"'),
            'el span del titulo de la nota no es hermano del icono info',
          );
          assert.equal(count(bloque, 'data-i18n='), 1, 'el data-i18n de la nota debe caer en el span del titulo');
          assert.ok(
            !/class="flex items-center gap-2 text-primary mb-2" data-i18n=/.test(sec),
            'el data-i18n se puso en el <div> contenedor: el motor borraria el icono info',
          );
          const hijo = i18nElems(
            '<span data-i18n="k">Texto <span class="material-symbols-outlined">chat</span></span>',
          );
          assert.equal(hasChildTag(hijo[0].inner), true, 'no detecta un icono HIJO (el guard seria vacuo)');
        },
      },
    ],
  },

  {
    name: 'plansA',
    extract: extractPlansA,
    markers: [PLANS_MARKER, PLANS_CUT_MARKER],
    prefix: 'videos_plans_',
    keys: [
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
    ],
    // Los numeros y "CLP" van LITERALES dentro de la frase (decision aprobada).
    // Ortografia exacta: "1ª" (U+00AA), "máx.", "•" (U+2022).
    es: {
      videos_plans_kicker: 'Suscripciones Mensuales',
      videos_plans_title: 'Planes Mensuales',
      videos_plans_subtitle: 'Precios transparentes en pesos chilenos. Sin contratos forzosos ni letras chicas.',
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
    },
    // Los 4 textos dentro de un <span data-i18n> NUEVO (sin class): su contenedor tiene
    // un <strong> adentro y el motor hace textContent =, que lo borraria.
    wrapped: [
      'videos_plans_p1_b1_s',
      'videos_plans_p2_b1_s',
      'videos_plans_p2_b4_post',
      'videos_plans_p2_b4_pre',
    ],
    strongKeys: ['videos_plans_p1_b1_n', 'videos_plans_p2_b1_n', 'videos_plans_p2_b4_strong'],
    whitelist: new Set([]),
    // Los 7 fragmentos de los 3 bullets con <strong>: los unicos textos de la seccion que
    // NO son una frase completa. Si uno quedara vacio, el motor hace `if (translations[key])`
    // y el espanol sobreviviria mezclado con el idioma elegido (defecto silencioso).
    fragments: [
      'videos_plans_p1_b1_n',
      'videos_plans_p1_b1_s',
      'videos_plans_p2_b1_n',
      'videos_plans_p2_b1_s',
      'videos_plans_p2_b4_pre',
      'videos_plans_p2_b4_strong',
      'videos_plans_p2_b4_post',
    ],
    // El numero que cada fragmento NO puede perder al traducirse.
    digitOf: {
      videos_plans_p1_b1_n: '4',
      videos_plans_p2_b1_n: '8',
      videos_plans_p2_b4_strong: '2',
    },
    // Precios y monedas que van LITERALES en los 6 idiomas.
    literals: {
      videos_plans_p1_reel_price: '$20.000',
      videos_plans_p2_reel_price: '$25.000',
      videos_plans_p1_unit: 'CLP',
      videos_plans_p2_unit: 'CLP',
    },
    // Tokens puros: no se traducen ni llevan clave. Si alguno apareciera en el JSON o
    // desapareciera del HTML, el contrato se rompio.
    pureTokens: ['$80.000', '$200.000'],
    // Los nombres de plan SE TRADUCEN: no pueden quedar iguales al espanol (el slice 7
    // reutiliza exactamente estas traducciones para "Nivel Económica/Equilibrada/Premium").
    translatedKeys: ['videos_plans_p1_title', 'videos_plans_p2_title'],
    distinctPairs: [['videos_plans_p1_title', 'videos_plans_p2_title']],
    mustInclude: ['Suscripciones Mensuales', 'Plan Equilibrada'],
    mustExclude: ['Plan Premium', 'id="como-funciona"', 'Entregables Claros'],
    extra: [
      {
        name: 'E_PLANS (meta) el detector SI distingue un <strong> hijo de uno hermano: el guard no es vacuo',
        fn: () => {
          const hijo = '<span data-i18n="k">Hasta <strong>2 clips</strong> por reel</span>';
          const hermano =
            '<span class=""><strong data-i18n="k">4 reels al mes</strong> <span data-i18n="k2">(x)</span></span>';
          assert.equal(hasChildTag(i18nElems(hijo)[0].inner), true, 'no detecta un <strong> HIJO (el guard seria vacuo)');
          const h = i18nElems(hermano);
          assert.equal(h.length, 2, 'el detector no encontro los 2 data-i18n hermanos');
          assert.deepEqual(
            h.map((e) => hasChildTag(e.inner)),
            [false, false],
            'marca como violacion un <strong> HERMANO (falso rojo)',
          );
        },
      },
    ],
  },
];

const D = Object.fromEntries(SECTIONS.map((d) => [d.name, d]));
const UNION = new Set(SECTIONS.flatMap((d) => d.keys));

// Extraccion perezosa: si un marcador se rompe, el throw falla solo los tests que tocan
// esa seccion en vez de tumbar el archivo entero al importarlo.
const secCache = new Map();
function secOf(d, html = V) {
  const key = d.name + (html === V ? '' : ':base');
  if (!secCache.has(key)) secCache.set(key, d.extract(html));
  return secCache.get(key);
}

const norm = (s) => s.replace(/\r\n/g, '\n');

// --- tests genericos, uno por descriptor -------------------------------------

for (const d of SECTIONS) {
  const K = d.keys;
  const S = () => secOf(d);

  test(`${d.name} P1 tiene exactamente las ${K.length} claves del contrato, con prefijo ${d.prefix}`, () => {
    const found = i18nElems(S()).map((e) => e.key);
    assert.deepEqual(
      [...found].sort(),
      [...K].sort(),
      `las claves de la seccion no son las ${K.length} del contrato (hay ${found.length}): ${found.join(', ')}`,
    );
    for (const k of found) {
      assert.match(k, new RegExp('^' + d.prefix), `la clave "${k}" no usa el prefijo ${d.prefix}`);
    }
  });

  test(`${d.name} P2 sin claves repetidas (el motor aplicaria la ultima y taparia un error)`, () => {
    const found = i18nElems(S()).map((e) => e.key);
    // Sin esto el detector de duplicados es vacuamente verde con 0 claves.
    assert.equal(found.length, K.length, `con ${found.length} claves el detector de duplicados no probaria nada`);
    assert.deepEqual(dupesOf(found), [], `claves duplicadas en la seccion: ${dupesOf(found).join(', ')}`);
  });

  test(`${d.name} P3 cada clave aparece exactamente 1 vez en videos.html (ningun slice pisa la seccion)`, () => {
    // Por clave y no por prefijo: asi el slice 6 puede agregar videos_plans_p3_* sin romper esto.
    const repes = K.filter((k) => count(V, `data-i18n="${k}"`) !== 1);
    assert.deepEqual(repes, [], 'estas claves no aparecen exactamente 1 vez en videos.html (estan repetidas o faltan)');
    assert.equal(count(S(), 'data-i18n="'), K.length, `la seccion no tiene los ${K.length} data-i18n del contrato`);
  });

  test(`${d.name} P4 (meta) los marcadores son unicos y el extractor devuelve la region correcta`, () => {
    for (const m of d.markers) {
      assert.equal(
        count(V, m),
        1,
        `el marcador se volvio ambiguo (${count(V, m)} ocurrencias): ${JSON.stringify(m.slice(0, 70))}`,
      );
    }
    const txt = visibleText(S());
    for (const x of d.mustInclude) assert.ok(txt.includes(x), `la seccion extraida no contiene "${x}"`);
    for (const x of d.mustExclude) {
      assert.equal(count(S(), x), 0, `la seccion extraida se paso a otra region: contiene "${x}"`);
    }
  });

  test(`${d.name} P5 ningun data-i18n vive en un elemento con hijos (el motor los borraria)`, () => {
    const elems = i18nElems(S());
    assert.equal(elems.length, K.length, `se esperaban ${K.length} elementos con data-i18n, hay ${elems.length}`);
    const malos = elems.filter((e) => hasChildTag(e.inner));
    assert.deepEqual(
      malos.map((m) => `${m.key} (<${m.tag}>)`),
      [],
      'estos elementos tienen hijos: el motor hace textContent = y los borraria',
    );
  });

  test(`${d.name} P6 los spans envolventes son exactamente los ${d.wrapped.length} declarados`, () => {
    const elems = i18nElems(S());
    assert.equal(elems.length, K.length, `con ${elems.length} elementos la lista de spans no probaria nada`);
    // El filtro por tag: los <strong data-i18n> tampoco tienen class (no pueden: P9 fija
    // las class de la seccion), asi que sin el se contarian como span envolvente.
    const wrapped = elems
      .filter((e) => e.tag === 'span' && e.attrs === `data-i18n="${e.key}"`)
      .map((e) => e.key)
      .sort();
    assert.deepEqual(wrapped, [...d.wrapped].sort(), 'los spans envolventes (span sin class) no son los del contrato');
    assert.equal(
      count(S(), '<span data-i18n="'),
      d.wrapped.length,
      'aparecio o falta un <span data-i18n="..."> pelado',
    );
  });

  test(`${d.name} P8a es.json dice exactamente el texto ES del contrato (sin espacios de mas)`, () => {
    for (const k of K) assert.equal(J.es[k], d.es[k], `es.json["${k}"] no coincide con el texto de Stitch`);
  });

  test(`${d.name} P8b ese texto existe de verdad en la seccion original (el contrato no invento nada)`, () => {
    const original = visibleText(secOf(d, VBASE));
    for (const k of K) {
      assert.ok(original.includes(d.es[k]), `"${d.es[k]}" (${k}) no aparece en la seccion original`);
    }
  });

  test(`${d.name} P9 la seccion es byte a byte el original + los data-i18n (nada mas)`, () => {
    let nuevo = S();
    // El conteo va ANTES de desenvolver: desenvolver borra el data-i18n de los spans.
    const attrs = [...nuevo.matchAll(/ data-i18n="[^"]*"/g)];
    assert.equal(attrs.length, K.length, `se esperaban ${K.length} data-i18n en la seccion, hay ${attrs.length}`);
    // ORDEN OBLIGATORIO: desenvolver ANTES de borrar los atributos. Al reves, el borrado
    // se lleva el data-i18n de los spans nuevos y el regex ya no matchea.
    for (const k of d.wrapped) {
      const re = new RegExp(`<span data-i18n="${k}">([^<]*)</span>`, 'g');
      assert.equal(
        (nuevo.match(re) || []).length,
        1,
        `falta el <span data-i18n="${k}"> envolvente (o lleva atributos de mas)`,
      );
      nuevo = nuevo.replace(re, '$1');
    }
    const a = norm(nuevo.replace(/ data-i18n="[^"]*"/g, ''));
    const b = norm(secOf(d, VBASE));
    if (a !== b) {
      let i = 0;
      while (i < a.length && a[i] === b[i]) i++;
      // El indice divergente reemplaza el diagnostico que antes daban los conteos de la seccion.
      assert.fail(
        `la seccion cambio algo mas que los data-i18n (primer byte divergente en ${i}):\n` +
          `  nuevo: ${JSON.stringify(a.slice(Math.max(0, i - 30), i + 50))}\n` +
          `  base:  ${JSON.stringify(b.slice(Math.max(0, i - 30), i + 50))}`,
      );
    }
  });

  test(`${d.name} P11 los 6 idiomas traducen, sin claves vacias y con maximo 3 iguales al espanol`, () => {
    for (const l of LANGS) {
      for (const k of K) {
        const v = J[l][k];
        assert.equal(typeof v, 'string', `${l}.json: "${k}" no es string (o falta la clave)`);
        assert.notEqual(
          v.trim(),
          '',
          `${l}.json: "${k}" esta vacia o es solo espacios (el motor la ignoraria y quedaria el espanol)`,
        );
      }
      if (l === 'es') continue;
      const same = K.filter((k) => J[l][k] === J.es[k] && !d.whitelist.has(k));
      assert.ok(same.length <= 3, `${l}.json tiene ${same.length} claves identicas al espanol (max 3): ${same.join(', ')}`);
    }
  });

  test(`${d.name} P-LINES las ${K.length} claves van una por linea, con indentacion de 2 espacios, en los 6 JSON`, () => {
    for (const l of LANGS) {
      const lines = stripBom(RAW[l]).split('\r\n');
      for (const k of K) {
        const hits = lines.filter((ln) => ln.trimStart().startsWith(`"${k}":`));
        assert.equal(hits.length, 1, `${l}.json: "${k}" debe estar en exactamente 1 linea (hay ${hits.length})`);
        assert.match(hits[0], new RegExp(`^  "${k}": ".+",?$`), `${l}.json: formato de la linea de "${k}"`);
      }
    }
  });

  // Gated por .length y no por truthiness: un `strongKeys: []` de mas no debe generar un
  // test vacuo ("los 0 <strong>...") que pasa siempre.
  if (d.strongKeys?.length) {
    test(`${d.name} P-STRONG los ${d.strongKeys.length} <strong> conservan el elemento y llevan su propio data-i18n`, () => {
      const strongs = [...S().matchAll(/<strong data-i18n="([^"]+)">/g)].map((m) => m[1]).sort();
      assert.deepEqual(strongs, [...d.strongKeys].sort(), 'los <strong> de la seccion no llevan su propio data-i18n');
    });
  }

  if (d.literals) {
    test(`${d.name} P-LITERALS los precios y monedas quedan literales en los 6 idiomas`, () => {
      for (const l of LANGS) {
        for (const [k, lit] of Object.entries(d.literals)) {
          assert.ok(String(J[l][k]).includes(lit), `${l}.json: "${k}" perdio el literal ${lit} al traducirse`);
        }
      }
    });
  }

  if (d.pureTokens) {
    test(`${d.name} P-PURE los ${d.pureTokens.length} tokens puros siguen en el HTML y sin clave`, () => {
      for (const p of d.pureTokens) {
        assert.equal(count(S(), p), 1, `el token puro ${p} desaparecio o se duplico`);
        assert.ok(!K.some((k) => d.es[k] === p), `el token puro ${p} recibio clave: no se traduce`);
      }
    });
  }

  if (d.fragments) {
    test(`${d.name} P-FRAGMENTS los ${d.fragments.length} fragmentos no quedan vacios ni pierden su numero`, () => {
      for (const l of LANGS) {
        for (const k of d.fragments) {
          const v = J[l][k];
          assert.equal(typeof v, 'string', `${l}.json: el fragmento "${k}" no es string`);
          assert.notEqual(
            v.trim(),
            '',
            `${l}.json: el fragmento "${k}" esta vacio: la secuencia prefijo-negrita-sufijo se rompe`,
          );
        }
        for (const [k, digito] of Object.entries(d.digitOf)) {
          assert.ok(
            String(J[l][k]).includes(digito),
            `${l}.json: "${k}" perdio el numero ${digito} al traducirse (el bullet diria otra cosa)`,
          );
        }
      }
    });
  }

  if (d.distinctPairs) {
    test(`${d.name} P-DISTINCT los pares de claves que deben diferir, difieren`, () => {
      for (const l of LANGS) {
        for (const [a, b] of d.distinctPairs) {
          assert.notEqual(J[l][a], J[l][b], `${l}.json: "${a}" y "${b}" tienen el mismo valor`);
        }
      }
    });
  }

  if (d.translatedKeys) {
    test(`${d.name} P-TRANSLATED los ${d.translatedKeys.length} nombres de plan se traducen en los 5 idiomas`, () => {
      // P11 tolera hasta 3 claves iguales al espanol: sin este test, dejar los nombres de
      // plan en espanol seguiria pasando (hallazgo 11 del audit, recuperado de forma generica).
      for (const l of LANGS.filter((x) => x !== 'es')) {
        for (const k of d.translatedKeys) {
          assert.notEqual(J[l][k], J.es[k], `${l}.json: "${k}" quedo igual al espanol (no se tradujo)`);
          assert.ok(!String(J[l][k]).trim().startsWith('['), `${l}.json: "${k}" quedo como placeholder`);
        }
      }
    });
  }

  for (const e of d.extra || []) test(`${d.name} ${e.name}`, e.fn);
}

// --- tests globales (una vez, no por seccion) --------------------------------

test('G1 los 6 JSON tienen las claves de la base + las de los descriptores, ni una mas', () => {
  const baseKeys = Object.keys(JBASE.es);
  const esperadas = new Set([...baseKeys, ...UNION]);
  for (const l of LANGS) {
    const ks = Object.keys(J[l]);
    const faltan = [...esperadas].filter((k) => !Object.hasOwn(J[l], k));
    const sobran = ks.filter((k) => !esperadas.has(k));
    assert.deepEqual(faltan, [], `${l}.json: faltan claves (${baseKeys.length} de la base + las de los descriptores)`);
    assert.deepEqual(sobran, [], `${l}.json: claves que no declara ninguna seccion`);
  }
});

test('G2 las claves de la base quedaron intactas y las agregadas son las de los descriptores', () => {
  for (const l of LANGS) {
    const old = JBASE[l];
    const cur = J[l];
    for (const k of Object.keys(old)) {
      assert.equal(cur[k], old[k], `${l}.json: la clave existente "${k}" cambio de valor`);
    }
    const added = Object.keys(cur).filter((k) => !Object.hasOwn(old, k));
    assert.deepEqual(added.sort(), [...UNION].sort(), `${l}.json: las claves agregadas no son las de los descriptores`);
  }
});

test('G3 todo data-i18n de videos.html pertenece a un descriptor (nada de i18n fuera de las secciones)', () => {
  const found = [...new Set(i18nElems(V).map((e) => e.key))];
  const fuera = found.filter((k) => !UNION.has(k));
  assert.deepEqual(fuera, [], 'hay data-i18n fuera de las secciones traducidas: se adelanto trabajo de un slice futuro');
});

test('G4 los 6 JSON conservan BOM, sin finales de linea mezclados y sin salto final', () => {
  for (const l of LANGS) {
    const raw = RAW[l];
    assert.equal(raw.charCodeAt(0), 0xfeff, `${l}.json perdio el BOM (decision aprobada: preservarlo)`);
    assert.equal(count(raw, '\n'), count(raw, '\r\n'), `${l}.json quedo con finales de linea mezclados`);
    assert.ok(raw.endsWith('}'), `${l}.json gano un salto de linea final`);
  }
});

test('G6 ningun valor ES del contrato lleva una entidad HTML cruda (textContent no decodifica)', () => {
  for (const d of SECTIONS) {
    for (const k of d.keys) {
      assert.doesNotMatch(d.es[k], /&[a-z]+;|&#\d+;/, `${d.name}: "${k}" lleva una entidad sin decodificar`);
    }
  }
});

test('G7 (meta) la tabla de descriptores y SECTION_EXTRACTORS de helpers no se separaron', () => {
  assert.deepEqual(
    SECTIONS.map((d) => d.extract),
    SECTION_EXTRACTORS,
    'agregar una seccion exige tocar helpers/page.mjs (extractor + SECTION_EXTRACTORS) y esta tabla',
  );
});

test('G-FILEWIDE videos.html conserva los conteos globales del slice 1 (iconos, WhatsApp, class)', () => {
  // Los conteos por seccion los implica P9 byte a byte; estos son de TODO el archivo.
  for (const t of ['material-symbols-outlined', '[LINK_WHATSAPP]', 'href="https://wa.me/"', 'class="']) {
    assert.equal(count(V, t), count(VBASE, t), `cambio la cantidad de ${JSON.stringify(t)} en videos.html`);
  }
});

// --- E2E por HTTP (los JSON se cargan por fetch) -----------------------------

let srv;
before(async () => {
  srv = await startServer();
});
after(async () => {
  await srv.close();
});

test('G5 (E2E) los 6 JSON se sirven, res.json() NO explota con el BOM y traen las claves', async () => {
  const esperadas = new Set([...Object.keys(JBASE.es), ...UNION]);
  for (const l of LANGS) {
    const res = await fetch(`${srv.base}/i18n/${l}.json`);
    assert.equal(res.status, 200, `${l}.json no responde 200`);
    const parsed = await res.json();
    assert.equal(Object.keys(parsed).length, esperadas.size, `${l}.json servido llego incompleto`);
    for (const k of UNION) {
      assert.equal(typeof parsed[k], 'string', `${l}.json servido no trae "${k}" como string`);
    }
  }
});
