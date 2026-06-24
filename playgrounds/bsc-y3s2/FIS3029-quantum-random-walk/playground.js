// Quantum vs classical random walk on a 1D lattice. The hero is the
// space-time probability carpet P(x, t): the classical walk diffuses into a
// narrow Gaussian cone (width ~ sqrt(t)), while the Hadamard quantum walk
// spreads ballistically (width ~ t) into two interference-fringed horns. The
// overlaid final distributions and the variance readout make the t vs sqrt(t)
// speed-up quantitative.

import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutInv = document.getElementById('readout-invariant') || { textContent: '' };
const readoutFrame = document.getElementById('readout-frame') || { textContent: '' };
const controlsEl = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const MAXS = 60;
const N = 2 * MAXS + 1;          // lattice wide enough for the full light cone
const CENTER = MAXS;

const state = { steps: 38, playing: false, phase: 0.62, coin: 'symmetric' };
let stepsInput, stepsVal, btnPlay, coinSel;

// Per-step distributions up to maxSteps. Classical: simple diffusion update.
function classicalHistory(maxSteps) {
  const hist = [new Float64Array(N)]; hist[0][CENTER] = 1;
  for (let t = 1; t <= maxSteps; t += 1) {
    const prev = hist[t - 1], cur = new Float64Array(N);
    for (let x = 1; x < N - 1; x += 1) cur[x] = 0.5 * (prev[x - 1] + prev[x + 1]);
    hist.push(cur);
  }
  return hist;
}

// Hadamard walk; record |psi|^2 each step. Coin sets the initial spinor.
function quantumHistory(maxSteps, coin) {
  const inv = 1 / Math.SQRT2;
  let lR = new Float64Array(N), lI = new Float64Array(N), rR = new Float64Array(N), rI = new Float64Array(N);
  if (coin === 'symmetric') { lR[CENTER] = inv; rI[CENTER] = inv; }        // (|L> + i|R>)/sqrt2
  else if (coin === 'right') { rR[CENTER] = 1; }                            // |R>: skews right
  else { lR[CENTER] = 1; }                                                  // |L>: skews left
  const prob = (a, b, c, d) => { const p = new Float64Array(N); for (let x = 0; x < N; x += 1) p[x] = a[x] * a[x] + b[x] * b[x] + c[x] * c[x] + d[x] * d[x]; return p; };
  const hist = [prob(lR, lI, rR, rI)];
  for (let t = 1; t <= maxSteps; t += 1) {
    const aLR = new Float64Array(N), aLI = new Float64Array(N), aRR = new Float64Array(N), aRI = new Float64Array(N);
    for (let x = 0; x < N; x += 1) {
      aLR[x] = (lR[x] + rR[x]) * inv; aLI[x] = (lI[x] + rI[x]) * inv;
      aRR[x] = (lR[x] - rR[x]) * inv; aRI[x] = (lI[x] - rI[x]) * inv;
    }
    const nLR = new Float64Array(N), nLI = new Float64Array(N), nRR = new Float64Array(N), nRI = new Float64Array(N);
    for (let x = 0; x < N; x += 1) {
      if (x - 1 >= 0) { nLR[x - 1] = aLR[x]; nLI[x - 1] = aLI[x]; }
      if (x + 1 < N) { nRR[x + 1] = aRR[x]; nRI[x + 1] = aRI[x]; }
    }
    lR = nLR; lI = nLI; rR = nRR; rI = nRI;
    hist.push(prob(lR, lI, rR, rI));
  }
  return hist;
}

function variance(p) {
  let m = 0, tot = 0;
  for (let x = 0; x < N; x += 1) { m += (x - CENTER) * p[x]; tot += p[x]; }
  m /= Math.max(tot, 1e-12);
  let v = 0;
  for (let x = 0; x < N; x += 1) v += p[x] * (x - CENTER - m) ** 2;
  return v / Math.max(tot, 1e-12);
}

// warm = quantum (black->orange->white), cool = classical (black->blue->white)
function ramp(u, warm) {
  u = Math.max(0, Math.min(1, u));
  if (warm) return [Math.round(255 * Math.min(1, u * 1.8)), Math.round(255 * Math.max(0, u * 1.6 - 0.5)), Math.round(255 * Math.max(0, u * 2 - 1.2))];
  return [Math.round(255 * Math.max(0, u * 2 - 1.2)), Math.round(255 * Math.max(0, u * 1.5 - 0.3)), Math.round(255 * Math.min(1, u * 1.9))];
}

