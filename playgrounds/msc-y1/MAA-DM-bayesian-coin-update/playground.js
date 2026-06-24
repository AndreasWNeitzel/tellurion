import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Beta-Binomial conjugate posterior. Three curves over theta in [0, 1]:
// prior (cat-1), normalized likelihood (cat-2), posterior (cat-3) with its
// 95 percent credible interval shaded.

import { makeRng } from '../../../shared/js/render/rng.js';
import { betaPdf, posteriorParams, betaMean, betaVariance, credibleInterval, credibleInterval95 } from './sim.js';
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
// Three stacked zones: the literal coin tosses (hero), the Beta belief
// curves, and a prior-versus-data pull strip on a shared theta axis.
const COINS = { x: 40, y: 56, w: W - 80, h: 432 };
const BELIEF = { x: 40, y: 512, w: W - 80, h: 300, ymax: 6 };
const PULL = { x: 40, y: 836, w: W - 80, h: 168 };

const rng = makeRng(0xC0FFEE);

const state = { a0: 2, b0: 2, k: 7, n: 10, trueBias: 0.7 };

function evenSeq(k, n) {
  const a = []; let acc = Math.floor(n / 2);
  for (let i = 0; i < n; i += 1) { acc += k; if (acc >= n) { acc -= n; a.push(1); } else a.push(0); }
  return a;
}

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

function panelLight(p, title) {
  ctx.fillStyle = '#0c0e14'; ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1; ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  ctx.fillStyle = tok.fg; ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, p.x + 10, p.y + 18);
}

function drawCoins() {
  const p = COINS;
  panelLight(p, 'the biased coin: heads or tails, one toss at a time');
  const n = state.n, k = state.k, t = n - k;
  const gold = '#d9a521', silver = '#b9bdc4';
  // big tally
  ctx.textBaseline = 'middle';
  ctx.font = fontString(canvas, 'heading', 'mono', 700); ctx.textAlign = 'left';
  ctx.fillStyle = gold; ctx.fillText(`${k}`, p.x + 14, p.y + 46);
  const kw = ctx.measureText(`${k}`).width;
  ctx.fillStyle = tok.fgMuted; ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillText('heads', p.x + 18 + kw, p.y + 47);
  ctx.fillStyle = tok.fg; ctx.font = fontString(canvas, 'heading', 'mono', 700);
  ctx.textAlign = 'right'; ctx.fillText(`${t}`, p.x + p.w - 70, p.y + 46);
  ctx.fillStyle = tok.fgMuted; ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.textAlign = 'left'; ctx.fillText('tails', p.x + p.w - 64, p.y + 47);
  ctx.textAlign = 'center'; ctx.fillStyle = tok.fgMuted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`${n} tosses of a coin that truly lands heads ${(state.trueBias * 100).toFixed(0)}% of the time`, p.x + p.w / 2, p.y + 46);

  // coin grid
  const seq = evenSeq(k, n);
  const gx = p.x + 16, gy = p.y + 78, gw = p.w - 32, gh = p.h - 96;
  const cols = Math.max(1, Math.min(16, Math.ceil(Math.sqrt(n * gw / Math.max(1, gh)))));
  const rows = Math.max(1, Math.ceil(n / cols));
  const cell = Math.min(gw / cols, gh / rows);
  const R = Math.min(20, cell * 0.42);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  for (let i = 0; i < n; i += 1) {
    const cx = gx + (i % cols + 0.5) * (gw / cols);
    const cy = gy + (Math.floor(i / cols) + 0.5) * Math.min(gh / rows, cell);
    const head = seq[i] === 1;
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.15, cx, cy, R);
    if (head) { g.addColorStop(0, '#f6d873'); g.addColorStop(1, gold); } else { g.addColorStop(0, '#e8eaee'); g.addColorStop(1, silver); }
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = head ? '#9a7415' : '#8f939b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
    if (i === n - 1) { ctx.strokeStyle = tok.cat3; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(cx, cy, R + 2.5, 0, 2 * Math.PI); ctx.stroke(); }
    if (R >= 9) { ctx.fillStyle = head ? '#5a430a' : '#55585e'; ctx.font = fontString(canvas, 'caption', 'mono', 700); ctx.fillText(head ? 'H' : 'T', cx, cy + 0.5); }
  }
  ctx.textBaseline = 'alphabetic';
}

