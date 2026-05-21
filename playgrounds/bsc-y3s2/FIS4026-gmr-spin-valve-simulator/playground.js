// Spin valve magnetoresistance. Panel A: the hysteretic R(H) loop as
// the applied field sweeps and the soft free layer flips against the
// pinned layer (low-R parallel / high-R antiparallel). Panel B: the
// stack with the two magnetisation arrows and the spacer (metallic
// for GMR, tunnel barrier for TMR). Panel C: the model curve, GMR
// beta^2/(1-beta^2) or Julliere TMR 2P^2/(1-P^2). Gate-tested sim.js;
// deterministic. Mott 1936; Julliere 1975; Baibich 1988; Dieny 1991.
import {
  rParallel, rAntiparallel, gmrRatio, tmrJulliere, tmrResistances,
  hysteresisLoop, createValve, stepField, valveState,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rH = document.getElementById('readout-h');
const rState = document.getElementById('readout-state');
const rR = document.getElementById('readout-r');
const rMR = document.getElementById('readout-mr');
const selM = document.getElementById('select-model');
const sP = document.getElementById('slider-p'), vP = document.getElementById('value-p');
const sHc = document.getElementById('slider-hc'), vHc = document.getElementById('value-hc');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const HC_PIN = 1.2, HMAX = 1.6, NLOOP = 2400;
const DEF_MODEL = 'gmr', DEF_P = 0.5, DEF_HC = 0.3;
const st = { model: DEF_MODEL, P: DEF_P, hcFree: DEF_HC, running: !prefersReducedMotion(), ph: 0, loop: null, rAP: 2, mr: 0 };

function modelResistances() {
  if (st.model === 'tmr') {
    const { rP, rAP } = tmrResistances(st.P, st.P);
    return { rP, rAP, mr: tmrJulliere(st.P, st.P) };
  }
  const rUp = 1, rDn = (1 + st.P) / (1 - st.P);          // channel asymmetry from P
  const rp = rParallel(rUp, rDn), rap = rAntiparallel(rUp, rDn);
  return { rP: 1, rAP: rap / rp, mr: gmrRatio(rUp, rDn) };
}

function rebuild() {
  const { rAP, mr } = modelResistances();
  st.rAP = rAP; st.mr = mr;
  st.loop = hysteresisLoop(NLOOP, { hcFree: st.hcFree, hcPin: HC_PIN, rP: 1, rAP, Hmax: HMAX });
  st.ph = 0; st.running = true;
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
}

// Free/pinned magnetisation at the current playhead, by replaying the
// field history along the precomputed loop (true hysteretic state).
function stateAt(idx) {
  const v = createValve({ hcFree: st.hcFree, hcPin: HC_PIN, rP: 1, rAP: st.rAP });
  stepField(v, HMAX);
  for (let i = 0; i <= idx; i += 1) stepField(v, st.loop.H[i]);
  return { mFree: v.mFree, mPin: v.mPin, state: valveState(v), R: v.mFree === v.mPin ? 1 : st.rAP };
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

function drawLoop(x, y, w, h, idx) {
  panel(x, y, w, h, 'magnetoresistance loop R(H): parallel (low) and antiparallel (high)');
  const x0 = x + 44, x1 = x + w - 16, y0 = y + 28, y1 = y + h - 26;
  const rMaxAxis = st.rAP * 1.12;
  const X = (hh) => x0 + (x1 - x0) * (hh + HMAX) / (2 * HMAX);
  const Y = (rr) => y1 - (y1 - y0) * (rr - 0.9) / (rMaxAxis - 0.9);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.setLineDash([2, 4]);
  for (const rr of [1, st.rAP]) { ctx.beginPath(); ctx.moveTo(x0, Y(rr)); ctx.lineTo(x1, Y(rr)); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(X(0), y0); ctx.lineTo(X(0), y1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('R_P', x + 8, Y(1) + 3); ctx.fillText('R_AP', x + 6, Y(st.rAP) + 3);
  // full loop faint, revealed part bright
  const Lp = st.loop;
  const drawSeg = (a, b, style, lw) => {
    ctx.strokeStyle = style; ctx.lineWidth = lw; ctx.beginPath();
    for (let i = a; i <= b; i += 1) { const xx = X(Lp.H[i]), yy = Y(Lp.R[i]); i === a ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
    ctx.stroke();
  };
  drawSeg(0, NLOOP, 'rgba(150,170,210,0.28)', 1);
  drawSeg(0, idx, '#7fd1ff', 2);
  const xx = X(Lp.H[idx]), yy = Y(Lp.R[idx]);
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(xx, yy, 5, 0, 2 * Math.PI); ctx.fill();
  // switching-field markers
  ctx.fillStyle = 'rgba(241,192,105,0.7)';
  ctx.fillText('+Hc_free', X(st.hcFree) - 6, y1 + 14);
  ctx.fillText('-Hc_free', X(-st.hcFree) - 6, y1 + 14);
  ctx.fillStyle = 'rgba(200,215,240,0.6)'; ctx.fillText('applied field H ->', x1 - 120, y0 + 12);
}

function arrow(cx, cy, dir, col, label) {
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3;
  const L = 26 * dir;
  ctx.beginPath(); ctx.moveTo(cx - L, cy); ctx.lineTo(cx + L, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + L, cy); ctx.lineTo(cx + L - 7 * dir, cy - 5); ctx.lineTo(cx + L - 7 * dir, cy + 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(220,230,250,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(label, cx - 70, cy + 4);
}

function drawStack(x, y, w, h, sAt) {
  panel(x, y, w, h, `spin-valve stack: ${st.model === 'tmr' ? 'FM / tunnel barrier / FM' : 'FM / metal spacer / FM'}`);
  const cx = x + w * 0.56, lw = w * 0.5;
  const yFree = y + 54, ySpace = y + 96, yPin = y + 138;
  ctx.fillStyle = '#26408a'; ctx.fillRect(cx - lw / 2, yFree - 18, lw, 30);                 // free layer
  ctx.fillStyle = st.model === 'tmr' ? '#3a3340' : '#2a3550';
  ctx.fillRect(cx - lw / 2, ySpace - 12, lw, 22);                                            // spacer / barrier
  ctx.fillStyle = '#26408a'; ctx.fillRect(cx - lw / 2, yPin - 18, lw, 30);                   // pinned layer
  // exchange-bias hatch under the pinned layer
  ctx.strokeStyle = 'rgba(231,155,255,0.6)'; ctx.lineWidth = 1;
  for (let i = 0; i < lw; i += 7) { ctx.beginPath(); ctx.moveTo(cx - lw / 2 + i, yPin + 14); ctx.lineTo(cx - lw / 2 + i + 5, yPin + 22); ctx.stroke(); }
  ctx.fillStyle = 'rgba(231,155,255,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('antiferromagnet (exchange bias)', cx - lw / 2, yPin + 36);
  arrow(cx, yFree - 3, sAt.mFree, '#7fd1ff', 'free');
  arrow(cx, yPin - 3, sAt.mPin, '#f1c069', 'pinned');
  ctx.fillStyle = 'rgba(220,230,250,0.7)';
  ctx.fillText(st.model === 'tmr' ? 'tunnel barrier' : 'metal spacer', cx + lw / 2 + 6, ySpace + 2);
  const par = sAt.state === 'parallel';
  ctx.fillStyle = par ? '#8fe39b' : '#ff8f8f'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(par ? 'PARALLEL  (low resistance R_P)' : 'ANTIPARALLEL  (high resistance R_AP)', x + 14, y + h - 14);
}

function drawModelCurve(x, y, w, h) {
  panel(x, y, w, h, st.model === 'tmr' ? 'Julliere: TMR = 2 P^2 / (1 - P^2)' : 'two-current: GMR = beta^2 / (1 - beta^2)');
  const x0 = x + 34, x1 = x + w - 14, y0 = y + 28, y1 = y + h - 24;
  const f = (p) => (st.model === 'tmr' ? tmrJulliere(p, p) : gmrRatio(1, (1 + p) / (1 - p)));
  let ymax = 1e-6; for (let i = 0; i <= 100; i += 1) ymax = Math.max(ymax, f(0.97 * i / 100));
  const X = (p) => x0 + (x1 - x0) * p / 0.97;
  const Y = (m) => y1 - (y1 - y0) * Math.min(1, m / ymax);
  ctx.strokeStyle = '#8fe39b'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 100; i += 1) { const p = 0.97 * i / 100; const xx = X(p), yy = Y(f(p)); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(X(st.P), Y(st.mr), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(st.model === 'tmr' ? 'P ->' : 'beta ->', x1 - 34, y1 + 14);
  ctx.fillText(`MR = ${(st.mr * 100).toFixed(0)}%`, x0 + 6, y0 + 12);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const idx = Math.max(0, Math.min(NLOOP, Math.round(st.ph * NLOOP)));
  const sAt = stateAt(idx);
  drawLoop(20, 22, W - 40, 232, idx);
  drawStack(20, 270, (W - 52) / 2, H - 270 - 16, sAt);
  drawModelCurve(20 + (W - 52) / 2 + 12, 270, (W - 52) / 2, H - 270 - 16);
  rH.textContent = (st.loop.H[idx] >= 0 ? '+' : '') + st.loop.H[idx].toFixed(2);
  rState.textContent = sAt.state;
  rR.textContent = sAt.R.toFixed(2);
  rMR.textContent = `${(st.mr * 100).toFixed(0)}%`;
}

const LIVE_FRAC = 1 / 480;
function tick() {
  if (st.running) {
    st.ph += LIVE_FRAC;
    if (st.ph >= 1) { st.ph = 1; st.running = false; bP.textContent = 'Play'; bP.setAttribute('aria-pressed', 'true'); }
  }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vP.textContent = st.P.toFixed(2); vHc.textContent = st.hcFree.toFixed(2); }
function restart() { st.ph = 0; st.running = true; bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); }
selM.addEventListener('change', () => { st.model = selM.value; rebuild(); syncLabels(); draw(); });
sP.addEventListener('input', () => { st.P = parseFloat(sP.value) / 100; syncLabels(); rebuild(); draw(); });
sHc.addEventListener('input', () => { st.hcFree = parseFloat(sHc.value) / 100; syncLabels(); rebuild(); draw(); });
bR.addEventListener('click', () => {
  st.model = DEF_MODEL; st.P = DEF_P; st.hcFree = DEF_HC;
  selM.value = DEF_MODEL; sP.value = String(DEF_P * 100); sHc.value = String(DEF_HC * 100);
  syncLabels(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  if (!st.running && st.ph >= 1) restart();
  else { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); }
});

function getState() { return { model: st.model, P: st.P.toFixed(2), hc: st.hcFree.toFixed(2) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.model) { st.model = s.model; selM.value = s.model; }
  if (s.P) { st.P = parseFloat(s.P); sP.value = String(Math.round(st.P * 100)); }
  if (s.hc) { st.hcFree = parseFloat(s.hc); sHc.value = String(Math.round(st.hcFree * 100)); }
}

function boot() {
  restoreState(); syncLabels(); rebuild();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.ph = f;
    draw();
  } else {
    draw();
  }
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  boot();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
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
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
