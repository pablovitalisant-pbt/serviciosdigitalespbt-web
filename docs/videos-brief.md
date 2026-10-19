# BRIEF - Landing /videos.html (Edicion de Video PBT)

Documento de direccion tecnica y de diseno. Lo ejecuta Claude Code en ciclos PBT-IA.
Reemplaza por completo el `videos.html` actual.

---

## 1. Concepto de identidad: "SALA DE EDICION"

La pagina se siente como estar adentro de un software de edicion en plena sesion.
El scroll es el "playhead": al bajar, el usuario literalmente avanza por una linea de tiempo.

Elementos de lenguaje visual propios (usar en toda la pagina):
- **Timecode vivo** `00:00:12:08` en una esquina, que avanza con el scroll.
- **Indicador REC** (punto que parpadea) junto al CTA.
- **Playhead**: linea vertical delgada que cruza secciones y marca el progreso.
- **Cortes duros**: las transiciones entre secciones son "cortes", no fundidos lentos.
- **Marcas de crop / safe area** (esquinas tipo visor de camara) enmarcando videos.
- **Barras de audio** (waveform) como separadores animados.

Tono: rapido, seguro, con ritmo. Nada de corporativo.

---

## 2. Paleta (tokens CSS en `:root`)

| Token | Hex | Uso |
|-------|-----|-----|
| `--ink` | `#0A0A0D` | Fondo principal |
| `--ink-2` | `#15151B` | Fondo de tarjetas / secciones alternas |
| `--bone` | `#F2EEE6` | Texto principal |
| `--mute` | `#8A8794` | Texto secundario, timecodes |
| `--signal` | `#D4FF3A` | Acento principal: CTA, playhead, highlights |
| `--uv` | `#7A5CFF` | Acento secundario: glow, gradientes |
| `--rec` | `#FF3D2E` | Solo indicador REC y "antes" en antes/despues |

Regla: `--signal` se usa con moderacion. Si todo es lima, nada destaca.
Grano de pelicula (noise SVG) sobre todo el fondo, opacidad 4-6%.

---

## 3. Tipografia (Google Fonts, licencia OFL, verificadas)

| Rol | Fuente | Pesos |
|-----|--------|-------|
| Display / titulares gigantes | **Unbounded** | 700, 900 |
| Texto / UI | **Inter Tight** | 400, 500, 700 |
| Timecodes, labels, etiquetas tecnicas | **JetBrains Mono** | 400, 600 |

- Titulares hero: `clamp(3.5rem, 12vw, 11rem)`, interlineado 0.9, mayusculas.
- Labels mono en mayusculas, tracking amplio, tamano chico.

---

## 4. Stack de animacion

- Base actual del sitio: HTML + Tailwind CDN + JS vanilla. Sin bundler.
- **GSAP** (core + ScrollTrigger + SplitText) via CDN jsDelivr. Gratis para uso comercial.
- **Lenis** (smooth scroll, MIT) via CDN, sincronizado con ScrollTrigger:
  `lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker.add(t => lenis.raf(t*1000))` + `gsap.ticker.lagSmoothing(0)`.
- Fijar versiones exactas en los `<script src>` (Claude Code las verifica en jsDelivr antes de usar).
- JS de la landing en archivo propio: `js/videos.js`. CSS propio: `css/videos.css`.

---

## 5. Secciones y efectos

Sin navbar (decision ya tomada). Un solo CTA repetido: WhatsApp.

### 5.0 Preloader "RENDER"
- Pantalla negra con contador mono `RENDERING 000% -> 100%` y barra lima.
- Al terminar: corte duro a la hero. Maximo 1.2 s. Se salta si ya se vio en la sesion.

### 5.1 Hero "PLAY"
- Video placeholder a pantalla completa con marcas de crop en las esquinas.
- Titular gigante que entra por lineas (SplitText, mascara desde abajo).
- Timecode vivo arriba a la derecha + indicador REC junto al CTA.
- Al hacer scroll, el video se encoge a una tarjeta centrada (scale + border-radius con scrub).
- CTA magnetico: el boton sigue levemente al cursor en desktop.

### 5.2 Marquee de formatos
- Cinta infinita: REELS - TIKTOK - SHORTS - YOUTUBE - PODCAST - ANUNCIOS.
- La velocidad y direccion reaccionan a la velocidad del scroll (lenis.velocity).

### 5.3 "El problema" (pin + reveal)
- Seccion fijada. Una frase grande cuyas palabras pasan de `--mute` a `--bone` con el scroll.
- Ejemplo de contenido: "Grabas. Subes. Nadie lo ve hasta el final."

