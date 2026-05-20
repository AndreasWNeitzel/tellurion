// Ionization-chamber dosimetry. Panel A: the cavity with recoil
// electrons and ion pairs drifting to the electrodes (some recombine
// at low voltage). Panel B: the Boag saturation curve. Panel C: the
// charge-to-dose chain through W and Bragg-Gray. Gate-tested sim.js;
// deterministic. ICRU Report 90; Boag 1950; Attix 1986.
import {
  W_AIR, runChamber, collectionEfficiency, saturationCurve,
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
const rV = document.getElementById('readout-v');
const rF = document.getElementById('readout-f');
const rQ = document.getElementById('readout-q');
const rD = document.getElementById('readout-d');
const slE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const slV = document.getElementById('slider-v'), vV = document.getElementById('value-v');
const slR = document.getElementById('slider-dr'), vR = document.getElementById('value-dr');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const DEF = { e: 100, vRaw: 248, dr: 1 };
const st = { ...DEF, running: !prefersReducedMotion(), ph: 0 };
const volts = () => Math.round(Math.pow(10, st.vRaw / 100));
const SR = 1.13, MASS = 1.3e-6;

const cache = {};
function rebuild() {
  cache.R = runChamber({
    E0: st.e, nPhot: 5000, V: volts(), m: MASS, sRatio: SR,
    doseRate: st.dr, d: 1, seed: 0xC0FFEE, recordPairs: 90,
  });
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px monospace';
  ctx.fillText(title, x + 8, y + 14);
}

function drawChamber(x, y, w, h) {
  const R = cache.R;
  panel(x, y, w, h, `ion chamber: recoil electrons and drifting ion pairs (V = ${volts()} V)`);
  const gx = x + 30, gy = y + 40, gw = w - 60, gh = h - 96;
  // electrodes
  ctx.fillStyle = 'rgba(255,120,120,0.5)'; ctx.fillRect(gx, gy - 10, gw, 8);
  ctx.fillStyle = 'rgba(120,160,255,0.5)'; ctx.fillRect(gx, gy + gh + 2, gw, 8);
  ctx.fillStyle = 'rgba(255,150,150,0.85)'; ctx.font = '11px monospace';
  ctx.fillText('+ anode', gx + 4, gy - 14);
  ctx.fillStyle = 'rgba(160,190,255,0.85)'; ctx.fillText('- cathode', gx + 4, gy + gh + 24);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.strokeRect(gx, gy, gw, gh);
  // incoming photon
  ctx.strokeStyle = 'rgba(255,209,102,0.6)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(gx - 18, gy + gh * 0.5); ctx.lineTo(gx + gw * 0.45, gy + gh * 0.5); ctx.stroke();
  ctx.fillStyle = 'rgba(255,209,102,0.7)'; ctx.font = '10px monospace';
  ctx.fillText('photon ->', gx - 18, gy + gh * 0.5 - 6);
  // a Compton recoil electron track from the interaction site
  const ix = gx + gw * 0.45, iy = gy + gh * 0.5;
  ctx.strokeStyle = '#6fd6e8'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(ix, iy);
  for (let s = 0; s <= 20; s += 1) {
    ctx.lineTo(ix + s * 5 + 6 * Math.sin(s), iy + 14 * Math.sin(s * 0.6) - s * 1.2);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(111,214,232,0.8)'; ctx.fillText('recoil e-', ix + 30, iy - 18);
  // ion pairs drifting: + toward cathode (down), - toward anode (up);
  // a fraction (1 - f) recombine before arrival
  const f = R.f, drift = st.ph;
  R.pairs.forEach((pp, i) => {
    const px = gx + 8 + pp.x * (gw - 16);
    const recombine = (i / R.pairs.length) > f;            // the lost fraction
    const prog = recombine ? Math.min(0.5, drift) : drift;
    // + ion moves down toward cathode, - electron up toward anode
    const yPlus = gy + gh * (0.2 + pp.y * 0.3) + prog * gh * 0.7;
    const yMinus = gy + gh * (0.2 + pp.y * 0.3) - prog * gh * 0.7;
    ctx.fillStyle = recombine ? 'rgba(255,160,90,0.5)' : '#ff6b6b';
    ctx.beginPath(); ctx.arc(px, Math.min(gy + gh, yPlus), 2.4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = recombine ? 'rgba(150,170,255,0.5)' : '#6fb4ff';
    ctx.beginPath(); ctx.arc(px, Math.max(gy, yMinus), 2.4, 0, 2 * Math.PI); ctx.fill();
    if (recombine && prog >= 0.5) {
      ctx.strokeStyle = 'rgba(255,200,120,0.4)';
      ctx.beginPath(); ctx.arc(px, gy + gh * (0.2 + pp.y * 0.3) + 0.35 * gh, 4, 0, 2 * Math.PI); ctx.stroke();
    }
  });
  ctx.fillStyle = 'rgba(200,210,235,0.65)'; ctx.font = '10px monospace';
  ctx.fillText('+ ions drift down, electrons drift up; faded pairs recombine (lost)', gx, y + h - 10);
}

function drawSaturation(x, y, w, h) {
  panel(x, y, w, h, 'Boag saturation curve: collection efficiency vs voltage');
  const px = x + 40, py = y + 26, pw = w - 54, ph = h - 74;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
  const s = saturationCurve(10, 3000, 120, st.dr, 1);
  const lvMin = 1, lvMax = Math.log10(3000);
  const X = (V) => px + pw * (Math.log10(V) - lvMin) / (lvMax - lvMin);
  const Y = (ff) => py + ph * (1 - (ff - 0.4) / 0.62);
  // recombination shading (f < 0.99)
  ctx.fillStyle = 'rgba(255,120,120,0.08)';
  ctx.fillRect(px, py, X(collectionEfficiencyInvV(0.99, st.dr)) - px, ph);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < s.V.length; i += 1) {
    const xx = X(s.V[i]), yy = Y(s.f[i]);
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  // f = 1 reference
  ctx.strokeStyle = 'rgba(155,232,176,0.4)'; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(px, Y(1)); ctx.lineTo(px + pw, Y(1)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(155,232,176,0.7)'; ctx.font = '10px monospace';
  ctx.fillText('f = 1 (full collection)', px + pw - 134, Y(1) - 4);
  // operating point
  const V0 = volts(), f0 = collectionEfficiency(V0, st.dr, 1);
  ctx.fillStyle = '#6fb4ff';
  ctx.beginPath(); ctx.arc(X(V0), Y(f0), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = '10px monospace';
  for (const V of [10, 100, 1000]) ctx.fillText(`${V}`, X(V) - 8, py + ph + 14);
  ctx.fillText('collecting voltage (V, log)', px + pw / 2 - 64, py + ph + 26);
  ctx.fillText('f', px - 16, py + 8);
  ctx.fillStyle = f0 > 0.99 ? '#9be8b0' : '#ffd166'; ctx.font = '11px monospace';
  ctx.fillText(`V = ${V0} V:  f = ${f0.toFixed(4)}  (recombination loss ${((1 - f0) * 100).toFixed(2)}%)`, px + 6, py + ph + 40);
}
function collectionEfficiencyInvV(target, dr) {
  // smallest V with f >= target, by scan (for the shaded region edge)
  for (let lv = 1; lv <= Math.log10(3000); lv += 0.02) {
    const V = Math.pow(10, lv);
    if (collectionEfficiency(V, dr, 1) >= target) return V;
  }
  return 3000;
}

function drawChain(x, y, w, h) {
  const R = cache.R;
  panel(x, y, w, h, 'charge-to-dose chain (W and Bragg-Gray)');
  const steps = [
    ['E deposited', `${(R.Edep / 1e6).toFixed(2)} MeV`, '#8aa0c8'],
    [`/ W (${W_AIR} eV)`, `${R.nPairs.toExponential(2)} pairs`, '#6fd6e8'],
    ['x e -> Q created', `${R.Qcreated.toExponential(3)} C`, '#ffd166'],
    [`x f = ${R.f.toFixed(4)}`, `${R.Qcollected.toExponential(3)} C`, '#ff9d6f'],
    ['(Q/m)(W/e) -> D_gas', `${R.Dgas.toExponential(3)} Gy`, '#9be8b0'],
    [`x (S/rho) = ${SR} -> D_med`, `${R.Dmed.toExponential(3)} Gy`, '#ff6b9d'],
  ];
  const bx = x + 16, bw = w - 32, rowH = (h - 50) / steps.length;
  ctx.font = '12px monospace';
  steps.forEach((stp, i) => {
    const yy = y + 30 + i * rowH;
    ctx.fillStyle = stp[2]; ctx.fillRect(bx, yy - 12, 8, 8);
    ctx.fillStyle = 'rgba(200,210,235,0.8)'; ctx.fillText(stp[0], bx + 16, yy - 4);
    ctx.fillStyle = 'rgba(235,240,250,0.95)'; ctx.fillText(stp[1], bx + bw - 150, yy - 4);
    if (i < steps.length - 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath(); ctx.moveTo(bx + 4, yy - 2); ctx.lineTo(bx + 4, yy + rowH - 14); ctx.stroke();
    }
  });
  ctx.fillStyle = 'rgba(155,232,176,0.85)'; ctx.font = '11px monospace';
  ctx.fillText('one ion pair per W; D scales with Q and with W', bx, y + h - 10);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const half = (W - 52) / 2;
  drawChamber(20, 20, half, H - 34);
  drawSaturation(20 + half + 12, 20, half, (H - 46) / 2);
  drawChain(20 + half + 12, 20 + (H - 46) / 2 + 6, half, (H - 46) / 2);
  const R = cache.R;
  rV.textContent = `${volts()} V`;
  rF.textContent = R.f.toFixed(4);
  rQ.textContent = `${R.Qcollected.toExponential(2)} C`;
  rD.textContent = `${R.Dmed.toExponential(2)} Gy`;
}

function tick() {
  if (st.running) st.ph = (st.ph + 1 / 150) % 1;
  draw();
  requestAnimationFrame(tick);
}

function sync() { vE.textContent = String(st.e); vV.textContent = String(volts()); vR.textContent = String(st.dr); }
slE.addEventListener('input', () => { vE.textContent = slE.value; });
slE.addEventListener('change', () => { st.e = parseInt(slE.value, 10); rebuild(); draw(); });
slV.addEventListener('input', () => { vV.textContent = String(Math.round(Math.pow(10, slV.value / 100))); });
slV.addEventListener('change', () => { st.vRaw = parseInt(slV.value, 10); rebuild(); draw(); });
slR.addEventListener('input', () => { vR.textContent = slR.value; });
slR.addEventListener('change', () => { st.dr = parseInt(slR.value, 10); rebuild(); draw(); });
bR.addEventListener('click', () => {
  Object.assign(st, DEF); st.running = true;
  slE.value = String(DEF.e); slV.value = String(DEF.vRaw); slR.value = String(DEF.dr);
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); sync(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { e: String(st.e), v: String(st.vRaw), dr: String(st.dr) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.e) { st.e = parseInt(s.e, 10); slE.value = s.e; }
  if (s.v) { st.vRaw = parseInt(s.v, 10); slV.value = s.v; }
  if (s.dr) { st.dr = parseInt(s.dr, 10); slR.value = s.dr; }
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
