// Second-harmonic generation in a chi(2) crystal. Undepleted regime:
// I_2w(z) = (gamma z)^2 sinc^2(dk z/2), so z^2 growth only at perfect
// phase matching and coherence-length oscillation otherwise. Depleted
// phase-matched regime: I_2w = tanh^2(z/L_NL), I_w = sech^2(z/L_NL),
// I_w + I_2w = 1 (Manley-Rowe). The beam sweep is the propagation
// coordinate z through the crystal; the full analytic curve is drawn
// faint with a bright reveal and a playhead, freezing at the crystal
// exit. Side panels: the sinc^2 phase-matching acceptance and the
// beta-BBO type-I dispersion. Closed-form, deterministic, no RNG.
// Armstrong et al. 1962; Boyd 2008, Ch. 2; Eimerl et al. 1987.
import {
  sinc, shgUndepleted, coherenceLength, pumpIntensity, shgDepleted,
  conversionEfficiency, nonlinearLength, nO, nE, phaseMatchAngleTypeI,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rDk = document.getElementById('readout-dk');
const rLc = document.getElementById('readout-lc');
const rEta = document.getElementById('readout-eta');
const rTpm = document.getElementById('readout-tpm');
const selReg = document.getElementById('select-regime');
const sDk = document.getElementById('slider-dk'), vDk = document.getElementById('value-dk');
const sG = document.getElementById('slider-gamma'), vG = document.getElementById('value-gamma');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const LAMBDA_FW = 1.0642;                               // canonical Nd:YAG fundamental (micron)
const DEF_DK = 0.6, DEF_G = 0.06;
const N = 1600;
const st = { regime: 'undepleted', dk: DEF_DK, gamma: DEF_G, running: !prefersReducedMotion(), z: null, i1: null, i2: null, zEnd: 1, i2max: 1, zNow: 0 };

function windowLength() {
  if (st.regime === 'depleted') return 7 * nonlinearLength(st.gamma);
  if (st.dk > 1e-6) return Math.min(9 * coherenceLength(st.dk), 60);
  return 14;
}

function rebuild() {
  st.zEnd = windowLength();
  st.z = new Float64Array(N + 1); st.i1 = new Float64Array(N + 1); st.i2 = new Float64Array(N + 1);
  let mx = 1e-12;
  for (let i = 0; i <= N; i += 1) {
    const zz = st.zEnd * i / N;
    st.z[i] = zz;
    if (st.regime === 'depleted') { st.i2[i] = shgDepleted(zz, st.gamma); st.i1[i] = pumpIntensity(zz, st.gamma); }
    else { st.i2[i] = shgUndepleted(zz, st.dk, st.gamma); st.i1[i] = 1; }
    if (st.i2[i] > mx) mx = st.i2[i];
  }
  st.i2max = st.regime === 'depleted' ? 1 : mx;
  st.zNow = 0; st.running = true;
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px monospace';
  ctx.fillText(title, x + 8, y + 14);
}

function drawProfile(x, y, w, h) {
  const t = st.regime === 'depleted'
    ? 'intensity along crystal: I_2w = tanh^2(z/L_NL) [amber], I_w = sech^2 [blue], sum = 1'
    : 'second-harmonic I_2w(z) (undepleted): z^2 growth only when dk = 0';
  panel(x, y, w, h, t);
  const x0 = x + 40, x1 = x + w - 14, y0 = y + 26, y1 = y + h - 22;
  const X = (z) => x0 + (x1 - x0) * z / st.zEnd;
  const Y = (v) => y1 - (y1 - y0) * Math.max(0, Math.min(1, v));
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.setLineDash([2, 4]);
  for (const v of [0, 0.5, 1]) { ctx.beginPath(); ctx.moveTo(x0, Y(v)); ctx.lineTo(x1, Y(v)); ctx.stroke(); }
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '11px monospace';
  ctx.fillText('1', x + 8, Y(1) + 3); ctx.fillText('0', x + 8, Y(0) + 3);
  // coherence length marker (undepleted, mismatched)
  if (st.regime !== 'depleted' && st.dk > 1e-6) {
    const Lc = coherenceLength(st.dk);
    for (let m = 1; m * Lc < st.zEnd; m += 1) {
      ctx.strokeStyle = 'rgba(127,209,255,0.35)'; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(X(m * Lc), y0); ctx.lineTo(X(m * Lc), y1); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.fillStyle = 'rgba(127,209,255,0.85)'; ctx.fillText('L_c', X(Lc) + 3, y0 + 10);
  }
  const drawCurve = (arr, norm, color, faint) => {
    ctx.strokeStyle = color; ctx.globalAlpha = faint ? 0.28 : 1; ctx.lineWidth = faint ? 1 : 1.6;
    ctx.beginPath();
    for (let i = 0; i <= N; i += 1) { const xx = X(st.z[i]), yy = Y(arr[i] / norm); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
    ctx.stroke(); ctx.globalAlpha = 1;
  };
  // full faint, then bright revealed up to zNow
  drawCurve(st.i2, st.i2max, '#f1c069', true);
  if (st.regime === 'depleted') drawCurve(st.i1, 1, '#6fa0ff', true);
  const drawReveal = (arr, norm, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.beginPath();
    let s = false;
    for (let i = 0; i <= N; i += 1) { if (st.z[i] > st.zNow) break; const xx = X(st.z[i]), yy = Y(arr[i] / norm); s ? ctx.lineTo(xx, yy) : (ctx.moveTo(xx, yy), s = true); }
    ctx.stroke();
  };
  drawReveal(st.i2, st.i2max, '#f1c069');
  if (st.regime === 'depleted') drawReveal(st.i1, 1, '#6fa0ff');
  const px = X(st.zNow);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.moveTo(px, y0); ctx.lineTo(px, y1); ctx.stroke();
  ctx.fillStyle = 'rgba(200,215,240,0.6)';
  ctx.fillText('propagation z  (crystal length, micron)', x1 - 250, y + h - 8);
  if (st.regime !== 'depleted') ctx.fillText(`I_2w / max = ${st.i2max.toExponential(1)}`, x + 26, y + h - 8);
}

function drawAcceptance(x, y, w, h) {
  panel(x, y, w, h, 'phase-matching acceptance: eta proportional to sinc^2(dk L / 2)');
  const x0 = x + 30, x1 = x + w - 14, y0 = y + 28, y1 = y + h - 24;
  const L = st.zEnd;
  const dkMax = 6 * Math.PI / L;                        // a few lobes either side
  const X = (dk) => x0 + (x1 - x0) * (dk + dkMax) / (2 * dkMax);
  const Y = (v) => y1 - (y1 - y0) * v;
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let i = 0; i <= 240; i += 1) {
    const dk = -dkMax + 2 * dkMax * i / 240;
    const s = sinc(dk * L / 2); const xx = X(dk), yy = Y(s * s);
    i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.setLineDash([2, 4]);
  ctx.beginPath(); ctx.moveTo(X(0), y0); ctx.lineTo(X(0), y1); ctx.stroke(); ctx.setLineDash([]);
  const dkOp = st.regime === 'depleted' ? 0 : st.dk;
  const so = sinc(dkOp * L / 2);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(X(Math.max(-dkMax, Math.min(dkMax, dkOp))), Y(so * so), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.7)'; ctx.font = '11px monospace';
  ctx.fillText('dk = 0', X(0) + 3, y0 + 10);
  ctx.fillText('dk ->', x1 - 34, y1 + 14);
}

function drawDispersion(x, y, w, h) {
  panel(x, y, w, h, 'beta-BBO type-I dispersion: n_o(lambda) vs the SH index band');
  const x0 = x + 34, x1 = x + w - 12, y0 = y + 28, y1 = y + h - 24;
  const lo = 0.5, hi = 1.6;
  const ns = [];
  for (let i = 0; i <= 120; i += 1) { const lam = lo + (hi - lo) * i / 120; ns.push([lam, nO(lam), nE(lam / 2), nO(lam / 2)]); }
  let vmin = 1.5, vmax = 1.7;
  for (const r of ns) { vmin = Math.min(vmin, r[1], r[2]); vmax = Math.max(vmax, r[1], r[3]); }
  const X = (l) => x0 + (x1 - x0) * (l - lo) / (hi - lo);
  const Y = (v) => y1 - (y1 - y0) * (v - vmin) / (vmax - vmin);
  const line = (idx, color) => { ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); ns.forEach((r, i) => { const xx = X(r[0]), yy = Y(r[idx]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }); ctx.stroke(); };
  line(1, '#f1c069');                                   // n_o(lambda) fundamental
  line(2, '#6fa0ff');                                   // n_e(lambda/2) SH (theta=90)
  line(3, 'rgba(150,170,210,0.5)');                     // n_o(lambda/2) SH (theta=0)
  const lamM = LAMBDA_FW;
  ctx.strokeStyle = 'rgba(255,209,102,0.6)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(X(lamM), y0); ctx.lineTo(X(lamM), y1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(X(lamM), Y(nO(lamM)), 3.5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(241,192,105,0.85)'; ctx.font = '11px monospace';
  ctx.fillText('n_o(w)', X(0.95), Y(nO(0.95)) - 6);
  ctx.fillStyle = 'rgba(111,160,255,0.85)'; ctx.fillText('n_e(2w)', X(0.62), Y(nE(0.31)) + 12);
  ctx.fillStyle = 'rgba(200,215,240,0.7)'; ctx.fillText('lambda_FW (micron) ->', x1 - 150, y1 + 14);
  ctx.fillText('1.064', X(lamM) - 12, y1 + 14);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawProfile(20, 22, W - 40, 232);
  drawAcceptance(20, 270, (W - 52) / 2, H - 270 - 16);
  drawDispersion(20 + (W - 52) / 2 + 12, 270, (W - 52) / 2, H - 270 - 16);
  rDk.textContent = (st.regime === 'depleted' ? 0 : st.dk).toFixed(2);
  const Lc = coherenceLength(st.regime === 'depleted' ? 0 : st.dk);
  rLc.textContent = Number.isFinite(Lc) ? Lc.toFixed(2) : 'inf';
  const idx = Math.max(0, Math.min(N, Math.round(N * st.zNow / st.zEnd)));
  rEta.textContent = (st.regime === 'depleted'
    ? conversionEfficiency(st.zNow, st.gamma)
    : st.i2[idx]).toFixed(4);
  rTpm.textContent = (phaseMatchAngleTypeI(LAMBDA_FW) * 180 / Math.PI).toFixed(2);
}

const LIVE_FRAC = 1 / 480;
function tick() {
  if (st.running) {
    st.zNow = Math.min(st.zEnd, st.zNow + LIVE_FRAC * st.zEnd);
    if (st.zNow >= st.zEnd - 1e-9) { st.running = false; bP.textContent = 'Play'; bP.setAttribute('aria-pressed', 'true'); }
  }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vDk.textContent = st.dk.toFixed(2); vG.textContent = st.gamma.toFixed(2); }
selReg.addEventListener('change', () => { st.regime = selReg.value; rebuild(); syncLabels(); draw(); });
// Sliders update params AND immediately advance the sweep cursor to
// the end so the user sees the new curve INSTANTLY rather than
// watching it crawl back from zero. Previously rebuild() reset zNow
// = 0, so the user perceived "nothing happening" until the
// animation caught up.
sDk.addEventListener('input', () => { st.dk = parseFloat(sDk.value) / 100; syncLabels(); rebuild(); st.zNow = st.zEnd; st.running = false; draw(); });
sG.addEventListener('input', () => { st.gamma = parseFloat(sG.value) / 100; syncLabels(); rebuild(); st.zNow = st.zEnd; st.running = false; draw(); });
bR.addEventListener('click', () => {
  st.regime = 'undepleted'; st.dk = DEF_DK; st.gamma = DEF_G;
  selReg.value = 'undepleted'; sDk.value = String(DEF_DK * 100); sG.value = String(DEF_G * 100);
  syncLabels(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  if (!st.running && st.zNow >= st.zEnd - 1e-9) { st.zNow = 0; st.running = true; bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); }
  else { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); }
});

function getState() { return { regime: st.regime, dk: st.dk.toFixed(2), gamma: st.gamma.toFixed(2) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.regime) { st.regime = s.regime; selReg.value = s.regime; }
  if (s.dk) { st.dk = parseFloat(s.dk); sDk.value = String(Math.round(st.dk * 100)); }
  if (s.gamma) { st.gamma = parseFloat(s.gamma); sG.value = String(Math.round(st.gamma * 100)); }
}

function boot() {
  restoreState(); syncLabels(); rebuild();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.zNow = f * st.zEnd;
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
