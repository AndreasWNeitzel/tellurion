// playground.js
// Soft retrieval visualization.
// Left panel: keys in 2D scattered around with the query (red dot).
// Right panel: bar chart of values colored by attention weight.

import { makeRng, gaussian } from '../../shared/js/render/rng.js';
import { attention, entropy, argmax } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas        = document.getElementById('stage');
const ctx           = canvas.getContext('2d', { alpha: false });
const sliderTau     = document.getElementById('slider-tau');
const sliderQx      = document.getElementById('slider-qx');
const sliderQy      = document.getElementById('slider-qy');
const valueTau      = document.getElementById('value-tau');
const valueQx       = document.getElementById('value-qx');
const valueQy       = document.getElementById('value-qy');
const btnReset      = document.getElementById('btn-reset');
const btnShuffle    = document.getElementById('btn-shuffle');

const W = canvas.width, H = canvas.height;
const KEY = { x: 40, y: 40, w: 360, h: 420, xmin: -3, xmax: 3, ymin: -3, ymax: 3 };
const VAL = { x: 440, y: 40, w: 280, h: 420 };

const N_KEYS = 6;
const D = 2;
let rng = makeRng(0xC0FFEE);

const state = {
  keys:   [],          // N_KEYS x 2
  values: [],          // N_KEYS x 1
  query:  [0, 0],
  tau:    0.5,
};

function cssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
const tok = {
  bg: cssVar('--bg', '#FBFBF9'),
  surface: cssVar('--surface', '#FFFFFF'),
  fg: cssVar('--fg', '#1A1B1C'),
  fgMuted: cssVar('--fg-muted', '#5C5E61'),
  fgFaint: cssVar('--fg-faint', '#9A9C9F'),
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
  cat1: cssVar('--cat-1', '#4C72B0'),
  cat3: cssVar('--cat-3', '#55A868'),
};

function pxKey(x, y) {
  return {
    px: KEY.x + (x - KEY.xmin) / (KEY.xmax - KEY.xmin) * KEY.w,
    py: KEY.y + (1 - (y - KEY.ymin) / (KEY.ymax - KEY.ymin)) * KEY.h,
  };
}

function reshuffle() {
  rng = makeRng(0xC0FFEE + (state.shuffleSeed ?? 0));
  state.keys = [];
  state.values = [];
  for (let i = 0; i < N_KEYS; i += 1) {
    state.keys.push([gaussian(rng, 0, 1.5), gaussian(rng, 0, 1.5)]);
    state.values.push([gaussian(rng, 0.5, 0.5) + 0.5 + 0.3 * i]);   // increasing-ish
  }
}

