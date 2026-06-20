// playground.js
// Catenary: the shape of a uniform chain hanging under its own weight
// between two draggable supports. The chain length is fixed, so the
// catenary re-solves (sim.js solveCatenary2pt) as the supports move.
//
// Vertical 4:5 composition:
//   1. SCENE: the hanging chain (gold) with a parabola through the same
//      endpoints (dashed) and the gap between them shaded. Most people guess
//      parabola; the shaded region is how wrong that guess is.
//   2. TENSION: the tension along the chain, lowest at the bottom and highest
//      at the supports (why cables fail at their anchors).

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';
import { solveCatenary2pt, sampleCatenary2pt, catenary2ptY } from './sim.js';

const urlParams = new URLSearchParams(location.search);
const DETERMINISTIC = urlParams.get('deterministic') === '1';
const CAPTURE_NAME = urlParams.get('capture');
const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sliderA = document.getElementById('slider-a');
const valueA = document.getElementById('value-a');
const btnReset = document.getElementById('btn-reset');

const X_LIM = 2.1, Y_LIM = 3.0;

const state = {
  P1: { x: -1.6, y: 2.7 },
  P2: { x: 1.6, y: 2.7 },
  L: 6.0,             // deep default sag so the catenary visibly differs from a parabola
  drag: null,
};

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.6 },
    { name: 'tension', weight: 1.4 },
  ]);
}

function chord() { return Math.hypot(state.P2.x - state.P1.x, state.P2.y - state.P1.y); }
function colors() {
  const css = getComputedStyle(document.body);
  const g = (k, d) => css.getPropertyValue(k).trim() || d;
  return {
    bg: g('--bg', '#07090f'), panel: '#0a0c12', fg: g('--fg', '#e8e8e8'),
    muted: 'rgba(255,255,255,0.5)', accent: g('--accent', '#ffd166'),
    cool: '#7fb1d8', red: '#ef476f', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.10)',
  };
}
function panel(col, r) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
}

function sceneMap() {
  const r = REG.scene;
  const padX = 28, padTop = 44, padBot = 16;
  const sw = r.w - 2 * padX, sh = r.h - padTop - padBot;
  const s = Math.min(sw / (2 * X_LIM), sh / Y_LIM);
  const ox = r.x + r.w / 2, oy = r.y + padTop;
  return { s, ox, oy, X: (x) => ox + x * s, Y: (yw) => oy + (Y_LIM - yw) * s };
}

function pxToWorld(cx, cy) {
  const rect = canvas.getBoundingClientRect();
  const x = (cx - rect.left) * (view.w / rect.width);
  const yp = (cy - rect.top) * (view.h / rect.height);
  const m = sceneMap();
  return { x: (x - m.ox) / m.s, y: Y_LIM - (yp - m.oy) / m.s };
}

