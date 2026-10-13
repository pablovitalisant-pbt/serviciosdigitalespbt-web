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
4. Copy v2 (slice 12, 2026-10-13): excepcion ACOTADA Y CERRADA — solo los 9 textos
   listados en la seccion "Copy v2" mas abajo. No habilita editar ningun otro texto.

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
- Hay placeholders de Stitch sin resolver (`[LINK_WHATSAPP]`, `https://wa.me/` vacio). NO se tocan en estos slices (Pablo pidio solo menu, footer e idioma). Se reportan.

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
