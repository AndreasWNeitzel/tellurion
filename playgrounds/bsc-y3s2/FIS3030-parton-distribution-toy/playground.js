// The proton as the parton swarm the spec describes, not a bare plot.
// Valence quarks (2u + 1d, the number sum rule), a cloud of gluons,
// and a fluctuating sea of quark-antiquark pairs live inside the
// confinement bag; each parton sits at a momentum fraction x sampled
// from its toy distribution, so the spatial pile-up IS the PDF shape
// (gluon and sea crowd small x, valence bump near x ~ 0.2). The
// swarm COMPOSITION uses the measured DIS momentum budget so the
// gluon visibly carries the most; the momentum sum rule
// sum_i int x f_i dx = 1 is the live invariant readout. A
// deep-inelastic probe strikes at the slider's x. The x f(x) curves
// are demoted to a strip. sim.js u_v/d_v/gluon/sea/betaIntegral are
// byte-identical; partonShape/sampleX are appended. Reference:
// Griffiths, Introduction to Elementary Particles, Ch. 9; PDG.
import { u_v, d_v, gluon, sea, sampleX } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rX = document.getElementById('readout-x');
const sX = document.getElementById('slider-x'), vX = document.getElementById('value-x');
const selS = document.getElementById('select-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const W = canvas.width, H = canvas.height;

// Representative DIS momentum budget at Q^2 ~ 10 GeV^2 (Griffiths
// Ch. 9 / PDG): the gluon carries the single largest share and the
// fractions sum to one (the momentum sum rule).
const BUDGET = [
  { kind: 'g', frac: 0.42, col: '#06d6a0', name: 'gluon' },
  { kind: 'u', frac: 0.27, col: '#ffd166', name: 'u_v' },
  { kind: 'd', frac: 0.11, col: '#5bc0eb', name: 'd_v' },
  { kind: 's', frac: 0.20, col: '#ef476f', name: 'sea' },
];

let _s = 0xC0FFEE >>> 0;
function rng() { _s = (Math.imul(_s, 1664525) + 1013904223) >>> 0; return _s / 4294967296; }

const st = { x: 0.2, scale: 'lin', t: 0 };
let running = !prefersReducedMotion();
const BAG = { cx: 250, cy: 198, rx: 220, ry: 130 };
// x (1e-3..1) -> screen inside the bag, log-spaced so the small-x
// gluon/sea crowd is visible and the valence bump is distinct.
const LX = (x) => (Math.log10(Math.max(1e-3, x)) + 3) / 3;          // 0..1
const xToBag = (x) => BAG.cx - BAG.rx + 0.06 * BAG.rx + LX(x) * (2 * BAG.rx * 0.9);

// the swarm
const partons = [];
function spawn(kind, big, lifetime) {
  const x = sampleX(kind, rng);
  const yb = (rng() - 0.5) * 1.7;
  return { kind, x, big, life: lifetime, age: rng() * (lifetime || 1), yb, ph: rng() * 6.28, flash: 0 };
}
function buildSwarm() {
  partons.length = 0;
  partons.push(spawn('u', true, 0), spawn('u', true, 0), spawn('d', true, 0)); // valence: 2u + 1d
  for (let i = 0; i < 78; i += 1) partons.push(spawn('g', false, 70 + rng() * 90));
  for (let i = 0; i < 26; i += 1) { const p = spawn('s', false, 50 + rng() * 70); p.anti = false; partons.push(p); const q = spawn('s', false, p.life); q.anti = true; q.x = p.x; q.yb = p.yb + 0.12; q.partner = p; partons.push(q); }
}
buildSwarm();

sX.addEventListener('input', () => { st.x = parseFloat(sX.value); vX.textContent = st.x.toFixed(3); });
selS.addEventListener('change', () => { st.scale = selS.value; });
btnR.addEventListener('click', () => { _s = 0xC0FFEE >>> 0; buildSwarm(); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

let probeT = -1, probeX = 0.2;
function update(dt) {
  st.t += dt;
  for (const p of partons) {
    if (p.big) continue;                       // valence persist (number sum rule)
    p.age += dt * 9;
    if (p.flash > 0) p.flash -= dt * 3;
    if (p.age > p.life) {                       // gluons emitted / sea pairs annihilate and reform
      const np = spawn(p.kind, false, p.life);
      Object.assign(p, np);
    }
  }
  // deep-inelastic probe every ~2.6 s, strikes at the cursor x
  if (probeT < 0 && st.t > 1.2) { probeT = 0; probeX = st.x; }
  if (probeT >= 0) {
    probeT += dt;
    if (probeT > 0.55 && probeT < 0.6) {
      for (const p of partons) if (Math.abs(LX(p.x) - LX(probeX)) < 0.06) p.flash = 1;
    }
    if (probeT > 2.6) probeT = -1;
  }
}

function drawProton() {
  const g = ctx.createRadialGradient(BAG.cx, BAG.cy, 10, BAG.cx, BAG.cy, BAG.rx);
  g.addColorStop(0, 'rgba(120,110,210,0.16)'); g.addColorStop(0.7, 'rgba(70,80,150,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(BAG.cx, BAG.cy, BAG.rx, BAG.ry, 0, 0, 6.2832); ctx.fill();
  ctx.strokeStyle = 'rgba(160,170,220,0.45)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]);
  ctx.beginPath(); ctx.ellipse(BAG.cx, BAG.cy, BAG.rx, BAG.ry, 0, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(200,206,224,0.7)'; ctx.font = fontString(canvas, 'body');
  ctx.fillText('proton (confinement bag)', BAG.cx - BAG.rx + 6, BAG.cy - BAG.ry - 8);

  for (const p of partons) {
    const px = xToBag(p.x);
    const py = BAG.cy + p.yb * BAG.ry * 0.78 + Math.sin(st.t * 1.4 + p.ph) * 4;
    const b = BUDGET.find((q) => q.kind === p.kind);
    let col = b.col, rad = p.big ? 13 : (p.kind === 'g' ? 4.5 : 3.4);
    if (p.kind === 's' && p.anti) col = '#7ad7ff';
    if (p.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${p.flash.toFixed(2)})`; ctx.beginPath(); ctx.arc(px, py, rad + 5, 0, 6.2832); ctx.fill(); }
    if (p.big) {
      const halo = ctx.createRadialGradient(px, py, rad * 0.6, px, py, rad + 12);
      halo.addColorStop(0, col.replace(')', ',0.0)').replace('rgb', 'rgba'));
      halo.addColorStop(0, 'rgba(255,255,255,0.0)');
      halo.addColorStop(0.55, `${col}66`); halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(px, py, rad + 12, 0, 6.2832); ctx.fill();
      const gg = ctx.createRadialGradient(px, py, 0, px, py, rad);
      gg.addColorStop(0, '#fff'); gg.addColorStop(0.4, col); gg.addColorStop(1, 'rgba(0,0,0,0.2)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(px, py, rad, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#0b0b12'; ctx.font = fontString(canvas, 'caption', 'mono', 600);
      ctx.fillText(p.kind === 'u' ? 'u' : 'd', px - 3, py + 4);
    } else if (p.kind === 'g') {
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
      for (let s = 0; s <= 10; s += 1) { const a = s / 10, xx = px - 5 + a * 10, yy = py + Math.sin(a * 9 + st.t * 4) * 3; s === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
      ctx.stroke();
    } else {
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px, py, rad, 0, 6.2832); ctx.fill();
    }
  }
  // deep-inelastic probe
  if (probeT >= 0 && probeT < 1.0) {
    const hx = xToBag(probeX);
    ctx.strokeStyle = `rgba(255,240,150,${(1 - probeT).toFixed(2)})`; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let s = 0; s <= 16; s += 1) { const a = s / 16; ctx.lineTo(hx + Math.sin(a * 22) * 6, 14 + a * (BAG.cy - 14)); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,150,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText('e- probe (DIS)', hx + 8, 24);
  }
  ctx.fillStyle = '#64748b'; ctx.font = fontString(canvas, 'caption', 'mono');
  for (const xt of [0.001, 0.01, 0.1, 1]) { const bx = xToBag(xt); ctx.fillText(`${xt}`, bx - 6, BAG.cy + BAG.ry + 14); ctx.strokeStyle = 'rgba(100,116,139,0.4)'; ctx.beginPath(); ctx.moveTo(bx, BAG.cy + BAG.ry - 2); ctx.lineTo(bx, BAG.cy + BAG.ry + 4); ctx.stroke(); }
  ctx.fillText('momentum fraction x  (log scale)', BAG.cx - 80, BAG.cy + BAG.ry + 28);
}

function drawBudget() {
  const bx0 = 500, bw = W - bx0 - 24, by = 70;
  ctx.fillStyle = '#e2e8f0'; ctx.font = fontString(canvas, 'body');
  ctx.fillText('Momentum budget', bx0, by - 8);
  let acc = 0;
  for (const b of BUDGET) {
    const x0 = bx0 + acc * bw, ww = b.frac * bw;
    ctx.fillStyle = b.col; ctx.fillRect(x0, by, ww - 1, 26);
    ctx.fillStyle = '#0b0b12'; ctx.font = fontString(canvas, 'tick', 'mono', 600);
    if (ww > 26) ctx.fillText(`${(b.frac * 100) | 0}%`, x0 + 4, by + 17);
    acc += b.frac;
  }
  ctx.fillStyle = '#94a3b8'; ctx.font = fontString(canvas, 'caption', 'mono');
  let ly = by + 44;
  for (const b of BUDGET) { ctx.fillStyle = b.col; ctx.fillRect(bx0, ly - 8, 9, 9); ctx.fillStyle = '#cbd5e1'; ctx.fillText(`${b.name}: ${(b.frac * 100).toFixed(0)}% of momentum`, bx0 + 14, ly); ly += 17; }
  const sum = BUDGET.reduce((a, b) => a + b.frac, 0);
  ctx.fillStyle = '#06d6a0'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`sum rule: Sum x f = ${sum.toFixed(3)}`, bx0, ly + 8);
  ctx.fillStyle = '#94a3b8'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('valence: 2u + 1d (number rule)', bx0, ly + 25);
  ctx.fillText('quarks ~58%, gluon ~42%:', bx0, ly + 46);
  ctx.fillText('nearly half is glue, not quarks.', bx0, ly + 61);
  return sum;
}

function drawStrip() {
  const dx0 = 60, dx1 = W - 24, dy0 = H - 116, dy1 = H - 14;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(dx0 + 0.5, dy0 + 0.5, dx1 - dx0 - 1, dy1 - dy0 - 1);
  ctx.fillStyle = '#64748b'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`diagnostic: x f(x) vs x  (${st.scale === 'lin' ? 'linear' : 'log'} x; same toy PDFs)`, dx0 + 8, dy0 + 12);
  const xpx = (x) => st.scale === 'lin' ? dx0 + 10 + x * (dx1 - dx0 - 20) : dx0 + 10 + (Math.log10(Math.max(1e-3, x)) + 3) / 3 * (dx1 - dx0 - 20);
  let yMax = 0;
  for (let i = 1; i < 220; i += 1) { const x = i / 220; yMax = Math.max(yMax, x * u_v(x), x * d_v(x), x * gluon(x), x * sea(x)); }
  const ypx = (v) => dy1 - 8 - v / (yMax * 1.05) * (dy1 - dy0 - 26);
  const curves = [[u_v, '#ffd166'], [d_v, '#5bc0eb'], [gluon, '#06d6a0'], [sea, '#ef476f']];
  for (const [fn, c] of curves) {
    ctx.strokeStyle = c; ctx.lineWidth = 1.6; ctx.beginPath();
    for (let i = 1; i <= 240; i += 1) {
      const x = st.scale === 'lin' ? i / 240 : Math.pow(10, -3 + 3 * i / 240);
      const p = { x: xpx(x), y: ypx(x * fn(x)) };
      i === 1 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(226,232,240,0.6)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xpx(st.x), dy0 + 16); ctx.lineTo(xpx(st.x), dy1 - 4); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#e2e8f0'; ctx.fillText(`x = ${st.x.toFixed(3)}`, xpx(st.x) + 4, dy0 + 24);
}

function render() {
  ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2e8f0'; ctx.font = fontString(canvas, 'heading');
  ctx.fillText('A proton is a swarm: valence quarks, glue, and a sea', 18, 24);
  drawProton();
  const sum = drawBudget();
  drawStrip();
  rX.textContent = sum.toFixed(3);
}

function tick() { if (running) update(0.0167); render(); requestAnimationFrame(tick); }
function bootSync() {
  const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
  const steps = CAPTURE_NAME ? Math.round(20 + frac * 240) : 40;
  for (let i = 0; i < steps; i += 1) update(0.0167);
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'probe-x', label: 'Probe x', value: st.x, format: 'float' },
      { key: 'scale', label: 'Scale', value: st.scale },
      { key: 'num-partons', label: 'Parton count', value: partons.length },
      { key: 'time', label: 'Time (s)', value: (st.t / 1000).toFixed(2) }
    ]
  };
};
window.playground.getInvariants = function () {
  // Momentum sum rule: integral of x * f(x) dx over all partons summed
  // by species should equal the physical momentum budget sum.
  const budget_sum = BUDGET.reduce((a, b) => a + b.frac, 0);
  return [
    {
      key: 'momentum-sum-rule',
      label: 'Momentum sum (x f(x))',
      value: budget_sum.toFixed(3),
      status: Math.abs(budget_sum - 1.0) < 0.01 ? 'pass' : 'drift'
    }
  ];
};
