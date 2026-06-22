import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// UI binding for the lyapunov-spectrum playground. Two panels:
//   left: attractor scatter in (x, y) for the current (a, b)
//   right: parameter (a, b) panel with a draggable handle
// Live readouts show a, b, lambda_1, lambda_2, lambda_1+lambda_2, ln|b|, and N.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  lyapunovSpectrum,
  attractorPoints,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readouts     = {
  a:        document.getElementById('readout-a'),
  b:        document.getElementById('readout-b'),
  lambda1:  document.getElementById('readout-lambda1'),
  lambda2:  document.getElementById('readout-lambda2'),
  sum:      document.getElementById('readout-sum'),
  target:   document.getElementById('readout-target'),
  N:        document.getElementById('readout-N'),
};
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
// Three full-height rows so the tall portrait canvas is used end to end:
// the Henon attractor on top, the Lyapunov spectrum lambda_1,2(a) in the
// middle, the (a,b) parameter picker plus a caption on the bottom (was two
// panels stranded in the top ~40% with the lower 60% empty).
const ATT  = { x: 56, y: 52, w: W - 112, h: 372, xmin: -1.55, xmax: 1.55, ymin: -0.42, ymax: 0.42 };
const SPEC = { x: 72, y: 492, w: W - 144, h: 300, amin: 1.0, amax: 1.42, lmin: -1.85, lmax: 0.6 };
const PAR  = { x: 72, y: 820, w: 160, h: 160, amin: 1.0, amax: 1.5, bmin: 0.1, bmax: 0.4 };

const state = {
  a: 1.4,
  b: 0.3,
  result: null,
  attractor: null,
  specCurve: null,
  specB: NaN,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  dragging: false,
};

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const tokens = {
  bg:         cssVar('--bg', '#FBFBF9'),
  surface:    cssVar('--surface', '#FFFFFF'),
  fg:         cssVar('--fg', '#1A1B1C'),
  fgMuted:    cssVar('--fg-muted', '#5C5E61'),
  fgFaint:    cssVar('--fg-faint', '#9A9C9F'),
  accent:     cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
  grid:       cssVar('--grid', '#9A9C9F4D'),
};

function recompute() {
  state.result    = lyapunovSpectrum(state.a, state.b, { burnIn: 1000, accum: 100_000 });
  state.attractor = attractorPoints(state.a, state.b, { burnIn: 200, count: 5000 });
}

function pxAtt(xv, yv) {
  return {
    px: ATT.x + ((xv - ATT.xmin) / (ATT.xmax - ATT.xmin)) * ATT.w,
    py: ATT.y + (1 - (yv - ATT.ymin) / (ATT.ymax - ATT.ymin)) * ATT.h,
  };
}

function pxPar(av, bv) {
  return {
    px: PAR.x + ((av - PAR.amin) / (PAR.amax - PAR.amin)) * PAR.w,
    py: PAR.y + (1 - (bv - PAR.bmin) / (PAR.bmax - PAR.bmin)) * PAR.h,
  };
}

