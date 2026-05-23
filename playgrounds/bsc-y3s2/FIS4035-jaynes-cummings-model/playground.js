// Resonant Jaynes-Cummings model: a two-level atom (initially excited)
// in one quantised cavity mode with a coherent field of mean photon
// number nbar. The atomic inversion W(t) = sum_n P(n) cos(2 g t
// sqrt(n+1)) Rabi-oscillates, collapses on the frequency-spread time
// (~ sqrt2/g, nbar-independent) and revives near t_r = 2 pi sqrt(nbar)
// / g (Eberly, Narozhny and Sanchez-Mondragon 1980; Gerry and Knight
// 2005, Ch. 4). The full analytic W(t) over the window is drawn faint;
// a bright sweep with a playhead reveals it in time. Side panels show
// the Poissonian photon distribution P(n) and the coherent-field
// Wigner blob in phase space. Closed-form, deterministic, no RNG.
import {
  collapseTime, revivalTime, photonDist, inversionSeries,
  coherentWigner,
} from './sim.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
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
const rT = document.getElementById('readout-t');
const rW = document.getElementById('readout-w');
const rPe = document.getElementById('readout-pe');
const rTc = document.getElementById('readout-tc');
const rTr = document.getElementById('readout-tr');
const sN = document.getElementById('slider-nbar'), vN = document.getElementById('value-nbar');
const sG = document.getElementById('slider-g'), vG = document.getElementById('value-g');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const DEF_NBAR = 25, DEF_G = 1;
const N_SAMPLES = 4000;                                // analytic-curve resolution
const st = { nbar: DEF_NBAR, g: DEF_G, running: !prefersReducedMotion(), series: null, tWin: 1, tNow: 0, P: null };

// The time window is fixed at the DEFAULT coupling g (DEF_G). It used
// to track 1/g, which auto-rescaled the axis so that g had no visible
// effect at all (the whole JC dynamics depends only on g*t). With a
// g-independent window, raising g visibly compresses the Rabi
// oscillations and packs in more collapse-revival cycles.
function windowTime(nbar) {
  return Math.max(2.4 * revivalTime(nbar, DEF_G), 24 / DEF_G, 18);
}

function rebuild() {
  st.tWin = windowTime(st.nbar);
  st.series = inversionSeries(st.tWin, N_SAMPLES, st.nbar, st.g);
  st.P = photonDist(st.nbar);
  st.tNow = 0; st.running = true;
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
}

