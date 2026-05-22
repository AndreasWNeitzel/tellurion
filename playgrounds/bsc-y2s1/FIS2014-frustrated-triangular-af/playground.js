import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Triangular antiferromagnetic Ising (Wannier 1950). The spins never
// order, but the *three-sublattice chirality field* does form domains
// as the lattice cools. Each elementary triangle in an AF ground state
// has exactly one "odd" vertex (two-up-one-down); colouring every
// triangle by which sublattice carries that odd spin turns the raw
// salt-and-pepper into the recognizable sqrt(3) x sqrt(3) domain
// mosaic. Fully frustrated triangles (all three equal) are flagged.
// sim.js is unchanged; this is purely the visualization.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createAF, sweep, magnetization, energyPerSite, frustratedFraction, setTemperature } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderT      = document.getElementById('slider-T');
const sliderL      = document.getElementById('slider-L');
const sliderSpeed  = document.getElementById('slider-speed');
const valueT       = document.getElementById('value-T');
const valueL       = document.getElementById('value-L');
const valueSpeed   = document.getElementById('value-speed');
const btnCold      = document.getElementById('btn-cold');
const btnHot       = document.getElementById('btn-hot');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const MARGIN = 20;
// Explicit vertical budget so the field, legend and history strip
// never overlap.
const FIELD_TOP = 26;
const HIST_H = 70;
const HIST_BOT = H - MARGIN;
const HIST_TOP = HIST_BOT - HIST_H;
const HIST_TITLE_Y = HIST_TOP - 8;
const LEGEND_Y = HIST_TOP - 24;
const FIELD_BOT = LEGEND_Y - 16;

const state = {
  af: null,
  L: 64,
  T: 0.5,
  speed: 3,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  hist: [],                                         // [{e, ff}]
};

// Sublattice-minority hues (the three-state chirality field) + the
// fully frustrated flag colour.
const HUE = ['#1B6CA8', '#E8A33D', '#3FA66A'];
const FRUST = '#F4F4F0';

function rebuild(init = 'hot') {
  state.af = createAF({ L: state.L, T: state.T, seed: SEED, init });
  state.hist = [];
}

// Triangular embedding consistent with sim.js's brick neighbour rule:
// odd rows shifted half a cell.
function geom() {
  const L = state.L;
  const dx = (W - 2 * MARGIN) / (L + 0.5);
  const dy = (FIELD_BOT - FIELD_TOP) / L;            // fill the field band
  return { L, dx, dy };
}
function px(i, j, g) { return MARGIN + i * g.dx + ((j & 1) ? 0.5 * g.dx : 0); }
function py(j, g) { return FIELD_TOP + j * g.dy; }

// Minority vertex of a 3-spin triangle: -1 if all equal (frustrated),
// else the index (0,1,2) of the spin that differs from the other two.
function minorityIdx(a, b, c) {
  if (a === b && b === c) return -1;
  if (a !== b && a !== c) return 0;     // a is the odd one
  if (b !== a && b !== c) return 1;
  return 2;                              // c is the odd one
}

function fillTri(p0, p1, p2, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(p0[0], p0[1]);
  ctx.lineTo(p1[0], p1[1]);
  ctx.lineTo(p2[0], p2[1]);
  ctx.closePath();
  ctx.fill();
}

function drawField() {
  const g = geom();
  const { L } = g;
  const sp = state.af.spins;
  for (let j = 0; j < L - 1; j += 1) {
    for (let i = 0; i < L - 1; i += 1) {
      const A = [px(i, j, g), py(j, g)];
      const B = [px(i + 1, j, g), py(j, g)];
      const Cd = [px(i, j + 1, g), py(j + 1, g)];
      const Dd = [px(i + 1, j + 1, g), py(j + 1, g)];
      const sA = sp[j * L + i], sB = sp[j * L + i + 1];
      const sC = sp[(j + 1) * L + i], sD = sp[(j + 1) * L + i + 1];
      // Up triangle (A,B,C) and down triangle (B,C,D), each coloured by
      // its own minority sublattice; frustrated triangles flagged white.
      const mu = minorityIdx(sA, sB, sC);
      fillTri(A, B, Cd, mu < 0 ? FRUST : HUE[mu]);
      const md = minorityIdx(sB, sC, sD);
      fillTri(B, Cd, Dd, md < 0 ? FRUST : HUE[md]);
    }
  }
}

