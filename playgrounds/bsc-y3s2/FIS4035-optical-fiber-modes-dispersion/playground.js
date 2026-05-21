// Step-index weakly guiding optical fibre. Panel A: the b-V
// dispersion curves for LP01, LP11, LP21, LP02 with the single-mode
// region V < 2.405 shaded and the operating point marked. Panel B:
// the |E|^2 cross-section of the selected LP mode. Panel C:
// group-velocity-dispersion broadening of a Gaussian pulse along the
// fibre, T(z) = T0 sqrt(1 + (z/L_D)^2), with z swept and frozen at
// the fibre end. Gloge 1971; Snyder and Love 1983; Agrawal 2019.
// LP eigenvalues from the gate-tested sim.js; deterministic, no RNG.
import {
  solveLP, guidedModeCount, modeIntensity, dispersionLength, pulseWidth,
} from './sim.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rV = document.getElementById('readout-v');
const rModes = document.getElementById('readout-modes');
const rB = document.getElementById('readout-b');
const rTT = document.getElementById('readout-tt');
const selMode = document.getElementById('select-mode');
const sV = document.getElementById('slider-v'), vV = document.getElementById('value-v');
const sLd = document.getElementById('slider-ld'), vLd = document.getElementById('value-ld');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const CUTOFF = 2.404826;                                // LP11 / single-mode cutoff
const CURVES = [[0, 1, '#7fd1ff', 'LP01'], [1, 1, '#f1c069', 'LP11'], [2, 1, '#8fe39b', 'LP21'], [0, 2, '#d79bff', 'LP02']];
const DEF_V = 3.8, DEF_LD = 2.0;
const st = { l: 0, m: 1, V: DEF_V, LD: DEF_LD, running: !prefersReducedMotion(), zEnd: 1, zNow: 0, disp: null };

function rebuild() {
  st.zEnd = 4 * st.LD;
  st.disp = CURVES.map(([l, m, c, name]) => {
    const pts = [];
    for (let i = 0; i <= 220; i += 1) {
      const V = 0.3 + (9 - 0.3) * i / 220;
      const s = solveLP(V, l, m);
      if (s) pts.push([V, s.b]);
    }
    return { l, m, c, name, pts };
  });
  st.zNow = 0; st.running = true;
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px monospace';
  ctx.fillText(title, x + 8, y + 14);
}

function drawDispersion(x, y, w, h) {
  panel(x, y, w, h, 'normalised dispersion b(V): single-mode region V < 2.405 shaded');
  const x0 = x + 34, x1 = x + w - 14, y0 = y + 26, y1 = y + h - 24;
  const Vmax = 9;
  const X = (V) => x0 + (x1 - x0) * V / Vmax;
  const Y = (b) => y1 - (y1 - y0) * b;
  // single-mode shading
  ctx.fillStyle = 'rgba(127,209,255,0.07)'; ctx.fillRect(x0, y0, X(CUTOFF) - x0, y1 - y0);
  ctx.strokeStyle = 'rgba(127,209,255,0.4)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(X(CUTOFF), y0); ctx.lineTo(X(CUTOFF), y1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(127,209,255,0.8)'; ctx.font = '11px monospace';
  ctx.fillText('V = 2.405', X(CUTOFF) + 4, y0 + 12);
  ctx.fillText('single-mode', x0 + 6, y1 - 8);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.setLineDash([2, 4]);
  for (const b of [0, 0.5, 1]) { ctx.beginPath(); ctx.moveTo(x0, Y(b)); ctx.lineTo(x1, Y(b)); ctx.stroke(); }
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('b=1', x + 8, Y(1) + 3); ctx.fillText('b=0', x + 8, Y(0) + 3);
  for (const d of st.disp) {
    ctx.strokeStyle = d.c; ctx.lineWidth = (d.l === st.l && d.m === st.m) ? 2.4 : 1.3;
    ctx.beginPath();
    d.pts.forEach(([V, b], i) => { const xx = X(V), yy = Y(b); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); });
    ctx.stroke();
    if (d.pts.length) { const [lv, lb] = d.pts[d.pts.length - 1]; ctx.fillStyle = d.c; ctx.fillText(d.name, X(lv) - 30, Y(lb) - 4); }
  }
  // operating V
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.moveTo(X(st.V), y0); ctx.lineTo(X(st.V), y1); ctx.stroke();
  const cur = cachedSolveLP(st.V, st.l, st.m);
  if (cur) { ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X(st.V), Y(cur.b), 4, 0, 2 * Math.PI); ctx.fill(); }
  ctx.fillStyle = 'rgba(200,215,240,0.65)';
  ctx.fillText('V ->', x1 - 30, y1 + 14);
}

