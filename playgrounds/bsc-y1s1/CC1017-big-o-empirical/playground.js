// playground.js
// Big-O made watchable. The same seeded shuffle is sorted by an O(N^2)
// algorithm (left) and merge sort, O(N log N) (right), both replayed
// from a recorded comparison/write event stream. Every finished race
// drops a point on the lower empirical plot, on top of the theoretical
// 1/2 N(N-1) and N log2 N curves. "Sweep N" fills the curve at once.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import {
  shuffledArray, recordSort, comparisonCount,
  EV_CMP, EV_SWAP, EV_SET,
} from './sim.js';

const params = new URLSearchParams(location.search);
const SEED = parseInt(params.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const readoutN = document.getElementById('readout-n');
const readoutA = document.getElementById('readout-a');
const readoutB = document.getElementById('readout-b');
const readoutRatio = document.getElementById('readout-ratio');
const sliderN = document.getElementById('slider-N');
const valueN = document.getElementById('value-N');
const sliderSpeed = document.getElementById('slider-speed');
const valueSpeed = document.getElementById('value-speed');
const selectAlgo = document.getElementById('select-algo');
const valueAlgo = document.getElementById('value-algo');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');
const btnSweep = document.getElementById('btn-sweep');

const NMAX = parseInt(sliderN.max, 10);
const SWEEP_NS = [];
for (let n = 8; n <= NMAX; n += 8) SWEEP_NS.push(n);

const state = {
  N: parseInt(sliderN.value, 10),
  speed: parseInt(sliderSpeed.value, 10),
  algoA: selectAlgo.value,        // 'bubble' | 'insertion'  -> O(N^2)
  playing: !DETERMINISTIC,
  A: null,                        // left  race (quadratic)
  B: null,                        // right race (merge)
  points: new Map(),              // `${N}:${algoA}` -> { N, q, m }
};

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue: '#5bc0eb',
    red: '#ef476f',
    grid: '#23252a',
  };
}

function makeRace(kind, arr) {
  return { kind, arr: Array.from(arr), rec: recordSort(kind, arr), cursor: 0, comp: 0, hi: [-1, -1] };
}

function rebuild() {
  const arr = shuffledArray(state.N, SEED);
  state.A = makeRace(state.algoA, arr);
  state.B = makeRace('merge', arr);
}

// Apply up to `budget` events to one race; stop at the end.
function advance(race, budget) {
  const ev = race.rec.events;
  let used = 0;
  while (used < budget && race.cursor < ev.length) {
    const e = ev[race.cursor]; race.cursor += 1;
    if (e[0] === EV_CMP) { race.hi = [e[1], e[2]]; race.comp += 1; used += 1; }
    else if (e[0] === EV_SWAP) { const t = race.arr[e[1]]; race.arr[e[1]] = race.arr[e[2]]; race.arr[e[2]] = t; }
    else if (e[0] === EV_SET) { race.arr[e[1]] = e[2]; }
  }
  return race.cursor >= ev.length;
}

function recordPoint() {
  const key = `${state.N}:${state.algoA}`;
  if (state.points.has(key)) return;
  state.points.set(key, { N: state.N, q: state.A.rec.comparisons, m: state.B.rec.comparisons });
}

function sweep() {
  for (const n of SWEEP_NS) {
    const arr = shuffledArray(n, SEED);
    const q = comparisonCount(state.algoA, n, SEED);
    const m = recordSort('merge', arr).comparisons;
    state.points.set(`${n}:${state.algoA}`, { N: n, q, m });
  }
}

// === drawing ===
const PAD = 24;
const PANEL_TOP = 74, PANEL_H = 188;
const GAP = 26;
const PANEL_W = (W - 2 * PAD - GAP) / 2;
const PLOT_TOP = PANEL_TOP + PANEL_H + 46;
const PLOT_H = H - PLOT_TOP - 34;
const PLOT_L = PAD + 52, PLOT_W = W - PLOT_L - PAD;

function drawPanel(race, x0, title, barColor, c) {
  ctx.fillStyle = c.muted;
  ctx.font = '13px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(title, x0, PANEL_TOP - 34);
  ctx.fillStyle = barColor;
  ctx.font = 'bold 14px ui-monospace, monospace';
  ctx.fillText(`${race.comp} comparisons`, x0, PANEL_TOP - 14);

  const a = race.arr, n = a.length;
  const bw = PANEL_W / n;
  const maxV = n;
  const done = race.cursor >= race.rec.events.length;
  for (let i = 0; i < n; i += 1) {
    const hgt = (a[i] / maxV) * (PANEL_H - 6);
    const px = x0 + i * bw;
    const active = !done && (i === race.hi[0] || i === race.hi[1]);
    ctx.fillStyle = active ? c.fg : (done ? barColor : `${barColor}aa`);
    ctx.fillRect(px, PANEL_TOP + PANEL_H - hgt, Math.max(1, bw - 1), hgt);
  }
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  ctx.strokeRect(x0, PANEL_TOP, PANEL_W, PANEL_H);
  if (done) {
    ctx.fillStyle = c.muted;
    ctx.font = '12px ui-monospace, monospace';
    ctx.fillText('sorted', x0 + PANEL_W - 52, PANEL_TOP + 16);
  }
}

