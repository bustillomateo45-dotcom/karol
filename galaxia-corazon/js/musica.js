/* ============================================================
   Música de fondo
   - La canción se define en config.js (no se cambia desde la pantalla)
   - Intenta sonar apenas se abre el programa, con el volumen del dispositivo
   - Si el navegador bloquea el audio automático, aparece "Toca para entrar"
   - El botón ♪ solo pausa / reanuda
   - Mientras la carta está abierta, el volumen baja suavemente y vuelve al cerrarla
   ============================================================ */
(function () {
  const M = window.CONFIG.musica || {};
  const $ = id => document.getElementById(id);
  const btn = $('btn-musica');
  const entrada = $('entrada');

  const audio = new Audio();
  audio.loop = M.bucle !== false;
  audio.volume = 1;            // el volumen real lo controla el dispositivo
  audio.preload = 'auto';
  audio.src = M.archivo;

  function pintar() {
    const suena = !audio.paused;
    btn.classList.toggle('sonando', suena);
    btn.setAttribute('aria-pressed', String(suena));
    btn.setAttribute('aria-label', suena ? 'Pausar música' : 'Reproducir música');
  }
  audio.addEventListener('play', pintar);
  audio.addEventListener('pause', pintar);

  // Si el archivo no existe
  audio.addEventListener('error', () => {
    btn.classList.add('sin-cancion');
    entrada.classList.add('oculto');
    console.warn('No se encontró la canción: ' + M.archivo + '. Colócala en la carpeta /audio.');
  });

  function reproducir() {
    const p = audio.play();
    if (p && p.catch) {
      p.catch(e => {
        // Solo se muestra la pantalla de entrada cuando el navegador bloquea el sonido automático
        if (e && e.name === 'NotAllowedError') entrada.classList.remove('oculto');
      });
    }
  }

  entrada.addEventListener('click', () => {
    entrada.classList.add('oculto');
    audio.play().catch(() => {});
  });

  btn.addEventListener('click', () => {
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  });

  /* ---------- volumen suave mientras la carta está abierta ---------- */
  const VOL_NORMAL = 1;                                  // el volumen real lo controla el dispositivo
  const VOL_CARTA = Math.min(1, Math.max(0, M.volumenCarta ?? 0.18));
  const FUNDIDO = M.fundidoMs ?? 700;
  let animVol = null;

  function irAVolumen(destino) {
    cancelAnimationFrame(animVol);
    const inicio = audio.volume;
    const t0 = performance.now();
    const paso = ahora => {
      const k = Math.min(1, (ahora - t0) / FUNDIDO);
      audio.volume = Math.min(1, Math.max(0, inicio + (destino - inicio) * k));
      if (k < 1) animVol = requestAnimationFrame(paso);
    };
    animVol = requestAnimationFrame(paso);
  }

  const modal = $('modal');
  const cartaAbierta = () => !modal.classList.contains('oculto');
  new MutationObserver(() => irAVolumen(cartaAbierta() ? VOL_CARTA : VOL_NORMAL))
    .observe(modal, { attributes: true, attributeFilter: ['class'] });

  pintar();
  reproducir();   // arranca desde que se abre el programa
})();
