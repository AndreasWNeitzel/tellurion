// playground.js
// Series convergence tests made visual. Top-left: the term bars a_n
// (the addends) shrinking, with the running partial sum. Top-right:
// the ratio |a_{n+1}/a_n| and root |a_n|^{1/n} curves against the
// threshold rho = 1, with the verdict. Bottom: the partial-sum trace
// vs N with the true limit and the N marker. sim.js is unchanged.

import { SERIES, partialSum, ratioTest, rootTest } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutS = document.getElementById('readout-s');
const readoutR = document.getElementById('readout-r');
const selectS = document.getElementById('select-s');
const sliderN = document.getElementById('slider-N');
const valueS = document.getElementById('value-s');
const valueN = document.getElementById('value-N');

const W = canvas.width, H = canvas.height;
const NMAX = 200;
const st = { name: selectS.value, N: parseInt(sliderN.value, 10) };

function drawTerms(px, py, pw, ph) {
  const S = SERIES[st.name], t = S.terms;
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  const NB = Math.min(48, st.N);
  let aMax = 0;
  for (let n = 1; n <= NB; n += 1) aMax = Math.max(aMax, Math.abs(t(n)));
  const bw = (pw - 16) / NB, mid = py + ph / 2;
  for (let n = 1; n <= NB; n += 1) {
    const a = t(n);
    const hh = (Math.abs(a) / aMax) * (ph / 2 - 12);
    ctx.fillStyle = a >= 0 ? 'rgba(91,192,235,0.85)' : 'rgba(239,71,111,0.85)';
    ctx.fillRect(px + 8 + (n - 1) * bw, a >= 0 ? mid - hh : mid, Math.max(1, bw - 1), hh);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(px + 8, mid); ctx.lineTo(px + pw - 8, mid); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('term a_n (the addends)', px + 8, py + 14);
}

function drawTests(px, py, pw, ph) {
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  const yOf = (v) => py + ph - 14 - (ph - 26) * Math.max(0, Math.min(1.6, v)) / 1.6;
  const xOf = (n) => px + 32 + (pw - 44) * (n - 1) / (NMAX - 1);
  // threshold rho = 1
  ctx.strokeStyle = 'rgba(239,71,111,0.6)'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(px + 32, yOf(1)); ctx.lineTo(px + pw - 12, yOf(1)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(239,71,111,0.8)'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('rho = 1', px + 34, yOf(1) - 4);
  const curve = (fn, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.beginPath();
    let started = false;
    for (let n = 2; n <= NMAX; n += 1) {
      const v = fn(st.name, n);
      if (!Number.isFinite(v)) continue;
      const X = xOf(n), Y = yOf(v);
      if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  };
  curve(ratioTest, '#5bc0eb');
  curve(rootTest, '#ffd166');
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('ratio |a_{n+1}/a_n|', px + 8, py + 14);
  ctx.fillStyle = '#ffd166'; ctx.fillText('root |a_n|^{1/n}', px + 8, py + 28);
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const S = SERIES[st.name];
  const Sn = partialSum(st.name, st.N);
  const rho = ratioTest(st.name, st.N);
  const conv = Number.isFinite(S.limit);

  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '13px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(`${S.label}    S_${st.N} = ${Sn.toFixed(5)}`, 24, 24);
  ctx.fillStyle = conv ? '#06d6a0' : '#ef476f'; ctx.font = 'bold 12px ui-monospace, monospace';
  ctx.fillText(conv
    ? `converges to ${S.limit.toFixed(5)}   (ratio rho -> ${rho.toFixed(3)})`
    : `diverges   (harmonic: terms ~ 1/n, sum unbounded)`, 24, 42);

  const pad = 24, halfW = (W - 3 * pad) / 2, topH = 150;
  drawTerms(pad, 56, halfW, topH);
  drawTests(pad * 2 + halfW, 56, halfW, topH);

  // Partial-sum trace.
  const tY0 = 232, tY1 = H - 30, tX0 = 48, tX1 = W - 24;
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(tX0, tY0, tX1 - tX0, tY1 - tY0);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(tX0 + 0.5, tY0 + 0.5, tX1 - tX0 - 1, tY1 - tY0 - 1);
  let lo = Infinity, hi = -Infinity;
  for (let n = 1; n <= NMAX; n += 1) { const s = partialSum(st.name, n); if (s < lo) lo = s; if (s > hi) hi = s; }
  if (conv) { lo = Math.min(lo, S.limit); hi = Math.max(hi, S.limit); }
  const sp = (hi - lo) || 1; lo -= 0.08 * sp; hi += 0.08 * sp;
  const nX = (n) => tX0 + (tX1 - tX0) * (n - 1) / (NMAX - 1);
  const sY = (s) => tY1 - (tY1 - tY0) * (s - lo) / (hi - lo);
  if (conv) {
    ctx.strokeStyle = 'rgba(6,214,160,0.7)'; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(tX0, sY(S.limit)); ctx.lineTo(tX1, sY(S.limit)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(6,214,160,0.85)'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'right';
    ctx.fillText(`limit ${S.limit.toFixed(4)}`, tX1 - 6, sY(S.limit) - 4);
  }
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let n = 1; n <= NMAX; n += 1) { const X = nX(n), Y = sY(partialSum(st.name, n)); if (n === 1) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
  ctx.stroke();
  const mx = nX(st.N);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(mx, tY0); ctx.lineTo(mx, tY1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(mx, sY(Sn), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(`N = ${st.N}`, mx, tY1 + 14);
  ctx.textAlign = 'left'; ctx.fillText('partial sum S_N vs N', tX0 + 6, tY0 + 14);

  readoutS.textContent = Sn.toFixed(5);
  readoutR.textContent = rho.toFixed(4);
}

selectS.addEventListener('change', () => { st.name = selectS.value; valueS.textContent = st.name; render(); });
sliderN.addEventListener('input', () => { st.N = parseInt(sliderN.value, 10); valueN.textContent = String(st.N); render(); });

function bootSync() {
  valueS.textContent = st.name;
  valueN.textContent = String(st.N);
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const keys = Object.keys(SERIES);
    st.name = keys[Math.min(keys.length - 1, Math.round(f * (keys.length - 1)))];
    selectS.value = st.name; valueS.textContent = st.name;
    st.N = Math.max(2, Math.round(f * NMAX));
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
      }));
    }
    return;
  }
  render();
}

bootSync();