### 5.4 Antes / Despues
- Dos videos placeholder superpuestos con divisor arrastrable (touch + mouse).
- Etiqueta `RAW` en `--rec` y `EDITADO` en `--signal`.
- Al entrar en viewport, el divisor hace un barrido automatico una vez para mostrar que se mueve.

### 5.5 Estilos de edicion (scroll horizontal)
- Seccion fijada; el scroll vertical desplaza una tira horizontal de 5-6 tarjetas de video.
- Cada tarjeta: video placeholder 9:16, nombre del estilo, tag mono.
- Hover desktop: el video hace play; en mobile, play al quedar centrado.
- Barra de progreso tipo timeline debajo de la tira.

### 5.6 Proceso (timeline que se dibuja)
- 4 pasos: Envias material -> Editamos -> Revisas -> Publicas.
- Linea SVG vertical que se dibuja con el scroll; cada paso se enciende al pasar el playhead.
- Numeros grandes en Unbounded con outline que se rellenan.

### 5.7 Cifras
- 3-4 contadores animados (ej. videos entregados, horas ahorradas, dias de entrega).
- Placeholders numericos hasta tener datos reales. NO inventar cifras en produccion.

### 5.8 Paquetes y precios
- 3 tarjetas. La recomendada con borde lima animado (gradiente que gira).
- Tilt 3D sutil siguiendo el cursor (max 6 grados). Desactivado en touch.
- Precios como placeholders hasta que Pablo los defina.

### 5.9 Testimonios
- Tarjetas con video vertical placeholder + cita corta.
- Fila con drag horizontal (inercia ligera).

### 5.10 FAQ
- Acordeon. Icono `+` que rota a `x`. Altura animada con GSAP.

### 5.11 CTA final
- Titular gigante con parallax de capas (texto, video de fondo, grano a distinta velocidad).
- Boton WhatsApp grande + REC parpadeando. Timecode llega a `FIN`.

### Global
- Cursor custom en desktop: circulo que crece sobre videos y muestra `PLAY`.
- Playhead lateral fijo que indica progreso total de la pagina.
- Revelados de seccion con "corte duro" (clip-path instantaneo + leve shake de 80 ms).

---

## 6. Placeholders

- Videos: `<div class="ph-video" data-ratio="9/16">` con fondo `--ink-2`, ruido animado
  y label mono `VIDEO 9:16 - REEMPLAZAR`. Estructura lista para cambiar por `<video muted loop playsinline>`.
- Imagenes: mismo patron con label `IMG - REEMPLAZAR`.
- Todos los textos de contenido marcados para reemplazo facil.

---

## 7. Requisitos no negociables

- `prefers-reduced-motion`: desactiva Lenis, pins y scrubs; muestra todo estatico y legible.
- Mobile primero: pins y scroll horizontal se adaptan o se convierten en carruseles nativos.
- Sin scroll horizontal accidental de la pagina en ningun ancho.
- Videos: `muted`, `playsinline`, `preload="none"` y carga diferida fuera de viewport.
- Lighthouse Performance mobile >= 80 con placeholders.
- Si GSAP o Lenis no cargan (CDN caido), la pagina sigue funcionando sin animaciones.
- i18n: por ahora solo ES. Dejar textos con `data-i18n` para no romper el sistema existente.

---

## 8. Plan de slices (sugerido, cada uno <= 200 lineas)

1. Esqueleto: tokens, fuentes, grano, carga de GSAP/Lenis, reduced-motion, placeholders base.
2. Preloader + Hero (split de titular, timecode, REC, encogido de video).
3. Marquee reactivo + "El problema" (pin + reveal de palabras).
4. Antes / Despues.
5. Estilos de edicion (scroll horizontal).
6. Proceso + Cifras.
7. Paquetes + Testimonios.
8. FAQ + CTA final + cursor custom + playhead global.
9. Pasada mobile + performance + feature flag.

Senal 2 del workflow: tras el slice 5, ponytail audit.

---

## 9. Zonas de riesgo

| Archivo / modulo | Riesgo | Que no tocar sin revisar |
|------------------|--------|--------------------------|
| `js/videos.js` (Lenis + ScrollTrigger) | Pins con alturas mal calculadas al cargar videos | Llamar `ScrollTrigger.refresh()` tras cargar media |
| Scroll horizontal (5.5) | Rompe en iOS Safari | Probar en dispositivo real antes de cerrar slice |
| `components/shared.js` | Pagina sin navbar puede romper el loader de componentes | Revisar antes de excluir navbar/footer |
