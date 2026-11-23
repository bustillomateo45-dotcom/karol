/* ============================================================
   Controles de cámara libres (sin dependencias)
   - Arrastrar (clic izq. / 1 dedo): girar alrededor del punto de enfoque
   - Clic derecho / Shift+arrastrar / 2 dedos: trasladarse (pan)
   - Rueda / pellizco: acercar o alejar
   - Teclado: WASD o flechas para moverte, Q/E subir y bajar, R reiniciar
   - Doble clic / doble toque: volver al centro
   ============================================================ */
class ControlesGalaxia {
  constructor(camara, elemento) {
    this.camara = camara;
    this.el = elemento;

    this.inicial = { theta: 0.4, phi: 1.3, radio: 170 };
    this.objetivo = new THREE.Vector3(0, 0, 0);
    this.theta = this.inicial.theta;
    this.phi = this.inicial.phi;
    this.radio = this.inicial.radio;

    this.vTheta = 0;
    this.vPhi = 0;
    this.vRadio = 0;       // velocidad de zoom (multiplicativa en log)
    this.vPan = new THREE.Vector3();

    this.radioMin = 6;
    this.radioMax = 1100;
    this.amortiguacion = 0.9;

    this.autoGiro = true;
    this.velAutoGiro = 0.025;
    this.ultimaInteraccion = -999;

    this.punteros = new Map();
    this.distPrevia = 0;
    this.medioPrevio = null;
    this.teclas = new Set();

    this._vincular();
    this._actualizarCamara();
  }

  /* ---------- eventos ---------- */
  _vincular() {
    const el = this.el;
    el.addEventListener('contextmenu', e => e.preventDefault());

    el.addEventListener('pointerdown', e => {
      el.setPointerCapture(e.pointerId);
      this.punteros.set(e.pointerId, {
        x: e.clientX, y: e.clientY,
        pan: e.button === 2 || e.button === 1 || e.shiftKey
      });
      this._tocado();
      el.classList.add('arrastrando');
      if (this.punteros.size === 2) {
        this.distPrevia = this._distancia();
        this.medioPrevio = this._medio();
      }
    });

    el.addEventListener('pointermove', e => {
      const p = this.punteros.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      this._tocado();

      if (this.punteros.size === 1) {
        if (p.pan) {
          this._pan(dx, dy);
        } else {
          this.vTheta = -dx * 0.0055;
          this.vPhi = -dy * 0.0055;
          this.theta += this.vTheta;
          this.phi += this.vPhi;
        }
      } else if (this.punteros.size === 2) {
        const d = this._distancia();
        const m = this._medio();
        if (this.distPrevia > 0) {
          this.radio *= this.distPrevia / d;       // pellizco
        }
        if (this.medioPrevio) {
          this._pan(m.x - this.medioPrevio.x, m.y - this.medioPrevio.y);
        }
        this.distPrevia = d;
        this.medioPrevio = m;
      }
      this._limitar();
    });

    const soltar = e => {
      this.punteros.delete(e.pointerId);
      if (this.punteros.size < 2) { this.distPrevia = 0; this.medioPrevio = null; }
      if (this.punteros.size === 0) el.classList.remove('arrastrando');
    };
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);

    el.addEventListener('wheel', e => {
      e.preventDefault();
      this._tocado();
      this.vRadio += Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 120) * 0.00055;
    }, { passive: false });

    el.addEventListener('dblclick', () => this.reiniciar());

    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (k === 'r') return this.reiniciar();
      this.teclas.add(k);
    });
    window.addEventListener('keyup', e => this.teclas.delete(e.key.toLowerCase()));
  }

  _tocado() {
    this.ultimaInteraccion = performance.now();
  }

  _distancia() {
    const [a, b] = [...this.punteros.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  }

  _medio() {
    const [a, b] = [...this.punteros.values()];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  /* ---------- movimiento ---------- */
  _pan(dx, dy) {
    const factor = this.radio * 0.0016;
    const derecha = new THREE.Vector3().setFromMatrixColumn(this.camara.matrix, 0);
    const arriba = new THREE.Vector3().setFromMatrixColumn(this.camara.matrix, 1);
    this.objetivo.addScaledVector(derecha, -dx * factor);
    this.objetivo.addScaledVector(arriba, dy * factor);
  }

  _limitar() {
    this.phi = Math.min(Math.max(this.phi, 0.05), Math.PI - 0.05);
    this.radio = Math.min(Math.max(this.radio, this.radioMin), this.radioMax);
  }

  acercar(factor = 0.8) { this._tocado(); this.vRadio += Math.log(factor) * 0.25; }
  alejar(factor = 1.25) { this._tocado(); this.vRadio += Math.log(factor) * 0.25; }

  reiniciar() {
    this._tocado();
    this.destino = { ...this.inicial };
  }

  /* ---------- actualización por cuadro ---------- */
  actualizar(dt) {
    // Volver suavemente al inicio
    if (this.destino) {
      const k = 1 - Math.pow(0.0015, dt);
      this.theta += (this.destino.theta - this.theta) * k;
      this.phi += (this.destino.phi - this.phi) * k;
      this.radio += (this.destino.radio - this.radio) * k;
      this.objetivo.lerp(new THREE.Vector3(), k);
      if (Math.abs(this.radio - this.destino.radio) < 0.3 && this.objetivo.length() < 0.1) this.destino = null;
    }

    // Zoom con inercia
    this.radio *= Math.exp(this.vRadio);
    this.vRadio *= 0.86;

    // Inercia de giro al soltar
    if (this.punteros.size === 0) {
      this.theta += this.vTheta;
      this.phi += this.vPhi;
      this.vTheta *= this.amortiguacion;
      this.vPhi *= this.amortiguacion;
    }

    // Teclado
    const v = this.radio * 0.012;
    const adelante = new THREE.Vector3();
    this.camara.getWorldDirection(adelante);
    const derecha = new THREE.Vector3().setFromMatrixColumn(this.camara.matrix, 0);
    if (this.teclas.size) this._tocado();
    if (this.teclas.has('w') || this.teclas.has('arrowup')) this.objetivo.addScaledVector(adelante, v);
    if (this.teclas.has('s') || this.teclas.has('arrowdown')) this.objetivo.addScaledVector(adelante, -v);
    if (this.teclas.has('a') || this.teclas.has('arrowleft')) this.objetivo.addScaledVector(derecha, -v);
    if (this.teclas.has('d') || this.teclas.has('arrowright')) this.objetivo.addScaledVector(derecha, v);
    if (this.teclas.has('q')) this.objetivo.y -= v;
    if (this.teclas.has('e')) this.objetivo.y += v;

    // Giro automático suave cuando no se está tocando
    const quieto = performance.now() - this.ultimaInteraccion > 4000;
    if (this.autoGiro && quieto && this.punteros.size === 0) {
      this.theta += this.velAutoGiro * dt;
    }

    this._limitar();
    this._actualizarCamara();
  }

  _actualizarCamara() {
    const sp = Math.sin(this.phi);
    this.camara.position.set(
      this.objetivo.x + this.radio * sp * Math.sin(this.theta),
      this.objetivo.y + this.radio * Math.cos(this.phi),
      this.objetivo.z + this.radio * sp * Math.cos(this.theta)
    );
    this.camara.lookAt(this.objetivo);
    this.camara.updateMatrix();
  }
}

window.ControlesGalaxia = ControlesGalaxia;
