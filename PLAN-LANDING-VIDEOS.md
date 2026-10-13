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
- Cada clave en los 6 JSON de `i18n/`. Solo se AGREGAN claves; nunca se modifican ni borran las existentes.
- El texto en espanol del HTML y el valor en es.json deben ser identicos al texto de Stitch.
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

Numeros de linea referidos al archivo original de Stitch; tras el slice 1 cambian. Ubicar por titulo de seccion.

## Reglas de proceso

- Ciclo PBT-IA completo (Fases A-D) por slice.
- Sin commits. Pablo aprueba commits.
- No tocar archivos fuera del alcance del slice. components/navbar.html y components/footer.html solo se tocan en el slice 11.