function drawBelief() {
  const p = BELIEF;
  panelLight(p, 'belief about the bias theta: prior, likelihood, posterior');
  const post = posteriorParams({ a0: state.a0, b0: state.b0, k: state.k, n: state.n });
  const meanPost = betaMean(post.a, post.b);
  const ymax = Math.max(4, betaPdf(meanPost, post.a, post.b) * 1.18);
  const ax = p.x + 14, ay = p.y + 28, aw = p.w - 28, ah = p.h - 56;
  const X = (t) => ax + t * aw;
  const Y = (y) => ay + ah * (1 - Math.min(y, ymax) / ymax);
  // grid + theta ticks
  ctx.strokeStyle = tok.grid; ctx.lineWidth = 0.4; ctx.fillStyle = tok.fgFaint; ctx.font = fontString(canvas, 'tick'); ctx.textAlign = 'center';
  for (const t of [0, 0.25, 0.5, 0.75, 1]) { ctx.beginPath(); ctx.moveTo(X(t), ay); ctx.lineTo(X(t), ay + ah); ctx.stroke(); ctx.fillText(t.toFixed(2), X(t), ay + ah + 14); }
  // 95% CI shade
  if (post.a > 0 && post.b > 0) {
    const ci = credibleInterval(post.a, post.b, 0.95);
    ctx.fillStyle = 'rgba(85,168,104,0.18)'; ctx.beginPath(); ctx.moveTo(X(ci.lo), Y(0));
    const M = 160; for (let i = 0; i <= M; i += 1) { const tt = ci.lo + (i / M) * (ci.hi - ci.lo); ctx.lineTo(X(tt), Y(betaPdf(tt, post.a, post.b))); }
    ctx.lineTo(X(ci.hi), Y(0)); ctx.closePath(); ctx.fill();
  }
  const curve = (color, fn, lw) => {
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
    const N = 360; for (let i = 0; i <= N; i += 1) { const tt = i / N; const yy = Y(fn(tt)); i ? ctx.lineTo(X(tt), yy) : ctx.moveTo(X(tt), yy); }
    ctx.stroke();
  };
  curve(tok.cat1, (t) => betaPdf(t, state.a0, state.b0), 1.4);
  curve(tok.cat2, (t) => betaPdf(t, state.k + 1, state.n - state.k + 1), 1.4);
  curve(tok.cat3, (t) => betaPdf(t, post.a, post.b), 2.2);
  ctx.strokeStyle = tok.fgFaint; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(ax, ay + ah); ctx.lineTo(ax + aw, ay + ah); ctx.stroke();
  // legend
  ctx.font = fontString(canvas, 'tick', 'sans', 600); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const leg = [[tok.cat1, `prior B(${state.a0.toFixed(1)},${state.b0.toFixed(1)})`], [tok.cat2, 'likelihood'], [tok.cat3, `posterior B(${post.a.toFixed(1)},${post.b.toFixed(1)})`]];
  let lx = ax + 8; const ly = ay + 10;
  for (const [c, lab] of leg) { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 14, ly); ctx.stroke(); ctx.fillStyle = tok.fg; ctx.fillText(lab, lx + 18, ly); lx += ctx.measureText(lab).width + 40; }
  ctx.textBaseline = 'alphabetic';
}

function drawPull() {
  const p = PULL;
  panelLight(p, 'where the posterior sits: the prior pulls against the data');
  const meanPrior = betaMean(state.a0, state.b0);
  const meanData = state.n > 0 ? state.k / state.n : 0.5;
  const post = posteriorParams({ a0: state.a0, b0: state.b0, k: state.k, n: state.n });
  const meanPost = betaMean(post.a, post.b);
  const priorStrength = state.a0 + state.b0, dataStrength = state.n;
  const pull = dataStrength / (priorStrength + dataStrength);
  const ax = p.x + 14, aw = p.w - 28, ly = p.y + 64;
  const X = (t) => ax + t * aw;
  // theta axis aligned with the belief panel
  ctx.strokeStyle = tok.fgFaint; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax, ly); ctx.lineTo(ax + aw, ly); ctx.stroke();
  ctx.fillStyle = tok.fgFaint; ctx.font = fontString(canvas, 'tick'); ctx.textAlign = 'center';
  for (const t of [0, 0.25, 0.5, 0.75, 1]) { ctx.beginPath(); ctx.moveTo(X(t), ly - 3); ctx.lineTo(X(t), ly + 3); ctx.stroke(); ctx.fillText(t.toFixed(2), X(t), ly + 16); }
  // arrow from prior mean to data mean (the tug); posterior sits at the pull point
  ctx.strokeStyle = tok.fgFaint; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(meanPrior), ly - 22); ctx.lineTo(X(meanData), ly - 22); ctx.stroke(); ctx.setLineDash([]);
  const mark = (m, c, lab, up) => {
    const x = X(m), y = up ? ly - 22 : ly;
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI); ctx.fill();
    ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center';
    ctx.fillText(lab, x, up ? y - 9 : y + 26);
  };
  mark(meanPrior, tok.cat1, 'prior', true);
  mark(meanData, tok.cat2, 'data', true);
  mark(meanPost, tok.cat3, 'posterior', false);
  // strength bars: prior pseudo-count vs data count
  const by = p.y + 104, bh = 12, bx = ax, bw = aw;
  const total = priorStrength + dataStrength;
  ctx.fillStyle = tok.cat1; ctx.fillRect(bx, by, bw * priorStrength / total, bh);
  ctx.fillStyle = tok.cat2; ctx.fillRect(bx + bw * priorStrength / total, by, bw * dataStrength / total, bh);
  ctx.fillStyle = tok.fg; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(`prior weight ${(100 - pull * 100).toFixed(0)}%  (alpha0+beta0 = ${priorStrength.toFixed(0)} pseudo-tosses)`, bx, by + bh + 14);
  ctx.textAlign = 'right'; ctx.fillText(`data weight ${(pull * 100).toFixed(0)}%  (n = ${dataStrength})`, bx + bw, by + bh + 14);
  ctx.textBaseline = 'alphabetic';
}

