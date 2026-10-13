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
  extractPlansB,
  extractSingle,
  extractHow,
  extractCta,
  extractMobile,
  extractExtras,
  extractFaq,
  uncoveredBodyText,
  HERO_MARKER,
  PROBLEM_MARKER,
  INCLUDES_MARKER,
  PLANS_MARKER,
  PLANS_CUT_MARKER,
  SINGLE_MARKER,
  HOW_MARKER,
  CTA_MARKER,
  MOBILE_MARKER,
  EXTRAS_MARKER,
  FAQ_MARKER,
  SECTION_EXTRACTORS,
} from './helpers/page.mjs';
import { startServer } from './helpers/server.mjs';

// Base congelada: el commit del slice 1, donde las 4 secciones estan pristine (verificado).
// Una sola base sirve para los 4 descriptores. NO usar HEAD (ver gitShowBaseline).
const BASE = '8a5fa69';
const LANGS = ['es', 'en', 'hi', 'zh', 'ur', 'ko'];

// La palabra "plan" en cada idioma. Se le quita al titulo del plan (slice 5/6) para obtener
// el nombre del nivel, que la seccion 5 DEBE reutilizar tal cual (decision D3 de Fase A):
// si aca dice "尊享方案" y alla "高级", P-LEVELS falla. Es el unico acoplamiento entre
// secciones por VALOR, y es deliberado.
const PLAN_WORD = { es: 'Plan', en: 'Plan', hi: 'प्लान', zh: '方案', ur: 'پلان', ko: '플랜' };

const V = read('videos.html');
const VBASE = gitShowBaseline(BASE, 'videos.html');
const RAW = Object.fromEntries(LANGS.map((l) => [l, read(`i18n/${l}.json`)]));
const J = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(stripBom(RAW[l]))]));
const JBASE = Object.fromEntries(
  LANGS.map((l) => [l, JSON.parse(stripBom(gitShowBaseline(BASE, `i18n/${l}.json`)))]),
);

// --- copy v2 (slices 12-13): divergencias DELIBERADAS del copy de Stitch -------
// Decision de negocio de Pablo (2026-10-13): la landing deja de vender "profesionales
// de servicios en Chile" y pasa a "negocios de cualquier rubro, servicio 100% online".
// Cada entrada declara el texto VIEJO (literal en la base 8a5fa69) y el NUEVO (= d.es[k]).
// P8b y P9 aplican esta tabla a la base ANTES de comparar: es lo UNICO que puede blanquear
// una divergencia, y solo estas claves. G-COPYV2 vigila la tabla; agregar una entrada
// exige tocar tambien su lista explicita (una decision visible, no un descuido).
// Slice 13 (precios, 2026-10-13): +2 claves reel_price aca y +2 tokens puros en COPY_V2_TOKENS.
const COPY_V2 = {
  videos_hero_badge: {
    old: 'Edición de reels para profesionales locales',
    new: 'Edición de reels para negocios que quieren vender en redes',
  },
  videos_hero_subtitle: {
    old: 'Tú entregas tus grabaciones en bruto y recibes reels editados listos para publicar. Entrega de tu primera versión en un máximo de 48 horas tras recibir todo el material e instrucciones.',
    new: 'Ya sea que vendas productos, servicios o experiencias, tú entregas tus grabaciones en bruto y recibes reels editados listos para publicar. Primera versión en un máximo de 48 horas tras recibir todo el material e instrucciones.',
  },
  videos_problem_subtitle: {
    old: 'La mayoría de médicos, abogados, esteticistas y prestadores de servicios quieren una presencia activa en redes sociales. El obstáculo nunca es la cámara: es perder horas valiosas cortando silencios, afinando subtítulos y buscando música sin derechos.',
    new: 'Tiendas, mayoristas, gimnasios, centros de estética, inmobiliarias, agencias de turismo, salas de eventos, consultas y oficinas: todos saben que tienen que estar activos en redes. El obstáculo nunca es la cámara: es perder horas valiosas cortando silencios, afinando subtítulos y buscando música sin derechos.',
  },
  videos_problem_block1_body: {
    old: 'Grabas una explicación en 5 minutos entre citas, pero terminas perdiendo todo el fin de semana probando filtros, sincronizando subtítulos y exportando videos que no quedan como imaginabas.',
    new: 'Grabas un video en 5 minutos entre una venta y otra, pero terminas perdiendo todo el fin de semana probando filtros, sincronizando subtítulos y exportando videos que no quedan como imaginabas.',
  },
  videos_problem_block3_title: {
    old: 'Enfócate en tu profesión',
    new: 'Enfócate en tu negocio',
  },
  videos_problem_block3_body: {
    old: 'Tú atiendes tu consulta, local o estudio jurídico sin desviarte de lo que genera ingresos reales. Nosotros nos encargamos de que tu material crudo se convierta en reels impecables que atraigan nuevos clientes.',
    new: 'Tú te dedicas a vender, atender y hacer crecer tu negocio sin desviarte de lo que genera ingresos reales. Nosotros nos encargamos de que tu material crudo se convierta en reels impecables que atraigan nuevos clientes.',
  },
  videos_includes_card2_body: {
    old: 'Cortes de silencios, eliminación de titubeos, estabilización y selección del mejor ritmo de oratoria.',
    new: 'Cortes de silencios y tiempos muertos, eliminación de titubeos, estabilización y el mejor ritmo para mostrar lo que ofreces.',
  },
  videos_plans_subtitle: {
    old: 'Precios transparentes en pesos chilenos. Sin contratos forzosos ni letras chicas.',
    new: 'Precios transparentes. Sin contratos forzosos ni letras chicas.',
  },
  videos_cta_footer: {
    old: 'Atención personalizada para profesionales de Iquique, Tarapacá y todo Chile',
    new: 'Servicio 100% online: trabajamos con negocios de todo el mundo',
  },
  // Slice 13: el precio por reel BAJA al subir de plan. Solo cambia el monto; la frase queda.
  videos_plans_p2_reel_price: {
    old: '$25.000 CLP por reel • Mayor presencia semanal',
    new: '$18.750 CLP por reel • Mayor presencia semanal',
  },
  videos_plans_p3_reel_price: {
    old: '$32.500 CLP por reel • Máxima frecuencia',
    new: '$17.500 CLP por reel • Máxima frecuencia',
  },
};

// Mitad del MISMO mecanismo de overrides declarados: los 2 precios mensuales no tienen
// clave i18n (son tokens puros), asi que no pueden vivir en COPY_V2 (que exige UNION.has(k)
// y o.new === d.es[k]). Formato token viejo -> token nuevo; secBaseV2 los aplica a la
// seccion que los contenga, y G-COPYV2 vigila que sigan siendo divergencias reales.
const COPY_V2_TOKENS = {
  '$200.000': '$150.000',
  '$390.000': '$210.000',
};