// Cache solveLP per (V, l, m) so it isn't recomputed every frame.
// solveLP runs a numerical eigenvalue search that is expensive
// enough to make the page lag when called at 60 Hz.
const _solveCache = new Map();
function cachedSolveLP(V, l, m) {
  const key = `${V.toFixed(4)}|${l}|${m}`;
  if (!_solveCache.has(key)) {
    _solveCache.set(key, solveLP(V, l, m));
    if (_solveCache.size > 32) _solveCache.delete(_solveCache.keys().next().value);
  }
  return _solveCache.get(key);
}

// Also cache the intensity image as an OffscreenCanvas so the per-
// pixel viridis loop only runs when the mode parameters change.
let _modeCanvas = null, _modeCacheKey = '';

function drawModeShape(x, y, w, h) {
  const name = `LP${st.l}${st.m}`;
  panel(x, y, w, h, `mode intensity |E|^2 cross-section: ${name}`);
  const cx = x + w * 0.42, cy = y + h * 0.54, R = Math.min(w, h) * 0.34;
  const mode = cachedSolveLP(st.V, st.l, st.m);
  const cell = 3;
  // The per-pixel viridis loop is expensive at 60 Hz. We render it
  // ONCE per (mode) into an offscreen canvas, then blit the cached
  // bitmap each frame.
  const key = `${st.V.toFixed(4)}|${st.l}|${st.m}|${R | 0}`;
  if (key !== _modeCacheKey || !_modeCanvas) {
    const D = Math.ceil(R * 2.5);
    _modeCanvas = new OffscreenCanvas(D, D);
    const moctx = _modeCanvas.getContext('2d');
    moctx.clearRect(0, 0, D, D);
    if (mode) {
      const cxL = D / 2, cyL = D / 2;
      for (let py = -R * 1.25; py < R * 1.25; py += cell) {
        for (let px = -R * 1.25; px < R * 1.25; px += cell) {
          const rr = Math.sqrt(px * px + py * py) / R;
          if (rr > 2.4) continue;
          const phi = Math.atan2(py, px);
          const az = Math.cos(st.l * phi);
          const v = modeIntensity(rr, mode) * az * az;
          const { r, g, b } = viridis(Math.max(0, Math.min(1, v)));
          moctx.fillStyle = `rgb(${r},${g},${b})`;
          moctx.fillRect(cxL + px, cyL + py, cell + 1, cell + 1);
        }
      }
    }
    _modeCacheKey = key;
  }
  if (_modeCanvas) {
    ctx.drawImage(_modeCanvas, cx - _modeCanvas.width / 2, cy - _modeCanvas.height / 2);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();   // core boundary r=a
  ctx.fillStyle = 'rgba(200,215,240,0.7)'; ctx.font = '11px monospace';
  ctx.fillText('core r = a', cx + R * 0.7, cy - R - 6);
  // radial profile strip on the right
  const px0 = x + w - 96, py0 = y + 30, pw = 80, ph = h - 56;
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(px0, py0, pw, ph);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText('|E|^2(r)', px0 + 4, py0 - 4);
  if (mode) {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.4; ctx.beginPath();
    for (let i = 0; i <= 100; i += 1) {
      const rr = 2.4 * i / 100;
      const v = modeIntensity(rr, mode);
      const xx = px0 + pw * rr / 2.4, yy = py0 + ph - ph * Math.max(0, Math.min(1, v));
      i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    const xa = px0 + pw / 2.4;
    ctx.strokeStyle = 'rgba(127,209,255,0.5)'; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(xa, py0); ctx.lineTo(xa, py0 + ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(127,209,255,0.7)'; ctx.fillText('r=a', xa + 2, py0 + ph - 4);
  }
}

function drawPulse(x, y, w, h) {
  panel(x, y, w, h, 'GVD pulse broadening: T(z) = T0 sqrt(1 + (z/L_D)^2)');
  const x0 = x + 30, x1 = x + w - 14, y0 = y + 28, y1 = y + h - 24;
  const T0 = 1, beta2 = -1 / st.LD;                       // L_D = T0^2/|beta2| = st.LD
  const Tt = pulseWidth(st.zNow, T0, beta2);
  const tmax = 7 * T0;
  const X = (t) => x0 + (x1 - x0) * (t + tmax) / (2 * tmax);
  const Y = (a) => y1 - (y1 - y0) * a;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.setLineDash([2, 4]);
  ctx.beginPath(); ctx.moveTo(X(0), y0); ctx.lineTo(X(0), y1); ctx.stroke(); ctx.setLineDash([]);
  const gauss = (T, amp) => {
    ctx.beginPath();
    for (let i = 0; i <= 240; i += 1) {
      const t = -tmax + 2 * tmax * i / 240;
      const a = amp * Math.exp(-(t * t) / (2 * T * T));
      const xx = X(t), yy = Y(a);
      i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  };
  // input (faint, area-normalised amplitude 1) and broadened (bright,
  // amplitude T0/T so the pulse energy is conserved)
  ctx.strokeStyle = 'rgba(150,170,210,0.4)'; ctx.lineWidth = 1; gauss(T0, 0.92);
  ctx.strokeStyle = '#f1c069'; ctx.lineWidth = 1.9; gauss(Tt, 0.92 * T0 / Tt);
  ctx.fillStyle = 'rgba(200,215,240,0.7)'; ctx.font = '11px monospace';
  ctx.fillText('time t / T0 ->', x1 - 96, y1 + 14);
  ctx.fillStyle = '#f1c069';
  ctx.fillText(`z/L_D = ${(st.zNow / st.LD).toFixed(2)}   T/T0 = ${Tt.toFixed(2)}`, x0 + 4, y0 + 10);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawDispersion(20, 22, W - 40, 232);
  drawModeShape(20, 270, (W - 52) / 2, H - 270 - 16);
  drawPulse(20 + (W - 52) / 2 + 12, 270, (W - 52) / 2, H - 270 - 16);
  rV.textContent = st.V.toFixed(2);
  rModes.textContent = String(guidedModeCount(st.V));
  const cur = solveLP(st.V, st.l, st.m);
  rB.textContent = cur ? cur.b.toFixed(3) : 'cutoff';
  rTT.textContent = pulseWidth(st.zNow, 1, -1 / st.LD).toFixed(2);
}

const LIVE_FRAC = 1 / 420;
function tick() {
  if (st.running) {
    st.zNow = Math.min(st.zEnd, st.zNow + LIVE_FRAC * st.zEnd);
    if (st.zNow >= st.zEnd - 1e-9) { st.running = false; bP.textContent = 'Play'; bP.setAttribute('aria-pressed', 'true'); }
  }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vV.textContent = st.V.toFixed(2); vLd.textContent = st.LD.toFixed(1); }
selMode.addEventListener('change', () => { const [l, m] = selMode.value.split(',').map(Number); st.l = l; st.m = m; draw(); });
sV.addEventListener('input', () => { st.V = parseFloat(sV.value) / 100; syncLabels(); draw(); });
sLd.addEventListener('input', () => { st.LD = parseFloat(sLd.value) / 10; syncLabels(); rebuild(); });
bR.addEventListener('click', () => {
  st.l = 0; st.m = 1; st.V = DEF_V; st.LD = DEF_LD;
  selMode.value = '0,1'; sV.value = String(DEF_V * 100); sLd.value = String(DEF_LD * 10);
  syncLabels(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  if (!st.running && st.zNow >= st.zEnd - 1e-9) { st.zNow = 0; st.running = true; bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); }
  else { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); }
});

function getState() { return { mode: `${st.l},${st.m}`, V: st.V.toFixed(2), ld: st.LD.toFixed(1) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.mode) { const [l, m] = s.mode.split(',').map(Number); st.l = l; st.m = m; selMode.value = s.mode; }
  if (s.V) { st.V = parseFloat(s.V); sV.value = String(Math.round(st.V * 100)); }
  if (s.ld) { st.LD = parseFloat(s.ld); sLd.value = String(Math.round(st.LD * 10)); }
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