function drawAll() {
  ctx.fillStyle = tok.bg; ctx.fillRect(0, 0, W, H);
  drawCoins();
  drawBelief();
  drawPull();
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
// Auto-stream coin flips so the posterior sharpens and walks toward the true
// bias on load; once data accumulate, restart from the prior to loop the
// "data overwhelms the prior" story. Any control pauses it.
let playing = !(DETERMINISTIC || prefersReducedMotion()), _last = (typeof performance !== 'undefined' ? performance.now() : 0), _acc = 0;
[sliderA0, sliderB0, sliderK, sliderN].forEach(s => s.addEventListener('input', () => { playing = false; applyControls(); }));
// Prior preset dropdown: snaps alpha0, beta0 to one of four classic
// hyperprior choices so the user can see the prior bias dominate when
// it is strong and recede when data are abundant.
const PRIOR_PRESETS = {
  'flat': [2, 2], 'bias-heads': [18, 4], 'bias-tails': [4, 18], 'skeptic': [12, 12],
};
const selPrior = document.getElementById('select-prior');
if (selPrior) selPrior.addEventListener('change', () => {
  playing = false;
  const p = PRIOR_PRESETS[selPrior.value]; if (!p) return;
  sliderA0.value = String(p[0]); sliderB0.value = String(p[1]);
  applyControls();
});
btnReset.addEventListener('click', () => {
  sliderA0.value = '2'; sliderB0.value = '2'; sliderK.value = '7'; sliderN.value = '10';
  if (selPrior) selPrior.value = 'flat';
  applyControls();
  if (!prefersReducedMotion()) playing = true;
});
function doFlip(m) {
  let extraHeads = 0;
  for (let i = 0; i < m; i += 1) if (rng() < state.trueBias) extraHeads += 1;
  state.n += m; state.k += extraHeads;
  sliderN.value = String(state.n); sliderK.value = String(state.k);
  if (state.n > 50) { sliderN.max = String(state.n); sliderK.max = String(state.n); }
  applyControls();
}
btnFlip.addEventListener('click', () => { playing = false; doFlip(5); });
function tick(now) {
  if (playing) {
    _acc += (now - _last) / 1000;
    if (_acc > 0.4) {
      _acc = 0;
      if (state.n >= 60) { state.n = 0; state.k = 0; sliderN.value = '0'; sliderK.value = '0'; sliderN.max = '50'; sliderK.max = '50'; applyControls(); }
      else doFlip(3);
    }
  }
  _last = now;
  requestAnimationFrame(tick);
}

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
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME && playing) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME && playing) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const p = posteriorParams({ a0: state.a0, b0: state.b0, k: state.k, n: state.n });
  const mean = betaMean(p.a, p.b);
  const sigma = Math.sqrt(betaVariance(p.a, p.b));
  return {
    fields: [
      { key: 'prior-a', label: 'prior $\\alpha$', value: state.a0.toFixed(1), format: 'float' },
      { key: 'posterior-mean', label: 'posterior mean', value: mean.toFixed(4), format: 'float' },
      { key: 'posterior-sigma', label: 'posterior std dev', value: sigma.toFixed(4), format: 'float' },
      { key: 'successes', label: 'heads (k/n)', value: `${state.k}/${state.n}`, format: undefined },
    ],
  };
};
window.playground.getInvariants = function () {
  const p = posteriorParams({ a0: state.a0, b0: state.b0, k: state.k, n: state.n });
  const expected_a = state.a0 + state.k;
  const expected_b = state.b0 + (state.n - state.k);
  const da = Math.abs(p.a - expected_a) / Math.max(1, expected_a);
  const db = Math.abs(p.b - expected_b) / Math.max(1, expected_b);
  return [
    {
      key: 'conjugate-posterior',
      label: 'Beta-Binomial conjugate (a = $\\alpha_0 + k$)',
      value: `a=${p.a.toFixed(1)} b=${p.b.toFixed(1)}`,
      status: da < 1e-10 && db < 1e-10 ? 'pass' : 'drift',
    },
  ];
};
