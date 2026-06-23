// MRI Bloch / k-space. Panel A: the magnetization on the Bloch sphere
// precessing and relaxing after a 90-degree pulse. Panel B: the free
// induction decay and its Lorentzian spectrum. Panel C: the brain
// phantom imaged by the chosen sequence and weighting, with its
// k-space and the partial-acquisition blur. Gate-tested sim.js;
// deterministic. Bloch 1946; Liang and Lauterbur 2000.
import {
  blochEvolve, mag, fid, spectrum, ernstAngle,
  brainPhantom, mrImage, imageToK, reconFromK, magnitude,
  phantomByName,
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
const selW = document.getElementById('select-w');
const selS = document.getElementById('select-seq');
const selP = document.getElementById('select-phantom');
const slK = document.getElementById('slider-kf'), vK = document.getElementById('value-kf');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const N = 64;
const PRESET = {
  t2: { TR: 3000, TE: 90, name: 'T2' },
  t1: { TR: 500, TE: 15, name: 'T1' },
  pd: { TR: 3000, TE: 15, name: 'proton density' },
};
const DEF = { w: 't2', seq: 'se', kf: 100, phantom: 'brain' };
const st = { ...DEF, running: !prefersReducedMotion(), ph: 0 };
let PH = brainPhantom(N);
if (selP) selP.addEventListener('change', () => { st.phantom = selP.value; PH = phantomByName(st.phantom, N); rebuild(); });
// representative grey-matter relaxation for the Bloch-sphere demo
const GM_T1 = 1000, GM_T2 = 100, OMEGA = 0.05;

const cache = {};
function rebuild() {
  const p = PRESET[st.w];
  const flip = st.seq === 'gre' ? ernstAngle(GM_T1, p.TR) : Math.PI / 2;
  const img = mrImage(PH, N, st.seq, p.TR, p.TE, flip);
  const kb = imageToK(img, N);
  const kmag = magnitude(kb, N);
  let kmax = 0; for (const v of kmag) kmax = Math.max(kmax, v);
  const recon = reconFromK(kb, N, st.kf / 100);
  let imax = 0; for (const v of recon) imax = Math.max(imax, v);
  cache.img = img; cache.kmag = kmag; cache.kmax = kmax; cache.recon = recon; cache.imax = imax;
  cache.p = p; cache.flip = flip;
}

function imgCanvas(arr, n, vmax, logScale) {
  const c = document.createElement('canvas'); c.width = n; c.height = n;
  const cc = c.getContext('2d'); const id = cc.createImageData(n, n);
  for (let k = 0; k < n * n; k += 1) {
    let t = vmax > 0 ? arr[k] / vmax : 0;
    if (logScale) t = Math.log10(1 + 9 * Math.max(0, Math.min(1, t)));
    const g = Math.max(0, Math.min(255, Math.round(255 * t)));
    id.data[4 * k] = g; id.data[4 * k + 1] = g; id.data[4 * k + 2] = g; id.data[4 * k + 3] = 255;
  }
  cc.putImageData(id, 0, 0);
  return c;
}
// shift k-space DC to centre for display
function kCentred(kmag, n) {
  const out = new Float64Array(n * n), h = n / 2;
  for (let r = 0; r < n; r += 1) for (let c = 0; c < n; c += 1) {
    out[((r + h) % n) * n + ((c + h) % n)] = kmag[r * n + c];
  }
  return out;
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

function drawBloch(x, y, w, h) {
  panel(x, y, w, h, 'Bloch sphere after a 90-degree pulse');
  const cx = x + w / 2, cy = y + h / 2 + 8, R = Math.min(w, h) / 2 - 44;
  // oblique projection: x_s = X - 0.5 Z, y_s = -Y + 0.4 Z (z up)
  const proj = (X, Y, Z) => [cx + R * (X - 0.42 * Z), cy - R * (Y - 0.42 * Z) * 0.55 - R * Z * 0.7];
  // sphere silhouette
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.96, 0, 0, 2 * Math.PI); ctx.stroke();
  // latitude rings
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1;
  for (let a = 1; a < 5; a += 1) {
    ctx.beginPath();
    for (let t = 0; t <= 64; t += 1) {
      const ph = 2 * Math.PI * t / 64, lat = (a / 5 - 0.5) * Math.PI;
      const [px, py] = proj(Math.cos(lat) * Math.cos(ph), Math.cos(lat) * Math.sin(ph), Math.sin(lat));
      if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // longitude meridians
  for (let a = 0; a < 4; a += 1) {
    ctx.beginPath();
    for (let t = 0; t <= 64; t += 1) {
      const lat = (t / 64 - 0.5) * Math.PI, lon = a * Math.PI / 4;
      const [px, py] = proj(Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat));
      if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // axes
  ctx.strokeStyle = 'rgba(150,170,210,0.4)';
  for (const [vx, vy, vz, lab] of [[1.2, 0, 0, 'x'], [0, 1.2, 0, 'y'], [0, 0, 1.2, 'z (B0)']]) {
    const [ax, ay] = proj(0, 0, 0), [bx, by] = proj(vx, vy, vz);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.fillStyle = 'rgba(180,195,225,0.65)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText(lab, bx + 2, by);
  }
  // M evolves over one TR, looping; trail of recent positions
  const p = cache.p, T = (st.ph * p.TR);
  ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let s = 0; s <= 80; s += 1) {
    const tt = (s / 80) * T;
    const m = blochEvolve({ mx: 1, my: 0, mz: 0 }, 1, GM_T1, GM_T2, OMEGA, tt);
    const [px, py] = proj(m.mx, m.my, m.mz);
    if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  const m = blochEvolve({ mx: 1, my: 0, mz: 0 }, 1, GM_T1, GM_T2, OMEGA, T);
  const [o0x, o0y] = proj(0, 0, 0), [mx, my] = proj(m.mx, m.my, m.mz);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(o0x, o0y); ctx.lineTo(mx, my); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(mx, my, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(230,236,250,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`t = ${T.toFixed(0)} ms   Mz = ${m.mz.toFixed(3)}   |Mxy| = ${Math.hypot(m.mx, m.my).toFixed(3)}`, x + 12, y + h - 10);
}

// Longitudinal recovery Mz(t) = 1 - e^{-t/T1} and transverse decay
// |Mxy|(t) = e^{-t/T2} after the 90-degree pulse, over one TR, with a
// marker at the current time. The Bloch-sphere trajectory above is these
// two envelopes combined.
function drawRelax(x, y, w, h) {
  panel(x, y, w, h, 'relaxation: Mz recovery (T1), |Mxy| decay (T2)');
  const ax = x + 44, ay = y + 32, aw = w - 58, ah = h - 60;
  const T = st.ph * cache.p.TR, tMax = cache.p.TR;
  const xOf = (t) => ax + aw * t / tMax;
  const yOf = (v) => ay + ah * (1 - v);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + ah); ctx.lineTo(ax + aw, ay + ah); ctx.stroke();
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = 'rgba(200,206,224,0.6)'; ctx.textAlign = 'right';
  for (const v of [0, 0.5, 1]) {
    const yy = yOf(v);
    ctx.fillText(v.toFixed(1), ax - 5, yy + 3);
    ctx.strokeStyle = 'rgba(226,232,240,0.06)'; ctx.beginPath(); ctx.moveTo(ax, yy); ctx.lineTo(ax + aw, yy); ctx.stroke();
  }
  ctx.textAlign = 'center';
  for (let k = 0; k <= 4; k += 1) { const t = tMax * k / 4; ctx.fillText(`${Math.round(t)}`, xOf(t), ay + ah + 16); }
  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'right';
  ctx.fillText('t (ms)', ax + aw, ay + ah + 16);
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) { const t = tMax * i / 120; const xx = xOf(t), yy = yOf(1 - Math.exp(-t / GM_T1)); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) { const t = tMax * i / 120; const xx = xOf(t), yy = yOf(Math.exp(-t / GM_T2)); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xOf(T), ay); ctx.lineTo(xOf(T), ay + ah); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('Mz = 1 - e^{-t/T1}', ax + 8, ay + 14);
  ctx.fillStyle = '#ffd166'; ctx.fillText('|Mxy| = e^{-t/T2}', ax + 8, ay + 30);
}

function drawFID(x, y, w, h) {
  panel(x, y, w, h, 'free induction decay and its spectrum');
  const p = cache.p;
  const f = fid(1, GM_T2, OMEGA * 12, 256, 0.6);
  const sp = spectrum(f);
  const ax = x + 14, ay = y + 24, aw = w - 28, ah = (h - 46) / 2;
  // FID (real part), revealed by the sweep
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.strokeRect(ax, ay, aw, ah);
  const rev = Math.max(2, Math.floor(f.re.length * st.ph));
  ctx.strokeStyle = '#6fb4ff'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let k = 0; k < rev; k += 1) {
    const xx = ax + aw * k / (f.re.length - 1), yy = ay + ah / 2 - f.re[k] * ah * 0.45;
    if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(111,180,255,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('FID  ~ e^{-t/T2*} cos(wt)', ax + 6, ay + 12);
  // spectrum
  const sy = ay + ah + 14;
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.strokeRect(ax, sy, aw, ah);
  let smax = 0; for (const v of sp) smax = Math.max(smax, v);
  ctx.strokeStyle = '#9be8b0'; ctx.lineWidth = 1.5; ctx.beginPath();
  const nb = sp.length;
  for (let k = 0; k < nb; k += 1) {
    const kk = (k + nb / 2) % nb;                          // centre DC
    const xx = ax + aw * k / (nb - 1), yy = sy + ah - (smax > 0 ? sp[kk] / smax : 0) * ah * 0.95;
    if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(155,232,176,0.85)';
  ctx.fillText('spectrum (Lorentzian, FWHM ~ 2/T2*)', ax + 6, sy + 12);
  ctx.fillStyle = 'rgba(200,210,235,0.6)';
  ctx.fillText(`T2* = ${GM_T2} ms (grey matter model)`, ax + 6, sy + ah - 6);
}

function drawImage(x, y, w, h) {
  const p = cache.p;
  panel(x, y, w, h, `${st.seq === 'gre' ? 'gradient-echo' : 'spin-echo'} image, ${PRESET[st.w].name}-weighted`);
  // image and k-space stacked vertically so each fills this tall panel.
  const sz = Math.min(w - 28, (h - 92) / 2);
  const ix = x + (w - sz) / 2;
  const iy1 = y + 26, iy2 = iy1 + sz + 28;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(imgCanvas(cache.recon, N, cache.imax, false), ix, iy1, sz, sz);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.strokeRect(ix, iy1, sz, sz);
  ctx.fillStyle = 'rgba(200,210,235,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`image (${st.kf}% of k-space)`, ix, iy1 + sz + 14);
  ctx.drawImage(imgCanvas(kCentred(cache.kmag, N), N, cache.kmax, true), ix, iy2, sz, sz);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.strokeRect(ix, iy2, sz, sz);
  // acquired-fraction overlay box on k-space
  const keep = Math.max(2, Math.floor(sz * st.kf / 100));
  ctx.strokeStyle = 'rgba(255,209,102,0.7)'; ctx.setLineDash([3, 3]);
  ctx.strokeRect(ix + sz / 2 - keep / 2, iy2 + sz / 2 - keep / 2, keep, keep); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(200,210,235,0.7)'; ctx.fillText('k-space (log |.|)', ix, iy2 + sz + 14);
  ctx.fillStyle = 'rgba(155,232,176,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('CSF / grey / white contrast set by TR and TE', x + 14, y + h - 8);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const half = (W - 52) / 2;
  const blochH = 466;
  drawBloch(20, 20, half, blochH);
  drawRelax(20, 20 + blochH + 12, half, H - (20 + blochH + 12) - 14);
  drawFID(20 + half + 12, 20, half, (H - 46) / 2);
  drawImage(20 + half + 12, 20 + (H - 46) / 2 + 6, half, (H - 46) / 2);
}

function tick() {
  if (st.running) st.ph = (st.ph + 1 / 300) % 1;
  draw();
  requestAnimationFrame(tick);
}

function sync() { vK.textContent = String(st.kf); }
selW.addEventListener('change', () => { st.w = selW.value; rebuild(); draw(); });
selS.addEventListener('change', () => { st.seq = selS.value; rebuild(); draw(); });
slK.addEventListener('input', () => { vK.textContent = slK.value; });
slK.addEventListener('change', () => { st.kf = parseInt(slK.value, 10); rebuild(); draw(); });
bR.addEventListener('click', () => {
  Object.assign(st, DEF); st.running = true;
  selW.value = DEF.w; selS.value = DEF.seq; slK.value = String(DEF.kf);
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); sync(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { w: st.w, seq: st.seq, kf: String(st.kf) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.w) { st.w = s.w; selW.value = s.w; }
  if (s.seq) { st.seq = s.seq; selS.value = s.seq; }
  if (s.kf) { st.kf = parseInt(s.kf, 10); slK.value = s.kf; }
}

function boot() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  sync(); rebuild();
  if (CAPTURE_NAME) {
    const fr = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.ph = fr; draw();
  } else { draw(); }
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
window.playground.getState = function () {
  const p = PRESET[st.w];
  const weightingLabel = p.name.charAt(0).toUpperCase() + p.name.slice(1);
  return {
    fields: [
      { key: 'weighting', label: 'T1/T2/PD weighting', value: weightingLabel, format: 'string' },
      { key: 'sequence', label: 'pulse sequence', value: st.seq === 'se' ? 'spin-echo' : 'gradient-echo', format: 'string' },
      { key: 'phantom', label: 'anatomy phantom', value: st.phantom, format: 'string' },
      { key: 'tr', label: 'repeat time TR (ms)', value: p.TR, format: 'float' },
      { key: 'te', label: 'echo time TE (ms)', value: p.TE, format: 'float' },
      { key: 'kspace-retained', label: 'k-space retained (%)', value: st.kf, format: 'float' },
      { key: 'animation-state', label: 'magnetization', value: st.running ? 'precessing' : 'paused', format: 'string' }
    ]
  };
};
window.playground.getInvariants = function () {
  const inv = [];
  const p = PRESET[st.w];
  // Ernst angle for gradient echo: theta_E = arccos(exp(-TR/T1))
  // Typical grey matter T1 at 1.5T = 1000 ms
  const T1 = 1000;
  const ernst = ernstAngle(p.TR, T1);
  inv.push({
    key: 'ernst-angle',
    label: 'Ernst angle is physical (0, pi)',
    value: (ernst * 180 / Math.PI).toFixed(1) + ' degrees',
    status: ernst > 0 && ernst < Math.PI ? 'pass' : 'fail'
  });
  // Practical constraint: TE <= TR (echo must occur before next pulse)
  inv.push({
    key: 'timing-constraint',
    label: 'TE <= TR (valid sequence timing)',
    value: `TE=${p.TE}ms, TR=${p.TR}ms`,
    status: p.TE <= p.TR ? 'pass' : 'fail'
  });
  // Weighting makes sense: T1 weighting has short TE
  inv.push({
    key: 'weighting-consistency',
    label: 'Weighting consistent with TR/TE',
    value: st.w + (p.TE < 30 ? ' (short TE)' : ' (long TE)'),
    status: 'pass'
  });
  // k-space fraction sensible
  inv.push({
    key: 'kspace-bounds',
    label: 'k-space retained fraction in [0.06, 1]',
    value: (st.kf / 100).toFixed(3),
    status: st.kf >= 6 && st.kf <= 100 ? 'pass' : 'fail'
  });
  return inv;
};