sliderA.addEventListener('input', () => {
  const t = parseFloat(sliderA.value);
  state.L = chord() * (1.02 + 0.9 * (t - 0.4) / 2.6);
  valueA.textContent = state.L.toFixed(2);
  render();
});
btnReset.addEventListener('click', () => {
  state.P1 = { x: -1.6, y: 2.7 }; state.P2 = { x: 1.6, y: 2.7 }; state.L = 6.0;
  sliderA.value = '2.87'; valueA.textContent = '6.00'; render();
});
canvas.addEventListener('pointerdown', (e) => {
  const w = pxToWorld(e.clientX, e.clientY);
  const d1 = Math.hypot(w.x - state.P1.x, w.y - state.P1.y);
  const d2 = Math.hypot(w.x - state.P2.x, w.y - state.P2.y);
  state.drag = d1 < d2 ? (d1 < 0.5 ? 1 : null) : (d2 < 0.5 ? 2 : null);
  canvas.classList.toggle('dragging', !!state.drag);
});
canvas.addEventListener('pointermove', (e) => {
  if (!state.drag) return;
  const w = pxToWorld(e.clientX, e.clientY);
  const P = state.drag === 1 ? state.P1 : state.P2;
  P.x = Math.max(-X_LIM + 0.15, Math.min(X_LIM - 0.15, w.x));
  P.y = Math.max(0.8, Math.min(Y_LIM - 0.2, w.y));
  if (state.L < chord() + 0.05) state.L = chord() + 0.05;
  render();
});
window.addEventListener('pointerup', () => { state.drag = null; canvas.classList.remove('dragging'); });

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);

  // ---- SCENE ----
  const S = REG.scene;
  panel(col, S);
  const m = sceneMap();
  const left = state.P1.x <= state.P2.x ? state.P1 : state.P2;
  const right = state.P1.x <= state.P2.x ? state.P2 : state.P1;
  const sol = solveCatenary2pt(left.x, left.y, right.x, right.y, state.L);

  let aOut = null, sagv = 0, tMax = 0, tMin = 0, maxGap = 0;
  if (sol) {
    aOut = sol.a;
    const { xs, ys } = sampleCatenary2pt(sol, left.x, right.x, 200);
    // Lowest point.
    let xm = xs[0], ym = ys[0];
    for (let i = 1; i < xs.length; i += 1) if (ys[i] < ym) { ym = ys[i]; xm = xs[i]; }
    sagv = Math.min(left.y, right.y) - ym;
    // Parabola through the two endpoints and the lowest point.
    const x1 = left.x, y1 = left.y, x2 = right.x, y2 = right.y;
    const para = (x) => y1 * ((x - x2) * (x - xm)) / ((x1 - x2) * (x1 - xm))
      + y2 * ((x - x1) * (x - xm)) / ((x2 - x1) * (x2 - xm))
      + ym * ((x - x1) * (x - x2)) / ((xm - x1) * (xm - x2));

    // Shaded gap between catenary and parabola.
    ctx.beginPath();
    for (let i = 0; i < xs.length; i += 1) { const p = [m.X(xs[i]), m.Y(ys[i])]; i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    for (let i = xs.length - 1; i >= 0; i -= 1) { ctx.lineTo(m.X(xs[i]), m.Y(para(xs[i]))); }
    ctx.closePath(); ctx.fillStyle = 'rgba(127,177,216,0.24)'; ctx.fill();
    for (let i = 0; i < xs.length; i += 1) maxGap = Math.max(maxGap, Math.abs(ys[i] - para(xs[i])));

    // Parabola (dashed).
    ctx.strokeStyle = 'rgba(127,177,216,0.85)'; ctx.lineWidth = 1.6; ctx.setLineDash([6, 5]);
    ctx.beginPath();
    for (let i = 0; i < xs.length; i += 1) { const p = [m.X(xs[i]), m.Y(para(xs[i]))]; i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.stroke(); ctx.setLineDash([]);

    // Catenary (gold) with chain-link beads.
    ctx.strokeStyle = col.accent; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < xs.length; i += 1) { const p = [m.X(xs[i]), m.Y(ys[i])]; i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.stroke();
    ctx.fillStyle = col.accent;
    const nBead = 16;
    for (let k = 0; k <= nBead; k += 1) {
      const x = left.x + (right.x - left.x) * k / nBead;
      ctx.beginPath(); ctx.arc(m.X(x), m.Y(catenary2ptY(sol, x)), 2.6, 0, 6.28); ctx.fill();
    }
    // Tension extremes (T_0 = mu g a at the bottom; T = mu g a cosh at supports), mu g = 1.
    tMin = aOut;
    tMax = Math.max(aOut * Math.cosh((left.x - sol.x0) / aOut), aOut * Math.cosh((right.x - sol.x0) / aOut));
  } else {
    // Too short: taut straight line.
    ctx.strokeStyle = col.red; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(m.X(left.x), m.Y(left.y)); ctx.lineTo(m.X(right.x), m.Y(right.y)); ctx.stroke();
  }

  // Supports + draggable handles.
  for (const [P, n] of [[state.P1, 1], [state.P2, 2]]) {
    const t = [m.X(P.x), m.Y(P.y)];
    ctx.fillStyle = '#c7d0de'; ctx.beginPath(); ctx.arc(t[0], t[1], 6, 0, 6.28); ctx.fill();
    ctx.strokeStyle = state.drag === n ? '#06d6a0' : 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(t[0], t[1], 12, 0, 6.28); ctx.stroke();
  }

  // Legend (left) + readout (right), kept on separate columns.
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.accent; ctx.fillText('chain', S.x + 8, S.y + 7);
  ctx.fillStyle = col.cool; ctx.fillText('parabola', S.x + 52, S.y + 7);
  ctx.font = fontString(canvas, 'mono', 'mono'); ctx.textAlign = 'right'; ctx.fillStyle = col.fg;
  if (sol) {
    ctx.fillText(`sag ${sagv.toFixed(2)}   gap ${maxGap.toFixed(2)}`, S.x + S.w - 8, S.y + 7);
  } else {
    ctx.fillStyle = col.red; ctx.fillText('taut: chain too short', S.x + S.w - 8, S.y + 7);
  }
  ctx.font = fontString(canvas, 'caption', 'sans'); ctx.fillStyle = col.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('drag a support', S.x + S.w / 2, S.y + S.h - 4);

  // ---- TENSION ----
  const T = REG.tension;
  panel(col, T);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('tension along the chain', T.x + 8, T.y + 7);
  if (sol) {
    const padL = 40, padR = 14, padT = 28, padB = 24;
    const x0 = T.x + padL, x1p = T.x + T.w - padR, pw = x1p - x0;
    const y0 = T.y + padT, y1 = T.y + T.h - padB, ph = y1 - y0;
    const tHi = tMax * 1.08;
    const fx = (x) => x0 + (x - left.x) / (right.x - left.x) * pw;
    const fy = (tv) => y1 - tv / tHi * ph;
    // gridlines.
    ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const frac of [0, 0.5, 1]) {
      const tv = tHi * frac, py = fy(tv);
      ctx.strokeStyle = col.grid; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x0, py); ctx.lineTo(x1p, py); ctx.stroke();
      ctx.fillText(tv.toFixed(1), x0 - 4, py);
    }
    // T(x) curve.
    ctx.strokeStyle = col.accent; ctx.lineWidth = 2.2; ctx.beginPath();
    const N = 120;
    for (let i = 0; i <= N; i += 1) {
      const x = left.x + (right.x - left.x) * i / N;
      const tv = aOut * Math.cosh((x - sol.x0) / aOut);
      const px = fx(x), py = fy(tv);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    // Mark min (bottom) and the support maxima.
    ctx.fillStyle = col.cool;
    ctx.beginPath(); ctx.arc(fx(sol.x0), fy(tMin), 4, 0, 6.28); ctx.fill();
    ctx.fillStyle = col.red;
    ctx.beginPath(); ctx.arc(fx(left.x), fy(aOut * Math.cosh((left.x - sol.x0) / aOut)), 4, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(fx(right.x), fy(aOut * Math.cosh((right.x - sol.x0) / aOut)), 4, 0, 6.28); ctx.fill();
    ctx.font = fontString(canvas, 'caption', 'sans'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = col.cool; ctx.fillText('min (bottom)', fx(sol.x0), fy(tMin) + 6);
    ctx.fillStyle = col.red; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText('max (supports)', x0 + 4, y0 + 12);
  } else {
    ctx.font = fontString(canvas, 'caption', 'sans'); ctx.fillStyle = col.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('chain is taut: tension set by the pull, not gravity', T.x + T.w / 2, T.y + T.h / 2);
  }
}

if (typeof ResizeObserver !== 'undefined') {
  let raf = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { relayout(); render(); });
  });
  ro.observe(canvas);
}