const off = document.createElement('canvas'); off.width = N; off.height = MAXS + 1;
const offCtx = off.getContext('2d');

function drawCarpet(hist, steps, x0, y0, w, h, warm, label) {
  const rows = steps + 1;
  const img = offCtx.createImageData(N, rows);
  for (let t = 0; t < rows; t += 1) {
    let rmax = 1e-9; for (let x = 0; x < N; x += 1) if (hist[t][x] > rmax) rmax = hist[t][x];
    for (let x = 0; x < N; x += 1) {
      const c = ramp(Math.sqrt(hist[t][x] / rmax), warm);  // per-row sqrt scaling for contrast
      const j = (t * N + x) * 4;
      img.data[j] = c[0]; img.data[j + 1] = c[1]; img.data[j + 2] = c[2]; img.data[j + 3] = 255;
    }
  }
  offCtx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, 0, 0, N, rows, x0, y0, w, h * rows / (MAXS + 1));
  ctx.strokeStyle = 'rgba(200,210,235,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(x0, y0, w, h * rows / (MAXS + 1));
  ctx.fillStyle = '#dfe3ee'; ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText(label, x0, y0 - 8);
}

function drawDist(C, Q, x0, y0, w, h) {
  let mx = 1e-9; for (let x = 0; x < N; x += 1) { if (C[x] > mx) mx = C[x]; if (Q[x] > mx) mx = Q[x]; }
  const xOf = (x) => x0 + (x / (N - 1)) * w;
  const yOf = (p) => y0 + h - (p / mx) * h;
  ctx.fillStyle = 'rgba(20,26,40,0.6)'; ctx.fillRect(x0 - 6, y0 - 26, w + 12, h + 44);
  ctx.fillStyle = '#dfe3ee'; ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText('final distribution  P(x)  at this step', x0, y0 - 10);
  // axis
  ctx.strokeStyle = 'rgba(200,210,235,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
  const fill = (p, col) => {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(xOf(0), y0 + h);
    for (let x = 0; x < N; x += 1) ctx.lineTo(xOf(x), yOf(p[x]));
    ctx.lineTo(xOf(N - 1), y0 + h); ctx.closePath(); ctx.fill();
  };
  fill(C, 'rgba(124,156,255,0.45)');
  fill(Q, 'rgba(255,180,90,0.5)');
  ctx.strokeStyle = '#ffb45a'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let x = 0; x < N; x += 1) { const X = xOf(x), Y = yOf(Q[x]); x ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.stroke();
  ctx.fillStyle = '#7c9cff'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.fillText('classical (Gaussian)', x0 + 6, y0 + 12);
  ctx.fillStyle = '#ffb45a'; ctx.fillText('quantum (twin peaks + fringes)', x0 + 6, y0 + 28);
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.textAlign = 'center'; ctx.fillText('position x', x0 + w / 2, y0 + h + 18);
}

function render() {
  ctx.fillStyle = '#0b0c12'; ctx.fillRect(0, 0, W, H);
  const C = classicalHistory(state.steps);
  const Q = quantumHistory(state.steps, state.coin);
  const cF = C[state.steps], qF = Q[state.steps];
  const vC = variance(cF), vQ = variance(qF);

  ctx.fillStyle = '#eef0f6'; ctx.font = fontString(canvas, 'body', 'sans', 600); ctx.textAlign = 'left';
  ctx.fillText('Quantum vs classical random walk', 22, 28);
  ctx.fillStyle = '#aab4c8'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`step ${state.steps}   spread sigma:  classical ${Math.sqrt(vC).toFixed(1)} (~sqrt t)   quantum ${Math.sqrt(vQ).toFixed(1)} (~t)   speed-up x${(Math.sqrt(vQ / Math.max(vC, 1e-6))).toFixed(2)}`, 22, 50);

  const cy0 = 96, ch = 470, cw = 366;
  drawCarpet(C, state.steps, 26, cy0, cw, ch, false, 'classical: diffusive cone');
  drawCarpet(Q, state.steps, 428, cy0, cw, ch, true, 'quantum: ballistic horns + interference');
  ctx.fillStyle = 'rgba(170,180,200,0.6)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('space-time carpet P(x,t): step 0 at top, position across', W / 2, cy0 + ch + 18);

  drawDist(cF, qF, 40, 656, W - 80, 300);

  readoutInv.textContent = `var_C=${vC.toFixed(2)} var_Q=${vQ.toFixed(2)} ratio=${(vQ / Math.max(vC, 1e-6)).toFixed(2)}`;
  readoutFrame.textContent = String(state.steps);
}

