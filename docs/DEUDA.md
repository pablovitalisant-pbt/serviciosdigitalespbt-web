# Deuda tecnica - landing v2 de videos

Registro de pendientes que NO pertenecen al slice en curso.

## Slice de limpieza (post swap)

- **`.gitattributes` LF/CRLF**: git normaliza a CRLF en checkout (`core.autocrlf` de Windows)
  y avisa en cada commit. Definir `* text=auto eol=lf` (o por tipo: `*.html`, `*.css`, `*.js`,
  `*.mjs`, `*.json`, `*.md`) y renormalizar con `git add --renormalize .` en un commit aislado,
  sin cambios funcionales.

## Swap a videos.html (brief slice 9)

- Retirar/reescribir las suites viejas ancladas al videos.html de Stitch: `slice-1-videos`,
  `slice-16-cta`, `slice-18-sin-navbar`, `slice-19-carrusel`, `slice-21-hero-planes`,
  `slice-24-rutas`, `slice-25-mini-footer`, `i18n-sections`.
- Quitar `<meta name="robots" content="noindex, nofollow">` de la landing publicada.
- Poner `videos_v2` en `true` y enlazar desde `components/navbar.html`.
