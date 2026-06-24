import { fontString } from '../../../shared/js/canvas-type.js';
// Schwarzschild effective potential and the ISCO. The hero is the actual
// orbit of a test particle around the black hole: bound orbits precess (the
// relativistic rosette), and below the ISCO (L < 2 sqrt(3) M) or over the
// barrier they plunge through the horizon. The V_eff(r) curve below is the
// linked diagnostic: the energy line, the turning points and the moving radius
// marker show why the orbit does what it does.

import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { veffMassive, veffPhoton, turningPoints, PHOTON_SPHERE, ISCO, L_ISCO, M } from './sim.js';

const urlParams = new URLSearchParams(location.search);
const DETERMINISTIC = urlParams.get('deterministic') === '1';
const CAPTURE_NAME = urlParams.get('capture');
const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const controlsHost = document.getElementById('controls');
if (controlsHost) {
  controlsHost.innerHTML = `
    <div class="row"><span>L / M</span>
      <input id="slider-L" type="range" min="3.2" max="6" step="0.01" value="3.7" aria-label="angular momentum L over M">
      <span class="value" id="value-L">3.70</span></div>
    <div class="row"><span>orbit energy</span>
      <input id="slider-en" type="range" min="0" max="1.08" step="0.01" value="0.6" aria-label="orbit energy from circular to plunge">
      <span class="value" id="value-en">0.60</span></div>
    <div class="row"><span>mode</span>
      <input id="slider-mode" type="range" min="0" max="1" step="1" value="0" aria-label="massive or photon">
      <span class="value" id="value-mode">massive</span></div>
    <div class="row buttons">
      <button id="btn-reset" type="button">Reset</button>
      <button id="btn-playpause" type="button" aria-pressed="false">Pause</button>
    </div>`;
}
const sliderL = document.getElementById('slider-L'), valueL = document.getElementById('value-L');
const sliderEn = document.getElementById('slider-en'), valueEn = document.getElementById('value-en');
const sliderMode = document.getElementById('slider-mode'), valueMode = document.getElementById('value-mode');
const btnReset = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const state = { L: 3.7, en: 0.6, mode: 0, playing: !(DETERMINISTIC || prefersReducedMotion()) };
// orbit integration state
let orb = null;
const TRAIL = 5200;

function dVdrMassive(r, L) { return -L * L / (r ** 3) + M / (r * r) + 3 * M * L * L / (r ** 4); }
function dVdrPhoton(r, L) { return -L * L / (r ** 3) + 3 * M * L * L / (r ** 4); }

// Set up the orbit for the current controls.
function setupOrbit() {
  const L = state.L;
  if (state.mode === 1) {
    // photon: impact parameter b set by the energy slider (b/M in [3, 9]).
    const b = 3.0 + state.en * 6.0;
    const E = 1, Lp = b * E;
    const R0 = 17 * M;
    const pr = -Math.sqrt(Math.max(0, E * E - 2 * veffPhoton(R0, Lp)));
    orb = { r: R0, pr, phi: Math.PI * 0.92, L: Lp, E, type: 'photon', trail: [], dead: false, b };
    return;
  }
  const tps = turningPoints(L);                          // [r_peak(inner,unstable), r_well(outer,stable)]
  if (tps.length === 2 && L >= L_ISCO) {
    const rPeak = Math.min(...tps), rWell = Math.max(...tps);
    const Vwell = veffMassive(rWell, L), Vpeak = veffMassive(rPeak, L);
    // Bound band: from the well (circular, en = 0) up to just below the barrier
    // AND below the escape level V = 0 (en = 1). en > 1 pushes over into a plunge.
    const Vbound = Math.min(Vpeak, -0.002);
    const lvl = state.en <= 1
      ? 2 * Vwell + state.en * (2 * Vbound - 2 * Vwell)
      : 2 * Vbound + (state.en - 1) * (2 * (Vpeak + 0.01) - 2 * Vbound);   // E^2 - 1
    const pr0 = Math.sqrt(Math.max(0, lvl - 2 * Vwell));
    orb = { r: rWell, pr: pr0, phi: 0, L, E2m1: lvl, rPeak, rWell, Vwell, Vpeak, type: lvl > 2 * Vpeak ? 'plunge' : 'bound', trail: [], rmax: rWell };
  } else {
    // L below ISCO (or no well): a plunge orbit from far in.
    const R0 = 16 * M, lvl = -0.02;
    const pr0 = -Math.sqrt(Math.max(1e-4, lvl - 2 * veffMassive(R0, L)));
    orb = { r: R0, pr: pr0, phi: 0, L, E2m1: lvl, type: 'plunge', trail: [] };
  }
}

