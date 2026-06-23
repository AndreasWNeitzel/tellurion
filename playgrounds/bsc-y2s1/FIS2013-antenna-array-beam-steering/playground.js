// Phased linear antenna array. Top panel: the radiation pattern |AF(theta)|^2
// drawn as a polar lobe in the forward half-plane, the N elements on the
// baseline carrying their progressive phase taper (the cause), and the
// steered main-beam direction. Bottom panel: the same array factor in dB
// against angle, with the half-power beamwidth, the peak side-lobe level,
// and any grating lobes. The steer angle auto-sweeps like a radar; every
// control pauses it and drives the whole frame.
// Reference: Balanis, Antenna Theory (2016), Ch. 6.

import {
  arrayPower, steerPhase, elementPhase, gratingLobes,
  halfPowerBeamwidth, peakSidelobeDb, DEG,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sN = document.getElementById('slider-N'), vN = document.getElementById('value-N');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const DEF = { N: 8, dOverLambda: 0.5, steerDeg: 0 };
const st = { ...DEF };
let running = !prefersReducedMotion();
const STEER_MAX = 55;                                   // auto-sweep amplitude (deg)

const W = canvas.width, H = canvas.height;
const CX = W / 2, BASE_Y = 596, RMAX = 350;
const DIAG = { x0: 70, x1: W - 26, yt: 712, yb: 986 };

// element-phase hue colour (0..2pi -> hue wheel)
function phaseColor(ph) { return `hsl(${(ph / (2 * Math.PI)) * 360}, 80%, 62%)`; }

function pausePlay() { running = false; btnP.textContent = 'Play'; btnP.setAttribute('aria-pressed', 'true'); }
function resume() { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); startLoop(); }

sN.addEventListener('input', () => { pausePlay(); st.N = parseInt(sN.value, 10); vN.textContent = String(st.N); render(); });
sD.addEventListener('input', () => { pausePlay(); st.dOverLambda = parseFloat(sD.value); vD.textContent = st.dOverLambda.toFixed(2); render(); });
sS.addEventListener('input', () => { pausePlay(); st.steerDeg = parseFloat(sS.value); vS.textContent = `${st.steerDeg.toFixed(0)}°`; render(); });
btnR.addEventListener('click', () => {
  Object.assign(st, DEF);
  sN.value = String(st.N); vN.textContent = String(st.N);
  sD.value = String(st.dOverLambda); vD.textContent = st.dOverLambda.toFixed(2);
  sS.value = String(st.steerDeg); vS.textContent = `${st.steerDeg.toFixed(0)}°`;
  resume(); render();
});
btnP.addEventListener('click', () => { if (running) pausePlay(); else resume(); });

function render() {
  ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, W, H);
  const theta0 = st.steerDeg * DEG;
  drawHeader(theta0);
  drawPolar(theta0);
  drawDiag(theta0);
}

function drawHeader(theta0) {
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f2f4f8'; ctx.font = fontString(canvas, 'title', 'sans', 600);
  ctx.fillText('Phased array beam steering', 20, 36);

  const hp = halfPowerBeamwidth(st.N, st.dOverLambda, theta0) / DEG;
  const sll = peakSidelobeDb(st.N, st.dOverLambda, theta0);
  const beta = steerPhase(st.dOverLambda, theta0) / DEG;
  const ng = gratingLobes(st.dOverLambda, theta0).length;
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillStyle = '#aeb6c2';
  ctx.fillText(`N = ${st.N}   d = ${st.dOverLambda.toFixed(2)} λ   steer θ₀ = ${st.steerDeg.toFixed(0)}°`, 20, 62);
  ctx.fillText(`phase taper β = ${beta.toFixed(0)}°/element`, 20, 82);
  ctx.fillStyle = '#7fd4ff';
  ctx.fillText(`HPBW = ${hp.toFixed(1)}°`, 360, 62);
  ctx.fillStyle = ng > 0 ? '#ff7a7a' : '#7ce0a8';
  ctx.fillText(ng > 0 ? `grating lobes: ${ng}` : 'no grating lobes', 360, 82);
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`peak side lobe = ${sll.toFixed(1)} dB`, 360, 36);
}