function drawAttractor() {
  const { x: ox, y: oy, w, h } = ATT;
  ctx.fillStyle = tokens.surface;
  ctx.fillRect(ox, oy, w, h);
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(ox + 0.5, oy + 0.5, w - 1, h - 1);

  ctx.beginPath();
  const zero = pxAtt(0, 0);
  ctx.moveTo(ox, zero.py); ctx.lineTo(ox + w, zero.py);
  ctx.moveTo(zero.px, oy); ctx.lineTo(zero.px, oy + h);
  ctx.stroke();

  ctx.fillStyle = tokens.fgFaint;
  ctx.font = fontString(canvas, 'tick');
  ctx.textAlign = 'center';
  for (const xt of [-1, 0, 1]) {
    const { px } = pxAtt(xt, 0);
    ctx.fillText(xt.toFixed(0), px, oy + h + 13);
  }
  ctx.textAlign = 'right';
  for (const yt of [-0.4, 0, 0.4]) {
    const { py } = pxAtt(0, yt);
    ctx.fillText(yt.toFixed(1), ox - 4, py + 3);
  }

  if (state.attractor && state.attractor.length > 0) {
    ctx.fillStyle = tokens.accent;
    for (let i = 0; i < state.attractor.length; i += 2) {
      const xv = state.attractor[i];
      const yv = state.attractor[i + 1];
      if (xv < ATT.xmin || xv > ATT.xmax || yv < ATT.ymin || yv > ATT.ymax) continue;
      const { px, py } = pxAtt(xv, yv);
      ctx.fillRect(px - 0.5, py - 0.5, 1, 1);
    }
  } else {
    ctx.fillStyle = tokens.accentWarm;
    ctx.textAlign = 'center';
    ctx.font = fontString(canvas, 'body');
    ctx.fillText('orbit unbounded at these parameters', ox + w / 2, oy + h / 2);
  }

  ctx.fillStyle = tokens.fgMuted;
  ctx.font = fontString(canvas, 'caption');
  ctx.textAlign = 'left';
  ctx.fillText('Henon attractor', ox, oy - 10);
  ctx.textAlign = 'right';
  ctx.fillText(`a = ${state.a.toFixed(4)}   b = ${state.b.toFixed(4)}`, ox + w, oy - 10);

  ctx.textAlign = 'center';
  ctx.fillStyle = tokens.fgFaint;
  ctx.font = fontString(canvas, 'tick');
  ctx.fillText('x', ox + w / 2, oy + h + 26);
  ctx.save();
  ctx.translate(ox - 26, oy + h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('y', 0, 0);
  ctx.restore();
}

function drawParameterPanel() {
  const { x: ox, y: oy, w, h } = PAR;
  ctx.fillStyle = tokens.surface;
  ctx.fillRect(ox, oy, w, h);
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(ox + 0.5, oy + 0.5, w - 1, h - 1);

  ctx.beginPath();
  for (const aTick of [1.1, 1.2, 1.3, 1.4]) {
    const { px } = pxPar(aTick, PAR.bmin);
    ctx.moveTo(px, oy); ctx.lineTo(px, oy + h);
  }
  for (const bTick of [0.15, 0.2, 0.25, 0.3, 0.35]) {
    const { py } = pxPar(PAR.amin, bTick);
    ctx.moveTo(ox, py); ctx.lineTo(ox + w, py);
  }
  ctx.stroke();

  ctx.fillStyle = tokens.fgFaint;
  ctx.font = fontString(canvas, 'tick');
  ctx.textAlign = 'center';
  for (const aTick of [1.0, 1.25, 1.5]) {
    const { px } = pxPar(aTick, 0);
    ctx.fillText(aTick.toFixed(2), px, oy + h + 11);
  }
  ctx.textAlign = 'right';
  for (const bTick of [0.1, 0.25, 0.4]) {
    const { py } = pxPar(0, bTick);
    ctx.fillText(bTick.toFixed(2), ox - 3, py + 3);
  }

  const { px, py } = pxPar(state.a, state.b);
  ctx.strokeStyle = tokens.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(px, py, 7, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = tokens.accent;
  ctx.beginPath(); ctx.arc(px, py, 2.5, 0, 2 * Math.PI); ctx.fill();

  ctx.fillStyle = tokens.fgMuted;
  ctx.font = fontString(canvas, 'caption');
  ctx.textAlign = 'left';
  ctx.fillText('Parameter (a, b)', ox, oy - 10);
  ctx.textAlign = 'center';
  ctx.fillStyle = tokens.fgFaint;
  ctx.font = fontString(canvas, 'tick');
  ctx.fillText('a', ox + w / 2, oy + h + 22);
  ctx.save();
  ctx.translate(ox - 22, oy + h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('b', 0, 0);
  ctx.restore();
}

// The spectrum lambda_1,2(a) at the current b. Cached because each sample
// is a 40k-step accumulation; it only changes when b changes, not as a
// sweeps, so the auto-sweep reuses one cached curve.
function computeSpectrumCurve() {
  const n = 88, out = [];
  for (let i = 0; i < n; i += 1) {
    const a = SPEC.amin + (SPEC.amax - SPEC.amin) * i / (n - 1);
    const r = lyapunovSpectrum(a, state.b, { burnIn: 600, accum: 40_000 });
    out.push({ a, l1: r.bounded ? r.lambda1 : NaN, l2: r.bounded ? r.lambda2 : NaN });
  }
  state.specCurve = out;
  state.specB = state.b;
}

function drawSpectrum() {
  const { x: ox, y: oy, w, h, amin, amax, lmin, lmax } = SPEC;
  const PX = (a) => ox + (a - amin) / (amax - amin) * w;
  const PY = (l) => oy + (1 - (Math.max(lmin, Math.min(lmax, l)) - lmin) / (lmax - lmin)) * h;

  ctx.fillStyle = tokens.surface;
  ctx.fillRect(ox, oy, w, h);

  // shade the chaotic columns (lambda_1 > 0)
  if (state.specCurve) {
    ctx.fillStyle = 'rgba(193,59,39,0.10)';
    for (let i = 0; i + 1 < state.specCurve.length; i += 1) {
      const c0 = state.specCurve[i], c1 = state.specCurve[i + 1];
      if (c0.l1 > 0) ctx.fillRect(PX(c0.a), oy, PX(c1.a) - PX(c0.a) + 1, h);
    }
  }

  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.8;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(ox, PY(0)); ctx.lineTo(ox + w, PY(0)); ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(ox + 0.5, oy + 0.5, w - 1, h - 1);

  const drawCurve = (key, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.beginPath();
    let started = false;
    for (const c of state.specCurve) {
      const v = c[key];
      if (!Number.isFinite(v)) { started = false; continue; }
      const px = PX(c.a), py = PY(v);
      if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  };
  if (state.specCurve) { drawCurve('l2', tokens.fgMuted); drawCurve('l1', tokens.accentWarm); }

  const acx = PX(Math.max(amin, Math.min(amax, state.a)));
  ctx.strokeStyle = tokens.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(acx, oy); ctx.lineTo(acx, oy + h); ctx.stroke();
  if (state.result && state.result.bounded) {
    ctx.fillStyle = tokens.accent;
    ctx.beginPath(); ctx.arc(acx, PY(state.result.lambda1), 4.5, 0, 2 * Math.PI); ctx.fill();
  }

  ctx.fillStyle = tokens.fgMuted;
  ctx.font = fontString(canvas, 'caption');
  ctx.textAlign = 'left';
  ctx.fillText('Lyapunov spectrum vs a   (shaded: lambda_1 > 0, chaos)', ox, oy - 10);

  ctx.font = fontString(canvas, 'tick');
  ctx.fillStyle = tokens.fgFaint;
  ctx.textAlign = 'center';
  for (const at of [1.0, 1.1, 1.2, 1.3, 1.4]) ctx.fillText(at.toFixed(1), PX(at), oy + h + 14);
  ctx.fillText('a', ox + w / 2, oy + h + 28);
  ctx.textAlign = 'right';
  for (const lt of [0.4, 0, -0.4, -0.8, -1.2, -1.6]) ctx.fillText(lt.toFixed(1), ox - 5, PY(lt) + 3);
  ctx.save();
  ctx.translate(ox - 38, oy + h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('lambda', 0, 0);
  ctx.restore();

  // legend
  ctx.textAlign = 'left';
  ctx.fillStyle = tokens.accentWarm; ctx.fillRect(ox + w - 116, oy + 9, 16, 3);
  ctx.fillStyle = tokens.fgMuted; ctx.fillText('lambda_1', ox + w - 96, oy + 13);
  ctx.fillStyle = tokens.fgMuted; ctx.fillRect(ox + w - 116, oy + 24, 16, 3);
  ctx.fillText('lambda_2', ox + w - 96, oy + 28);
}

function drawCaption() {
  const tx = PAR.x + PAR.w + 34, ty = PAR.y + 16;
  ctx.fillStyle = tokens.fgMuted;
  ctx.font = fontString(canvas, 'caption');
  ctx.textAlign = 'left';
  const lines = [
    "Henon map:  x' = 1 - a x^2 + y,   y' = b x",
    'lambda_1 + lambda_2 = ln|b|  (constant area contraction)',
    'lambda_1 > 0 is the signature of chaos.',
    'Drag the (a,b) handle to explore; a sweeps automatically.',
  ];
  lines.forEach((s, i) => ctx.fillText(s, tx, ty + i * 26));
}

function drawAll() {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawAttractor();
  drawSpectrum();
  drawParameterPanel();
  drawCaption();
}

function updateReadouts() {
  readouts.a.textContent = state.a.toFixed(6);
  readouts.b.textContent = state.b.toFixed(6);
  const r = state.result;
  if (r && r.bounded && !r.lowConfidence) {
    readouts.lambda1.textContent = r.lambda1.toFixed(4);
    readouts.lambda2.textContent = r.lambda2.toFixed(4);
    readouts.sum.textContent     = r.sum.toFixed(4);
    readouts.target.textContent  = r.sumTarget.toFixed(4);
    readouts.N.textContent       = String(r.n);
    readouts.lambda1.classList.remove('warn');
    readouts.lambda2.classList.remove('warn');
  } else if (r && r.bounded) {
    readouts.lambda1.textContent = 'low-conf';
    readouts.lambda2.textContent = 'low-conf';
    readouts.sum.textContent     = r.sum.toFixed(4);
    readouts.target.textContent  = r.sumTarget.toFixed(4);
    readouts.N.textContent       = String(r.n);
    readouts.lambda1.classList.add('warn');
    readouts.lambda2.classList.add('warn');
  } else {
    readouts.lambda1.textContent = 'unbounded';
    readouts.lambda2.textContent = 'unbounded';
    readouts.sum.textContent     = 'NA';
    readouts.target.textContent  = r ? r.sumTarget.toFixed(4) : 'NA';
    readouts.N.textContent       = '0';
    readouts.lambda1.classList.add('warn');
    readouts.lambda2.classList.add('warn');
  }
}

function canvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const ev   = evt.touches ? evt.touches[0] : evt;
  const sx   = canvas.width  / rect.width;
  const sy   = canvas.height / rect.height;
  return { x: (ev.clientX - rect.left) * sx, y: (ev.clientY - rect.top) * sy };
}

function inPar(p) {
  return p.x >= PAR.x && p.x <= PAR.x + PAR.w
      && p.y >= PAR.y && p.y <= PAR.y + PAR.h;
}

let _pendingRecompute = false;
function setFromPar(p) {
  const ta = Math.max(0, Math.min(1, (p.x - PAR.x) / PAR.w));
  const tb = Math.max(0, Math.min(1, 1 - (p.y - PAR.y) / PAR.h));
  state.a = PAR.amin + ta * (PAR.amax - PAR.amin);
  state.b = PAR.bmin + tb * (PAR.bmax - PAR.bmin);
  // Debounce: at most one recompute per animation frame while the user drags.
  if (_pendingRecompute) return;
  _pendingRecompute = true;
  requestAnimationFrame(() => {
    _pendingRecompute = false;
    if (Math.abs(state.b - state.specB) > 1e-4) computeSpectrumCurve();
    recompute();
    drawAll();
    updateReadouts();
  });
}

canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPos(e);
  if (inPar(p)) {
    pauseSweep();
    state.dragging = true;
    canvas.setPointerCapture?.(e.pointerId);
    setFromPar(p);
    e.preventDefault();
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (state.dragging) setFromPar(canvasPos(e));
});
canvas.addEventListener('pointerup', () => { state.dragging = false; });
canvas.addEventListener('pointercancel', () => { state.dragging = false; });

btnReset.addEventListener('click', () => {
  state.a = 1.4;
  state.b = 0.3;
  if (Math.abs(state.b - state.specB) > 1e-4) computeSpectrumCurve();
  recompute();
  drawAll();
  updateReadouts();
});
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  if (state.playing) startSweep();
});

// Auto-sweep the nonlinearity a from the periodic regime up to the canonical
// chaotic attractor at a = 1.4; the cursor on the spectrum tracks where
// lambda_1 crosses zero. Dragging the (a,b) handle halts the sweep.
let sweepRaf = 0, sweepDir = 1, sweepLast = 0;
function sweepStep(now) {
  if (!state.playing) { sweepRaf = 0; return; }
  if (!state.dragging) {
    const dt = Math.min(0.05, (now - sweepLast) / 1000 || 0);
    state.a += sweepDir * dt * ((SPEC.amax - SPEC.amin) / 16);   // ~16 s end to end
    if (state.a >= SPEC.amax) { state.a = SPEC.amax; sweepDir = -1; }
    else if (state.a <= SPEC.amin) { state.a = SPEC.amin; sweepDir = 1; }
    recompute();
    drawAll();
    updateReadouts();
  }
  sweepLast = now;
  sweepRaf = requestAnimationFrame(sweepStep);
}
function startSweep() { if (!sweepRaf) { sweepLast = performance.now(); sweepRaf = requestAnimationFrame(sweepStep); } }
function pauseSweep() {
  if (state.playing) { state.playing = false; btnPlayPause.textContent = 'Play'; }
  if (sweepRaf) { cancelAnimationFrame(sweepRaf); sweepRaf = 0; }
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.a = 1.2 + frac * (1.42 - 1.2);                   // populated attractor across all frames
    state.b = 0.3;
    state.playing = false;
  } else if (state.playing) {
    state.a = 1.4;                                         // open on the iconic chaotic attractor
    sweepDir = -1;                                         // then sweep down through the cascade
  }
  computeSpectrumCurve();
  recompute();
  drawAll();
  updateReadouts();
  if (state.playing) { btnPlayPause.textContent = 'Pause'; startSweep(); }
  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, seed: SEED, a: state.a, b: state.b };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSync, { once: true });
} else {
  bootSync();
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'param-a', label: 'Parameter $a$', value: state.a, format: 'float' },
      { key: 'param-b', label: 'Parameter $b$', value: state.b, format: 'float' },
      { key: 'lambda1', label: '$\\lambda_1$', value: state.result && state.result.lambda1 !== undefined ? state.result.lambda1 : 0, format: 'float' },
      { key: 'lambda2', label: '$\\lambda_2$', value: state.result && state.result.lambda2 !== undefined ? state.result.lambda2 : 0, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const r = state.result;
  const bounded = r && r.bounded;
  return [
    { key: 'orbit-bounded', label: 'Orbit bounded', value: bounded ? 'yes' : 'no', status: bounded ? 'pass' : 'drift' },
    { key: 'spectrum-sum', label: '$\\lambda_1 + \\lambda_2 \\approx \\ln|b|$', value: r && r.sum !== undefined && r.sumTarget !== undefined ? Math.abs(r.sum - r.sumTarget).toFixed(4) : 'NA', status: r && r.bounded && !r.lowConfidence ? 'pass' : 'pending' }
  ];
};
