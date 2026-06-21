import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for the Jeans gravitational instability, Canvas2D
// only. Top region: a density ripple of the chosen wavelength that
// oscillates as a sound wave (below the Jeans length) or collapses
// exponentially (above it). Bottom region: the growth rate (collapse)
// or oscillation frequency (stable) versus wavelength, crossing zero at
// the Jeans length.
//
// Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics,
// 2nd ed., Ch. 12.

import { jeansLengthM, jeansMassKg, omegaSquared, nToRho, isothermalCs, G_SI, PC_M, M_SUN } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderTemp = document.getElementById('slider-temp');
const sliderN = document.getElementById('slider-n');
const sliderLam = document.getElementById('slider-lam');
const valueTemp = document.getElementById('value-temp');
const valueN = document.getElementById('value-n');
const valueLam = document.getElementById('value-lam');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const SEC_PER_MYR = 3.156e13, A0 = 0.12, AMAX = 0.92;
let running = !DETERMINISTIC;
let phi = 0, hold = 0;

function tempK() { return parseFloat(sliderTemp.value); }
function nCm3() { return Math.pow(10, parseFloat(sliderN.value)); }
function lamPc() { return parseFloat(sliderLam.value); }
function cs() { return isothermalCs(tempK()); }
function rho() { return nToRho(nCm3()); }
function lamJpc() { return jeansLengthM(cs(), rho()) / PC_M; }
function w2() { const k = 2 * Math.PI / (lamPc() * PC_M); return omegaSquared(k, cs(), rho()); }

function syncVals() {
  valueTemp.textContent = `${tempK().toFixed(0)} K`;
  valueN.textContent = `1e${parseFloat(sliderN.value).toFixed(1)}`;
  valueLam.textContent = `${lamPc().toFixed(1)} pc`;
}
[sliderTemp, sliderN, sliderLam].forEach((el) => el.addEventListener('input', () => { syncVals(); phi = 0; hold = 0; render(); }));
btnReset.addEventListener('click', () => {
  sliderTemp.value = '10'; sliderN.value = '3'; sliderLam.value = '5'; phi = 0; hold = 0;
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); render();
});
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.7 },
    { name: 'diagnostic', weight: 1.3 },
  ]);
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    collapse: '#ef5466', stable: '#5bc0eb',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
}

// warm "gas" colour for normalized density d in [0, 2]; brighter = denser.
function gasColor(d) {
  const t = Math.max(0, Math.min(1, d / 2));
  const r = Math.round(255 * Math.min(1, t * 1.7));
  const g = Math.round(255 * Math.max(0, (t - 0.32) * 1.5));
  const b = Math.round(255 * Math.max(0, (t - 0.72) * 3.2));
  return `rgb(${r},${g},${b})`;
}

function panel(col, r, title) {
  ctx.fillStyle = col.panel;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.fillStyle = col.muted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

function amplitude(unstable) {
  return unstable ? Math.min(AMAX, A0 * Math.cosh(phi)) : A0 * 3.2 * Math.cos(phi);
}

function drawScene(col, r) {
  const unstable = w2() < 0;
  panel(col, r, unstable ? 'A density ripple running away: gravity wins' : 'A density ripple sloshing: a sound wave');

  const titleH = 22, stripH = 28;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const A = amplitude(unstable);
  const cyc = 2.5;                       // wavelengths shown
  const slabY = draw.y + draw.h * 0.36, slabH = draw.h * 0.54;

  ctx.save();
  clipTo(ctx, draw);

  // density bands.
  const NB = 200;
  for (let i = 0; i < NB; i++) {
    const xf = i / NB, kx = xf * cyc * 2 * Math.PI;
    const d = 1 + A * Math.cos(kx);
    ctx.fillStyle = gasColor(d);
    ctx.fillRect(draw.x + xf * draw.w, slabY, draw.w / NB + 1, slabH);
  }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(draw.x, slabY, draw.w, slabH);

  // density profile curve above the slab.
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= NB; i++) { const xf = i / NB, kx = xf * cyc * 2 * Math.PI; const d = 1 + A * Math.cos(kx); const X = draw.x + xf * draw.w, Y = slabY - 14 - (d - 1) / Math.max(0.3, A + 0.05) * (draw.h * 0.13); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
  ctx.stroke();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText('density ρ(x)', draw.x + 6, slabY - 16 - draw.h * 0.13 - 2);

  // clump markers when collapsing hard.
  if (unstable && A > 0.45) {
    for (let m = 0; m < cyc; m++) {
      const xf = (m + 0.0) / cyc; const X = draw.x + xf * draw.w;
      ctx.fillStyle = 'rgba(255,240,200,0.9)'; ctx.beginPath(); ctx.arc(X, slabY + slabH / 2, 3 + 7 * A, 0, 2 * Math.PI); ctx.fill();
    }
  }

  // regime label.
  ctx.fillStyle = unstable ? col.collapse : col.stable; ctx.font = fontString(canvas, 'heading', 'sans', 800);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(unstable ? 'COLLAPSING' : 'STABLE (sound wave)', draw.x + draw.w / 2, draw.y + draw.h * 0.04);

  ctx.restore();

  // readout strip.
  const lj = lamJpc(), ratio = lamPc() / lj;
  const Mj = jeansMassKg(cs(), rho()) / M_SUN;
  const items = [
    [unstable ? 'collapse' : 'stable', unstable ? col.collapse : col.stable],
    [`λ/λ_J ${ratio.toFixed(2)}`, col.accent],
    [`λ_J ${lj.toFixed(2)}pc`, col.muted],
    [`M_J ${Mj.toFixed(0)}M⊙`, col.muted],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - stripH / 2 + 1); });
}

