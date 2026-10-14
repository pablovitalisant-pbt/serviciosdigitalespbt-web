# Plan: Landing de Edicion de Video (videos.html)

Documento del Director Tecnico. Fuente de verdad para los slices de esta landing.

## Regla principal (decision de Pablo, no negociable)

`videos.html` ES la pagina de Stitch, copiada byte a byte desde
`C:\Users\pablo\Downloads\stitch_servicios_digitales_pbt_landing_page\code.html`.
NO se usa template.html. NO se rehace, NO se reestiliza, NO se reordena nada.
Los UNICOS cambios permitidos son:

1. Menu: el `<header>` propio de Stitch se reemplaza por el navbar compartido (`components/navbar.html`).
2. Footer: el `<footer>` propio de Stitch se reemplaza por el footer compartido (`components/footer.html`).
3. Multilingue: todo texto visible pasa a ser traducible en los 6 idiomas (es, en, hi, zh, ur, ko).
4. Copy v2 (slices 12-13, 2026-10-13): excepcion ACOTADA Y CERRADA — solo los 9 textos
   y los 4 precios listados en la seccion "Copy v2" mas abajo. No habilita editar nada mas.
5. Links de WhatsApp (slice 14, 2026-10-13): excepcion ACOTADA Y CERRADA — solo los 8
   atributos `href` listados en la seccion "Slice 14" mas abajo. Ningun otro `href` de la
   pagina, y ningun texto, clase ni estructura. No habilita editar nada mas.
