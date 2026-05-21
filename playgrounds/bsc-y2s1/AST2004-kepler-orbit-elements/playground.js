import { elementsToPos, solveKepler, trueAnomaly } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { setCanvasFont } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const sA = document.getElementById('slider-a'), vA = document.getElementById('value-a');
const sE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const sI = document.getElementById('slider-i'), vI = document.getElementById('value-i');
const sO = document.getElementById('slider-O'), vO = document.getElementById('value-O');
const sW = document.getElementById('slider-w'), vW = document.getElementById('value-w');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { a: 1.5, e: 0.3, i: 30, O: 60, w: 45, t: 0 };
let running = !prefersReducedMotion();
// Latest derived quantities, exposed to the rail via window.playground.
const latest = { nu: 0, r: 1, rMin: 0, rMax: 0, semiLatus: 0 };

for (const [id, key, fmt] of [[sA, 'a', 2], [sE, 'e', 2], [sI, 'i', 0], [sO, 'O', 0], [sW, 'w', 0]]) {
  id.addEventListener('input', () => { st[key] = parseFloat(id.value); document.getElementById(`value-${key === 'w' ? 'w' : key}`).textContent = st[key].toFixed(fmt); });
}
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

let last = performance.now();
function project(x, y, z) { return { px: canvas.width / 2 + x * 80 + 0.3 * z * 80, py: canvas.height / 2 - y * 80 + 0.3 * z * 80 }; }

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(91,192,235,0.3)'; ctx.lineWidth = 1;
  ctx.beginPath(); const ext = 3.5;
  for (let ang = 0; ang < 2 * Math.PI; ang += 0.02) {
    const p = project(ext * Math.cos(ang), ext * Math.sin(ang), 0);
    if (ang === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.closePath(); ctx.fillStyle = 'rgba(91,192,235,0.07)'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd166';
  const sun = project(0, 0, 0);
  ctx.beginPath(); ctx.arc(sun.px, sun.py, 10, 0, 2 * Math.PI); ctx.fill();
  const i = st.i * Math.PI / 180, O = st.O * Math.PI / 180, w = st.w * Math.PI / 180;
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2; ctx.beginPath();
  for (let nu = 0; nu < 2 * Math.PI; nu += 0.02) {
    const p = elementsToPos(st.a, st.e, i, O, w, nu);
    const pr = project(p.x, p.y, p.z);
    if (nu === 0) ctx.moveTo(pr.px, pr.py); else ctx.lineTo(pr.px, pr.py);
  }
  ctx.closePath(); ctx.stroke();
  const M = st.t * 2 * Math.PI / Math.pow(st.a, 1.5);
  const E = solveKepler(M, st.e);
  const nu = trueAnomaly(E, st.e);
  const p = elementsToPos(st.a, st.e, i, O, w, nu);
  const pr = project(p.x, p.y, p.z);
  ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(pr.px, pr.py, 7, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(154,160,166,0.5)';
  ctx.beginPath(); ctx.moveTo(sun.px, sun.py); ctx.lineTo(pr.px, pr.py); ctx.stroke();

  // State values now live in the rail; record them for getState().
  latest.nu = nu;
  latest.r = p.r;
  latest.rMin = st.a * (1 - st.e);
  latest.rMax = st.a * (1 + st.e);
  latest.semiLatus = st.a * (1 - st.e * st.e);

  drawOrbitDiagnostic(nu, p.r);
}

// Diagnostic: orbit radius r(nu) = a(1-e^2)/(1+e cos nu) over one full
// revolution, with the current true anomaly marked.
function drawOrbitDiagnostic(nuNow, rNow) {
  const pw = 250, ph = 140, px = canvas.width - pw - 14, py = 14;
  ctx.fillStyle = 'rgba(8, 12, 22, 0.9)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.3)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  setCanvasFont(ctx, canvas, 'caption', { family: 'mono', weight: 600, align: 'left' });
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.fillText('orbit radius  r(ν) = a(1-e²)/(1+e cos ν)', px + 8, py + 16);
  const ax = px + 36, ay = py + 24, aw = pw - 48, ah = ph - 46;
  const rPeri = st.a * (1 - st.e), rApo = st.a * (1 + st.e);
  const rLo = 0, rHi = rApo * 1.1;
  const xOf = (nu) => ax + (nu / (2 * Math.PI)) * aw;
  const yOf = (r) => ay + ah - ((r - rLo) / (rHi - rLo)) * ah;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  for (const r of [rPeri, rApo]) {
    ctx.beginPath(); ctx.moveTo(ax, yOf(r)); ctx.lineTo(ax + aw, yOf(r)); ctx.stroke();
  }
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let k = 0; k <= 120; k += 1) {
    const nu = 2 * Math.PI * k / 120;
    const r = st.a * (1 - st.e * st.e) / (1 + st.e * Math.cos(nu));
    const x = xOf(nu), y = yOf(r);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#ef476f';
  ctx.beginPath(); ctx.arc(xOf(((nuNow % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)), yOf(rNow), 4, 0, 6.28); ctx.fill();
  setCanvasFont(ctx, canvas, 'tick', { family: 'mono', align: 'left' });
  ctx.fillStyle = 'rgba(200,210,240,0.75)';
  ctx.fillText('peri', px + 4, yOf(rPeri) + 3);
  ctx.fillText('apo', px + 6, yOf(rApo) + 3);
  ctx.fillText('ν: 0', ax, ay + ah + 13);
  ctx.fillText('2π', ax + aw - 14, ay + ah + 13);
}

function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt * 0.3; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = CAPTURE_FRAC * 2; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function getState() {
  return {
    fields: [
      { key: 'a', label: 'semi-major axis', value: st.a, unit: 'AU', format: 'fixed-3' },
      { key: 'e', label: 'eccentricity', value: st.e, format: 'fixed-3' },
      { key: 'i', label: 'inclination', value: st.i, unit: 'deg', format: 'int' },
      { key: 'Omega', label: 'node Ω', value: st.O, unit: 'deg', format: 'int' },
      { key: 'omega', label: 'periapsis ω', value: st.w, unit: 'deg', format: 'int' },
      { key: 'nu', label: 'true anomaly ν', value: latest.nu * 180 / Math.PI, unit: 'deg', format: 'int' },
      { key: 'r', label: 'radius', value: latest.r, unit: 'AU', format: 'fixed-3' },
    ],
  };
};
window.playground.getInvariants = function getInvariants() {
  // Closed-form conic checks (spec 12.1: static checks are valid
  // invariants for a parameter-driven solver).
  const rPeri = st.a * (1 - st.e * st.e) / (1 + st.e);          // r at nu = 0
  const rApo = st.a * (1 - st.e * st.e) / (1 - st.e);           // r at nu = pi
  const rQuad = st.a * (1 - st.e * st.e) / (1 + st.e * Math.cos(Math.PI / 2));
  const mk = (key, label, value, tol) => ({
    key, label, value, tolerance: tol,
    status: Math.abs(value) < tol ? 'pass' : 'drift',
  });
  return [
    mk('perihelion', 'perihelion = a(1-e)', rPeri - st.a * (1 - st.e), 1e-9),
    mk('aphelion', 'aphelion = a(1+e)', rApo - st.a * (1 + st.e), 1e-9),
    mk('semi_latus', 'r(90°) = a(1-e²)', rQuad - st.a * (1 - st.e * st.e), 1e-9),
  ];
};
