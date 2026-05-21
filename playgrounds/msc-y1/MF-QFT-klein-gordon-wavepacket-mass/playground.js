// Klein-Gordon wave packet. Panel A: |psi(x,t)|^2 propagating with
// the light cone |x| = t; the packet moves at v_g < c (massive) or
// on the cone (massless) and spreads when m > 0. Panel B: the
// dispersion omega(k) with the light line and the v_g tangent. Panel
// C: the centroid vs the light cone and the RMS width vs time.
// Gate-tested sim.js; deterministic. Peskin and Schroeder; Greiner.
import {
  omega, groupVelocity, phaseVelocity, packet, evolve,
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
const rVg = document.getElementById('readout-vg');
const rVp = document.getElementById('readout-vp');
const rW = document.getElementById('readout-w');
const rC = document.getElementById('readout-c');
const sM = document.getElementById('slider-m'), vM = document.getElementById('value-m');
const sK = document.getElementById('slider-k'), vK = document.getElementById('value-k');
const sW = document.getElementById('slider-w'), vW = document.getElementById('value-w');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const L = 60, T_END = 52;
const DEF_M = 150, DEF_K = 200, DEF_W = 100;
const st = { m: DEF_M, k0: DEF_K, w: DEF_W, running: !prefersReducedMotion(), ph: 0 };
const opts = () => ({ m: st.m / 100, k0: st.k0 / 100, sigma0: st.w / 100, L, xN: 360, kN: 256 });

function rebuild() {
  st.init = packet(0, opts());
  st.ev = evolve(T_END, 60, opts());
  st.ph = 0; st.running = true;
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

function drawPacket(x, y, w, h) {
  const m = st.m / 100;
  panel(x, y, w, h, `|psi(x,t)|^2 ${m === 0 ? '(massless: dispersion-free, on the light cone)' : '(massive: sub-luminal, spreading)'}`);
  const t = st.ph * T_END;
  const r = packet(t, opts());
  const x0 = x + 14, x1 = x + w - 12, y0 = y + 26, y1 = y + h - 22;
  const X = (xx) => x0 + (x1 - x0) * (xx + L) / (2 * L);
  let pmax = 1e-12; for (const v of r.p2) pmax = Math.max(pmax, v);
  let p0max = 1e-12; for (const v of st.init.p2) p0max = Math.max(p0max, v);
  const Y = (p, mx) => y1 - (y1 - y0) * p / mx;
  // light cone from the origin: |x| = t
  ctx.strokeStyle = 'rgba(255,143,143,0.5)'; ctx.setLineDash([4, 4]);
  for (const xc of [t, -t]) { const px = X(xc); ctx.beginPath(); ctx.moveTo(px, y0); ctx.lineTo(px, y1); ctx.stroke(); }
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,143,143,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono');
  if (X(t) < x1 - 30) ctx.fillText('x = t (light cone)', X(t) + 4, y0 + 12);
  // initial packet (faint) for spreading comparison
  ctx.strokeStyle = 'rgba(150,170,210,0.4)'; ctx.lineWidth = 1; ctx.beginPath();
  st.init.p2.forEach((p, i) => { const xx = X(st.init.x[i]), yy = Y(p, p0max); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); });
  ctx.stroke();
  // current packet
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 1.8; ctx.beginPath();
  r.p2.forEach((p, i) => { const xx = X(r.x[i]), yy = Y(p, pmax); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); });
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,209,102,0.7)';
  ctx.beginPath(); ctx.moveTo(X(r.centroid), y0); ctx.lineTo(X(r.centroid), y1); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.fillText(`centroid ${r.centroid.toFixed(1)} (t=${t.toFixed(0)})`, X(r.centroid) + 4, y1 - 6);
  ctx.fillStyle = 'rgba(200,215,240,0.6)'; ctx.fillText('x ->', x1 - 30, y1 + 14);
}

function drawDispersion(x, y, w, h) {
  const m = st.m / 100, k0 = st.k0 / 100;
  panel(x, y, w, h, 'dispersion omega(k) = sqrt(k^2 + m^2); slope at k0 = v_g');
  const x0 = x + 30, x1 = x + w - 14, y0 = y + 26, y1 = y + h - 24;
  const kMax = Math.max(8, k0 * 2.2);
  const oMax = omega(kMax, m);
  const X = (k) => x0 + (x1 - x0) * k / kMax;
  const Y = (o) => y1 - (y1 - y0) * o / (oMax * 1.05);
  // light line omega = |k|
  ctx.strokeStyle = 'rgba(255,143,143,0.45)'; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(kMax), Y(kMax)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,143,143,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText('omega = |k| (light)', X(kMax) - 110, Y(kMax) + 14);
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 160; i += 1) { const k = kMax * i / 160; const xx = X(k), yy = Y(omega(k, m)); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  // group-velocity tangent at k0
  const o0 = omega(k0, m), vg = groupVelocity(k0, m);
  ctx.strokeStyle = 'rgba(143,227,155,0.8)'; ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(X(Math.max(0, k0 - kMax * 0.3)), Y(o0 - vg * Math.min(k0, kMax * 0.3)));
  ctx.lineTo(X(Math.min(kMax, k0 + kMax * 0.3)), Y(o0 + vg * Math.min(kMax - k0, kMax * 0.3)));
  ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X(k0), Y(o0), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(143,227,155,0.85)'; ctx.fillText(`v_g = ${vg.toFixed(3)} (slope)`, X(k0) + 6, Y(o0) - 6);
  ctx.fillStyle = 'rgba(200,215,240,0.6)'; ctx.fillText('k ->', x1 - 30, y1 + 14);
}