function bootSync() {
  relayout();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.P1 = { x: -1.7, y: 1.7 + 0.8 * f };
    state.P2 = { x: 1.7, y: 2.5 - 0.6 * f };
    state.L = chord() * (1.06 + 0.6 * f);
    valueA.textContent = state.L.toFixed(2);
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = { capture: CAPTURE_NAME };
      }));
    }
    return;
  }
  valueA.textContent = state.L.toFixed(2);
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSync, { once: true });
} else {
  bootSync();
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const span = Math.hypot(state.P2.x - state.P1.x, state.P2.y - state.P1.y);
  return {
    fields: [
      { key: 'cable-length', label: 'Chain length L', value: state.L, format: 'float' },
      { key: 'span', label: 'Support span', value: span, format: 'float' },
      { key: 'taut-ratio', label: 'L / span (taut=1)', value: state.L / Math.max(1e-6, span), format: 'float' },
      { key: 'config', label: 'Configuration', value: state.L > span ? 'slack' : 'taut', format: undefined },
    ],
  };
};
window.playground.getInvariants = function () {
  const span = Math.hypot(state.P2.x - state.P1.x, state.P2.y - state.P1.y);
  const length_gt_span = state.L >= span - 1e-6;
  return [
    {
      key: 'geometry-validity',
      label: 'L >= span (chain can reach)',
      value: length_gt_span ? 'pass' : 'fail',
      status: length_gt_span ? 'pass' : 'drift',
    },
  ];
};