function buildControls() {
  controlsEl.innerHTML = '';
  const mkRow = () => { const r = document.createElement('div'); r.className = 'row'; controlsEl.appendChild(r); return r; };
  let r = mkRow();
  const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = 'qrw-steps'; lab.textContent = 'steps t';
  stepsInput = document.createElement('input'); stepsInput.id = 'qrw-steps'; stepsInput.type = 'range'; stepsInput.min = '2'; stepsInput.max = String(MAXS); stepsInput.value = String(state.steps);
  stepsInput.setAttribute('aria-label', 'Number of walk steps');
  stepsVal = document.createElement('span'); stepsVal.className = 'value'; stepsVal.textContent = String(state.steps);
  stepsInput.addEventListener('input', () => { state.steps = parseInt(stepsInput.value, 10); state.phase = state.steps / MAXS; stepsVal.textContent = String(state.steps); state.playing = false; if (btnPlay) btnPlay.textContent = 'Play'; render(); });
  r.append(lab, stepsInput, stepsVal);

  r = mkRow();
  const cl = document.createElement('label'); cl.className = 'label'; cl.htmlFor = 'qrw-coin'; cl.textContent = 'coin state';
  coinSel = document.createElement('select'); coinSel.id = 'qrw-coin'; coinSel.setAttribute('aria-label', 'initial coin state');
  for (const [v, t] of [['symmetric', 'symmetric'], ['left', 'left-biased'], ['right', 'right-biased']]) { const o = document.createElement('option'); o.value = v; o.textContent = t; coinSel.appendChild(o); }
  coinSel.value = state.coin;
  const cv = document.createElement('span'); cv.className = 'value'; cv.textContent = state.coin;
  coinSel.addEventListener('change', () => { state.coin = coinSel.value; cv.textContent = coinSel.options[coinSel.selectedIndex].text; render(); });
  r.append(cl, coinSel, cv);

  r = mkRow();
  btnPlay = document.createElement('button'); btnPlay.type = 'button'; btnPlay.textContent = 'Pause'; btnPlay.style.gridColumn = '1 / -1';
  btnPlay.addEventListener('click', () => { state.playing = !state.playing; btnPlay.textContent = state.playing ? 'Pause' : 'Play'; });
  r.appendChild(btnPlay);
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (state.playing) {
    state.phase = (state.phase + dt / 11) % 1;
    state.steps = 2 + Math.round(state.phase * (MAXS - 2));
    stepsInput.value = String(state.steps); stepsVal.textContent = String(state.steps);
    render();
  }
  requestAnimationFrame(tick);
}

buildControls();
if (CAPTURE_NAME) { state.steps = Math.round(8 + (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0.6) * (MAXS - 10)); stepsInput.value = String(state.steps); stepsVal.textContent = String(state.steps); }
render();
if (DETERMINISTIC) {
  state.playing = false;
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else if (!prefersReducedMotion()) {
  state.playing = true; requestAnimationFrame(tick);
} else { render(); }

window.__physicsCheck = async () => {
  const Q = quantumHistory(50, 'symmetric'); const pQ = Q[50];
  let total = 0; for (let i = 0; i < N; i += 1) total += pQ[i];
  if (Math.abs(total - 1) > 1e-8) return { name: 'unitarity', pass: false, msg: `sum|psi|^2 = ${total}` };
  const vC = variance(classicalHistory(50)[50]); const vQ = variance(pQ);
  if (Math.abs(vC - 50) / 50 > 0.05) return { name: 'classical var', pass: false, msg: `var_C(50) = ${vC.toFixed(2)}` };
  if (vQ < 75) return { name: 'quantum speedup', pass: false, msg: `var_Q(50) = ${vQ.toFixed(2)}` };
  return { name: 'unitarity + speedup', pass: true, msg: `sum=1 var_C=${vC.toFixed(2)} var_Q=${vQ.toFixed(2)}` };
};

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const vQ = variance(quantumHistory(state.steps, state.coin)[state.steps]);
  return { fields: [
    { key: 'time-steps', label: 'Steps', value: state.steps, format: 'float' },
    { key: 'variance-quantum', label: 'Variance (quantum)', value: parseFloat(vQ.toFixed(2)), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const pQ = quantumHistory(state.steps, state.coin)[state.steps];
  let total = 0; for (let i = 0; i < N; i += 1) total += pQ[i];
  return [{ key: 'probability-norm', label: 'P normalization (sum = 1)', value: total.toFixed(6), status: Math.abs(total - 1) < 1e-6 ? 'pass' : 'drift' }];
};
