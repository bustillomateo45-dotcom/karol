/* ============================================================
   Galaxia del corazón — escena three.js
   ============================================================ */
(function () {
  const C = window.CONFIG;
  const movil = Math.min(innerWidth, innerHeight) < 700;
  const factor = movil ? 0.6 : 1;           // menos objetos en celulares
  const cant = {};
  Object.keys(C.cantidad).forEach(k => (cant[k] = Math.round(C.cantidad[k] * factor)));

  /* ---------- renderer, escena, cámara ---------- */
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);

  const escena = new THREE.Scene();
  escena.background = new THREE.Color(C.colores.fondo);

  const camara = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 6000);
  const controles = new ControlesGalaxia(camara, canvas);

  window.addEventListener('resize', () => {
    camara.aspect = innerWidth / innerHeight;
    camara.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  /* ---------- utilidades ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  const elegir = arr => arr[Math.floor(Math.random() * arr.length)];

  function texturaBrillo() {
    const s = 128, c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }
  const brillo = texturaBrillo();

  function crearPuntos(pos, col, tamano, atenuar = true, opacidad = 1) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: tamano,
      map: brillo,
      vertexColors: true,
      transparent: true,
      opacity: opacidad,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: atenuar
    });
    return new THREE.Points(geo, mat);
  }

  /* ---------- estrellas de fondo ---------- */
  let estrellasObj;
  (function estrellas() {
    const n = cant.estrellas;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const tonos = [new THREE.Color('#ffffff'), new THREE.Color('#ffd0e8'), new THREE.Color('#bcd4ff')];
    for (let i = 0; i < n; i++) {
      const r = rnd(500, 2400);
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(rnd(-1, 1));
      pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
      const c = elegir(tonos).clone().multiplyScalar(rnd(0.35, 1));
      col.set([c.r, c.g, c.b], i * 3);
    }
    const p = crearPuntos(pos, col, 2.6, false);
    escena.add(p);
    estrellasObj = p;
  })();

  /* ---------- corazón de partículas ---------- */
  const corazon = new THREE.Group();
  escena.add(corazon);

  (function crearCorazon() {
    const n = cant.particulasCorazon;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const paleta = C.colores.corazon.map(c => new THREE.Color(c));
    const esc = 1.45;
    for (let i = 0; i < n; i++) {
      const borde = Math.random() < 0.62;
      const t = Math.random() * Math.PI * 2;
      let x = 16 * Math.pow(Math.sin(t), 3);
      let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const k = borde ? 1 - Math.random() * 0.05 : Math.sqrt(Math.random());
      x *= k; y *= k;
      const jit = borde ? 0.9 : 0.5;
      x += gauss() * jit;
      y += gauss() * jit + 2.5;
      const z = gauss() * (borde ? 2.2 : 4.5 * (1 - k * 0.4));
      pos.set([x * esc, y * esc, z * esc], i * 3);

      const c = paleta[Math.min(paleta.length - 1, Math.floor(Math.pow(Math.random(), 1.6) * paleta.length))]
        .clone().multiplyScalar(borde ? rnd(0.7, 1) : rnd(0.35, 0.8));
      col.set([c.r, c.g, c.b], i * 3);
    }
    corazon.add(crearPuntos(pos, col, 0.85));
  })();

  // Resplandor central
  const resplandor = new THREE.Sprite(new THREE.SpriteMaterial({
    map: brillo, color: 0xff2f92, transparent: true, opacity: 0.5,
    depthWrite: false, blending: THREE.AdditiveBlending
  }));
  resplandor.scale.set(150, 150, 1);
  escena.add(resplandor);

  /* ---------- anillos de órbita alrededor del corazón ---------- */
  const anillos = new THREE.Group();
  escena.add(anillos);
  (function crearAnillos() {
    const defs = [
      { radio: 40, n: 1800, y: -28, grosor: 2.2, color: '#ff4fa3' },
      { radio: 62, n: 1400, y: -30, grosor: 3.2, color: '#ff8ac4' }
    ];
    defs.forEach(d => {
      const pos = new Float32Array(d.n * 3), col = new Float32Array(d.n * 3);
      const c = new THREE.Color(d.color);
      for (let i = 0; i < d.n; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = d.radio + gauss() * d.grosor;
        pos.set([Math.cos(a) * r, d.y + gauss() * 0.7, Math.sin(a) * r], i * 3);
        const m = rnd(0.35, 1);
        col.set([c.r * m, c.g * m, c.b * m], i * 3);
      }
      anillos.add(crearPuntos(pos, col, 0.9));
    });
  })();

  /* ---------- brazos en espiral (disco de la galaxia) ---------- */
  const polvo = (function () {
    const grupo = new THREE.Group();
    const n = cant.particulasPolvo;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const paleta = C.colores.polvo.map(c => new THREE.Color(c));
    const brazos = 3;
    for (let i = 0; i < n; i++) {
      const r = Math.pow(Math.random(), 0.8) * 330 + 10;
      const brazo = i % brazos;
      const ancho = 5 + r * 0.045;                        // grosor del brazo (en unidades)
      const ang = (brazo / brazos) * Math.PI * 2 + r * 0.017 + (gauss() * ancho) / r;
      pos.set([Math.cos(ang) * r, gauss() * (2.5 + r * 0.018), Math.sin(ang) * r], i * 3);
      const c = elegir(paleta).clone().multiplyScalar(rnd(0.65, 1) * (1 - r / 800));
      col.set([c.r, c.g, c.b], i * 3);
    }
    grupo.add(crearPuntos(pos, col, 2.1));

    // Resplandor suave sobre los brazos
    const m = Math.floor(n / 5);
    const posG = new Float32Array(m * 3), colG = new Float32Array(m * 3);
    for (let i = 0; i < m; i++) {
      const j = i * 5;
      posG.set([pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]], i * 3);
      colG.set([col[j * 3], col[j * 3 + 1], col[j * 3 + 2]], i * 3);
    }
    grupo.add(crearPuntos(posG, colG, 6, true, 0.2));

    escena.add(grupo);
    return grupo;
  })();

  /* ---------- ondas exteriores (anillos ondulados, tan vivos como los del centro) ---------- */
  const ondas = [];
  (function crearOndas() {
    const cfg = C.ondas || { radios: [95, 140, 190, 245, 300], densidad: 3.2 };
    const paleta = C.colores.corazon.slice(0, 3).map(c => new THREE.Color(c));
    cfg.radios.forEach((R, idx) => {
      const n = Math.round(2 * Math.PI * R * cfg.densidad * factor);
      const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
      const lobulos = 4 + idx;
      const amp = 2.5 + idx * 0.8;
      const fase = Math.random() * Math.PI * 2;
      const grosor = 1.8 + idx * 0.5;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = R + gauss() * grosor;
        const y = -28 + amp * Math.sin(lobulos * a + fase) + gauss() * 0.8;
        pos.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
        const c = paleta[Math.floor(Math.random() * paleta.length)].clone().multiplyScalar(rnd(0.6, 1));
        col.set([c.r, c.g, c.b], i * 3);
      }
      const grupo = new THREE.Group();
      grupo.add(crearPuntos(pos, col, 1.2 + idx * 0.2));

      const m = Math.floor(n / 6);
      const posG = new Float32Array(m * 3), colG = new Float32Array(m * 3);
      for (let i = 0; i < m; i++) {
        const j = i * 6;
        posG.set([pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]], i * 3);
        colG.set([col[j * 3], col[j * 3 + 1], col[j * 3 + 2]], i * 3);
      }
      grupo.add(crearPuntos(posG, colG, 4.5 + idx * 0.6, true, 0.25));

      escena.add(grupo);
      ondas.push({ obj: grupo, vel: (idx % 2 ? -1 : 1) * (0.05 + 0.012 * idx) });
    });
  })();

  /* ---------- sprites de texto e imágenes ---------- */
  const cacheTextos = new Map();

  function texturaTexto(texto) {
    if (cacheTextos.has(texto)) return cacheTextos.get(texto);
    const px = movil ? 34 : 46;                 // tamaño de letra de la textura (más grande = más nítido, pero pesa más)
    const fuente = `700 ${px}px "Playfair Display", Georgia, serif`;
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    g.font = fuente;
    const ancho = Math.ceil(g.measureText(texto).width);
    const pad = 24;
    c.width = ancho + pad * 2;
    c.height = Math.round(px * 1.6);
    g.font = fuente;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#ffe9f5';
    g.shadowColor = 'rgba(255,90,175,0.95)';
    g.shadowBlur = px * 0.28;
    g.fillText(texto, c.width / 2, c.height / 2 + 1);
    g.shadowBlur = px * 0.1;
    g.fillText(texto, c.width / 2, c.height / 2 + 1);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const r = { tex, aspecto: c.width / c.height };
    cacheTextos.set(texto, r);
    return r;
  }

  const cacheEmojis = new Map();

  function texturaEmoji(emoji) {
    if (cacheEmojis.has(emoji)) return cacheEmojis.get(emoji);
    const s = 160;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    g.font = `${s * 0.62}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = 'rgba(255,90,175,0.9)';
    g.shadowBlur = 14;
    g.fillText(emoji, s / 2, s / 2 + 6);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const r = { tex, aspecto: 1 };
    cacheEmojis.set(emoji, r);
    return r;
  }

  function cargarImagen(ruta) {
    return new Promise(res => {
      new THREE.TextureLoader().load(
        ruta,
        t => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 4;
          res({ tex: t, aspecto: t.image.width / t.image.height });
        },
        undefined,
        () => res(null)
      );
    });
  }

  function avisar(texto) {
    const d = document.createElement('div');
    d.textContent = texto;
    d.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:40;' +
      'background:rgba(60,0,30,.9);color:#ffd9ec;border:1px solid #ff4fa3;border-radius:10px;' +
      'padding:8px 14px;font:13px Georgia,serif;';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 12000);
  }

  /* ---------- objetos en órbita ---------- */
  const orbitas = [];

  function agregarOrbita({ tex, aspecto }, alto, opciones = {}) {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      opacity: opciones.opacidad ?? 1
    });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(alto * aspecto, alto, 1);
    escena.add(sp);

    const radio = opciones.radio;
    const dir = Math.random() < 0.88 ? 1 : -1;           // casi todos giran igual
    orbitas.push({
      sp, mat, radio,
      ang: Math.random() * Math.PI * 2,
      vel: dir * rnd(0.6, 1.4) * 0.07 * Math.pow(70 / radio, 0.6),
      y: opciones.y,
      bobAmp: rnd(0.8, 4.5),
      bobVel: rnd(0.25, 0.8),
      fase: Math.random() * Math.PI * 2,
      inclinar: opciones.inclinar || 0
    });
  }

  function barajar(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function crearFrases() {
    const lista = barajar(C.frases.slice());      // en celulares se muestra una selección al azar
    for (let i = 0; i < cant.frases; i++) {
      const texto = lista[i % lista.length];
      const t = texturaTexto(texto);
      const sorteo = Math.random();
      let alto, maxAncho;
      if (sorteo < 0.68)      { alto = rnd(2.6, 4.2); maxAncho = 46; }
      else if (sorteo < 0.93) { alto = rnd(5.5, 8);   maxAncho = 64; }
      else                    { alto = rnd(9.5, 13);  maxAncho = 84; }
      alto = Math.min(alto, maxAncho / t.aspecto);   // limita el ancho de las frases largas
      const radio = 48 + Math.pow(Math.random(), 0.85) * 240;
      const limiteY = Math.min(120, 25 + radio * 0.4);
      agregarOrbita(t, alto, {
        radio,
        y: rnd(-limiteY, limiteY),
        opacidad: rnd(0.7, 1)
      });
    }
  }

  async function crearImagenes() {
    const incrustadas = window.IMAGENES_DATA || {};
    const resultados = await Promise.all(C.imagenes.map(r => cargarImagen(incrustadas[r] || r)));
    const cargadas = resultados.filter(Boolean);
    const fallidas = C.imagenes.filter((r, i) => !resultados[i]);
    if (fallidas.length) {
      console.warn('No se pudieron cargar estas imágenes:', fallidas);
      avisar('No se pudieron cargar ' + fallidas.length + ' imagen(es). Revisa la consola (F12).');
    }
    let fuentes = cargadas;
    if (!cargadas.length) {
      console.info('No se pudieron cargar las imágenes de /img — usando emojis de respaldo. ' +
        'Recuerda abrir el proyecto con un servidor local (ver LEEME.md).');
      fuentes = C.emojisRespaldo.map(texturaEmoji);
    }

    // Imágenes propias, repartidas de forma pareja entre todas
    for (let i = 0; i < cant.imagenes; i++) {
      const f = fuentes[i % fuentes.length];
      const radio = 55 + Math.pow(Math.random(), 0.9) * 190;
      const limiteY = Math.min(110, 25 + radio * 0.35);
      const alto = cargadas.length ? rnd(10, 24) : rnd(7, 15);
      agregarOrbita(f, alto, {
        radio,
        y: rnd(-limiteY, limiteY),
        inclinar: cargadas.length ? rnd(-0.18, 0.18) : 0
      });
    }

    // Emojis decorativos que completan la galaxia
    const decoracion = (C.emojisDecoracion || []).map(texturaEmoji);
    if (decoracion.length) {
      for (let i = 0; i < cant.emojis; i++) {
        const radio = 42 + Math.pow(Math.random(), 0.85) * 250;
        const limiteY = Math.min(125, 25 + radio * 0.42);
        agregarOrbita(decoracion[i % decoracion.length], rnd(3.5, 8.5), {
          radio,
          y: rnd(-limiteY, limiteY),
          opacidad: rnd(0.75, 1)
        });
      }
    }
  }

  /* ---------- TE AMO en 3D: fijo sobre el corazón ---------- */
  const tituloGrupo = new THREE.Group();
  escena.add(tituloGrupo);
  let tituloHalo = null;

  function crearTitulo() {
    const texto = (C.titulo || 'TE AMO') + ' ♥';
    const W = 1500, H = 300;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '900 210px "Playfair Display", Georgia, serif';
    g.fillText(texto, W / 2, H / 2 + 8);

    // Muestrear los píxeles del texto para convertirlos en partículas
    const datos = g.getImageData(0, 0, W, H).data;
    const paso = movil ? 3 : 2;
    const pts = [];
    let minX = W, maxX = 0, minY = H, maxY = 0;
    for (let y = 0; y < H; y += paso) {
      for (let x = 0; x < W; x += paso) {
        if (datos[(y * W + x) * 4 + 3] > 140) {
          pts.push(x, y);
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    const escala = (C.tituloAncho || 66) / (maxX - minX);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const n = pts.length / 2;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const paleta = C.colores.corazon.map(k => new THREE.Color(k));   // misma paleta que el corazón

    for (let i = 0; i < n; i++) {
      const x = (pts[i * 2] - cx + (Math.random() - 0.5) * paso) * escala;
      const y = -(pts[i * 2 + 1] - cy + (Math.random() - 0.5) * paso) * escala;
      pos.set([x, y, gauss() * 0.45], i * 3);
      const k = paleta[Math.min(paleta.length - 1, Math.floor(Math.pow(Math.random(), 1.25) * paleta.length))]
        .clone().multiplyScalar(rnd(0.85, 1));
      col.set([k.r, k.g, k.b], i * 3);
    }

    const altura = C.tituloAltura || 37;

    // Capa principal: mismas partículas del corazón, pero más grandes, densas y brillantes
    const letras = crearPuntos(pos, col, 1.25);
    letras.position.y = altura;
    letras.renderOrder = 20;
    letras.material.depthTest = false;
    tituloGrupo.add(letras);

    // Capa de resplandor neón (partículas grandes y suaves)
    const m = Math.floor(n / 6);
    const posG = new Float32Array(m * 3), colG = new Float32Array(m * 3);
    for (let i = 0; i < m; i++) {
      const j = i * 6;
      posG.set([pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]], i * 3);
      colG.set([col[j * 3], col[j * 3 + 1], col[j * 3 + 2]], i * 3);
    }
    const aura = crearPuntos(posG, colG, 4.2, true, 0.3);
    aura.position.y = altura;
    aura.renderOrder = 19;
    aura.material.depthTest = false;
    tituloGrupo.add(aura);

    // Halo rosado detrás del texto
    tituloHalo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: brillo, color: 0xff2f92, transparent: true, opacity: 0.26,
      depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending
    }));
    tituloHalo.scale.set(110, 36, 1);
    tituloHalo.position.y = altura;
    tituloHalo.renderOrder = 18;
    tituloGrupo.add(tituloHalo);
  }

  /* ---------- animación ---------- */
  const reloj = new THREE.Clock();

  function animar() {
    requestAnimationFrame(animar);
    const dt = Math.min(reloj.getDelta(), 0.05);
    const t = reloj.elapsedTime;

    for (const o of orbitas) {
      o.ang += o.vel * dt;
      o.sp.position.set(
        Math.cos(o.ang) * o.radio,
        o.y + Math.sin(t * o.bobVel + o.fase) * o.bobAmp,
        Math.sin(o.ang) * o.radio
      );
      if (o.inclinar) o.mat.rotation = Math.sin(t * 0.4 + o.fase) * o.inclinar;
    }

    // Latido del corazón
    const latido = 1 + 0.035 * Math.sin(t * 3.0) + 0.04 * Math.pow(Math.max(0, Math.sin(t * 3.0 - 0.4)), 6);
    corazon.scale.setScalar(latido);
    corazon.rotation.y += 0.18 * dt;
    resplandor.material.opacity = 0.42 + 0.12 * Math.sin(t * 3.0);

    // TE AMO: posición fija sobre el corazón, siempre de frente a la cámara
    tituloGrupo.rotation.y = Math.atan2(camara.position.x, camara.position.z);
    if (tituloHalo) tituloHalo.material.opacity = 0.24 + 0.05 * Math.sin(t * 3.0);

    anillos.rotation.y -= 0.12 * dt;
    polvo.rotation.y += 0.012 * dt;
    for (const o of ondas) o.obj.rotation.y += o.vel * dt;
    if (estrellasObj) estrellasObj.rotation.y += 0.002 * dt;

    controles.actualizar(dt);
    renderer.render(escena, camara);
  }

  /* ---------- arranque ---------- */
  async function iniciar() {
    // Espera la tipografía (máx. 2.5 s por si no hay internet)
    try {
      await Promise.race([
        Promise.all([
          document.fonts.load('700 64px "Playfair Display"'),
          document.fonts.load('900 64px "Playfair Display"')
        ]),
        new Promise(r => setTimeout(r, 2500))
      ]);
    } catch (e) { /* se usa Georgia */ }

    crearTitulo();
    crearFrases();
    await crearImagenes();
    animar();
    document.getElementById('cargando').classList.add('listo');
  }

  window.galaxia = { controles, camara, escena, renderer };
  iniciar();
})();
