// Movimiento de la landing (brief videos, slice 1).
// Sin GSAP/Lenis o con reduced-motion: la pagina queda estatica y legible, sin errores.
(function () {
  var root = document.documentElement;

  // 2a: completa el contador y corta duro. Corre aunque falten GSAP/Lenis.
  if (root.classList && root.classList.contains && root.classList.contains('is-loading')) {
    var pct = document.getElementById && document.getElementById('render-pct');
    var start = null;
    var step = function (now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / 1200);
      if (pct) pct.textContent = ('00' + Math.round(p * 100)).slice(-3);
      if (p < 1) { requestAnimationFrame(step); return; }
      try { sessionStorage.setItem('reels_v2_preloaded', '1'); } catch (e) {}
      root.classList.remove('is-loading');
    };
    requestAnimationFrame(step);
  }

  // 2b1: timecode vivo, independiente de GSAP/Lenis. Sin JS queda en cero.
  var tc = document.getElementById && document.getElementById('timecode');
  if (tc) {
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var updateTc = function () {
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var total = Math.round(Math.min(1, Math.max(0, window.scrollY) / max) * 1440);
      tc.textContent = pad(Math.floor(total / 86400)) + ':' + pad(Math.floor(total / 1440) % 60) + ':' + pad(Math.floor(total / 24) % 60) + ':' + pad(total % 24);
    };
    window.addEventListener('scroll', updateTc, { passive: true });
    updateTc();
  }

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var Lenis = window.Lenis;

  if (reduced || !gsap || !ScrollTrigger || !Lenis) {
    root.classList.add('no-motion');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  var lenis = new Lenis({ smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);
  root.classList.add('motion');
})();
