// Persistent parallax star field that sits behind all page content.
// Three procedurally generated layers from the shared seeded RNG (a
// fixed seed, so every page renders the identical field and it never
// flickers or "reinitialises" across navigations). Stars are nearly
// still: the only motion is a slow parallax drift on scroll and mouse,
// and even that is disabled under prefers-reduced-motion. No shooting
// stars, no pulsing. Reference: design spec Section 3.
import { mulberry32 } from './render/rng.js';

const LAYERS = [
  { n: 300, omin: 0.25, omax: 0.45, r: 0.5, par: 0.015 },
  { n: 120, omin: 0.15, omax: 0.30, r: 0.8, par: 0.008 },
  { n: 40, omin: 0.08, omax: 0.18, r: 1.2, par: 0.003 },
];

export class StarField {
  constructor({ seed = 0xC0FFEE } = {}) {
    this.seed = seed >>> 0;
    this.reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const c = document.createElement('canvas');
    c.id = 'ambient';
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;display:block';
    this.canvas = c;
    this.ctx = c.getContext('2d', { alpha: false });
    document.body.appendChild(c);

    this.scrollY = window.scrollY || 0;
    this.mx = 0; this.my = 0;            // mouse offset from viewport centre
    this.lastScroll = -999; this.lastMx = -999; this.lastMy = -999;
    this.dirty = true;

    this._resize = this._resize.bind(this);
    this._onScroll = () => { this.scrollY = window.scrollY || 0; this._mark(); };
    this._onMouse = (e) => {
      if (this.reduce) return;
      this.mx = e.clientX - window.innerWidth / 2;
      this.my = e.clientY - window.innerHeight / 2;
      this._mark();
    };
    this._resize();
    window.addEventListener('resize', this._resize);
    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('mousemove', this._onMouse, { passive: true });
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _mark() {
    // Only flag a redraw when scroll or mouse moved more than 2 px.
    if (Math.abs(this.scrollY - this.lastScroll) > 2
      || Math.abs(this.mx - this.lastMx) > 2
      || Math.abs(this.my - this.lastMy) > 2) this.dirty = true;
  }

  _resize() {
    const W = window.innerWidth, H = window.innerHeight;
    this.W = W; this.H = H;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = W * this.dpr;
    this.canvas.height = H * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // Generate stars over a margin so parallax never exposes an edge.
    const rng = mulberry32(this.seed);
    const MX = 80;
    this.stars = [];
    for (const L of LAYERS) {
      const layer = [];
      for (let i = 0; i < L.n; i += 1) {
        const t = rng();
        // 85% white, 10% faint blue-white, 5% faint warm white
        const col = t < 0.85 ? '255,255,255' : t < 0.95 ? '200,216,255' : '255,244,224';
        layer.push({
          x: rng() * (W + 2 * MX) - MX,
          y: rng() * (H + 2 * MX) - MX,
          o: L.omin + rng() * (L.omax - L.omin),
          r: L.r, col,
        });
      }
      this.stars.push({ par: L.par, list: layer });
    }
    this.dirty = true;
  }

  _draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#07090f';
    ctx.fillRect(0, 0, this.W, this.H);
    const sOff = this.reduce ? 0 : this.scrollY;
    const mxO = this.reduce ? 0 : this.mx;
    const myO = this.reduce ? 0 : this.my;
    for (const layer of this.stars) {
      const ox = -mxO * layer.par, oy = -(sOff * layer.par) - myO * layer.par;
      for (const s of layer.list) {
        let px = s.x + ox, py = s.y + oy;
        if (px < -4 || px > this.W + 4 || py < -4 || py > this.H + 4) continue;
        ctx.globalAlpha = s.o;
        ctx.fillStyle = `rgb(${s.col})`;
        ctx.beginPath(); ctx.arc(px, py, s.r, 0, 6.2832); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    this.lastScroll = this.scrollY; this.lastMx = this.mx; this.lastMy = this.my;
  }

  _loop() {
    if (this.dirty) { this._draw(); this.dirty = false; }
    requestAnimationFrame(this._loop);
  }
}

export function mountStarField(opts) {
  if (document.getElementById('ambient')) return null;   // already present
  return new StarField(opts);
}
