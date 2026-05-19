// Persistent parallax star field (spec Section 3 + experiential
// Part A). One fixed seed, so every page renders the identical field
// and it never flickers across navigations. Enhancements: 8% of stars
// twinkle on their own slow sine period; mouse parallax uses a
// per-layer spring so the foreground reacts faster than the heavy
// background; selecting a playground briefly accelerates the drift
// and blurs the canvas; a lone meteor crosses every 45-90 s. All
// motion is disabled under prefers-reduced-motion (static field).
//
// Disable the whole layer in one place (spec H4):
const STARFIELD_ENABLED = true;

import { mulberry32 } from './render/rng.js';

const LAYERS = [
  { n: 300, omin: 0.25, omax: 0.45, r: 0.5, par: 0.015, damp: 0.040 },
  { n: 120, omin: 0.15, omax: 0.30, r: 0.8, par: 0.008, damp: 0.025 },
  { n: 40, omin: 0.08, omax: 0.18, r: 1.2, par: 0.003, damp: 0.012 },
];

export class StarField {
  constructor({ seed = 0xC0FFEE } = {}) {
    this.seed = seed >>> 0;
    this.reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const c = document.createElement('canvas');
    c.id = 'ambient';
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;display:block;transition:filter 400ms ease';
    this.canvas = c;
    this.ctx = c.getContext('2d', { alpha: false });
    // Parent to <html>, not <body>: page-transition fades set opacity
    // on body, and the star field must never fade or reinitialise.
    document.documentElement.appendChild(c);

    this.scrollY = window.scrollY || 0;
    this.tMx = 0; this.tMy = 0;          // mouse target offset from centre
    this.speedMul = 1;                    // transition-acceleration factor
    this.accel = null;                    // {from,to,t0,dur,ease}
    this.meteor = null;
    this.rngM = mulberry32(this.seed ^ 0x5151);
    this.nextMeteor = performance.now() + (45 + this.rngM() * 45) * 1000;

    this._resize = this._resize.bind(this);
    this._onScroll = () => { this.scrollY = window.scrollY || 0; };
    this._onMouse = (e) => {
      if (this.reduce) return;
      this.tMx = e.clientX - window.innerWidth / 2;
      this.tMy = e.clientY - window.innerHeight / 2;
    };
    this._resize();
    window.addEventListener('resize', this._resize);
    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('mousemove', this._onMouse, { passive: true });
    this._loop = this._loop.bind(this);
    if (this.reduce) { this._draw(0); } else { requestAnimationFrame(this._loop); }
  }

  // spec A3: ramp the parallax speed 1 -> 3.5 (+ canvas blur) on
  // 'in', reverse on 'out'. Each is a 400 ms eased tween.
  accelerate(dir) {
    if (this.reduce) return;
    const now = performance.now();
    const cur = this.speedMul;
    if (dir === 'in') {
      this.accel = { from: cur, to: 3.5, t0: now, dur: 400, ein: true };
      this.canvas.style.filter = 'blur(1.5px)';
    } else {
      this.accel = { from: cur, to: 1.0, t0: now, dur: 400, ein: false };
      this.canvas.style.filter = 'blur(0px)';
    }
  }

  _resize() {
    const W = window.innerWidth, H = window.innerHeight;
    this.W = W; this.H = H;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = W * this.dpr;
    this.canvas.height = H * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const rng = mulberry32(this.seed);
    const MX = 90;
    this.stars = [];
    for (const L of LAYERS) {
      const list = [];
      for (let i = 0; i < L.n; i += 1) {
        const t = rng();
        const col = t < 0.85 ? '255,255,255' : t < 0.95 ? '200,216,255' : '255,244,224';
        const tw = rng() < 0.08;                       // A1: 8% twinkle
        list.push({
          x: rng() * (W + 2 * MX) - MX,
          y: rng() * (H + 2 * MX) - MX,
          o: L.omin + rng() * (L.omax - L.omin),
          r: L.r, col,
          tw,
          period: 3 + rng() * 6,                        // 3-9 s
          phase: rng() * 6.2832,
        });
      }
      this.stars.push({ par: L.par, damp: L.damp, cx: 0, cy: 0, list });
    }
  }