function stepOrbit(dtau) {
  if (!orb) return;
  const L = orb.L, photon = orb.type === 'photon';
  const dV = (r) => photon ? dVdrPhoton(r, L) : dVdrMassive(r, L);
  const deriv = (s) => ({ r: s.pr, pr: -dV(s.r), phi: L / (s.r * s.r) });
  const s0 = { r: orb.r, pr: orb.pr, phi: orb.phi };
  const k1 = deriv(s0);
  const k2 = deriv({ r: s0.r + 0.5 * dtau * k1.r, pr: s0.pr + 0.5 * dtau * k1.pr, phi: 0 });
  const k3 = deriv({ r: s0.r + 0.5 * dtau * k2.r, pr: s0.pr + 0.5 * dtau * k2.pr, phi: 0 });
  const k4 = deriv({ r: s0.r + dtau * k3.r, pr: s0.pr + dtau * k3.pr, phi: 0 });
  orb.r += dtau / 6 * (k1.r + 2 * k2.r + 2 * k3.r + k4.r);
  orb.pr += dtau / 6 * (k1.pr + 2 * k2.pr + 2 * k3.pr + k4.pr);
  orb.phi += dtau / 6 * (k1.phi + 2 * k2.phi + 2 * k3.phi + k4.phi);
  orb.trail.push([orb.r, orb.phi]);
  if (orb.trail.length > TRAIL) orb.trail.shift();
  if (orb.r > (orb.rmax || 0) && orb.r < 30) orb.rmax = orb.r;
  // captured at the horizon, or photon escaped far away -> respawn
  if (orb.r <= 2 * M + 0.02) { orb.dead = 'plunge'; }
  if (photon && orb.r > 24 * M && orb.pr > 0) { orb.dead = 'escape'; }
  if (!photon && orb.type === 'bound' && orb.trail.length > TRAIL - 2) orb.trail.shift();
}

function colors() {
  return { bg: '#06070d', fg: '#e8ecf6', muted: '#9aa6bd', cool: '#7fb1d8', warm: '#e0a060', isco: '#73d39a', photon: '#ffd166', horizon: '#000' };
}