function drawTracks(x, y, w, h) {
  panel(x, y, w, h, 'centroid <x>(t) vs the light cone, and RMS width(t)');
  const x0 = x + 32, x1 = x + w - 14, y0 = y + 26, y1 = y + h - 24;
  const e = st.ev, n = e.t.length, tMax = e.t[n - 1];
  const cMax = Math.max(tMax, e.cen[n - 1]) * 1.05;
  const X = (tt) => x0 + (x1 - x0) * tt / tMax;
  const Yc = (c) => y1 - (y1 - y0) * c / cMax;
  // light cone x = t
  ctx.strokeStyle = 'rgba(255,143,143,0.5)'; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(X(0), Yc(0)); ctx.lineTo(X(tMax), Yc(tMax)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,143,143,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText('x = t', X(tMax) - 36, Yc(tMax) + 4);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let i = 0; i < n; i += 1) { const xx = X(e.t[i]), yy = Yc(e.cen[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,209,102,0.85)'; ctx.fillText('<x>(t)', X(tMax) - 50, Yc(e.cen[n - 1]) - 4);
  // width(t) scaled to the lower part
  let wMax = 1e-9; for (let i = 0; i < n; i += 1) wMax = Math.max(wMax, e.wid[i]);
  const Yw = (wv) => y1 - (y1 - y0) * 0.32 * wv / wMax;
  ctx.strokeStyle = '#8fe39b'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i < n; i += 1) { const xx = X(e.t[i]), yy = Yw(e.wid[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(143,227,155,0.85)'; ctx.fillText('width(t)', x0 + 4, Yw(e.wid[n - 1]) - 4);
  const idx = Math.min(n - 1, Math.floor(st.ph * (n - 1)));
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(e.t[idx]), Yc(e.cen[idx]), 3.5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.6)'; ctx.fillText('time t ->', x1 - 70, y1 + 14);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawPacket(20, 22, W - 40, 232);
  drawDispersion(20, 270, (W - 52) / 2, H - 270 - 16);
  drawTracks(20 + (W - 52) / 2 + 12, 270, (W - 52) / 2, H - 270 - 16);
  const m = st.m / 100, k0 = st.k0 / 100;
  rVg.textContent = groupVelocity(k0, m).toFixed(3);
  rVp.textContent = Number.isFinite(phaseVelocity(k0, m)) ? phaseVelocity(k0, m).toFixed(3) : 'inf';
  const idx = Math.min(st.ev.t.length - 1, Math.floor(st.ph * (st.ev.t.length - 1)));
  rW.textContent = (st.ev.wid[idx] / st.ev.wid[0]).toFixed(3);
  rC.textContent = st.ev.cen[idx].toFixed(2);
}

const LIVE = 1 / 360;
function tick() {
  if (st.running) { st.ph += LIVE; if (st.ph >= 1) { st.ph = 1; st.running = false; bP.textContent = 'Play'; bP.setAttribute('aria-pressed', 'true'); } }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vM.textContent = (st.m / 100).toFixed(2); vK.textContent = (st.k0 / 100).toFixed(2); vW.textContent = (st.w / 100).toFixed(2); }
function restart() { st.ph = 0; st.running = true; bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); }
sM.addEventListener('input', () => { st.m = parseInt(sM.value, 10); syncLabels(); rebuild(); draw(); });
sK.addEventListener('input', () => { st.k0 = parseInt(sK.value, 10); syncLabels(); rebuild(); draw(); });
sW.addEventListener('input', () => { st.w = parseInt(sW.value, 10); syncLabels(); rebuild(); draw(); });
bR.addEventListener('click', () => {
  st.m = DEF_M; st.k0 = DEF_K; st.w = DEF_W;
  sM.value = String(DEF_M); sK.value = String(DEF_K); sW.value = String(DEF_W);
  syncLabels(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  if (!st.running && st.ph >= 1) restart();
  else { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); }
});

function getState() { return { m: String(st.m), k0: String(st.k0), w: String(st.w) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.m) { st.m = parseInt(s.m, 10); sM.value = String(st.m); }
  if (s.k0) { st.k0 = parseInt(s.k0, 10); sK.value = String(st.k0); }
  if (s.w) { st.w = parseInt(s.w, 10); sW.value = String(st.w); }
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