// Lista explicita, en el orden del contrato. G-COPYV2 la compara con las claves reales de
// COPY_V2: si alguien agrega o quita una divergencia, este array lo delata.
const COPY_V2_KEYS = [
  'videos_hero_badge',
  'videos_hero_subtitle',
  'videos_problem_subtitle',
  'videos_problem_block1_body',
  'videos_problem_block3_title',
  'videos_problem_block3_body',
  'videos_includes_card2_body',
  'videos_plans_subtitle',
  'videos_cta_footer',
  'videos_plans_p2_reel_price',
  'videos_plans_p3_reel_price',
];

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
      videos_hero_badge: 'Edición de reels para negocios que quieren vender en redes',
      videos_hero_title: 'Publica videos profesionales sin quedarte editando',
      videos_hero_subtitle:
        'Ya sea que vendas productos, servicios o experiencias, tú entregas tus grabaciones en bruto y recibes reels editados listos para publicar. Primera versión en un máximo de 48 horas tras recibir todo el material e instrucciones.',
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
    // Copy v2 (slice 12): el "48" del subtitulo queda literal en los 6 idiomas.
    literals: { videos_hero_subtitle: '48' },
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
        'Tiendas, mayoristas, gimnasios, centros de estética, inmobiliarias, agencias de turismo, salas de eventos, consultas y oficinas: todos saben que tienen que estar activos en redes. El obstáculo nunca es la cámara: es perder horas valiosas cortando silencios, afinando subtítulos y buscando música sin derechos.',
      videos_problem_block1_step: '01 / El Problema',
      videos_problem_block1_title: 'El dilema del tiempo',
      videos_problem_block1_body:
        'Grabas un video en 5 minutos entre una venta y otra, pero terminas perdiendo todo el fin de semana probando filtros, sincronizando subtítulos y exportando videos que no quedan como imaginabas.',
      videos_problem_block1_result: 'Resultado: Cuentas inactivas por semanas',
      videos_problem_formula_badge: 'Fórmula PBT',
      videos_problem_block2_step: '02 / La Metodología',
      videos_problem_block2_title: 'Edición híbrida IA + Humano',
      videos_problem_block2_body:
        'Aprovechamos la aceleración computacional de agentes de IA para transcripción y b-roll selectivo, combinada con la revisión meticulosa y criterio estético de un editor profesional.',
      videos_problem_block2_result: 'Calidad editorial + entrega en 48 horas',
      videos_problem_block3_step: '03 / El Resultado',
      videos_problem_block3_title: 'Enfócate en tu negocio',
      videos_problem_block3_body:
        'Tú te dedicas a vender, atender y hacer crecer tu negocio sin desviarte de lo que genera ingresos reales. Nosotros nos encargamos de que tu material crudo se convierta en reels impecables que atraigan nuevos clientes.',
      videos_problem_block3_result: 'Presencia constante y profesional',
    },
    // Los 3 iconos (schedule, smart_toy, payments) son HERMANOS de los textos: viven en
    // su propio contenedor y el texto tiene su propio tag. Ningun span envolvente.
    wrapped: [],
    strongKeys: [],
    whitelist: new Set([]),
    // Copy v2 (slice 12): el "5" del bloque del problema queda literal en los 6 idiomas.
    literals: { videos_problem_block1_body: '5' },
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
        'Cortes de silencios y tiempos muertos, eliminación de titubeos, estabilización y el mejor ritmo para mostrar lo que ofreces.',
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
      videos_plans_subtitle: 'Precios transparentes. Sin contratos forzosos ni letras chicas.',
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
      videos_plans_p2_reel_price: '$18.750 CLP por reel • Mayor presencia semanal',
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
      videos_plans_p2_reel_price: '$18.750',
      videos_plans_p1_unit: 'CLP',
      videos_plans_p2_unit: 'CLP',
    },
    // Tokens puros: no se traducen ni llevan clave. Si alguno apareciera en el JSON o
    // desapareciera del HTML, el contrato se rompio.
    pureTokens: ['$80.000', '$150.000'],
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

  {
    name: 'plansB',
    extract: extractPlansB,
    // Reusa el marcador de corte del slice 5: es el arranque de la tarjeta Premium y el primer
    // </section> tras el es el cierre de #planes. La unicidad la cubre P4 (count === 1).
    markers: [PLANS_CUT_MARKER],
    prefix: 'videos_plans_',
    keys: [
      'videos_plans_p3_kicker',
      'videos_plans_p3_title',
      'videos_plans_p3_unit',
      'videos_plans_p3_reel_price',
      'videos_plans_p3_b1_n',
      'videos_plans_p3_b1_s',
      'videos_plans_p3_b2',
      'videos_plans_p3_b3',
      'videos_plans_p3_b4_pre',
      'videos_plans_p3_b4_strong',
      'videos_plans_p3_b4_post',
      'videos_plans_p3_b5_strong',
      'videos_plans_p3_b5_post',
      'videos_plans_p3_b6',
      'videos_plans_p3_cta',
      'videos_plans_note_title',
      'videos_plans_note_body',
    ],
    // Los numeros y "CLP" van LITERALES dentro de la frase (decision aprobada).
    // Ortografia exacta: "1ª" (U+00AA), "máx.", "•" (U+2022).
    es: {
      videos_plans_p3_kicker: 'Máximo impacto',
      videos_plans_p3_title: 'Plan Premium',
      videos_plans_p3_unit: 'CLP / mes',
      videos_plans_p3_reel_price: '$17.500 CLP por reel • Máxima frecuencia',
      videos_plans_p3_b1_n: '12 reels al mes',
      videos_plans_p3_b1_s: '(hasta 60s cada uno)',
      videos_plans_p3_b2: 'Edición personalizada según tus referencias',
      videos_plans_p3_b3: 'Gráficos a medida en el estilo acordado',
      videos_plans_p3_b4_pre: 'Hasta',
      videos_plans_p3_b4_strong: '4 clips breves de b-roll IA',
      videos_plans_p3_b4_post: 'por reel',
      videos_plans_p3_b5_strong: 'Hasta 2 rondas',
      videos_plans_p3_b5_post: 'de cambios menores por reel',
      videos_plans_p3_b6: 'Entrega 1ª versión en máx. 48h hábiles',
      videos_plans_p3_cta: 'Elegir Premium',
      videos_plans_note_title: 'Términos de servicio de edición mensual:',
      videos_plans_note_body:
        'El b-roll se incluye dentro de los límites indicados y solo cuando sea técnicamente y visualmente adecuado para el contenido. La generación completa de videos con IA se cotiza aparte. Los videos no usados dentro del mes calendario no se acumulan para el mes siguiente. El precio mensual corresponde al servicio de edición; grabación, traslados, publicación y gestión de comunidad se cotizan por separado.',
    },
    // Los 5 textos dentro de un <span data-i18n> NUEVO (sin class): su contenedor tiene un
    // <strong> adentro y el motor hace textContent =, que lo borraria. note_body es el cuerpo
    // de la nota: el <p> tiene un <strong> hijo, asi que el texto va en su propio span.
    wrapped: [
      'videos_plans_p3_b1_s',
      'videos_plans_p3_b4_pre',
      'videos_plans_p3_b4_post',
      'videos_plans_p3_b5_post',
      'videos_plans_note_body',
    ],
    // D1 (aprobada): el <strong> de la nota lleva class, asi que su data-i18n va AL FINAL del tag
    // y el regex de P-STRONG (<strong data-i18n="...">) no lo ve: por eso no entra en esta lista.
    strongKeys: ['videos_plans_p3_b1_n', 'videos_plans_p3_b4_strong', 'videos_plans_p3_b5_strong'],
    whitelist: new Set([]),
    // Los 8 textos que NO son una frase completa (fragmentos de bullets + el label de la nota).
    // Si uno quedara vacio, el motor hace `if (translations[key])` y el espanol sobreviviria.
    fragments: [
      'videos_plans_p3_b1_n',
      'videos_plans_p3_b1_s',
      'videos_plans_p3_b4_pre',
      'videos_plans_p3_b4_strong',
      'videos_plans_p3_b4_post',
      'videos_plans_p3_b5_strong',
      'videos_plans_p3_b5_post',
      'videos_plans_note_title',
    ],
    // El numero que cada fragmento NO puede perder al traducirse (la negrita puede moverse de
    // lugar dentro de la frase, pero el digito se queda en la negrita).
    digitOf: {
      videos_plans_p3_b1_n: '12',
      videos_plans_p3_b4_strong: '4',
      videos_plans_p3_b5_strong: '2',
    },
    // Precios y monedas que van LITERALES en los 6 idiomas.
    literals: {
      videos_plans_p3_unit: 'CLP',
      videos_plans_p3_reel_price: '$17.500',
    },
    // Token puro: el precio grande de la tarjeta no se traduce ni lleva clave.
    pureTokens: ['$210.000'],
    // El nombre del plan SE TRADUCE, coherente con los otros dos (videos_plans_p1/p2_title).
    translatedKeys: ['videos_plans_p3_title'],
    distinctPairs: [
      ['videos_plans_p3_title', 'videos_plans_p1_title'],
      ['videos_plans_p3_title', 'videos_plans_p2_title'],
    ],
    mustInclude: ['Plan Premium', 'Máximo impacto', 'Términos de servicio'],
    mustExclude: ['Plan Económica', 'Plan Equilibrada', 'id="como-funciona"'],
  },

  {
    name: 'single',
    extract: extractSingle,
    // El <section> de esta seccion comparte tag con el de la 3 (count === 2, lo prueba
    // E_INCLUDES): el marcador es el comentario de Stitch, que si es unico, y P4 lo vigila.
    markers: [SINGLE_MARKER],
    prefix: 'videos_single_',
    keys: [
      'videos_single_kicker',
      'videos_single_title',
      'videos_single_subtitle',
      'videos_single_reel_title',
      'videos_single_reel_format',
      'videos_single_reel_p1',
      'videos_single_reel_p2',
      'videos_single_reel_p3',
      'videos_single_reel_cta',
      'videos_single_long_title',
      'videos_single_long_format',
      'videos_single_long_p1',
      'videos_single_long_p2',
      'videos_single_long_p3',
      'videos_single_long_cta',
      'videos_single_note',
    ],
    // Texto ES = el de Stitch, literal. El rotulo "Nivel X" aparece DOS veces en la seccion
    // (bloque Reel y bloque Video Largo): P3 exige 1 ocurrencia por clave, asi que son 6
    // claves de nivel, no 3 (decision D1 de Fase A).
    es: {
      videos_single_kicker: 'Flexibilidad Total',
      videos_single_title: '¿Prefieres probar antes de suscribirte?',
      videos_single_subtitle:
        'Opciones de edición por video individual sin compromiso mensual. Ideal para validar nuestro flujo de trabajo o proyectos específicos.',
      videos_single_reel_title: '1 Reel Individual',
      videos_single_reel_format: 'Formato vertical de hasta 60 segundos',
      videos_single_reel_p1: 'Nivel Económica',
      videos_single_reel_p2: 'Nivel Equilibrada',
      videos_single_reel_p3: 'Nivel Premium',
      videos_single_reel_cta: 'Cotizar Reel Suelto',
      videos_single_long_title: '1 Video Largo Individual',
      videos_single_long_format: 'Duración de 5 a 6 minutos (YouTube / Web)',
      videos_single_long_p1: 'Nivel Económica',
      videos_single_long_p2: 'Nivel Equilibrada',
      videos_single_long_p3: 'Nivel Premium',
      videos_single_long_cta: 'Cotizar Video Largo',
      videos_single_note:
        '* Los videos largos se cotizan exclusivamente como trabajos individuales y no forman parte de los planes mensuales.',
    },
    // Ningun <span data-i18n="k"> pelado: los 6 spans de nivel llevan su class del diseno
    // (P6 filtra por attrs === data-i18n solo), y los 2 CTA viven en el <a> con su texto.
    wrapped: [],
    // La seccion no tiene NI UN <strong> (verificado): no hay fragmentos de bullet partido
    // ni negrita que conservar. Por eso tampoco hay digitOf (decision D4 de Fase A).
    strongKeys: [],
    fragments: [],
    whitelist: new Set([]),
    // Numeros + moneda sin ninguna palabra alrededor: no se traducen ni llevan clave.
    pureTokens: ['$22.000 CLP', '$30.000 CLP', '$40.000 CLP', '$45.000 CLP', '$65.000 CLP', '$90.000 CLP'],
    // D2: el unico literal dentro de un valor traducido es el asterisco del pie de pagina.
    literals: { videos_single_note: '*' },
    // D3: los 6 rotulos "Nivel X" deben reutilizar el nombre de plan ya traducido en las
    // tarjetas del slice 5/6, no retraducirlo.
    levelOfPlan: [
      ['videos_single_reel_p1', 'videos_plans_p1_title'],
      ['videos_single_reel_p2', 'videos_plans_p2_title'],
      ['videos_single_reel_p3', 'videos_plans_p3_title'],
      ['videos_single_long_p1', 'videos_plans_p1_title'],
      ['videos_single_long_p2', 'videos_plans_p2_title'],
      ['videos_single_long_p3', 'videos_plans_p3_title'],
    ],
    mustInclude: ['Flexibilidad Total', 'Cotizar Reel Suelto', 'Nivel Premium'],
    mustExclude: ['id="planes"', 'Términos de servicio', 'id="como-funciona"'],
  },

  {
    name: 'how',
    extract: extractHow,
    // El <section> lleva id="como-funciona"; el marcador es el comentario de Stitch, unico,
    // por consistencia con INCLUDES/SINGLE/PLANS (P4 vigila su unicidad).
    markers: [HOW_MARKER],
    prefix: 'videos_how_',
    keys: [
      'videos_how_kicker',
      'videos_how_title',
      'videos_how_subtitle',
      'videos_how_step1_title',
      'videos_how_step1_body',
      'videos_how_step1_note',
      'videos_how_step2_title',
      'videos_how_step2_body',
      'videos_how_step2_note',
      'videos_how_step3_title',
      'videos_how_step3_body',
      'videos_how_step3_note',
      'videos_how_note_title',
      'videos_how_note_body',
    ],
    // Texto ES = el de Stitch, literal. Los "01/02/03" de los pasos NO se traducen
    // (tokens puros, mismo criterio que 48H / 9:16): ver pureTokens.
    es: {
      videos_how_kicker: 'Proceso Ágil',
      videos_how_title: 'Cómo Funciona',
      videos_how_subtitle:
        'Un flujo de trabajo diseñado para que no pierdas ni un minuto de tu jornada laboral.',
      videos_how_step1_title: 'Envías tu material',
      videos_how_step1_body:
        'Eliges tu plan y nos envías tus grabaciones en bruto por Drive, WhatsApp o enlace, junto a tus instrucciones breves y referencias deseadas.',
      videos_how_step1_note: 'Sin complicaciones técnicas',
      videos_how_step2_title: 'Editamos con precisión',
      videos_how_step2_body:
        'Editamos tu contenido aplicando las especificaciones de tu plan: corte de pausas, subtítulos dinámicos legibles, audio optimizado y b-roll asistido.',
      videos_how_step2_note: 'Filtro de calidad humano',
      videos_how_step3_title: 'Recibes en 48 horas',
      videos_how_step3_body:
        'Recibes la primera versión en un máximo de 48 horas hábiles desde la recepción completa del material y las instrucciones para tu revisión.',
      videos_how_step3_note: 'Listo para publicar',
      videos_how_note_title: 'Aclaración:',
      videos_how_note_body:
        'Los cambios solicitados se aplican posterior a esta primera entrega, conforme a las rondas de revisión incluidas en tu plan.',
    },
    // Los 3 textos que son nodo suelto hermano del icono del paso (cloud_upload, tune, timer)
    // y el cuerpo de la nota final (texto suelto dentro del <p>, hermano del <span> "Aclaración:"):
    // el motor hace textContent =, asi que van en un <span data-i18n> NUEVO (sin class).
    wrapped: [
      'videos_how_step1_note',
      'videos_how_step2_note',
      'videos_how_step3_note',
      'videos_how_note_body',
    ],
    // La seccion no tiene NI UN <strong>: nada que conservar. Por eso tampoco digitOf.
    strongKeys: [],
    fragments: [],
    whitelist: new Set([]),
    // El "48" de los pasos es literal en los 6 idiomas (no se convierte a 48h/48 horas).
    literals: {
      videos_how_step3_title: '48',
      videos_how_step3_body: '48',
    },
    // Los numeros de paso: no se traducen ni llevan clave.
    pureTokens: ['01', '02', '03'],
    mustInclude: ['Proceso Ágil', 'Cómo Funciona', 'Sin complicaciones técnicas', 'Aclaración:'],
    mustExclude: ['id="planes"', 'Trabajos adicionales', 'Preguntas Frecuentes'],
  },

  {
    name: 'cta',
    extract: extractCta,
    // La ultima <section> de <main>: el CTA propio de Stitch que se conserva (C6 lo vigila).
    markers: [CTA_MARKER],
    prefix: 'videos_cta_',
    keys: [
      'videos_cta_kicker',
      'videos_cta_title',
      'videos_cta_subtitle',
      'videos_cta_whatsapp',
      'videos_cta_compare',
      'videos_cta_footer',
    ],
    es: {
      videos_cta_kicker: 'Empecemos esta semana',
      videos_cta_title: 'Empieza hoy a publicar reels profesionales',
      videos_cta_subtitle:
        'Tú envías tu material y recibes la primera versión en un máximo de 48 horas desde que la entrega está completa. Deja la edición en nuestras manos.',
      videos_cta_whatsapp: 'Quiero cotizar por WhatsApp',
      videos_cta_compare: 'Comparar planes',
      videos_cta_footer: 'Servicio 100% online: trabajamos con negocios de todo el mundo',
    },
    // El <a> del boton WhatsApp tiene el icono (chat) como HIJO hermano del texto: el texto va
    // en un <span data-i18n> NUEVO. El <a> "#planes" ("Comparar planes") no tiene hijos: su
    // data-i18n va en el propio <a> (precedente: el CTA de los planes).
    wrapped: ['videos_cta_whatsapp'],
    strongKeys: [],
    fragments: [],
    whitelist: new Set([]),
    literals: { videos_cta_subtitle: '48', videos_cta_footer: '100%' },
    // EL acoplamiento por valor de esta seccion: "Quiero cotizar por WhatsApp" ya existe en el
    // hero. Clave propia por ocurrencia, pero la traduccion debe ser EXACTAMENTE la misma en
    // los 6 idiomas (misma guardia que P-LEVELS, pero por igualdad estricta: es la misma frase).
    guardPairs: [['videos_cta_whatsapp', 'videos_hero_cta_whatsapp']],
    mustInclude: ['Empecemos esta semana', 'Empieza hoy a publicar reels profesionales', 'Comparar planes'],
    mustExclude: ['id="como-funciona"', 'Preguntas Frecuentes', 'Proceso Ágil'],
  },

  {
    name: 'mobile',
    extract: extractMobile,
    // Fuera de <main>: el boton fijo movil, tras el footer-placeholder y antes del loader.
    markers: [MOBILE_MARKER],
    prefix: 'videos_mobile_',
    keys: ['videos_mobile_whatsapp'],
    // Texto ES = el de Stitch. OJO: es "Cotizar por WhatsApp", DISTINTO del "Quiero cotizar por
    // WhatsApp" del hero y del CTA: no hay reutilizacion de traduccion (frase distinta).
    es: {
      videos_mobile_whatsapp: 'Cotizar por WhatsApp',
    },
    // El <a> tiene el icono (chat) como hijo: el texto va en un <span data-i18n> NUEVO.
    wrapped: ['videos_mobile_whatsapp'],
    strongKeys: [],
    fragments: [],
    whitelist: new Set([]),
    // Icono, href y clases intactos (C5a/C5b los vigilan): el href es un placeholder de Stitch.
    pureTokens: ['https://wa.me/'],
    mustInclude: ['Cotizar por WhatsApp'],
    mustExclude: ['id="footer-placeholder"', '<section', '[LINK_WHATSAPP]'],
  },

  {
    name: 'extras',
    extract: extractExtras,
    // Seccion 7, entre #como-funciona y #preguntas-frecuentes. Marcador: comentario de Stitch,
    // unico (su tag <section> tambien lo es hoy, pero se usa el comentario por consistencia).
    markers: [EXTRAS_MARKER],
    prefix: 'videos_extras_',
    keys: [
      'videos_extras_kicker',
      'videos_extras_title',
      'videos_extras_subtitle',
      'videos_extras_card1_badge',
      'videos_extras_card1_title',
      'videos_extras_card1_body',
      'videos_extras_card1_footer',
      'videos_extras_card2_badge',
      'videos_extras_card2_title',
      'videos_extras_card2_body',
      'videos_extras_card2_footer',
      'videos_extras_card3_badge',
      'videos_extras_card3_title',
      'videos_extras_card3_body',
      'videos_extras_card3_footer',
      'videos_extras_card4_badge',
      'videos_extras_card4_title',
      'videos_extras_card4_body',
      'videos_extras_card4_footer',
    ],
    // Texto ES = el de Stitch, literal. OJO: la etiqueta de las 4 tarjetas es la MISMA frase
    // ("Cotización a medida"), pero P3 exige 1 ocurrencia por clave en videos.html: por eso son
    // 4 claves (precedente D1 del slice 7 con "Nivel X" x 6), coherentes por P-GUARD, no por
    // una clave compartida.
    es: {
      videos_extras_kicker: 'Servicios Complementarios',
      videos_extras_title: 'Trabajos adicionales cotizados por separado',
      videos_extras_subtitle:
        'Si requieres apoyo más allá de la edición de video, disponemos de soluciones a la medida con presupuesto individualizado según tus necesidades.',
      videos_extras_card1_badge: 'Cotización a medida',
      videos_extras_card1_title: 'Grabación en tu local',
      videos_extras_card1_body:
        'Contratación de personal para grabación presencial en Iquique y localidades de la Región de Tarapacá.',
      videos_extras_card1_footer: 'Presencial Tarapacá',
      videos_extras_card2_badge: 'Cotización a medida',
      videos_extras_card2_title: 'Publicación y Programación',
      videos_extras_card2_body:
        'Subida calendarizada de reels con copy, hashtags optimizados y portada en tus canales sociales.',
      videos_extras_card2_footer: 'Gestión de subida',
      videos_extras_card3_badge: 'Cotización a medida',
      videos_extras_card3_title: 'Manejo de Comunidad',
      videos_extras_card3_body:
        'Respuesta y filtro de comentarios y mensajes directos derivados de las publicaciones.',
      videos_extras_card3_footer: 'Moderación activa',
      videos_extras_card4_badge: 'Cotización a medida',
      videos_extras_card4_title: 'Videos 100% con IA',
      videos_extras_card4_body:
        'Creación integral de avatar, voz sintetizada y escenas íntegramente generadas por Inteligencia Artificial.',
      videos_extras_card4_footer: 'Producción sintética',
    },
    // Los 4 pies de tarjeta (videocam, calendar_month, forum, memory) son nodos de texto
    // HERMANOS del icono: poner el data-i18n en el <div> borraria el icono (textContent =),
    // asi que el texto va en un <span data-i18n> NUEVO (sin class).
    wrapped: [
      'videos_extras_card1_footer',
      'videos_extras_card2_footer',
      'videos_extras_card3_footer',
      'videos_extras_card4_footer',
    ],
    // La seccion no tiene NI UN <strong> (verificado): nada que conservar. Por eso tampoco digitOf.
    strongKeys: [],
    fragments: [],
    whitelist: new Set([]),
    // El "%" de "Videos 100% con IA" queda literal en los 6 idiomas (mismo criterio que el "48").
    literals: { videos_extras_card4_title: '100%' },
    // La unica reutilizacion de este slice: las 4 etiquetas son la misma frase, asi que su
    // traduccion debe ser EXACTAMENTE la misma en los 6 idiomas (no se retraduce 4 veces).
    guardPairs: [
      ['videos_extras_card2_badge', 'videos_extras_card1_badge'],
      ['videos_extras_card3_badge', 'videos_extras_card1_badge'],
      ['videos_extras_card4_badge', 'videos_extras_card1_badge'],
    ],
    mustInclude: [
      'Servicios Complementarios',
      'Trabajos adicionales cotizados por separado',
      'Producción sintética',
    ],
    mustExclude: ['id="preguntas-frecuentes"', 'Claridad Absoluta', 'id="como-funciona"'],
  },

  {
    name: 'faq',
    extract: extractFaq,
    // Seccion 8, la ULTIMA de contenido. Marcador: comentario de Stitch, unico; P4 lo vigila.
    markers: [FAQ_MARKER],
    prefix: 'videos_faq_',
    keys: [
      'videos_faq_kicker',
      'videos_faq_title',
      'videos_faq_subtitle',
      'videos_faq_q1_title',
      'videos_faq_q1_strong',
      'videos_faq_q1_body',
      'videos_faq_q2_title',
      'videos_faq_q2_body',
      'videos_faq_q3_title',
      'videos_faq_q3_body',
      'videos_faq_q4_title',
      'videos_faq_q4_body',
      'videos_faq_q5_title',
      'videos_faq_q5_body',
      'videos_faq_q6_title',
      'videos_faq_q6_pre',
      'videos_faq_q6_strong',
      'videos_faq_q6_post',
      'videos_faq_q7_title',
      'videos_faq_q7_body',
    ],
    // Texto ES = el de Stitch, literal (P9 lo verifica byte a byte). Los "01".."07" de las
    // preguntas NO se traducen (tokens puros, criterio del PLAN y del slice 8).
    es: {
      videos_faq_kicker: 'Claridad Absoluta',
      videos_faq_title: 'Preguntas Frecuentes',
      videos_faq_subtitle:
        'Respuestas directas a las dudas habituales antes de iniciar tu servicio de edición.',
      videos_faq_q1_title: '¿Tengo que grabar los videos?',
      videos_faq_q1_strong: 'Sí.',
      videos_faq_q1_body:
        'El cliente entrega el material en bruto grabado desde su celular o cámara. El servicio de grabación presencial en Iquique se cotiza de manera independiente si no cuentas con tiempo para hacerlo.',
      videos_faq_q2_title: '¿Qué se considera una ronda de revisión?',
      videos_faq_q2_body:
        'Se consideran cambios menores sobre la primera versión entregada (ajuste de ortografía en subtítulos, volumen de música o corte de un segundo específico). Cambios de concepto completo, re-estructuración de guion o el envío de nuevo material grabado se cotizan aparte.',
      videos_faq_q3_title: '¿Publican los videos por mí?',
      videos_faq_q3_body:
        'No está incluido en el precio base de edición. Te entregamos el archivo MP4 optimizado listo para subir. Si deseas que programemos y publiquemos por ti con portadas y copys, se puede cotizar como servicio adicional.',
      videos_faq_q4_title: '¿Responden comentarios o mensajes de mis redes?',
      videos_faq_q4_body:
        'No está incluido en el plan de edición. El community management y atención de consultas puede cotizarse por separado con horarios y alcance predefinidos.',
      videos_faq_q5_title: '¿Incluyen videos generados completamente con IA?',
      videos_faq_q5_body:
        'No. Nuestros planes utilizan IA como asistencia técnica de montaje y pequeños clips de b-roll ilustrativo. La creación de videos 100% generados con IA (voces clonadas y avatares) se presupuesta tras evaluar tu requerimiento específico.',
      videos_faq_q6_title: '¿Cuándo comienza a correr el plazo de 48 horas?',
      videos_faq_q6_pre:
        'Comienza a contar desde el momento exacto en que recibimos todos los archivos brutos y las instrucciones completas acordadas. La entrega en 48 horas hábiles corresponde a la',
      videos_faq_q6_strong: 'primera versión editable',
      videos_faq_q6_post: 'para tu revisión.',
      videos_faq_q7_title: '¿Incluye grabación, traslados o inversión publicitaria?',
      videos_faq_q7_body:
        'No. Estos ítems son ajenos a la edición de video digital y se gestionan como presupuestos independientes según cada cliente.',
    },
    // Las 7 preguntas van dentro de un <h4> que YA tiene un hijo (el <span> del numero), y
    // q1_body/q6_pre/q6_post dentro de un <p> que tiene un <strong> hijo: el motor hace
    // textContent = y los borraria, asi que el texto va en un <span data-i18n> NUEVO (sin class).
    wrapped: [
      'videos_faq_q1_title',
      'videos_faq_q2_title',
      'videos_faq_q3_title',
      'videos_faq_q4_title',
      'videos_faq_q5_title',
      'videos_faq_q6_title',
      'videos_faq_q7_title',
      'videos_faq_q1_body',
      'videos_faq_q6_pre',
      'videos_faq_q6_post',
    ],
    // Los 2 <strong> de la seccion son DESNUDOS (sin class): su data-i18n matchea P-STRONG.
    strongKeys: ['videos_faq_q1_strong', 'videos_faq_q6_strong'],
    // Los 5 textos que NO son una frase completa. Si uno quedara vacio, el motor hace
    // `if (translations[key])` y el espanol sobreviviria mezclado con el idioma elegido.
    fragments: [
      'videos_faq_q1_strong',
      'videos_faq_q1_body',
      'videos_faq_q6_pre',
      'videos_faq_q6_strong',
      'videos_faq_q6_post',
    ],
    digitOf: { videos_faq_q6_pre: '48' },
    // El "48" y el "100%" quedan literales en los 6 idiomas (mismo criterio que how/extras).
    literals: {
      videos_faq_q6_title: '48',
      videos_faq_q6_pre: '48',
      videos_faq_q5_body: '100%',
    },
    // Los numeros de pregunta: no se traducen ni llevan clave.
    pureTokens: ['01', '02', '03', '04', '05', '06', '07'],
    // Decision de Fase A #1: "community management" se traduce reutilizando el termino ya
    // fijado en la tarjeta "Manejo de Comunidad" (slice 9), no se retraduce. Va por `includes`
    // y sin 'es' porque el texto ES lo fija Stitch (P8a/P8b): en espanol la frase conserva
    // "community management" aunque la tarjeta diga "Manejo de Comunidad".
    reusedTerms: [['videos_faq_q4_body', 'videos_extras_card3_title']],
    whitelist: new Set([]),
    mustInclude: ['Claridad Absoluta', 'Preguntas Frecuentes', 'Respuestas directas'],
    mustExclude: ['id="como-funciona"', 'id="planes"', 'Producción sintética'],
  },
];