// ----------------------------------------------------- orbit hero
function drawOrbit(c) {
  const x0 = 20, y0 = 96, w = W - 40, h = 470;
  const cx = x0 + w / 2, cy = y0 + h / 2;
  ctx.fillStyle = 'rgba(10,14,26,0.6)'; ctx.fillRect(x0, y0 - 8, w, h + 20);
  const Rview = state.mode === 1 ? 20 : Math.max(9, (orb && orb.rmax ? orb.rmax : 10) * 1.28);
  const sc = (Math.min(w, h) * 0.46) / Rview;     // px per M
  const toXY = (r, phi) => [cx + sc * r * Math.cos(phi), cy + sc * r * Math.sin(phi)];

  // reference circles (labels stacked vertically so they never overlap)
  const circle = (rM, col, dash, label, labY) => {
    ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.setLineDash(dash); ctx.beginPath();
    ctx.arc(cx, cy, sc * rM, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
    if (label) { ctx.fillStyle = col; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.fillText(label, cx + sc * rM + 4, labY); }
  };
  circle(6, c.isco, [5, 4], 'ISCO 6M', cy - 14);
  circle(3, c.photon, [3, 3], 'photon 3M', cy + 14);
  // event horizon (black disk + ring)
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, sc * 2, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,170,90,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, sc * 2, 0, 2 * Math.PI); ctx.stroke();

  if (orb) {
    // orbit trail
    const tcol = orb.type === 'photon' ? c.photon : (orb.type === 'plunge' ? '#e0708a' : c.cool);
    ctx.strokeStyle = tcol; ctx.lineWidth = 1.8; ctx.beginPath();
    for (let i = 0; i < orb.trail.length; i += 1) { const [r, ph] = orb.trail[i]; const [X, Y] = toXY(r, ph); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
    ctx.stroke();
    // particle
    const [px, py] = toXY(orb.r, orb.phi);
    ctx.fillStyle = orb.type === 'photon' ? c.photon : '#fff'; ctx.beginPath(); ctx.arc(px, py, 5, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(state.mode === 1 ? 'photon orbit: deflected, or captured below b = 3 sqrt(3) M' : 'test-particle orbit (precessing rosette; plunges below the ISCO)', x0 + 12, y0 + h + 6);
}

// ----------------------------------------------------- V_eff diagnostic
function drawVeff(c) {
  const x0 = 56, y0 = 600, w = W - 96, h = 360;
  const massive = state.mode === 0;
  const Vf = (r) => massive ? veffMassive(r, state.L) : veffPhoton(r, orb ? orb.L : state.L);
  ctx.fillStyle = 'rgba(10,14,26,0.6)'; ctx.fillRect(x0 - 30, y0 - 22, w + 56, h + 56);
  const rLo = 2.0, rHi = massive ? Math.max(20, (orb && orb.rWell ? orb.rWell * 2.4 : 24)) : 20;
  // y-range from the curve
  let vLo = Infinity, vHi = -Infinity;
  for (let i = 0; i <= 240; i += 1) { const r = rLo + (rHi - rLo) * i / 240; const v = Vf(r); if (isFinite(v) && r > 2.05) { if (v < vLo) vLo = v; if (v > vHi) vHi = v; } }
  const pad = (vHi - vLo) * 0.12 + 1e-3; vLo -= pad; vHi += pad;
  const xOf = (r) => x0 + (r - rLo) / (rHi - rLo) * w;
  const yOf = (v) => y0 + h - (v - vLo) / (vHi - vLo) * h;
  // axes
  ctx.strokeStyle = 'rgba(150,160,185,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('r / M', x0 + w / 2, y0 + h + 30);
  for (const r of [2, 4, 6, 8, 10, 12, 16, 20]) { if (r >= rLo && r <= rHi) { const X = xOf(r); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(X, y0, 1, h); ctx.fillStyle = c.muted; ctx.fillText(`${r}`, X, y0 + h + 14); } }
  ctx.save(); ctx.translate(x0 - 26, y0 + h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillStyle = c.muted; ctx.fillText(massive ? 'V_eff' : 'V_photon', 0, 0); ctx.restore();
  // ISCO + photon sphere markers
  const vline = (rM, col, lab) => { if (rM < rLo || rM > rHi) return; const X = xOf(rM); ctx.strokeStyle = col; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(X, y0); ctx.lineTo(X, y0 + h); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.fillText(lab, X + 3, y0 + 12); };
  vline(6, c.isco, 'ISCO'); vline(3, c.photon, 'photon');
  // V_eff curve
  ctx.strokeStyle = massive ? c.cool : c.photon; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let i = 0; i <= 300; i += 1) { const r = rLo + (rHi - rLo) * i / 300; if (r <= 2.02) continue; const X = xOf(r), Y = yOf(Vf(r)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
  ctx.stroke();
  // energy level + turning points + current r
  if (orb) {
    const lvl = orb.type === 'photon' ? orb.E * orb.E : orb.E2m1;
    const yE = yOf(lvl / (orb.type === 'photon' ? 1 : 2) * (orb.type === 'photon' ? 1 : 2) / 2 * 2);   // E^2-1 already the level for massive
    const yLevel = yOf(orb.type === 'photon' ? orb.E * orb.E / 2 : orb.E2m1 / 2 * 1);
    // For massive, the radial eq uses (1/2)pr^2 + V = (E^2-1)/2, so the energy line is at V = (E^2-1)/2.
    const Elabel = orb.type === 'photon' ? orb.E * orb.E / 2 : orb.E2m1 / 2;
    const yL = yOf(Elabel);
    ctx.strokeStyle = 'rgba(224,160,96,0.85)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 3]); ctx.beginPath(); ctx.moveTo(x0, yL); ctx.lineTo(x0 + w, yL); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = c.warm; ctx.textAlign = 'left'; ctx.fillText('energy', x0 + 4, yL - 4);
    // current radius marker
    if (orb.r >= rLo && orb.r <= rHi) { const X = xOf(orb.r); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X, yOf(Vf(orb.r)), 5, 0, 2 * Math.PI); ctx.fill(); }
  }
}

function drawHeader(c) {
  ctx.fillStyle = c.fg; ctx.font = fontString(canvas, 'body', 'sans', 600); ctx.textAlign = 'left';
  ctx.fillText('Schwarzschild effective potential and the ISCO', 22, 28);
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  if (state.mode === 0) {
    const stable = state.L >= L_ISCO;
    const kind = !stable ? 'L < L_ISCO: no stable orbit -> plunge' : (orb && orb.type === 'plunge' ? 'over the barrier -> plunge' : 'bound: precessing rosette');
    ctx.fillText(`L/M = ${state.L.toFixed(2)}   L_ISCO = 2 sqrt(3) = ${L_ISCO.toFixed(3)}   r_ISCO = 6M   ${kind}`, 22, 50);
  } else {
    ctx.fillText(`photon  b/M = ${orb ? orb.b.toFixed(2) : '--'}   b_crit = 3 sqrt(3) = ${(3 * Math.sqrt(3)).toFixed(2)}   r_photon = 3M`, 22, 50);
  }
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
  drawHeader(c);
  drawOrbit(c);
  drawVeff(c);
}

function syncLabels() { valueL.textContent = state.L.toFixed(2); valueEn.textContent = state.en.toFixed(2); valueMode.textContent = state.mode ? 'photon' : 'massive'; }

let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  if (state.playing && orb) {
    const sub = 80; const dtau = (state.mode === 1 ? 0.42 : 0.5) * dt / sub * 60;
    for (let i = 0; i < sub; i += 1) { stepOrbit(dtau); if (orb.dead) break; }
    if (orb.dead) setupOrbit();
  }
  render();
  requestAnimationFrame(tick);
}

function rebuild() { setupOrbit(); syncLabels(); render(); }
sliderL.addEventListener('input', () => { state.L = parseFloat(sliderL.value); rebuild(); });
sliderEn.addEventListener('input', () => { state.en = parseFloat(sliderEn.value); rebuild(); });
sliderMode.addEventListener('input', () => { state.mode = parseInt(sliderMode.value, 10); rebuild(); });
btnReset.addEventListener('click', () => { state.L = 4.3; state.en = 0.45; state.mode = 0; sliderL.value = '4.3'; sliderEn.value = '0.45'; sliderMode.value = '0'; rebuild(); });
btnPlayPause.addEventListener('click', () => { state.playing = !state.playing; btnPlayPause.textContent = state.playing ? 'Pause' : 'Play'; btnPlayPause.setAttribute('aria-pressed', String(!state.playing)); });

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.L = 3.55 + f * 0.45; state.en = 0.6;
    sliderL.value = String(state.L);
  }
  setupOrbit();
  // pre-roll the trail so a still capture already shows the precessing rosette
  if (orb) { const n = state.mode === 1 ? 1500 : 4200; for (let i = 0; i < n; i += 1) { stepOrbit(0.16); if (orb.dead) { setupOrbit(); break; } } }
  syncLabels(); render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  } else if (state.playing) { requestAnimationFrame(tick); }
}
bootSync();

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'L', label: 'angular momentum L/M', value: state.L, format: 'float' },
    { key: 'mode', label: 'particle', value: state.mode ? 1 : 0, format: 'float' },
    { key: 'r', label: 'current radius r/M', value: orb ? parseFloat(orb.r.toFixed(2)) : 0, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  // r_well from turningPoints must be a genuine extremum of V_eff and >= 6M.
  const tps = turningPoints(state.L);
  if (tps.length === 2) {
    const rWell = Math.max(...tps);
    const okISCO = rWell >= ISCO - 1e-6 || state.L < L_ISCO;
    return [{ key: 'isco-bound', label: 'stable orbit r >= 6M', value: okISCO ? 'pass' : 'drift', status: okISCO ? 'pass' : 'drift' }];
  }
  return [{ key: 'isco-bound', label: 'stable orbit r >= 6M', value: 'L < L_ISCO', status: 'pass' }];
};
