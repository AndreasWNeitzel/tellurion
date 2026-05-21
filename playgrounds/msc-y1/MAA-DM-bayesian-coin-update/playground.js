// playground.js
// Beta-Binomial conjugate posterior. Three curves over theta in [0, 1]:
// prior (cat-1), normalized likelihood (cat-2), posterior (cat-3) with its
// 95 percent credible interval shaded.

import { makeRng } from '../../../shared/js/render/rng.js';
import { betaPdf, posteriorParams, betaMean, betaVariance, credibleInterval } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas    = document.getElementById('stage');
const ctx       = canvas.getContext('2d', { alpha: false });
const sliderA0  = document.getElementById('slider-a0');
const sliderB0  = document.getElementById('slider-b0');
const sliderK   = document.getElementById('slider-k');
const sliderN   = document.getElementById('slider-n');
const valueA0   = document.getElementById('value-a0');
const valueB0   = document.getElementById('value-b0');
const valueK    = document.getElementById('value-k');
const valueN    = document.getElementById('value-n');
const btnReset  = document.getElementById('btn-reset');
const btnFlip   = document.getElementById('btn-flip');

const W = canvas.width, H = canvas.height;
const PLOT = { x: 70, y: 50, w: 660, h: 380, ymin: 0, ymax: 6 };

const rng = makeRng(0xC0FFEE);

const state = { a0: 2, b0: 2, k: 7, n: 10, trueBias: 0.7 };

function cssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
const tok = {
  bg: cssVar('--bg', '#FBFBF9'),
  surface: cssVar('--surface', '#FFFFFF'),
  fg: cssVar('--fg', '#1A1B1C'),
  fgMuted: cssVar('--fg-muted', '#5C5E61'),
  fgFaint: cssVar('--fg-faint', '#9A9C9F'),
  cat1: cssVar('--cat-1', '#4C72B0'),
  cat2: cssVar('--cat-2', '#DD8452'),
  cat3: cssVar('--cat-3', '#55A868'),
  grid: cssVar('--grid', '#9A9C9F4D'),
};

function px(t, y) {
  return {
    px: PLOT.x + t * PLOT.w,
    py: PLOT.y + (1 - y / PLOT.ymax) * PLOT.h,
  };
}

function drawAxes() {
  ctx.fillStyle = tok.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = tok.surface; ctx.fillRect(PLOT.x, PLOT.y, PLOT.w, PLOT.h);
  ctx.strokeStyle = tok.fgFaint;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(PLOT.x + 0.5, PLOT.y + 0.5, PLOT.w - 1, PLOT.h - 1);

  ctx.fillStyle = tok.fgFaint;
  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const p = px(t, 0);
    ctx.fillText(t.toFixed(2), p.px, PLOT.y + PLOT.h + 13);
    ctx.strokeStyle = tok.grid;
    ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(p.px, PLOT.y); ctx.lineTo(p.px, PLOT.y + PLOT.h); ctx.stroke();
  }
  ctx.fillStyle = tok.fgMuted;
  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('theta (coin bias)', PLOT.x + PLOT.w / 2, PLOT.y + PLOT.h + 32);
  ctx.save();
  ctx.translate(PLOT.x - 38, PLOT.y + PLOT.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('density', 0, 0);
  ctx.restore();
}

function drawCurve(color, fn, lineWidth = 1.5) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  const N = 400;
  for (let i = 0; i <= N; i += 1) {
    const t = i / N;
    const y = fn(t);
    const p = px(t, Math.min(y, PLOT.ymax));
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
}