const LAM_MIN = 0.1, LAM_MAX = 30;
function rateMyr(lpc) {
  const k = 2 * Math.PI / (lpc * PC_M); const ww = omegaSquared(k, cs(), rho());
  const r = ww < 0 ? Math.sqrt(-ww) : -Math.sqrt(ww);   // + = growth (collapse), - = oscillation
  return r * SEC_PER_MYR;
}
function drawDiagnostic(col, r) {
  panel(col, r, 'Growth rate vs wavelength (zero at the Jeans length)');

  const inner = { x: r.x + 50, y: r.y + 28, w: r.w - 50 - 16, h: r.h - 28 - 42 };
  // y-range tied to the maximum growth rate sqrt(4 pi G rho) so the
  // collapse branch (which plateaus there) is fully visible; the much
  // larger short-wavelength sound frequencies are clipped.
  const mx = 1.7 * Math.sqrt(4 * Math.PI * G_SI * rho()) * SEC_PER_MYR;
  const N = 160, pts = [];
  for (let i = 0; i <= N; i++) { const lpc = LAM_MIN * Math.pow(LAM_MAX / LAM_MIN, i / N); pts.push([lpc, Math.max(-mx, Math.min(mx, rateMyr(lpc)))]); }
  const lx = (lpc) => inner.x + (Math.log10(lpc) - Math.log10(LAM_MIN)) / (Math.log10(LAM_MAX) - Math.log10(LAM_MIN)) * inner.w;
  const cy = inner.y + inner.h / 2;
  const yOf = (rt) => cy - (rt / mx) * (inner.h / 2);

  // collapse / stable shading split at lambda_J.
  const lj = lamJpc(), xj = lx(lj);
  ctx.fillStyle = 'rgba(239,84,102,0.10)'; ctx.fillRect(xj, inner.y, inner.x + inner.w - xj, inner.h);
  ctx.fillStyle = 'rgba(91,192,235,0.08)'; ctx.fillRect(inner.x, inner.y, xj - inner.x, inner.h);

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(inner.x, cy); ctx.lineTo(inner.x + inner.w, cy); ctx.stroke();
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('0', inner.x - 5, cy);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const l of [0.1, 1, 10]) if (l >= LAM_MIN && l <= LAM_MAX) ctx.fillText(`${l}`, lx(l), inner.y + inner.h + 6);

  // curve.
  ctx.strokeStyle = col.accent; ctx.lineWidth = 2.6; ctx.beginPath();
  pts.forEach((p, i) => { const X = lx(p[0]), Y = yOf(p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke();

  // lambda_J line + current lambda marker.
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(xj, inner.y); ctx.lineTo(xj, inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.fg; ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('λ_J', xj, inner.y + 3);
  const cl = lamPc(); const cur = rateMyr(cl), curC = Math.max(-mx, Math.min(mx, cur));
  ctx.fillStyle = cur > 0 ? col.collapse : col.stable; ctx.beginPath(); ctx.arc(lx(cl), yOf(curC), 5, 0, 2 * Math.PI); ctx.fill();

  // region labels.
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textBaseline = 'bottom';
  ctx.fillStyle = col.collapse; ctx.textAlign = 'left'; ctx.fillText('collapse →', xj + 6, inner.y + inner.h - 4);
  ctx.fillStyle = col.stable; ctx.textAlign = 'right'; ctx.fillText('← sound waves', xj - 6, inner.y + 16);

  // labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('wavelength λ (pc, log)', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 38, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('growth rate (1/Myr)', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) {
    const ww = w2(), unstable = ww < 0;
    const rateRef = Math.sqrt(4 * Math.PI * G_SI * rho());
    const vr = Math.min(1.4, Math.sqrt(Math.abs(ww)) / rateRef);
    if (unstable) {
      if (amplitude(true) >= AMAX - 1e-6) { hold += 1; if (hold > 45) { phi = 0; hold = 0; } }
      else phi += vr * 1.4 * dt;
    } else { phi += vr * 2.2 * dt; }
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() { syncVals(); relayout(); phi = 1.2; render(); }

window.addEventListener('load', bootSync);
if (document.readyState !== 'loading') bootSync();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => { relayout(); render(); }).observe(canvas);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else if (!CAPTURE_NAME) {
  requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'regime', label: 'regime', value: w2() < 0 ? 'collapse' : 'stable', format: 'text' },
      { key: 'ratio', label: 'λ / λ_J', value: lamPc() / lamJpc(), format: 'float' },
      { key: 'lamJ', label: 'Jeans length (pc)', value: lamJpc(), format: 'float' },
      { key: 'Mj', label: 'Jeans mass (M_sun)', value: jeansMassKg(cs(), rho()) / M_SUN, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // Jeans criterion: the mode is unstable (omega^2 < 0) exactly when its
    // wavelength exceeds the Jeans length.
    const ww = w2();
    const consistent = (ww < 0) === (lamPc() > lamJpc());
    return [{
      key: 'jeans',
      label: 'ω² < 0  ⟺  λ > λ_J',
      value: (ww * SEC_PER_MYR * SEC_PER_MYR).toExponential(2),
      status: consistent ? 'pass' : 'drift',
    }];
  } catch (e) {
    return [];
  }
};