function drawPolar(theta0) {
  // polar rings (power = 0.25, 0.5, 0.75, 1.0) over the forward half-plane
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillStyle = '#5f6672';
  for (let f = 0.25; f <= 1.0001; f += 0.25) {
    ctx.beginPath(); ctx.arc(CX, BASE_Y, f * RMAX, Math.PI, 2 * Math.PI); ctx.stroke();
  }
  // radial angle spokes with labels
  ctx.textAlign = 'center';
  for (let a = -90; a <= 90; a += 30) {
    const th = a * DEG;
    const ex = CX + RMAX * Math.sin(th), ey = BASE_Y - RMAX * Math.cos(th);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(CX, BASE_Y); ctx.lineTo(ex, ey); ctx.stroke();
    const lx = CX + (RMAX + 16) * Math.sin(th), ly = BASE_Y - (RMAX + 16) * Math.cos(th);
    ctx.fillStyle = '#6e757f'; ctx.fillText(`${a}°`, lx, ly + 3);
  }

  // filled pattern lobe
  const Nθ = 540;
  ctx.beginPath();
  for (let i = 0; i <= Nθ; i += 1) {
    const th = -Math.PI / 2 + (Math.PI * i) / Nθ;
    const r = arrayPower(th, st.N, st.dOverLambda, theta0) * RMAX;
    const px = CX + r * Math.sin(th), py = BASE_Y - r * Math.cos(th);
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.lineTo(CX, BASE_Y); ctx.closePath();
  ctx.fillStyle = 'rgba(80,180,255,0.20)'; ctx.fill();
  ctx.strokeStyle = '#56b4ff'; ctx.lineWidth = 2; ctx.stroke();

  // grating lobes highlighted
  const grat = gratingLobes(st.dOverLambda, theta0);
  grat.forEach((g) => {
    const ex = CX + RMAX * Math.sin(g), ey = BASE_Y - RMAX * Math.cos(g);
    ctx.strokeStyle = 'rgba(255,122,122,0.7)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(CX, BASE_Y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
  });

  // steered main-beam direction
  const bx = CX + RMAX * Math.sin(theta0), by = BASE_Y - RMAX * Math.cos(theta0);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(CX, BASE_Y); ctx.lineTo(bx, by); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(bx, by, 4.5, 0, 2 * Math.PI); ctx.fill();

  // the N elements on the baseline, coloured by their excitation phase,
  // each with a small phasor hand showing the progressive taper (the cause).
  const spanPx = Math.min(W - 120, RMAX * 1.5);
  const dx = st.N > 1 ? spanPx / (st.N - 1) : 0;
  const x0 = CX - ((st.N - 1) * dx) / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0 - 10, BASE_Y); ctx.lineTo(x0 + (st.N - 1) * dx + 10, BASE_Y); ctx.stroke();
  for (let n = 0; n < st.N; n += 1) {
    const ex = x0 + n * dx, ph = elementPhase(n, st.dOverLambda, theta0);
    const col = phaseColor(ph);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ex, BASE_Y, 6, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ex, BASE_Y); ctx.lineTo(ex + 9 * Math.cos(ph - Math.PI / 2), BASE_Y + 9 * Math.sin(ph - Math.PI / 2)); ctx.stroke();
  }
  ctx.fillStyle = '#9aa2ae'; ctx.font = fontString(canvas, 'caption', 'sans'); ctx.textAlign = 'center';
  ctx.fillText('array of N elements, coloured by feed phase', CX, BASE_Y + 30);
  ctx.fillText('forward radiation pattern  |AF(θ)|²', CX, 250);
}

function drawDiag(theta0) {
  const { x0, x1, yt, yb } = DIAG;
  ctx.fillStyle = '#080a10'; ctx.fillRect(x0, yt, x1 - x0, yb - yt);
  const DBMIN = -40;
  const xOf = (deg) => x0 + ((deg + 90) / 180) * (x1 - x0);
  const yOf = (db) => yb - (Math.max(DBMIN, Math.min(0, db)) - DBMIN) / (0 - DBMIN) * (yb - yt);

  // dB gridlines
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'right';
  for (let db = 0; db >= DBMIN; db -= 10) {
    const yy = yOf(db);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
    ctx.fillStyle = '#727a88'; ctx.fillText(`${db}`, x0 - 6, yy + 3);
  }
  // angle ticks
  ctx.textAlign = 'center';
  for (let a = -90; a <= 90; a += 30) {
    const xx = xOf(a);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.moveTo(xx, yt); ctx.lineTo(xx, yb); ctx.stroke();
    ctx.fillStyle = '#727a88'; ctx.fillText(`${a}°`, xx, yb + 18);
  }

  // half-power band around the main beam
  const hp = halfPowerBeamwidth(st.N, st.dOverLambda, theta0);
  const bl = xOf((theta0 - hp / 2) / DEG), br = xOf((theta0 + hp / 2) / DEG);
  ctx.fillStyle = 'rgba(127,212,255,0.12)'; ctx.fillRect(Math.min(bl, br), yt, Math.abs(br - bl), yb - yt);

  // pattern in dB
  ctx.strokeStyle = '#56b4ff'; ctx.lineWidth = 2; ctx.beginPath();
  let started = false;
  for (let a = -90; a <= 90; a += 0.25) {
    const p = arrayPower(a * DEG, st.N, st.dOverLambda, theta0);
    const db = p > 0 ? 10 * Math.log10(p) : DBMIN;
    const X = xOf(a), Y = yOf(db);
    started ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); started = true;
  }
  ctx.stroke();

  // peak side-lobe level line
  const sll = peakSidelobeDb(st.N, st.dOverLambda, theta0);
  if (sll > DBMIN) {
    const ys = yOf(sll);
    ctx.strokeStyle = 'rgba(255,209,102,0.8)'; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x0, ys); ctx.lineTo(x1, ys); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ffd166'; ctx.textAlign = 'left'; ctx.fillText(`peak side lobe ${sll.toFixed(1)} dB`, x0 + 8, ys - 5);
  }

  // main-beam marker
  const xm = xOf(st.steerDeg);
  ctx.strokeStyle = '#ef476f'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(xm, yt); ctx.lineTo(xm, yb); ctx.stroke(); ctx.setLineDash([]);

  // labels
  ctx.fillStyle = '#9aa2ae'; ctx.font = fontString(canvas, 'caption', 'sans'); ctx.textAlign = 'center';
  ctx.fillText('angle from broadside  θ (deg)', (x0 + x1) / 2, yb + 38);
  ctx.save(); ctx.translate(20, (yt + yb) / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('relative power (dB)', 0, 0); ctx.restore();
  ctx.fillStyle = '#e6e8ec'; ctx.font = fontString(canvas, 'body', 'sans', 500); ctx.textAlign = 'left';
  ctx.fillText('Array factor in decibels', x0, yt - 12);
}