  _spawnMeteor(now) {
    const r = this.rngM;
    const fromLeft = r() < 0.5;
    const ang = (10 + r() * 10) * Math.PI / 180 * (r() < 0.5 ? 1 : -1);
    const y0 = r() * this.H * 0.7;
    const len = this.W + 200;
    this.meteor = {
      x0: fromLeft ? -100 : this.W + 100,
      y0,
      dx: (fromLeft ? 1 : -1) * Math.cos(ang) * len,
      dy: Math.sin(ang) * len,
      t0: now,
      dur: 800 + r() * 600,
    };
  }

  _draw(now) {
    const ctx = this.ctx;
    ctx.fillStyle = '#07090f';
    ctx.fillRect(0, 0, this.W, this.H);
    const sOff = this.reduce ? 0 : this.scrollY;
    for (const layer of this.stars) {
      // A2: spring the mouse offset toward its target per layer.
      if (!this.reduce) {
        layer.cx += (this.tMx - layer.cx) * layer.damp;
        layer.cy += (this.tMy - layer.cy) * layer.damp;
      }
      const sp = layer.par * this.speedMul;
      const ox = -layer.cx * sp;
      const oy = -(sOff * layer.par) - layer.cy * sp;
      for (const s of layer.list) {
        const px = s.x + ox, py = s.y + oy;
        if (px < -4 || px > this.W + 4 || py < -4 || py > this.H + 4) continue;
        let a = s.o;
        if (s.tw && !this.reduce) {
          const u = 0.5 + 0.5 * Math.sin(now / 1000 / s.period * 6.2832 + s.phase);
          a = s.o * (0.4 + 0.6 * u);                    // base*0.4 .. base
        }
        ctx.globalAlpha = a;
        ctx.fillStyle = `rgb(${s.col})`;
        ctx.beginPath(); ctx.arc(px, py, s.r, 0, 6.2832); ctx.fill();
      }
    }
    // A4: lone meteor.
    if (this.meteor) {
      const m = this.meteor;
      const k = (now - m.t0) / m.dur;
      if (k >= 1) { this.meteor = null; }
      else {
        const hx = m.x0 + m.dx * k, hy = m.y0 + m.dy * k;
        const dirN = Math.hypot(m.dx, m.dy) || 1;
        const ux = m.dx / dirN, uy = m.dy / dirN;
        const tailX = hx - ux * 80, tailY = hy - uy * 80;
        const g = ctx.createLinearGradient(tailX, tailY, hx, hy);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(1, 'rgba(255,255,255,0.35)');
        ctx.strokeStyle = g; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(hx, hy, 1, 0, 6.2832); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  _loop(now) {
    // transition-acceleration tween
    if (this.accel) {
      const a = this.accel;
      let k = Math.min(1, (now - a.t0) / a.dur);
      const e = a.ein ? k * k : 1 - (1 - k) * (1 - k);
      this.speedMul = a.from + (a.to - a.from) * e;
      if (k >= 1) this.accel = null;
    }
    if (!this.reduce) {
      if (!this.meteor && now >= this.nextMeteor) {
        this._spawnMeteor(now);
        this.nextMeteor = now + (45 + this.rngM() * 45) * 1000;
      }
      this._draw(now);
    }
    requestAnimationFrame(this._loop);
  }
}

export function mountStarField(opts) {
  if (!STARFIELD_ENABLED) return null;
  if (document.getElementById('ambient')) return window.__starfield || null;
  const sf = new StarField(opts);
  window.__starfield = sf;            // shared handle for transition acceleration
  return sf;
}