6. Rediseno de conversion (slices 16-20, 2026-10-13): decision de Pablo. La landing pasa a
   ser el index y se orienta a compra: CTA unico "Quiero mi Pack de Reels", botones de compra
   verdes (#15803d) con brillo, sin navbar, "cotiza" -> "compra", carrusel de reels en el hero.
   Las secciones rediseñadas (hero, cierre, barra movil) llevan `redesigned` en su descriptor
   y dejan de compararse byte a byte con Stitch (P8b/P9); las vigilan los tests de su slice.

Cualquier otro cambio (estilos, textos, links, estructura, head, clases) esta PROHIBIDO.
Si algo parece roto en el diseno de Stitch, se reporta, no se corrige.

## Hechos verificados del sistema

- Navbar y footer se inyectan por fetch en `<div id="navbar-placeholder">` y `<div id="footer-placeholder">`.
  Patron de referencia: `casos.html` (script de carga inline lineas 113-165, motor `initI18n` lineas 399-507).
- `components/footer.html` contiene 3 cosas: `section#contacto` (CTA generico), `<footer>` y el portal `#lang-menu`.
  Sin el footer cargado, el selector de idioma del navbar NO funciona.
- Pablo decidio mantener el CTA final de Stitch (es especifico de esta oferta).
  Por lo tanto, en videos.html el `section#contacto` del footer compartido se OCULTA tras cargarlo
  (en el callback del footer, igual que casos.html hace su override). `<footer>` y `#lang-menu` se conservan.
- `initI18n` vive inline en cada pagina (no esta en shared.js). videos.html debe incluir el mismo motor que casos.html, sin modificarlo.
- El motor hace `el.textContent = translations[key]`: BORRA los hijos del elemento.
  Nunca poner data-i18n en un elemento que tenga iconos u otros hijos; envolver solo el texto en `<span data-i18n="...">`.
- Componentes se cargan por fetch: probar siempre por HTTP local (`python -m http.server`), nunca file://.
- Los 8 botones de WhatsApp de Stitch (`[LINK_WHATSAPP]` x7 y el `https://wa.me/` vacio del
  boton fijo movil) quedaron RESUELTOS en el slice 14: abren el chat con +56920948874 con
  mensaje prellenado (ver "Slice 14" mas abajo).

## Reglas i18n

- Prefijo de claves: `videos_`.
- No se traducen: atributos `data-alt` (no visibles), URLs/href, ni tokens numericos o de formato puros (48H, 9:16, 0:42 / 0:60, 1.8k, 94, 210). Frases que contienen numeros si se traducen, con el numero literal.
- Los JSON de i18n/ tienen BOM, CRLF, 2 espacios y no llevan salto final tras `}`: preservar exactamente.
- Comando de tests: `node --test "tests/*.test.mjs"` (`node --test tests/` falla en Node 22).
- Al probar en navegador tras cambiar los JSON, forzar recarga: el navegador cachea i18n/*.json y muestra claves viejas.
- Cada clave en los 6 JSON de `i18n/`. Solo se AGREGAN claves; nunca se modifican ni borran las existentes.
- El texto en espanol del HTML y el valor en es.json deben ser identicos al texto de Stitch.
- Nombres de plan (Económica / Equilibrada / Premium) SE TRADUCEN (decision de Fase A del
  slice 5, `videos_plans_p1_title` / `videos_plans_p2_title` / `videos_plans_p3_title`).
  El slice 7 ("Nivel Económica/Equilibrada/Premium", seccion 5) DEBE reutilizar
  EXACTAMENTE las mismas traducciones que fije el slice 5/6: no se retraduce el nivel.
- Bullets con `<strong>` adentro: no se puede poner `data-i18n` en el contenedor (el motor
  hace `textContent =` y borraria la negrita), asi que se fragmenta con `<span data-i18n>`
  sin class y el `<strong>` conserva su elemento con su propio `data-i18n`. CRITICO: el
  motor hace `if (translations[key])`, asi que un valor `""` NO se aplica y deja el espanol
  a la vista; ningun fragmento puede quedar vacio ni con solo espacios en ningun idioma.
- Probar en ES, EN, UR (RTL) y KO o ZH.

## Feature flag

Sitio estatico sin `config/feature-flags.json`. Flag efectivo: videos.html NO se enlaza desde el navbar hasta el slice final.
No crear infraestructura de flags.

## Slices (max 200 lineas cada uno, sin contar lineas movidas)

| # | Alcance | Lineas de Stitch originales |
|---|---------|-----------------------------|
| 1 | Reemplazar header y footer de Stitch por placeholders + script de carga (con ocultamiento de section#contacto) + motor initI18n igual a casos.html | header (linea 2), footer (linea 815) |
| 2 | i18n Hero | 6-134 |
| 3 | i18n "Tu tiempo vale mas..." | 135-205 |
| 4 | i18n "Que incluye el servicio" | 206-292 |
| 5 | i18n Planes parte 1 | 293-~375 |
| 6 | i18n Planes parte 2 | ~376-456 |
| 7 | i18n "Prefieres probar..." | 457-539 |
| 8 | i18n Como funciona + CTA final + boton fijo movil | 540-618, 786-814 |
| 9 | i18n Trabajos adicionales | 619-696 |
| 10 | i18n Preguntas frecuentes | 697-785 |
| 11 | Navbar: item `nav_videos` -> videos.html (desktop + movil) + 6 JSON | components/navbar.html |
| 12 | Copy v2: reposicionamiento a "negocios de todo rubro" + servicio 100% online (9 textos) | 17, 26, 144, 158, 191, 193, 249, 301, 810 |
| 13 | Precios de planes p2/p3 (el precio por reel baja al subir de plan) + guardia G-PRICING | 362, 365, 407, 410 |
| 14 | Links de WhatsApp: los 7 `[LINK_WHATSAPP]` + el `https://wa.me/` vacio pasan a abrir el chat con mensaje prellenado (8 `href`) + guardia G-WHATSAPP | 37, 346, 395, 440, 494, 523, 800, 815 |
| 15 | SEO: `<title>` de videos.html (Stitch no lo genero) | head (linea 1) |

Numeros de linea referidos al archivo original de Stitch; tras el slice 1 cambian. Ubicar por titulo de seccion.

## Reglas de proceso

- Ciclo PBT-IA completo (Fases A-D) por slice.
- Sin commits. Pablo aprueba commits.
- No tocar archivos fuera del alcance del slice. components/navbar.html y components/footer.html solo se tocan en el slice 11.

## Copy v2 (slice 12, 2026-10-13)

Decision de negocio de Pablo: la landing deja de apuntar a "profesionales de servicios"
(medicos, abogados, esteticistas) **en Chile** y pasa a apuntar a **negocios de
cualquier rubro**, con el servicio ofrecido **100% online a todo el mundo**.

Esto es una excepcion deliberada a la "Regla principal": el copy ES deja de ser el de
Stitch en estos 9 textos y solo en estos 9. Cerrada por ambos lados:

- **Negativo**: `G-NICHO` falla si cualquier clave visible de videos.html vuelve a
  mencionar "profesionales de servicios", "Chile", "chileno" o "pesos chilenos".
- **Positivo**: `G-COPYV2` falla si la tabla de divergencias crece, si `new` deja de
  coincidir con `d.es[k]`, si `old` no existe en la base `8a5fa69`, o si `new` ya
  estuviera en ella. La unica via para blanquear una divergencia es escribirla a mano
  en `COPY_V2` (tests/i18n-sections.test.mjs).

| Clave | Texto v2 (ES) |
|-------|---------------|
| `videos_hero_badge` | Edición de reels para negocios que quieren vender en redes |
| `videos_hero_subtitle` | Ya sea que vendas productos, servicios o experiencias, tú entregas tus grabaciones en bruto y recibes reels editados listos para publicar. Primera versión en un máximo de 48 horas tras recibir todo el material e instrucciones. |
| `videos_problem_subtitle` | Tiendas, mayoristas, gimnasios, centros de estética, inmobiliarias, agencias de turismo, salas de eventos, consultas y oficinas: todos saben que tienen que estar activos en redes. El obstáculo nunca es la cámara: es perder horas valiosas cortando silencios, afinando subtítulos y buscando música sin derechos. |
| `videos_problem_block1_body` | Grabas un video en 5 minutos entre una venta y otra, pero terminas perdiendo todo el fin de semana probando filtros, sincronizando subtítulos y exportando videos que no quedan como imaginabas. |
| `videos_problem_block3_title` | Enfócate en tu negocio |
| `videos_problem_block3_body` | Tú te dedicas a vender, atender y hacer crecer tu negocio sin desviarte de lo que genera ingresos reales. Nosotros nos encargamos de que tu material crudo se convierta en reels impecables que atraigan nuevos clientes. |
| `videos_includes_card2_body` | Cortes de silencios y tiempos muertos, eliminación de titubeos, estabilización y el mejor ritmo para mostrar lo que ofreces. |
| `videos_plans_subtitle` | Precios transparentes. Sin contratos forzosos ni letras chicas. |
| `videos_cta_footer` | Servicio 100% online: trabajamos con negocios de todo el mundo |

Menciones locales que **sobreviven a proposito** (no las cubre `G-NICHO`): grabacion
presencial en `videos_extras_card1_body` / `videos_extras_card1_footer` /
`videos_faq_q1_body`, y la moneda CLP en los valores de precio. Lo presencial sigue
siendo la excepcion cotizable (`videos_includes_note_body`), no la regla.

Terminos en observacion, reportados y **no tocados**: `videos_faq_q4_body`
("atención de consultas") y `videos_problem_block2_body` ("editor profesional").

### Copy v2 — Precios (slice 13, 2026-10-13)

Decision de negocio de Pablo: el precio por reel debe **BAJAR** al subir de plan (comprar mas
reels sale mas barato por reel). Solo cambian 4 valores; reels sueltos y video largo NO se tocan.

| Plan | Mensual | Reels | Precio por reel |
|------|---------|-------|-----------------|
| p1 Economica | $80.000 (sin cambio) | 4 | $20.000 (sin cambio) |
| p2 Equilibrada | $200.000 -> **$150.000** | 8 | $25.000 -> **$18.750** |
| p3 Premium | $390.000 -> **$210.000** | 12 | $32.500 -> **$17.500** |

Regla que debe cumplirse siempre: **mensual = reels x precio por reel** (80.000=4x20.000,
150.000=8x18.750, 210.000=12x17.500, sin redondeo) y **precio por reel estrictamente
decreciente** (20.000 > 18.750 > 17.500). `G-PRICING` (tests/i18n-sections.test.mjs) la vigila
leyendo los 3 precios mensuales del HTML y los 2 textos de `reel_price` del HTML y de `es.json`.

Los 2 precios mensuales son tokens puros (sin clave i18n): su cambio se declara en
`COPY_V2_TOKENS`; los 2 textos `reel_price` (monto literal dentro de la frase traducida) en
`COPY_V2`. Esas son las unicas divergencias que `G-COPYV2` blanquea: P8b/P9 siguen comparando
byte a byte todo lo demas contra la base `8a5fa69`.

Lo mismo que el copy v2: excepcion acotada, no habilita tocar ningun otro precio ni texto.

## Slice 14 — Links de WhatsApp (2026-10-13)

Decision de negocio de Pablo: **todos** los botones de WhatsApp de la landing abren un chat
con **+56920948874** con un mensaje prellenado propio de cada boton. Los 8 botones son TODOS
los CTAs de WhatsApp visibles de la pagina: el unico boton de WhatsApp del footer compartido
(`section#contacto`) esta oculto en `videos.html` (invariante C11 del slice 1), asi que el
footer no necesita cambios. `casos.html` (2 links) e `index.html` (link armado por JS con
`encodeURIComponent`) quedan FUERA de alcance y sin mensaje prellenado.

Excepcion acotada: solo los 8 atributos `href`. No cambia ningun texto visible, clase,
`data-i18n`, `target` ni `rel` (los 8 ya traian `target="_blank"` y `rel="noopener noreferrer"`).

Base del link: `https://wa.me/56920948874?text=` + `encodeURIComponent(mensaje)`. Un solo
parametro, por eso **no aparece `&`**. `encodeURIComponent` codifica la coma (`%2C`), las
tildes (`%C3%B3`) y los espacios (`%20`), pero **NO** codifica `( ) ! ' * - . _ ~`: los
parentesis de "(N reels al mes)" quedan LITERALES en el href.

**Los hrefs NO se escriben a mano: se generan con `encodeURIComponent` desde el texto plano.**
La tabla de abajo es la fuente de verdad del TEXTO; el href es su encode.

| # | Boton (clave i18n) | Texto plano del mensaje |
|---|--------------------|-------------------------|
| 1 | Hero `videos_hero_cta_whatsapp` | `Hola, quiero cotizar la edición de reels para mi negocio.` |
| 2 | `videos_plans_p1_cta` (Elegir Económica) | `Hola, quiero contratar el Plan Económica (4 reels al mes).` |
| 3 | `videos_plans_p2_cta` (Elegir Equilibrada) | `Hola, quiero contratar el Plan Equilibrada (8 reels al mes).` |
| 4 | `videos_plans_p3_cta` (Elegir Premium) | `Hola, quiero contratar el Plan Premium (12 reels al mes).` |
| 5 | `videos_single_reel_cta` | `Hola, quiero cotizar un reel suelto.` |
| 6 | `videos_single_long_cta` | `Hola, quiero cotizar un video largo.` |
| 7 | CTA final `videos_cta_whatsapp` | `Hola, quiero cotizar la edición de reels para mi negocio.` |
| 8 | Barra fija movil `videos_mobile_whatsapp` | `Hola, quiero cotizar la edición de reels para mi negocio.` |

Decisiones de la Fase A (aprobadas por el Director Tecnico):

- Los mensajes van en **espanol fijo**, sin traducir en los 6 idiomas: son `href`, no texto
  visible, y `initI18n` solo escribe `textContent` (no atributos). Traducirlos exigiria tocar
  el motor, fuera de alcance.
- El mensaje por defecto se comparte a proposito en 3 botones (hero, CTA final, barra movil).
- El numero va en claro en 4 archivos + tests: es un numero de negocio publico ya publicado.

Mecanismo de blanqueo: la tabla `WA_CTA` de `tests/i18n-sections.test.mjs` (hermana de
`COPY_V2` / `COPY_V2_TOKENS`). Es la **unica via** para que P9/P8b dejen de exigir los
placeholders de la base `8a5fa69`, y `G-WHATSAPP` la vigila: destinatario unico y exactamente
8 hrefs, codificacion canonica (`encodeURIComponent(decodeURIComponent(v)) === v`), mapeo por
IDENTIDAD (clave i18n del `<a>` o de su `<span>` hijo, no por posicion: en `plansA` y `single`
el placeholder viejo es el mismo string dos veces y un cruce de mensajes pasaria inadvertido),
biyeccion mensajes HTML ↔ tabla, y coherencia plan/reels leyendo los reels de `es.json`
(cambiar los reels de un plan sin su mensaje rompe la guardia).

Como el copy v2 y los precios: excepcion acotada, no habilita tocar ningun otro link.

## Slice 15 — `<title>` SEO (2026-10-13)

Stitch no genero `<title>` para videos.html: la pestana mostraba la URL. Decision de Pablo:
agregar uno optimo para SEO.

Texto aprobado por el Director (exacto, no traducible):

```
Edición de Reels para Negocios | Servicios Digitales PBT
```

Decisiones de la Fase A:

- **Espanol fijo**, como `index.html` y `casos.html`, que tampoco traducen su `<title>`.
  `initI18n` solo escribe `textContent` de `[data-i18n]`; traducir el titulo de la pestana
  exigiria tocar el motor (fuera de alcance).
- **Unica adicion al head de Stitch.** Nada mas cambia: ni `meta description`, ni `og:`,
  ni el motor. Posicion aprobada: inmediatamente despues de `<meta charset="utf-8">`, para
  que el charset gane antes de que el parser lea los bytes no-ASCII (`ó`).
- 56 caracteres (<= 60, el corte de SERP).

Vigilancia: `C12b` de `tests/slice-1-videos.test.mjs` (1 solo `<title>` en todo el archivo,
texto exacto, <= 60 caracteres, contiene "Reels" y la marca, y va pegado al charset). `C12`
suma los conteos de `<meta>` (3) y `<link>` (5) del head de Stitch para que cualquier otra
adicion tenga que romper ahi.