function drawKeyPanel(weights) {
  ctx.fillStyle = tok.surface;
  ctx.fillRect(KEY.x, KEY.y, KEY.w, KEY.h);
  ctx.strokeStyle = tok.fgFaint;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(KEY.x + 0.5, KEY.y + 0.5, KEY.w - 1, KEY.h - 1);

  // axes
  ctx.strokeStyle = tok.fgFaint;
  ctx.lineWidth = 0.5;
  const o = pxKey(0, 0);
  ctx.beginPath();
  ctx.moveTo(KEY.x, o.py); ctx.lineTo(KEY.x + KEY.w, o.py);
  ctx.moveTo(o.px, KEY.y); ctx.lineTo(o.px, KEY.y + KEY.h);
  ctx.stroke();

  // keys: radius proportional to attention weight
  for (let i = 0; i < state.keys.length; i += 1) {
    const k = state.keys[i];
    const p = pxKey(k[0], k[1]);
    const w = weights[i];
    const r = 4 + 18 * w;
    ctx.fillStyle = tok.accent;
    ctx.globalAlpha = 0.25 + 0.75 * w;
    ctx.beginPath();
    ctx.arc(p.px, p.py, r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = tok.fg;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.fillStyle = tok.fg;
    ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`k${i + 1}`, p.px, p.py - r - 4);
  }

  // query
  const q = pxKey(state.query[0], state.query[1]);
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath();
  ctx.arc(q.px, q.py, 6, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = tok.fg;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.fillStyle = tok.fg;
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('query', q.px + 8, q.py - 4);

  // panel label
  ctx.fillStyle = tok.fgMuted;
  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Keys (k_i) and query', KEY.x, KEY.y - 8);
}

function drawValuePanel(weights, output) {
  ctx.fillStyle = tok.surface;
  ctx.fillRect(VAL.x, VAL.y, VAL.w, VAL.h);
  ctx.strokeStyle = tok.fgFaint;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(VAL.x + 0.5, VAL.y + 0.5, VAL.w - 1, VAL.h - 1);

  // bar chart: value height on y, weight as bar shading
  const allVals = state.values.map(v => v[0]).concat([output[0]]);
  const vmin = Math.min(0, ...allVals) - 0.2;
  const vmax = Math.max(...allVals) + 0.2;
  function ypx(v) { return VAL.y + (1 - (v - vmin) / (vmax - vmin)) * VAL.h; }

  const nBars = state.values.length + 1;
  const barW = VAL.w / (nBars + 1);
  const startX = VAL.x + barW / 2;
  for (let i = 0; i < state.values.length; i += 1) {
    const v = state.values[i][0];
    const x = startX + i * barW;
    const y0 = ypx(0);
    const yv = ypx(v);
    ctx.globalAlpha = 0.25 + 0.75 * weights[i];
    ctx.fillStyle = tok.accent;
    const top = Math.min(y0, yv), height = Math.abs(y0 - yv);
    ctx.fillRect(x, top, barW * 0.7, height);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = tok.fg;
    ctx.lineWidth = 0.7;
    ctx.strokeRect(x, top, barW * 0.7, height);
    ctx.fillStyle = tok.fg;
    ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`v${i + 1}`, x + barW * 0.35, y0 + 12);
    ctx.fillText(`w=${weights[i].toFixed(2)}`, x + barW * 0.35, y0 + 24);
  }
  // output bar in cat3
  {
    const v = output[0];
    const x = startX + state.values.length * barW;
    const y0 = ypx(0);
    const yv = ypx(v);
    const top = Math.min(y0, yv), height = Math.abs(y0 - yv);
    ctx.fillStyle = tok.cat3;
    ctx.fillRect(x, top, barW * 0.7, height);
    ctx.strokeStyle = tok.fg;
    ctx.lineWidth = 0.9;
    ctx.strokeRect(x, top, barW * 0.7, height);
    ctx.fillStyle = tok.fg;
    ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('out', x + barW * 0.35, y0 + 12);
    ctx.fillText(v.toFixed(2), x + barW * 0.35, y0 + 24);
  }

  // zero line
  ctx.strokeStyle = tok.fgFaint;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(VAL.x, ypx(0));
  ctx.lineTo(VAL.x + VAL.w, ypx(0));
  ctx.stroke();

  ctx.fillStyle = tok.fgMuted;
  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Values and weighted output', VAL.x, VAL.y - 8);
}

function drawReadout(weights, output) {
  const H = entropy(weights);
  const Hmax = Math.log(weights.length);
  const am = argmax(weights);
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  const rows = [
    ['tau',         state.tau.toFixed(3)],
    ['entropy',     H.toFixed(3)],
    ['entropy_max', Hmax.toFixed(3)],
    ['argmax i',    String(am + 1)],
    ['w[argmax]',   weights[am].toFixed(3)],
    ['output',      output[0].toFixed(3)],
  ];
  const xL = VAL.x;
  const xR = VAL.x + VAL.w;
  let y = VAL.y + VAL.h + 18;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';  ctx.fillStyle = tok.fgMuted; ctx.fillText(k, xL, y);
    ctx.textAlign = 'right'; ctx.fillStyle = tok.fg; ctx.fillText(v, xR, y);
    y += 14;
  }
}

function drawAll() {
  ctx.fillStyle = tok.bg; ctx.fillRect(0, 0, W, H);
  const r = attention(state.query, state.keys, state.values, state.tau);
  drawKeyPanel(r.weights);
  drawValuePanel(r.weights, r.output);
  drawReadout(r.weights, r.output);
}

function applyControls() {
  state.tau = parseFloat(sliderTau.value);
  state.query = [parseFloat(sliderQx.value), parseFloat(sliderQy.value)];
  valueTau.textContent = state.tau.toFixed(2);
  valueQx.textContent  = state.query[0].toFixed(2);
  valueQy.textContent  = state.query[1].toFixed(2);
  drawAll();
}
[sliderTau, sliderQx, sliderQy].forEach(s => s.addEventListener('input', applyControls));
btnReset.addEventListener('click', () => { sliderTau.value = '0.5'; sliderQx.value = '0'; sliderQy.value = '0'; applyControls(); });
btnShuffle.addEventListener('click', () => {
  state.shuffleSeed = (state.shuffleSeed ?? 0) + 1;
  reshuffle();
  drawAll();
});

function bootSync() {
  reshuffle();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Sweep tau from 2.5 down to 0.05 to show the collapse to argmax.
    state.tau = 2.5 * Math.exp(Math.log(0.02) * frac);
    state.query = [1.2, 0.8];
    sliderTau.value = state.tau.toString();
    sliderQx.value = '1.2'; sliderQy.value = '0.8';
    valueTau.textContent = state.tau.toFixed(2);
    valueQx.textContent = '1.20'; valueQy.textContent = '0.80';
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME };
        });
      });
    }
    return;
  }
  applyControls();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSync, { once: true });
} else {
  bootSync();
}