// ---- animation: sweep the steer angle like a radar ----
let rafOn = false, dir = 1, last = (typeof performance !== 'undefined' ? performance.now() : 0);
function tick(now) {
  if (running) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    st.steerDeg += dir * dt * (2 * STEER_MAX / 6);
    if (st.steerDeg >= STEER_MAX) { st.steerDeg = STEER_MAX; dir = -1; } else if (st.steerDeg <= -STEER_MAX) { st.steerDeg = -STEER_MAX; dir = 1; }
    sS.value = String(st.steerDeg); vS.textContent = `${st.steerDeg.toFixed(0)}°`;
  }
  last = now;
  render();
  if (running && !CAPTURE_NAME) requestAnimationFrame(tick); else rafOn = false;
}
function startLoop() { if (!rafOn && running && !CAPTURE_NAME) { rafOn = true; last = (typeof performance !== 'undefined' ? performance.now() : 0); requestAnimationFrame(tick); } }

function boot() {
  vN.textContent = String(st.N); vD.textContent = st.dOverLambda.toFixed(2); vS.textContent = `${st.steerDeg.toFixed(0)}°`;
  sN.value = String(st.N); sD.value = String(st.dOverLambda); sS.value = String(st.steerDeg);
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { boot(); startLoop(); }, { once: true }); } else { boot(); startLoop(); }

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const theta0 = st.steerDeg * DEG;
  return { fields: [
    { key: 'N', label: 'elements $N$', value: st.N, format: 'int' },
    { key: 'spacing', label: 'spacing $d/\\lambda$', value: st.dOverLambda, format: 'float' },
    { key: 'steer', label: 'steer angle $\\theta_0$ (deg)', value: st.steerDeg, format: 'float' },
    { key: 'beta', label: 'phase taper $\\beta$ (deg)', value: steerPhase(st.dOverLambda, theta0) / DEG, format: 'float' },
    { key: 'hpbw', label: 'beamwidth HPBW (deg)', value: halfPowerBeamwidth(st.N, st.dOverLambda, theta0) / DEG, format: 'float' },
    { key: 'sll', label: 'peak side lobe (dB)', value: peakSidelobeDb(st.N, st.dOverLambda, theta0), format: 'float' },
    { key: 'grating', label: 'grating lobes', value: gratingLobes(st.dOverLambda, theta0).length, format: 'int' },
  ] };
};
window.playground.getInvariants = function () {
  const theta0 = st.steerDeg * DEG;
  // the main beam peaks at the steer angle: power(theta0) == 1.
  const pk = arrayPower(theta0, st.N, st.dOverLambda, theta0);
  // a closely spaced array (d/lambda < 0.5) cannot form a grating lobe at
  // any steer angle, since |sin(theta0)| + 1 < lambda/d.
  const ng = gratingLobes(st.dOverLambda, theta0).length;
  const gratingOk = st.dOverLambda >= 0.5 || ng === 0;
  return [
    { key: 'main-peak', label: 'main beam peaks at $\\theta_0$', value: pk.toFixed(4), status: Math.abs(pk - 1) < 1e-6 ? 'pass' : 'drift' },
    { key: 'no-grating-when-dense', label: 'no grating lobe for $d<\\lambda/2$', value: ng > 0 ? `${ng} lobe(s)` : 'none', status: gratingOk ? 'pass' : 'drift' },
  ];
};
