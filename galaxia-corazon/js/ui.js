/* ============================================================
   Interfaz: título, carta (modal), botones de zoom, ayuda
   ============================================================ */
(function () {
  const C = window.CONFIG;
  const $ = id => document.getElementById(id);

  // Carta
  $('modal-titulo').textContent = C.carta.titulo;
  $('modal-texto').innerHTML = C.carta.parrafos.map(p => `<p>${p}</p>`).join('');

  const modal = $('modal');
  const abrir = () => { modal.classList.remove('oculto'); $('cerrar').focus(); };
  const cerrar = () => { modal.classList.add('oculto'); $('btn-carta').focus(); };

  $('btn-carta').addEventListener('click', abrir);
  $('cerrar').addEventListener('click', cerrar);
  modal.addEventListener('click', e => { if (e.target === modal) cerrar(); });
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.classList.contains('oculto')) cerrar();
  });

  // Botón para volver a la vista inicial
  const g = () => window.galaxia && window.galaxia.controles;
  $('centrar').addEventListener('click', () => g() && g().reiniciar());

  // La ayuda se oculta sola
  setTimeout(() => $('ayuda').classList.add('oculta'), 9000);
})();