function theoryQ(N) { return 0.5 * N * (N - 1); }            // O(N^2) envelope
function theoryM(N) { return N * Math.log2(Math.max(N, 2)); } // O(N log N)

function drawPlot(c) {
  const yMax = theoryQ(NMAX) * 1.04;
  const xOf = (N) => PLOT_L + PLOT_W * (N / NMAX);
  const yOf = (v) => PLOT_TOP + PLOT_H * (1 - v / yMax);

  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  ctx.fillStyle = c.muted; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'right';
  for (let g = 0; g <= 4; g += 1) {
    const y = PLOT_TOP + PLOT_H * g / 4;
    ctx.beginPath(); ctx.moveTo(PLOT_L, y); ctx.lineTo(PLOT_L + PLOT_W, y); ctx.stroke();
    ctx.fillText(((yMax * (4 - g) / 4) | 0).toString(), PLOT_L - 6, y + 3);
  }
  ctx.textAlign = 'center';
  for (let g = 0; g <= 4; g += 1) {
    const N = NMAX * g / 4; const x = xOf(N);
    ctx.beginPath(); ctx.moveTo(x, PLOT_TOP); ctx.lineTo(x, PLOT_TOP + PLOT_H); ctx.stroke();
    ctx.fillText((N | 0).toString(), x, PLOT_TOP + PLOT_H + 16);
  }

  // Theory curves.
  const curve = (fn, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 160; i += 1) {
      const N = NMAX * i / 160; const x = xOf(N), y = yOf(fn(N));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  curve(theoryQ, c.red);
  curve(theoryM, c.blue);

  // Measured points.
  for (const p of state.points.values()) {
    const xq = xOf(p.N);
    ctx.fillStyle = c.red;
    ctx.beginPath(); ctx.arc(xq, yOf(p.q), 3.2, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = c.blue;
    ctx.beginPath(); ctx.arc(xq, yOf(p.m), 3.2, 0, 2 * Math.PI); ctx.fill();
  }

  // Current-N marker.
  const xc = xOf(state.N);
  ctx.strokeStyle = c.fg; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xc, PLOT_TOP); ctx.lineTo(xc, PLOT_TOP + PLOT_H); ctx.stroke();
  ctx.setLineDash([]);

  // Labels + legend.
  ctx.fillStyle = c.muted; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('input size N', PLOT_L + PLOT_W / 2, PLOT_TOP + PLOT_H + 30);
  ctx.save(); ctx.translate(PAD - 6, PLOT_TOP + PLOT_H / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('comparisons', 0, 0); ctx.restore();
  ctx.textAlign = 'left';
  ctx.fillStyle = c.red; ctx.fillText('1/2 N(N-1), measured O(N^2)', PLOT_L + 8, PLOT_TOP + 14);
  ctx.fillStyle = c.blue; ctx.fillText('N log2 N, measured merge', PLOT_L + 8, PLOT_TOP + 30);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = c.muted; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('Same shuffle, two algorithms. Counts accumulate on the plot below.', PAD, 18);
  drawPanel(state.A, PAD, `${state.algoA} sort  O(N^2)`, c.red, c);
  drawPanel(state.B, PAD + PANEL_W + GAP, 'merge sort  O(N log N)', c.blue, c);
  drawPlot(c);
}

function updateReadout() {
  readoutN.textContent = String(state.N);
  readoutA.textContent = String(state.A.comp);
  readoutB.textContent = String(state.B.comp);
  readoutRatio.textContent = state.B.comp > 0 ? `${(state.A.comp / state.B.comp).toFixed(1)}x` : '-';
}

function tick() {
  if (state.playing) {
    const aDone = advance(state.A, state.speed);
    const bDone = advance(state.B, state.speed);
    if (aDone && bDone) recordPoint();
  }
  render();
  updateReadout();
  requestAnimationFrame(tick);
}

// === controls ===
sliderN.addEventListener('input', () => {
  state.N = parseInt(sliderN.value, 10); valueN.textContent = String(state.N); rebuild();
});
sliderSpeed.addEventListener('input', () => {
  state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed);
});
selectAlgo.addEventListener('change', () => {
  state.algoA = selectAlgo.value; valueAlgo.textContent = state.algoA; rebuild();
});
btnPlay.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlay.textContent = state.playing ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!state.playing));
});
btnReset.addEventListener('click', () => { rebuild(); });
btnSweep.addEventListener('click', () => { sweep(); render(); });

function bootSync() {
  valueN.textContent = String(state.N);
  valueSpeed.textContent = String(state.speed);
  valueAlgo.textContent = state.algoA;

  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.N = 4 * Math.round((24 + f * 80) / 4);
    valueN.textContent = String(state.N);
    rebuild();
    sweep();                                   // populate the empirical plot
    const aN = state.A.rec.events.length, bN = state.B.rec.events.length;
    advance(state.A, Math.floor(f * aN) + 1);
    advance(state.B, Math.floor(f * bN) + 1);
    if (f >= 1) recordPoint();
    render(); updateReadout();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED, N: state.N } }));
      }));
    }
    return;
  }

  rebuild();
  render(); updateReadout();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
