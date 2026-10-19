# Bugs resueltos

Registro del protocolo de debugging (`~/.claude/PBT-IA-DEBUGGING.md`).

## 2026-10-19 — Hero 2b1: la tilde de "TU" pisaba "EDITAMOS" y el timecode pisaba el crop

- Tipo: A (visual)
- Causa raiz: `line-height:.9` uniforme en el H1 no reservaba el vuelo del acento; el HUD estaba en `top:20px`, dentro de la marca de crop (14-36px); `100dvh` sin respaldo para navegadores sin esa unidad; los medios del placeholder no tenian `object-fit:cover`.
- Fix aplicado: `.hero__line + .hero__line{margin-top:.16em}`, `.hero__hud{top:44px}`, `100vh` como respaldo de `100svh` en `body`/`#sala`/`.hero`, y `.ph-video` con `object-fit:cover` en `css/videos.css`. Tests H9-H11 en `tests/videos-brief-slice-2b1.test.mjs`.
- Zona fragil: SplitText (2b2) reemplaza los `.hero__line` y puede anular el margen de la tilde. Mantener H9 verde con el titular partido y validar visualmente.
- Commit: da6f1e2
