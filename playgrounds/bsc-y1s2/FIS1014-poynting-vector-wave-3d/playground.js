import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for the Poynting vector of a plane EM wave, Canvas2D
// only. Top region: the electric (red) and magnetic (blue) fields drawn
// at right angles in pseudo-3D, propagating along z, with the energy-flow
// arrows S = E x B (gold). Bottom region: the E and B components and the
// Poynting flow S along the wave, with the cycle-averaged flow.
//
// Reference: Griffiths, Introduction to Electrodynamics, 4th ed., Sec.
// 9.2; Jackson, Classical Electrodynamics, Ch. 7.

import { fields, dot, norm } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selMode = document.getElementById('select-mode');
const sliderK = document.getElementById('slider-k');
const valueMode = document.getElementById('value-mode');
const valueK = document.getElementById('value-k');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const ZMAX = 13, E0 = 1;
let running = !DETERMINISTIC;
let t = 0;
function mode() { return selMode.value; }
function kVal() { return parseFloat(sliderK.value); }
function opts() { return { mode: mode(), k: kVal(), E0, pol: 0 }; }

function syncVals() { valueMode.textContent = mode(); valueK.textContent = kVal().toFixed(1); }
selMode.addEventListener('change', () => { syncVals(); render(); });
sliderK.addEventListener('input', () => { syncVals(); render(); });
btnReset.addEventListener('click', () => {
  selMode.value = 'linear'; sliderK.value = '1.0'; t = 0;
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
    { name: 'scene', weight: 1.85 },
    { name: 'diagnostic', weight: 1.15 },
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
    E: '#ef5466', B: '#5b8def', S: '#ffce4d',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
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

// cycle-averaged Poynting flow at mid-z (numeric, robust for all modes).
function avgS() {
  const o = opts(), w = o.k, z = ZMAX / 2;
  let s = 0; const M = 240;
  for (let n = 0; n < M; n++) s += fields(z, (n / M) * (2 * Math.PI / w), o).S[2];
  return s / M;
}

function drawScene(col, r) {
  panel(col, r, 'E (red) ⟂ B (blue), energy flows along S (gold)');

  const titleH = 22, stripH = 28;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const ox = draw.x + 30, oy = draw.y + draw.h * 0.46;
  const zS = (draw.w - 60) / ZMAX, AMP = draw.h * 0.26;
  const DDx = 0.46 * AMP, DDy = -0.32 * AMP;   // depth axis (y-field) on screen
  const bp = (z) => [ox + z * zS, oy];
  // field vector v=(vx,vy,0) -> screen tip offset from base.
  const tip = (b, v) => [b[0] + v[1] * DDx, b[1] - v[0] * AMP - v[1] * DDy];
  const o = opts();

  ctx.save();
  clipTo(ctx, draw);

  // depth-axis hint + propagation axis.
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(bp(0)[0], bp(0)[1]); ctx.lineTo(bp(ZMAX)[0], bp(ZMAX)[1]); ctx.stroke();
  { const e = bp(ZMAX); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.moveTo(e[0], e[1]); ctx.lineTo(e[0] - 9, e[1] - 5); ctx.lineTo(e[0] - 9, e[1] + 5); ctx.closePath(); ctx.fill(); }

  const N = 120;
  // S energy-flow arrows along the axis (under it).
  for (let i = 0; i < 9; i++) {
    const z = ZMAX * (i + 0.5) / 9; const b = bp(z); const Sz = fields(z, t, o).S[2];
    const L = Sz * zS * 0.6; if (Math.abs(L) < 1.5) continue;
    const y = b[1] + AMP * 0.62;
    ctx.strokeStyle = col.S; ctx.fillStyle = col.S; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(b[0], y); ctx.lineTo(b[0] + L, y); ctx.stroke();
    const dir = Math.sign(L);
    ctx.beginPath(); ctx.moveTo(b[0] + L, y); ctx.lineTo(b[0] + L - dir * 6, y - 4); ctx.lineTo(b[0] + L - dir * 6, y + 4); ctx.closePath(); ctx.fill();
  }

  // E and B ribbons (tips connected).
  const drawRibbon = (pick, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.beginPath();
    for (let i = 0; i <= N; i++) { const z = ZMAX * i / N; const f = fields(z, t, o); const p = tip(bp(z), pick(f)); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
    ctx.stroke();
  };
  // field vectors (stems) at a subset.
  const drawStems = (pick, color) => {
    ctx.strokeStyle = color; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.4;
    for (let i = 0; i <= 24; i++) { const z = ZMAX * i / 24; const b = bp(z); const p = tip(b, pick(fields(z, t, o))); ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); }
    ctx.globalAlpha = 1;
  };
  drawStems((f) => f.B, col.B); drawRibbon((f) => f.B, col.B);
  drawStems((f) => f.E, col.E); drawRibbon((f) => f.E, col.E);

  // labels.
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textBaseline = 'middle';
  ctx.fillStyle = col.E; ctx.textAlign = 'left'; ctx.fillText('E', tip(bp(0.2), fields(0.2, t, o).E)[0] + 4, tip(bp(0.2), fields(0.2, t, o).E)[1]);
  ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('z (propagation) →', bp(ZMAX)[0] - 4, bp(ZMAX)[1] + 6);

  ctx.restore();

  // readout strip.
  const f0 = fields(0.9, t, o);
  const eb = (norm(f0.E) > 1e-9 && norm(f0.B) > 1e-9) ? Math.abs(dot(f0.E, f0.B)) / (norm(f0.E) * norm(f0.B)) : 0;
  const items = [
    [mode(), col.fg],
    [`⟨S⟩ ${avgS().toFixed(2)}`, col.S],
    [`E·B ${eb.toExponential(0)}`, col.muted],
    ['E ⟂ B ⟂ S', col.accent],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - stripH / 2 + 1); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'E, B and the energy flow S along the wave');

  const inner = { x: r.x + 40, y: r.y + 28, w: r.w - 40 - 16, h: r.h - 28 - 42 };
  const o = opts();
  const N = 200;
  const E = [], B = [], S = []; let mx = 0.5;
  for (let i = 0; i <= N; i++) { const z = ZMAX * i / N; const f = fields(z, t, o); E.push(f.E[0]); B.push(f.B[1]); S.push(f.S[2]); mx = Math.max(mx, Math.abs(f.E[0]), Math.abs(f.B[1]), Math.abs(f.S[2])); }
  mx *= 1.1;
  const cy = inner.y + inner.h / 2;
  const xOf = (i) => inner.x + i / N * inner.w;
  const yOf = (v) => cy - (v / mx) * (inner.h / 2);

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(inner.x, cy); ctx.lineTo(inner.x + inner.w, cy); ctx.stroke();
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('0', inner.x - 5, cy);

  // S filled (positive forward / negative back).
  for (let i = 0; i < N; i++) {
    const v = (S[i] + S[i + 1]) / 2;
    ctx.fillStyle = v >= 0 ? 'rgba(255,206,77,0.22)' : 'rgba(91,141,239,0.22)';
    ctx.fillRect(xOf(i), Math.min(cy, yOf(S[i])), xOf(i + 1) - xOf(i) + 0.6, Math.abs(yOf(S[i]) - cy));
  }
  const plot = (arr, c, lw) => { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); arr.forEach((v, i) => { const X = xOf(i), Y = yOf(v); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke(); };
  plot(E, col.E, 2); plot(B, col.B, 2); plot(S, col.S, 2.6);

  // cycle-averaged S line.
  const aS = avgS();
  ctx.strokeStyle = 'rgba(255,206,77,0.6)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(inner.x, yOf(aS)); ctx.lineTo(inner.x + inner.w, yOf(aS)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.S; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(`⟨S⟩ = ${aS.toFixed(2)}`, inner.x + 6, yOf(aS) - 3);

  // labels + legend.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('position along z', inner.x + inner.w / 2, inner.y + inner.h + 20);
  const leg = [['E', col.E], ['B', col.B], ['S', col.S]];
  let lx = inner.x + 8; const ly = inner.y + 11;
  ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const [lab, c] of leg) { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 13, ly); ctx.stroke(); ctx.fillStyle = col.fg; ctx.fillText(lab, lx + 16, ly); lx += 40; }
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
  if (running) t += 0.9 * dt;
  render();
  requestAnimationFrame(tick);
}

function bootSync() { syncVals(); relayout(); t = 0.7; render(); }

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
      { key: 'mode', label: 'wave', value: mode(), format: 'text' },
      { key: 'k', label: 'wavenumber k', value: kVal(), format: 'float' },
      { key: 'avgS', label: 'time-averaged $\\langle S\\rangle$', value: avgS(), format: 'float' },
      { key: 'peak', label: 'peak |S|', value: E0 * E0, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // E, B, and the propagation direction are mutually perpendicular:
    // E . B = 0 everywhere (transverse wave).
    const o = opts();
    let worst = 0;
    for (let i = 0; i < 10; i++) {
      const f = fields(0.6 * i, t + 0.13 * i, o);
      const ne = norm(f.E), nb = norm(f.B);
      if (ne < 1e-6 || nb < 1e-6) continue;
      worst = Math.max(worst, Math.abs(dot(f.E, f.B)) / (ne * nb));
    }
    return [{
      key: 'transverse',
      label: 'E ⟂ B (transverse wave)',
      value: worst.toExponential(2),
      status: worst < 1e-9 ? 'pass' : (worst < 1e-4 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