const D = Object.fromEntries(SECTIONS.map((d) => [d.name, d]));
const UNION = new Set(SECTIONS.flatMap((d) => d.keys));
// Claves de i18n que NO pertenecen a una seccion de videos.html: el item del navbar
// compartido (slice 11). Viven en los mismos 6 JSON, asi que G1/G2/G5 tienen que contarlas
// o acusan "claves que no declara ninguna seccion" / "faltan claves".
const NAV_KEYS = ['nav_videos'];

// Extraccion perezosa: si un marcador se rompe, el throw falla solo los tests que tocan
// esa seccion en vez de tumbar el archivo entero al importarlo.
const secCache = new Map();
function secOf(d, html = V) {
  const key = d.name + (html === V ? '' : ':base');
  if (!secCache.has(key)) secCache.set(key, d.extract(html));
  return secCache.get(key);
}

// La seccion de la base con el copy v2 aplicado: reemplazo LITERAL del texto viejo por el
// nuevo, que es exactamente lo que hace el slice en el HTML (texto plano, sin entidades ni
// saltos de linea adentro). Sin esta capa, P8b/P9 exigirian el copy de Stitch y las claves
// aprobadas serian imposibles. Para el resto de las claves devuelve la base tal cual, asi
// que no relaja nada.
const secBaseCache = new Map();
function secBaseV2(d) {
  if (!secBaseCache.has(d.name)) {
    let s = secOf(d, VBASE);
    for (const k of d.keys) {
      const o = COPY_V2[k];
      if (!o) continue;
      // .replace() cambia solo la PRIMERA ocurrencia: si el texto viejo estuviera repetido
      // dentro de la seccion, el override quedaria a medias y P9 fallaria por una razon
      // enganosa. Hoy cada uno aparece exactamente 1 vez (verificado).
      assert.equal(
        count(s, o.old),
        1,
        `${d.name}: el texto viejo de "${k}" aparece ${count(s, o.old)} veces en la base (se esperaba 1)`,
      );
      s = s.replace(o.old, o.new);
    }
    // Los tokens puros (precio mensual, sin clave i18n) van por la misma logica, pero se
    // buscan por su literal: se aplican solo a la seccion que los contiene.
    for (const [oldT, newT] of Object.entries(COPY_V2_TOKENS)) {
      if (!s.includes(oldT)) continue;
      assert.equal(
        count(s, oldT),
        1,
        `${d.name}: el token viejo ${oldT} aparece ${count(s, oldT)} veces en la base (se esperaba 1)`,
      );
      s = s.replace(oldT, newT);
    }
    secBaseCache.set(d.name, s);
  }
  return secBaseCache.get(d.name);
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
    const original = visibleText(secBaseV2(d));
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
    const b = norm(secBaseV2(d));
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
    test(`${d.name} P-LITERALS los literales (precios, monedas y marcas) quedan literales en los 6 idiomas`, () => {
      for (const l of LANGS) {
        for (const [k, lit] of Object.entries(d.literals)) {
          assert.ok(String(J[l][k]).includes(lit), `${l}.json: "${k}" perdio el literal ${lit} al traducirse`);
        }
      }
    });
  }

  if (d.levelOfPlan) {
    test(`${d.name} P-LEVELS los ${d.levelOfPlan.length} niveles reutilizan el nombre de plan de su tarjeta`, () => {
      // El unico assert de este archivo que compara el valor de una seccion con el de OTRA:
      // es la guardia que impide retraducir el nivel (D3 de Fase A). Tolerante al orden y a la
      // puntuacion del rotulo (includes), estricta con el nombre del plan.
      for (const l of LANGS) {
        for (const [k, titleKey] of d.levelOfPlan) {
          const v = J[l][k];
          assert.equal(typeof v, 'string', `${l}.json: "${k}" no es string (o falta)`);
          const nombre = J[l][titleKey].replace(PLAN_WORD[l], '').trim();
          assert.ok(
            nombre.length > 1,
            `${l}.json: "${titleKey}" no trae la palabra de plan esperada (${PLAN_WORD[l]}): ${J[l][titleKey]}`,
          );
          assert.ok(
            v.includes(nombre),
            `${l}.json: "${k}" (${v}) no reutiliza el nombre de "${titleKey}" (${nombre}): el nivel se retradujo`,
          );
        }
      }
    });
  }

  if (d.guardPairs?.length) {
    test(`${d.name} P-GUARD los ${d.guardPairs.length} pares reutilizan la traduccion EXACTA (no se retraducen)`, () => {
      // Guardia de coherencia entre secciones (hermana de P-LEVELS): la misma frase con clave
      // propia por ocurrencia debe tener el MISMO valor en los 6 idiomas. Aqui va por igualdad
      // estricta (no `includes`): es literalmente la misma frase, no un rotulo compuesto.
      for (const l of LANGS) {
        for (const [a, b] of d.guardPairs) {
          assert.equal(
            J[l][a],
            J[l][b],
            `${l}.json: "${a}" (${J[l][a]}) y "${b}" (${J[l][b]}) deben ser identicos: es la misma frase, no se retraduce`,
          );
        }
      }
    });
  }

  if (d.reusedTerms?.length) {
    test(`${d.name} P-REUSE los ${d.reusedTerms.length} terminos reutilizan la traduccion de su seccion de origen`, () => {
      // Hermana de P-GUARD/P-LEVELS, pero por `includes` y SIN 'es': el texto espanol lo fija
      // Stitch (P8a/P8b), asi que solo se vigila que las 5 traducciones no inventen un termino
      // propio para un concepto ya traducido en otra seccion.
      for (const l of LANGS.filter((x) => x !== 'es')) {
        for (const [k, srcKey] of d.reusedTerms) {
          const term = J[l][srcKey];
          assert.equal(typeof term, 'string', `${l}.json: "${srcKey}" no es string (o falta)`);
          assert.equal(typeof J[l][k], 'string', `${l}.json: "${k}" no es string (o falta)`);
          assert.ok(
            J[l][k].includes(term),
            `${l}.json: "${k}" (${J[l][k]}) no reutiliza el termino de "${srcKey}" (${term}): se retradujo`,
          );
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

  // Gated por .length, igual que strongKeys: un `fragments: []` declarado a proposito ("esta
  // seccion no tiene fragmentos") generaba un test vacuo que ademas crasheaba en digitOf.
  if (d.fragments?.length) {
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
  const esperadas = new Set([...baseKeys, ...UNION, ...NAV_KEYS]);
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
    assert.deepEqual(added.sort(), [...UNION, ...NAV_KEYS].sort(), `${l}.json: las claves agregadas no son las de los descriptores`);
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

test('G-COPYV2 (copy v2) la tabla de divergencias es exactamente la declarada y describe cambios reales', () => {
  assert.deepEqual(
    Object.keys(COPY_V2).sort(),
    [...COPY_V2_KEYS].sort(),
    'COPY_V2 y COPY_V2_KEYS se separaron: agregar una divergencia exige tocar la lista explicita',
  );
  assert.equal(COPY_V2_KEYS.length, 11, 'el contrato declara 11 claves con clave i18n, ni una mas');
  const secciones = new Set();
  for (const [k, o] of Object.entries(COPY_V2)) {
    const d = SECTIONS.find((s) => s.keys.includes(k));
    assert.ok(d, `"${k}" no pertenece a ninguna seccion de videos.html`);
    assert.ok(UNION.has(k), `"${k}" no esta en UNION: no es una clave visible de la pagina`);
    // Una sola fuente de verdad del texto nuevo: el contrato ES del descriptor. Si los dos
    // se separan, P8a ya falla; esto lo dice con un mensaje claro.
    assert.equal(o.new, d.es[k], `el "new" de "${k}" y d.es["${k}"] se separaron`);
    assert.notEqual(o.old, o.new, `"${k}": old y new son iguales, no hay divergencia que declarar`);
    const base = visibleText(secOf(d, VBASE));
    // El "viejo" tiene que existir de verdad: sin esto, la tabla podria blanquear un texto
    // inventado declarando un "viejo" que nunca estuvo.
    assert.ok(base.includes(o.old), `"${k}": el texto viejo no esta en la base 8a5fa69`);
    // Y el "nuevo" NO puede estar ya en la base: si estuviera, no habria divergencia.
    assert.ok(!base.includes(o.new), `"${k}": el texto nuevo YA estaba en la base: no es una divergencia`);
    secciones.add(d.name);
  }
  // Los tokens puros declarados (slice 13): mismos requisitos, pero se validan contra el
  // HTML crudo porque no tienen clave ni d.es contra el cual contrastar.
  const tokens = Object.entries(COPY_V2_TOKENS);
  assert.equal(tokens.length, 2, `el slice 13 declara 2 tokens puros, hay ${tokens.length}`);
  for (const [oldT, newT] of tokens) {
    assert.notEqual(oldT, newT, `"${oldT}": old y new son iguales, no hay divergencia que declarar`);
    assert.equal(count(VBASE, oldT), 1, `"${oldT}": el token viejo no aparece 1 vez en la base 8a5fa69`);
    assert.ok(!VBASE.includes(newT), `"${newT}": el token nuevo YA estaba en la base: no es una divergencia`);
    assert.ok(PURE_TOKENS_FILEWIDE.has(newT), `"${newT}": el token nuevo no esta declarado como token puro (P-PURE/G-COVERAGE)`);
  }
  assert.equal(
    Object.keys(COPY_V2).length + tokens.length,
    13,
    'el contrato de copy v2 son 13 divergencias (11 claves + 2 tokens), ni una mas',
  );
  // Anti-vacuidad: el override tiene que cambiar de verdad la base de cada seccion tocada.
  // Si la tabla quedara vacia o el .replace() no mordiera, P9 pasaria sin vigilar nada.
  assert.equal(secciones.size, 6, `el copy v2 deberia tocar 6 secciones, toca ${secciones.size}`);
  for (const name of secciones) {
    assert.notEqual(
      secBaseV2(D[name]),
      secOf(D[name], VBASE),
      `el override del copy v2 no cambio la base de "${name}"`,
    );
  }
});

// --- coherencia de precios (slice 13, 2026-10-13) -----------------------------
// Decision de negocio de Pablo: el precio por reel BAJA al subir de plan. La tarifa mensual
// tiene que ser exactamente reels x precio por reel, y el precio por reel estrictamente
// decreciente. Lee las dos magnitudes del HTML (los 3 tokens puros del precio mensual y los
// 3 spans con clave del precio por reel) y de es.json, y las cruza: si el HTML y el JSON se
// separan, lo dice.
const MONTHLY_HTML = /class="font-display-md[^"]*">\$([\d.]+)<\/span>/g;
const REEL_HTML = /data-i18n="videos_plans_p([123])_reel_price">([^<]*)</g;
// A CLP: "$210.000" -> 210000 y "12 reels al mes" -> 12. Ningun monto lleva decimales.
const clp = (s) => Number(String(s).replace(/[^\d]/g, ''));

test('G-PRICING los 3 planes cuadran (mensual = reels x reel) y el precio por reel decrece', () => {
  const mensuales = [...V.matchAll(MONTHLY_HTML)].map((m) => clp(m[1]));
  const reelHtml = [...V.matchAll(REEL_HTML)]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map((m) => clp(m[2]));
  const reelJson = [1, 2, 3].map((i) => clp(J.es[`videos_plans_p${i}_reel_price`]));
  const reels = [1, 2, 3].map((i) => clp(J.es[`videos_plans_p${i}_b1_n`]));
  // Anti-vacuidad: sin los 3 valores parseados de cada lado, el cuadre seria trivial.
  for (const [nombre, xs] of [
    ['mensual (HTML)', mensuales],
    ['por reel (HTML)', reelHtml],
    ['por reel (es.json)', reelJson],
    ['reels (es.json)', reels],
  ]) {
    assert.equal(xs.length, 3, `${nombre}: se esperaban 3 valores, hay ${xs.length}`);
    assert.ok(xs.every((x) => Number.isFinite(x) && x > 0), `${nombre}: algun valor no parseo: ${xs.join(', ')}`);
  }
  for (let i = 0; i < 3; i++) {
    assert.equal(
      reelHtml[i],
      reelJson[i],
      `plan p${i + 1}: el precio por reel del HTML (${reelHtml[i]}) no coincide con es.json (${reelJson[i]})`,
    );
    assert.equal(
      mensuales[i],
      reels[i] * reelJson[i],
      `plan p${i + 1}: el mensual ${mensuales[i]} no es ${reels[i]} reels x ${reelJson[i]}`,
    );
  }
  assert.ok(
    reelJson[0] > reelJson[1] && reelJson[1] > reelJson[2],
    `el precio por reel debe decrecer p1 > p2 > p3: ${reelJson.join(' > ')}`,
  );
});

// Copy v2 (2026-10-13): la landing ya no vende nicho ni localismo. Se escanean SOLO las
// claves visibles de videos.html (UNION + navbar), no es.json entero: index.html y casos.html
// tienen claves legitimas con "Iquique" (diff_1, casos_case2_*).
// No hay lista blanca a proposito: las excepciones aprobadas (grabacion presencial en
// Iquique/Tarapaca de extras_card1_body, extras_card1_footer y faq_q1_body, y la moneda CLP
// de los precios) simplemente NO son alcanzadas por estos patrones.
const NICHO = [
  /profesionales de servicios/i,
  /\bchile\b/i,
  /chileno/i,
  /pesos chilenos/i,
];

test('G-NICHO ninguna clave visible de videos.html vende "profesionales de servicios", Chile ni pesos chilenos', () => {
  const ks = [...UNION, ...NAV_KEYS];
  assert.ok(ks.length > 100, `el escaneo solo vio ${ks.length} claves: el guard seria vacuo`);
  for (const k of ks) {
    assert.equal(typeof J.es[k], 'string', `es.json: "${k}" no es string (o falta)`);
    for (const re of NICHO) {
      assert.doesNotMatch(J.es[k], re, `es.json: "${k}" reintroduce copy local/nicho: ${J.es[k]}`);
    }
  }
});

test('G-FILEWIDE videos.html conserva los conteos globales del slice 1 (iconos, WhatsApp, class)', () => {
  // Los conteos por seccion los implica P9 byte a byte; estos son de TODO el archivo.
  for (const t of ['material-symbols-outlined', '[LINK_WHATSAPP]', 'href="https://wa.me/"', 'class="']) {
    assert.equal(count(V, t), count(VBASE, t), `cambio la cantidad de ${JSON.stringify(t)} en videos.html`);
  }
});

// Los UNICOS textos de <body> que pueden quedar sin data-i18n: tokens numericos o de formato
// puros (documentados en el PLAN y en los pureTokens de cada descriptor) y el separador "/".
// Todo lo demas es deuda de i18n. Esta es la lista COMPLETA del archivo, no la de una seccion.
const PURE_TOKENS_FILEWIDE = new Set([
  // precios grandes de las tarjetas de plan, sin palabras alrededor (slices 5/6/13)
  '$80.000', '$150.000', '$210.000',
  // precios de trabajos individuales (slice 7) + la moneda que los sigue
  '$22.000', '$30.000', '$40.000', '$45.000', '$65.000', '$90.000', 'CLP',
  // formatos y metricas de los mockups del hero (slice 2), con su separador
  '48H', '9:16', '0:42', '0:60', '/', '1.8k', '94', '210',
  // numeros de paso (slice 8) y de pregunta (slice 10)
  '01', '02', '03', '04', '05', '06', '07',
]);

test('G-COVERAGE no queda texto visible en el body sin data-i18n (salvo los tokens puros documentados)', () => {
  const { text, covered, removed, icons } = uncoveredBodyText(V);
  // Si estos dos no coinciden, algun elemento con data-i18n tiene hijos y el regex no lo
  // borro: sin este assert, su texto apareceria como "no cubierto" o (peor) no apareceria.
  assert.equal(removed, covered, 'el borrado no cubrio todos los data-i18n del body: alguno tiene hijos');
  assert.ok(covered > 100, `solo se encontraron ${covered} data-i18n en el body: el escaneo no leyo la pagina`);
  assert.ok(icons > 0, 'no se encontro ningun icono: el regex de spans de icono dejo de matchear');
  const fuera = [...new Set(text.split(' '))].filter((t) => t && !PURE_TOKENS_FILEWIDE.has(t));
  assert.deepEqual(
    fuera,
    [],
    `estos textos del body no tienen data-i18n y no son tokens puros (${fuera.length}):\n  ${fuera.join(' ')}`,
  );
  // Anti-vacuidad por el otro lado: el escaneo tiene que llegar a ver el body.
  assert.ok(text.length > 0, 'no sobrevivio ni un token puro: el escaneo devolvio texto vacio');
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
  const esperadas = new Set([...Object.keys(JBASE.es), ...UNION, ...NAV_KEYS]);
  for (const l of LANGS) {
    const res = await fetch(`${srv.base}/i18n/${l}.json`);
    assert.equal(res.status, 200, `${l}.json no responde 200`);
    const parsed = await res.json();
    assert.equal(Object.keys(parsed).length, esperadas.size, `${l}.json servido llego incompleto`);
    for (const k of [...UNION, ...NAV_KEYS]) {
      assert.equal(typeof parsed[k], 'string', `${l}.json servido no trae "${k}" como string`);
    }
  }
});