function drawHistory() {
  const top = HIST_TOP, x0 = MARGIN, w = W - 2 * MARGIN;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
  ctx.strokeRect(x0, top, w, HIST_H);
  const hist = state.hist;
  if (hist.length > 1) {
    const eLo = -1.05, eHi = -0.45;                  // the AF energy band
    const yE = (e) => top + HIST_H * (1 - (Math.max(eLo, Math.min(eHi, e)) - eLo) / (eHi - eLo));
    ctx.strokeStyle = '#E8A33D'; ctx.lineWidth = 1.8; ctx.beginPath();
    for (let k = 0; k < hist.length; k += 1) {
      const x = x0 + w * k / (hist.length - 1);
      if (k === 0) ctx.moveTo(x, yE(hist[k].e)); else ctx.lineTo(x, yE(hist[k].e));
    }
    ctx.stroke();
    const yF = (ff) => top + HIST_H * (1 - Math.min(1, ff / 0.25));
    ctx.strokeStyle = FRUST; ctx.lineWidth = 1.4; ctx.beginPath();
    for (let k = 0; k < hist.length; k += 1) {
      const x = x0 + w * k / (hist.length - 1);
      if (k === 0) ctx.moveTo(x, yF(hist[k].ff)); else ctx.lineTo(x, yF(hist[k].ff));
    }
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('energy/site -1.05..-0.45 (amber)   frustrated fraction 0..0.25 (white)', x0 + 6, HIST_TITLE_Y);
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  drawField();

  const m = magnetization(state.af);
  const e = energyPerSite(state.af);
  const ff = frustratedFraction(state.af);

  // Legend.
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  const lg = [['minority = A', HUE[0]], ['B', HUE[1]], ['C', HUE[2]], ['all-equal (frustrated)', FRUST]];
  let lx = MARGIN;
  const ly = LEGEND_Y;
  for (const [txt, col] of lg) {
    ctx.fillStyle = col; ctx.fillRect(lx, ly - 9, 11, 11);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText(txt, lx + 16, ly);
    lx += ctx.measureText(txt).width + 46;
  }

  drawHistory();

  // Live invariant readout (monospace).
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.textAlign = 'left';
  ctx.fillText(
    `T = ${state.T.toFixed(2)}   L = ${state.L}   m = ${m.toFixed(3)}   e/site = ${e.toFixed(3)}   frustrated = ${(100 * ff).toFixed(1)} %`,
    MARGIN, MARGIN - 4);
}

function record() {
  const e = energyPerSite(state.af), ff = frustratedFraction(state.af);
  state.hist.push({ e, ff });
  if (state.hist.length > W) state.hist.shift();
}

function tickN(n) { if (state.af) { sweep(state.af, n); record(); } }

sliderT.addEventListener('input', () => {
  state.T = parseFloat(sliderT.value);
  valueT.textContent = state.T.toFixed(2);
  if (state.af) setTemperature(state.af, state.T);
});
sliderL.addEventListener('change', () => {
  state.L = parseInt(sliderL.value, 10);
  valueL.textContent = String(state.L);
  rebuild('hot'); drawAll();
});
sliderSpeed.addEventListener('input', () => {
  state.speed = parseInt(sliderSpeed.value, 10);
  valueSpeed.textContent = String(state.speed);
});
btnCold.addEventListener('click', () => { rebuild('cold'); drawAll(); });
btnHot.addEventListener('click', () => { rebuild('hot'); drawAll(); });
if (btnPlayPause) {
  btnPlayPause.addEventListener('click', () => {
    state.playing = !state.playing;
    btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
    btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
  });
}

function bootSync() {
  rebuild('hot');
  valueT.textContent = state.T.toFixed(2);
  valueL.textContent = String(state.L);
  valueSpeed.textContent = String(state.speed);

  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Slow anneal: hot disordered -> cold sqrt(3) domains. Cool in
    // steps, accumulating sweeps and the energy/frustration history so
    // the five frames show structure forming, not a 2-cycle flicker.
    const steps = 26;
    const target = 1.6 - f * 1.45;                  // 1.6 down to ~0.15
    for (let k = 0; k <= steps; k += 1) {
      const frac = k / steps;
      const Tk = 1.6 - frac * (1.6 - target);
      setTemperature(state.af, Tk);
      sweep(state.af, 14);
      record();
    }
    state.T = target;
    setTemperature(state.af, state.T);
    sliderT.value = state.T.toFixed(2);
    valueT.textContent = state.T.toFixed(2);
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
      }));
    }
    return;
  }
  record();
  drawAll();
}

function tick() {
  if (state.playing) { tickN(state.speed); drawAll(); }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const T = parseFloat(sliderT?.value || '1');
  const spins = state.spins || [];
  return {
    fields: [
      { key: 'temperature', label: 'temperature T', value: T, format: 'float' },
      { key: 'spin-count', label: 'spins', value: spins.length, format: 'float' },
      { key: 'magnetization', label: 'net M', value: 0, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const spins = state.spins || [];
  if (spins.length === 0) {
    return [{ key: 'init', label: 'initializing', value: 'pending', status: 'pending' }];
  }
  let m = 0;
  for (const s of spins) m += s || 0;
  const mag = Math.abs(m / spins.length);
  return [
    {
      key: 'frustration',
      label: 'frustrated (low |M|)',
      value: mag.toFixed(3),
      status: mag < 0.1 ? 'pass' : 'drift'
    }
  ];
};