function wAt(t) {                                      // analytic W at arbitrary t (interp the series)
  const f = Math.max(0, Math.min(1, t / st.tWin)) * N_SAMPLES;
  const i = Math.min(N_SAMPLES - 1, Math.floor(f));
  const a = f - i;
  return st.series.w[i] * (1 - a) + st.series.w[i + 1] * a;
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

function drawInversion(x, y, w, h) {
  panel(x, y, w, h, 'atomic inversion W(t) = <sigma_z>: Rabi collapse then revival');
  const x0 = x + 44, x1 = x + w - 12, yc = y + h * 0.56, amp = (h - 44) * 0.42;
  const X = (t) => x0 + (x1 - x0) * Math.min(1, t / st.tWin);
  const Y = (wv) => yc - amp * wv;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.setLineDash([2, 4]);
  for (const wv of [1, 0, -1]) { ctx.beginPath(); ctx.moveTo(x0, Y(wv)); ctx.lineTo(x1, Y(wv)); ctx.stroke(); }
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('+1', x + 8, Y(1) + 3); ctx.fillText(' 0', x + 8, Y(0) + 3); ctx.fillText('-1', x + 8, Y(-1) + 3);
  const tc = collapseTime(st.g), tr = revivalTime(st.nbar, st.g);
  ctx.strokeStyle = 'rgba(127,209,255,0.5)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(X(tc), y + 20); ctx.lineTo(X(tc), y + h - 8); ctx.stroke();
  if (tr > 0 && tr < st.tWin) { ctx.strokeStyle = 'rgba(241,192,105,0.55)'; ctx.beginPath(); ctx.moveTo(X(tr), y + 20); ctx.lineTo(X(tr), y + h - 8); ctx.stroke(); }
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(127,209,255,0.85)'; ctx.fillText('collapse t_c', X(tc) + 4, y + 28);
  if (tr > 0 && tr < st.tWin) { ctx.fillStyle = 'rgba(241,192,105,0.9)'; ctx.fillText('revival t_r', X(tr) + 4, y + 28); }
  const ww = st.series.w, tt = st.series.t;
  ctx.strokeStyle = 'rgba(150,170,210,0.28)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 0; i <= N_SAMPLES; i += 1) { const xx = X(tt[i]), yy = Y(ww[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 1.6; ctx.beginPath();
  let started = false;
  for (let i = 0; i <= N_SAMPLES; i += 1) {
    if (tt[i] > st.tNow) break;
    const xx = X(tt[i]), yy = Y(ww[i]);
    started ? ctx.lineTo(xx, yy) : (ctx.moveTo(xx, yy), started = true);
  }
  ctx.stroke();
  const px = X(st.tNow);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.moveTo(px, y + 20); ctx.lineTo(px, y + h - 8); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(px, Y(wAt(st.tNow)), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.6)'; ctx.fillText('time t  (units of 1/g)', x1 - 150, y + h - 12);
}

function drawPhotonDist(x, y, w, h) {
  panel(x, y, w, h, 'cavity photon number distribution P(n): coherent (Poissonian)');
  const P = st.P;
  let nMax = 0, pMax = 1e-9;
  for (let n = 0; n < P.length; n += 1) { if (P[n] > 1e-4) nMax = n; if (P[n] > pMax) pMax = P[n]; }
  nMax = Math.max(nMax, 4);
  const x0 = x + 36, x1 = x + w - 12, y0 = y + 26, y1 = y + h - 24;
  const bw = (x1 - x0) / (nMax + 1);
  ctx.fillStyle = '#6fa0ff';
  for (let n = 0; n <= nMax; n += 1) {
    const bh = (y1 - y0) * P[n] / pMax;
    ctx.fillRect(x0 + n * bw + 1, y1 - bh, Math.max(1, bw - 2), bh);
  }
  const mx = x0 + st.nbar * bw + bw / 2;
  ctx.strokeStyle = 'rgba(241,192,105,0.8)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(mx, y0); ctx.lineTo(mx, y1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(241,192,105,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`nbar = ${st.nbar.toFixed(1)}`, Math.min(mx + 4, x1 - 70), y0 + 10);
  ctx.fillStyle = 'rgba(200,215,240,0.7)';
  ctx.fillText('n ->', x1 - 28, y1 + 16); ctx.fillText('P(n)', x + 6, y0 + 4);
}

function drawWigner(x, y, w, h) {
  panel(x, y, w, h, 'field phase space: Wigner W(x,p) of the coherent state');
  const x0c = x + 30, x1c = x + w - 14, y0c = y + 26, y1c = y + h - 24;
  const xq = Math.sqrt(2 * st.nbar);
  const XR = [-3.2, Math.max(6, xq + 3.4)], PR = [-3.6, 3.6];
  const cols = 64, rows = 40;
  const cw = (x1c - x0c) / cols, ch = (y1c - y0c) / rows;
  const wmax = 2 / Math.PI;
  for (let j = 0; j < rows; j += 1) {
    const pq = PR[1] + (PR[0] - PR[1]) * (j + 0.5) / rows;
    for (let i = 0; i < cols; i += 1) {
      const xx = XR[0] + (XR[1] - XR[0]) * (i + 0.5) / cols;
      const v = coherentWigner(xx, pq, st.nbar) / wmax;
      const { r, g, b } = viridis(Math.max(0, Math.min(1, v)));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x0c + i * cw, y0c + j * ch, cw + 1, ch + 1);
    }
  }
  const PX = (xx) => x0c + (x1c - x0c) * (xx - XR[0]) / (XR[1] - XR[0]);
  const PY = (pp) => y0c + (y1c - y0c) * (PR[1] - pp) / (PR[1] - PR[0]);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PX(XR[0]), PY(0)); ctx.lineTo(PX(XR[1]), PY(0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(PX(0), PY(PR[0])); ctx.lineTo(PX(0), PY(PR[1])); ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(PX(xq), PY(0), 3, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('x = sqrt2 Re(α) ->', x1c - 150, y1c + 16);
  ctx.fillText('p', PX(0) + 4, y0c + 6);
  ctx.fillText('|α|=sqrt(nbar)', Math.min(PX(xq) + 6, x1c - 110), PY(0) - 6);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawInversion(20, 22, W - 40, 232);
  drawPhotonDist(20, 270, (W - 52) / 2, H - 270 - 16);
  drawWigner(20 + (W - 52) / 2 + 12, 270, (W - 52) / 2, H - 270 - 16);
  const wv = wAt(st.tNow);
  rT.textContent = st.tNow.toFixed(2);
  rW.textContent = (wv >= 0 ? '+' : '') + wv.toFixed(3);
  rPe.textContent = (0.5 * (1 + wv)).toFixed(3);
  rTc.textContent = collapseTime(st.g).toFixed(2);
  const tr = revivalTime(st.nbar, st.g);
  rTr.textContent = tr > 0 ? tr.toFixed(2) : '--';
}

const LIVE_DT_FRAC = 1 / 600;                          // full window in ~10 s at 60 fps
function tick() {
  if (st.running) {
    st.tNow = Math.min(st.tWin, st.tNow + LIVE_DT_FRAC * st.tWin);
    if (st.tNow >= st.tWin - 1e-9) { st.running = false; bP.textContent = 'Play'; bP.setAttribute('aria-pressed', 'true'); }
  }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vN.textContent = st.nbar.toFixed(1); vG.textContent = st.g.toFixed(2); }
sN.addEventListener('input', () => { st.nbar = parseFloat(sN.value) / 10; syncLabels(); rebuild(); });
sG.addEventListener('input', () => { st.g = parseFloat(sG.value) / 100; syncLabels(); rebuild(); });
bR.addEventListener('click', () => {
  st.nbar = DEF_NBAR; st.g = DEF_G;
  sN.value = String(DEF_NBAR * 10); sG.value = String(DEF_G * 100);
  syncLabels(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  if (!st.running && st.tNow >= st.tWin - 1e-9) { st.tNow = 0; st.running = true; bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); }
  else { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); }
});

function getState() { return { nbar: st.nbar.toFixed(1), g: st.g.toFixed(2) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.nbar) { st.nbar = parseFloat(s.nbar); sN.value = String(Math.round(st.nbar * 10)); }
  if (s.g) { st.g = parseFloat(s.g); sG.value = String(Math.round(st.g * 100)); }
}

function boot() {
  restoreState(); syncLabels(); rebuild();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.tNow = f * st.tWin;
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const tc = collapseTime(st.g);
    const tr = revivalTime(st.nbar, st.g);
    return { fields: [
      { key: 'photon-number', label: 'mean photon number $\\bar{n}$', value: st.nbar.toFixed(1), format: 'float' },
      { key: 'coupling', label: 'coupling $g$', value: st.g.toFixed(2), format: 'float' },
      { key: 'collapse-time', label: 'collapse time $t_c$', value: tc.toFixed(2), format: 'float' },
    ] };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    try {
      if (!st || !st.series) return [];
      const tc = collapseTime(st.g);
      const tr = revivalTime(st.nbar, st.g);
      return [{
        key: 'collapse-revival',
        label: '$t_c = \\sqrt{2}/g$; revival near $t_r$',
        value: `$t_c=${tc.toFixed(2)}$; $t_r=${tr > 0 ? tr.toFixed(2) : '--'}$`,
        status: st.tWin > tc ? 'pass' : 'pending',
      }];
    } catch (e) { return []; }
  };
}
