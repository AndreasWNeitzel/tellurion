// Multicomponent flat FLRW. Panel A: the comoving galaxy grid
// expanding with a(t) through the radiation/matter/Lambda eras with
// the particle-horizon and Hubble-radius circles. Panel B: the scale
// factor a(t) (decelerate then accelerate) and H(t) toward the de
// Sitter floor. Panel C: the density-fraction bands vs log a with the
// equality epochs. Gate-tested sim.js; deterministic. Friedmann 1922;
// Ryden; Planck 2018.
import {
  flatParams, hubble, ageNow, ageAt,
  densityFractions, aEqMatterRadiation, aEqMatterLambda,
  deceleration, particleHorizon, hubbleRadius,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rA = document.getElementById('readout-a');
const rAge = document.getElementById('readout-age');
const rEra = document.getElementById('readout-era');
const rQ = document.getElementById('readout-q');
const sOm = document.getElementById('slider-om'), vOm = document.getElementById('value-om');
const sH0 = document.getElementById('slider-h0'), vH0 = document.getElementById('value-h0');
const sOr = document.getElementById('slider-or'), vOr = document.getElementById('value-or');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const DEF_OM = 315, DEF_H0 = 67, DEF_OR = 9;
const A_MIN = 1e-6, A_MAX = 8;
const st = { om: DEF_OM, h0: DEF_H0, or: DEF_OR, running: true, ph: 0, p: null };

function rebuild() {
  st.p = flatParams(st.om / 1000, st.or * 1e-5, st.h0);
  st.age0 = ageNow(st.p);
  st.aEqMR = aEqMatterRadiation(st.p);
  st.aEqML = aEqMatterLambda(st.p);
  // sample a(t) on a log-a grid (eras span many decades in a)
  st.N = 320;
  st.aArr = new Float64Array(st.N + 1);
  st.tArr = new Float64Array(st.N + 1);
  for (let i = 0; i <= st.N; i += 1) {
    const a = A_MIN * Math.pow(A_MAX / A_MIN, i / st.N);
    st.aArr[i] = a; st.tArr[i] = ageAt(a, st.p, 4000);
  }
  st.ph = 0; st.running = true;
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
}

function curA() { return st.aArr[Math.min(st.N, Math.floor(st.ph * st.N))]; }
function eraName(a) {
  const d = densityFractions(a, st.p);
  return d.fr >= d.fm && d.fr >= d.fL ? 'radiation' : d.fm >= d.fL ? 'matter' : 'Lambda';
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px monospace';
  ctx.fillText(title, x + 8, y + 14);
}

function drawGrid(x, y, w, h) {
  const a = curA();
  panel(x, y, w, h, `comoving galaxy grid expanding with a(t)  [${eraName(a)} era]`);
  const cx = x + w * 0.5, cy = y + h * 0.54;
  // physical scale: normalise so the grid fits; comoving step fixed,
  // physical = comoving * a, mapped through a log to keep it on screen
  const zoom = (Math.min(w, h) * 0.42) / (1 + Math.log10(1 + a / A_MIN) * 0.55);
  const step = zoom * Math.max(a, A_MIN) / A_MAX * 6 + 6;
  for (let i = -7; i <= 7; i += 1) for (let j = -5; j <= 5; j += 1) {
    const px = cx + i * step, py = cy + j * step;
    if (px < x + 6 || px > x + w - 6 || py < y + 22 || py > y + h - 8) continue;
    const dist = Math.hypot(i, j);
    const zr = Math.min(1, dist / 8);
    ctx.fillStyle = `rgb(${(150 + 90 * zr) | 0},${(170 - 70 * zr) | 0},${(230 - 150 * zr) | 0})`;
    ctx.beginPath(); ctx.arc(px, py, 2.6, 0, 2 * Math.PI); ctx.fill();
  }
  // particle horizon (amber) and Hubble radius (cyan) in c/H0 units
  const uH = Math.min(w, h) * 0.16;                      // px per (c/H0)
  ctx.strokeStyle = 'rgba(241,192,105,0.55)'; ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.arc(cx, cy, Math.min(Math.min(w, h) * 0.46, particleHorizon(a, st.p) * uH), 0, 2 * Math.PI); ctx.stroke();
  ctx.strokeStyle = 'rgba(127,209,255,0.55)'; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.arc(cx, cy, Math.min(Math.min(w, h) * 0.4, hubbleRadius(a, st.p) * uH), 0, 2 * Math.PI); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(241,192,105,0.8)'; ctx.font = '10px monospace';
  ctx.fillText('particle horizon', x + 12, y + 28);
  ctx.fillStyle = 'rgba(127,209,255,0.8)'; ctx.fillText('Hubble radius', x + 12, y + 42);
  ctx.fillStyle = 'rgba(200,215,240,0.75)';
  ctx.fillText(`a = ${a.toExponential(2)},  z = ${(1 / a - 1).toExponential(2)},  t = ${ageAt(a, st.p, 2000).toFixed(3)} Gyr`, x + 12, y + h - 10);
}

function drawScale(x, y, w, h) {
  panel(x, y, w, h, 'scale factor a(t) [green] and H(t) [cyan]: decelerate then accelerate');
  const x0 = x + 34, x1 = x + w - 14, y0 = y + 26, y1 = y + h - 24;
  const tMax = st.tArr[st.N], aMax = st.aArr[st.N];
  const X = (t) => x0 + (x1 - x0) * t / tMax;
  const Ya = (av) => y1 - (y1 - y0) * av / aMax;
  let hMax = 0; for (let i = 0; i <= st.N; i += 1) hMax = Math.max(hMax, hubble(st.aArr[i], st.p));
  const Yh = (hv) => y1 - (y1 - y0) * Math.min(1, hv / hMax);
  ctx.strokeStyle = '#8fe39b'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= st.N; i += 1) { const xx = X(st.tArr[i]), yy = Ya(st.aArr[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(127,209,255,0.7)'; ctx.lineWidth = 1.4; ctx.beginPath();
  for (let i = 0; i <= st.N; i += 1) { const xx = X(st.tArr[i]), yy = Yh(hubble(st.aArr[i], st.p)); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  // now (a = 1) marker
  ctx.strokeStyle = 'rgba(255,209,102,0.6)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(X(st.age0), y0); ctx.lineTo(X(st.age0), y1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,209,102,0.85)'; ctx.font = '10px monospace';
  ctx.fillText(`now: ${st.age0.toFixed(1)} Gyr`, X(st.age0) - 4, y0 + 12);
  const a = curA();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X(ageAt(a, st.p, 1500)), Ya(a), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.65)'; ctx.fillText('cosmic time (Gyr) ->', x1 - 150, y1 + 14);
}

function drawBands(x, y, w, h) {
  panel(x, y, w, h, 'density fractions vs log a: radiation | matter | Lambda eras');
  const x0 = x + 30, x1 = x + w - 14, y0 = y + 26, y1 = y + h - 24;
  const la0 = Math.log10(A_MIN), la1 = Math.log10(A_MAX);
  const X = (la) => x0 + (x1 - x0) * (la - la0) / (la1 - la0);
  const Y = (f) => y1 - (y1 - y0) * f;
  const NB = 220;
  // stacked bands: radiation (bottom), matter (mid), Lambda (top)
  const cols = ['rgba(127,209,255,0.55)', 'rgba(143,227,155,0.55)', 'rgba(231,155,255,0.5)'];
  for (let i = 0; i < NB; i += 1) {
    const la = la0 + (la1 - la0) * i / NB, a = Math.pow(10, la);
    const d = densityFractions(a, st.p);
    const segs = [d.fr, d.fm, d.fL];
    let acc = 0;
    for (let k = 0; k < 3; k += 1) {
      ctx.fillStyle = cols[k];
      ctx.fillRect(X(la), Y(acc + segs[k]), (x1 - x0) / NB + 1, Y(acc) - Y(acc + segs[k]));
      acc += segs[k];
    }
  }
  for (const [aEq, lab] of [[st.aEqMR, 'r=m'], [st.aEqML, 'm=L'], [curA(), 'now']]) {
    const lx = X(Math.log10(Math.max(A_MIN, Math.min(A_MAX, aEq))));
    ctx.strokeStyle = lab === 'now' ? '#ffd166' : 'rgba(255,255,255,0.4)';
    ctx.setLineDash(lab === 'now' ? [] : [3, 3]);
    ctx.beginPath(); ctx.moveTo(lx, y0); ctx.lineTo(lx, y1); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = lab === 'now' ? 'rgba(255,209,102,0.9)' : 'rgba(255,255,255,0.6)';
    ctx.font = '9px monospace'; ctx.fillText(lab, lx + 2, y0 + 10);
  }
  ctx.fillStyle = 'rgba(200,215,240,0.65)'; ctx.font = '10px monospace';
  ctx.fillText('log10 a ->', x1 - 64, y1 + 14);
  ctx.fillStyle = 'rgba(127,209,255,0.8)'; ctx.fillText('rad', x0 + 4, y1 - 4);
  ctx.fillStyle = 'rgba(231,155,255,0.8)'; ctx.fillText('Lambda', x0 + 4, y0 + 22);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawGrid(20, 22, W - 40, 232);
  drawScale(20, 270, (W - 52) / 2, H - 270 - 16);
  drawBands(20 + (W - 52) / 2 + 12, 270, (W - 52) / 2, H - 270 - 16);
  const a = curA();
  rA.textContent = a.toExponential(2);
  rAge.textContent = `${ageAt(a, st.p, 1500).toFixed(2)} Gyr`;
  rEra.textContent = eraName(a);
  rQ.textContent = deceleration(1, st.p).toFixed(2);
}

const LIVE = 1 / 360;
function tick() {
  if (st.running) { st.ph += LIVE; if (st.ph >= 1) st.ph = 0; }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vOm.textContent = (st.om / 1000).toFixed(3); vH0.textContent = String(st.h0); vOr.textContent = (st.or * 1e-5).toExponential(1); }
function restart() { st.ph = 0; st.running = true; bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); }
sOm.addEventListener('input', () => { st.om = parseInt(sOm.value, 10); syncLabels(); rebuild(); draw(); });
sH0.addEventListener('input', () => { st.h0 = parseInt(sH0.value, 10); syncLabels(); rebuild(); draw(); });
sOr.addEventListener('input', () => { st.or = parseInt(sOr.value, 10); syncLabels(); rebuild(); draw(); });
bR.addEventListener('click', () => {
  st.om = DEF_OM; st.h0 = DEF_H0; st.or = DEF_OR;
  sOm.value = String(DEF_OM); sH0.value = String(DEF_H0); sOr.value = String(DEF_OR);
  syncLabels(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { om: String(st.om), h0: String(st.h0), or: String(st.or) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.om) { st.om = parseInt(s.om, 10); sOm.value = String(st.om); }
  if (s.h0) { st.h0 = parseInt(s.h0, 10); sH0.value = String(st.h0); }
  if (s.or) { st.or = parseInt(s.or, 10); sOr.value = String(st.or); }
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