function drawAll() {
  const post = posteriorParams({ a0: state.a0, b0: state.b0, k: state.k, n: state.n });
  const meanPost = betaMean(post.a, post.b);
  const peakPost = betaPdf(meanPost, post.a, post.b);
  PLOT.ymax = Math.max(4, peakPost * 1.2);

  drawAxes();

  if (post.a > 0 && post.b > 0) {
    const ci = credibleInterval(post.a, post.b, 0.95);
    const N = 200;
    ctx.fillStyle = 'rgba(85, 168, 104, 0.18)';
    ctx.beginPath();
    const p0 = px(ci.lo, 0);
    ctx.moveTo(p0.px, p0.py);
    for (let i = 0; i <= N; i += 1) {
      const t = ci.lo + (i / N) * (ci.hi - ci.lo);
      const y = betaPdf(t, post.a, post.b);
      const p = px(t, Math.min(y, PLOT.ymax));
      ctx.lineTo(p.px, p.py);
    }
    const pEnd = px(ci.hi, 0);
    ctx.lineTo(pEnd.px, pEnd.py);
    ctx.closePath();
    ctx.fill();
  }

  drawCurve(tok.cat1, t => betaPdf(t, state.a0, state.b0), 1.2);
  drawCurve(tok.cat3, t => betaPdf(t, post.a, post.b), 2.0);
  drawCurve(tok.cat2, t => betaPdf(t, state.k + 1, state.n - state.k + 1), 1.2);

  ctx.font = '11px "Inter", system-ui, sans-serif';
  const lx = PLOT.x + 12;
  const items = [
    [tok.cat1, `prior Beta(${state.a0.toFixed(1)}, ${state.b0.toFixed(1)})`],
    [tok.cat2, `likelihood (Beta(${state.k + 1}, ${state.n - state.k + 1}))`],
    [tok.cat3, `posterior Beta(${post.a.toFixed(1)}, ${post.b.toFixed(1)})`],
  ];
  let ly = PLOT.y + 16;
  for (const [c, label] of items) {
    ctx.fillStyle = c;
    ctx.fillRect(lx, ly - 8, 14, 3);
    ctx.fillStyle = tok.fg;
    ctx.textAlign = 'left';
    ctx.fillText(label, lx + 22, ly);
    ly += 14;
  }

  const ci = credibleInterval(post.a, post.b, 0.95);
  const sigma = Math.sqrt(betaVariance(post.a, post.b));
  const meanPrior = betaMean(state.a0, state.b0);
  const meanData = state.n > 0 ? state.k / state.n : 0.5;
  const priorStrength = state.a0 + state.b0;
  const dataStrength = state.n;
  const pull = dataStrength / (priorStrength + dataStrength);   // 0 = all prior, 1 = all data

  // Tick marks at each of the three means so the user SEES the pull
  // from prior to data through posterior.
  ctx.lineWidth = 1.2;
  for (const [m, c, lab] of [
    [meanPrior, tok.cat1, 'prior'],
    [meanData,  tok.cat2, 'data'],
    [meanPost,  tok.cat3, 'post'],
  ]) {
    const p = px(m, 0);
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.moveTo(p.px, PLOT.y + PLOT.h - 18);
    ctx.lineTo(p.px, PLOT.y + PLOT.h - 2);
    ctx.stroke();
    ctx.fillStyle = c; ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(lab, p.px, PLOT.y + PLOT.h - 20);
  }

  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  const rows = [
    ['prior mean',  meanPrior.toFixed(4)],
    ['data mean',   meanData.toFixed(4)],
    ['post mean',   meanPost.toFixed(4)],
    ['k / n',       `${state.k} / ${state.n}`],
    ['sigma',       sigma.toFixed(4)],
    ['95% CI',      `${ci.lo.toFixed(3)}..${ci.hi.toFixed(3)}`],
    ['pull (data)', `${(pull * 100).toFixed(0)}%`],
  ];
  const xL = W - 190, xR = W - 16;
  let y = 20;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';  ctx.fillStyle = tok.fgMuted; ctx.fillText(k, xL, y);
    ctx.textAlign = 'right'; ctx.fillStyle = tok.fg; ctx.fillText(v, xR, y);
    y += 14;
  }
}

function applyControls() {
  state.a0 = parseFloat(sliderA0.value);
  state.b0 = parseFloat(sliderB0.value);
  state.k  = parseInt(sliderK.value, 10);
  state.n  = parseInt(sliderN.value, 10);
  if (state.k > state.n) { state.k = state.n; sliderK.value = state.k; }
  valueA0.textContent = state.a0.toFixed(1);
  valueB0.textContent = state.b0.toFixed(1);
  valueK.textContent  = String(state.k);
  valueN.textContent  = String(state.n);
  drawAll();
}
[sliderA0, sliderB0, sliderK, sliderN].forEach(s => s.addEventListener('input', applyControls));
// Prior preset dropdown: snaps alpha0, beta0 to one of four classic
// hyperprior choices so the user can see the prior bias dominate when
// it is strong and recede when data are abundant.
const PRIOR_PRESETS = {
  'flat': [2, 2], 'bias-heads': [18, 4], 'bias-tails': [4, 18], 'skeptic': [12, 12],
};
const selPrior = document.getElementById('select-prior');
if (selPrior) selPrior.addEventListener('change', () => {
  const p = PRIOR_PRESETS[selPrior.value]; if (!p) return;
  sliderA0.value = String(p[0]); sliderB0.value = String(p[1]);
  applyControls();
});
btnReset.addEventListener('click', () => {
  sliderA0.value = '2'; sliderB0.value = '2'; sliderK.value = '7'; sliderN.value = '10';
  if (selPrior) selPrior.value = 'flat';
  applyControls();
});
btnFlip.addEventListener('click', () => {
  let extraHeads = 0;
  for (let i = 0; i < 5; i += 1) if (rng() < state.trueBias) extraHeads += 1;
  state.n += 5;
  state.k += extraHeads;
  sliderN.value = String(state.n);
  sliderK.value = String(state.k);
  if (state.n > 50) { sliderN.max = String(state.n); sliderK.max = String(state.n); }
  applyControls();
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.n = Math.round(frac * 40);
    state.k = Math.round(state.trueBias * state.n);
    state.a0 = 2; state.b0 = 2;
    sliderA0.value = '2'; sliderB0.value = '2';
    sliderK.value = String(state.k); sliderN.value = String(state.n);
    valueA0.textContent = '2.0'; valueB0.textContent = '2.0';
    valueK.textContent = String(state.k); valueN.textContent = String(state.n);
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
