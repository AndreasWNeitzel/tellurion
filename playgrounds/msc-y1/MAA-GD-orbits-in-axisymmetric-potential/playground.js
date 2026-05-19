// Orbits in an axisymmetric (Miyamoto-Nagai) potential, done right.
// The old version integrated R-double-dot = F_R with no angular
// momentum, so every "orbit" was a degenerate radial plunge through
// the centre: no rosette, contradicting this playground's own spec.
// Here the conserved L_z is set by the azimuthal launch speed, the
// meridional motion is integrated symplectically with the centrifugal
// term, and you see the two textbook pictures: the face-on rosette
// that never closes (left) and the meridional (R, z) orbit filling
// the box inside the zero-velocity curve Phi_eff = E (right). Energy
// and L_z hold flat in the live readout. sim.js miyamotoPotential /
// forceR / forceZ / rk4Orbit are byte-identical; effPotential /
// orbitEnergy / leapfrogMeridional are appended. Reference: Binney
// and Tremaine, Galactic Dynamics 2e, Sec. 3.2; Miyamoto and Nagai,
// PASJ 27, 533 (1975).
import { leapfrogMeridional, effPotential, orbitEnergy, forceR } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sR = document.getElementById('slider-R'), vRo = document.getElementById('value-R');
const sV = document.getElementById('slider-v'), vVo = document.getElementById('value-v');
const sVz = document.getElementById('slider-vz'), vVzo = document.getElementById('value-vz');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const W = canvas.width, H = canvas.height;

const KPC = 3.086e19;
const Mg = 5e40, aD = 3 * KPC, bD = 0.3 * KPC;          // galaxy potential
const DT = 4e13, SUB = 14;                              // s; steps per frame

// circular speed at R (z=0): v_c = sqrt(R |F_R|)
function vCirc(R) { return Math.sqrt(R * Math.abs(forceR(R, 0, Mg, aD, bD))); }

const st = { R0: 8, vphi: 80, vz: 40 };
let phi = 0, state, Lz = 0, E0 = 0, running = true;
let Rmin = 0, Rmax = 0, zMax = 0;        // true turning points (peri/apo, |z|max)
let viewR = 0, viewZ = 0;                // padded extents for panel scaling
const trailXY = [], trailRz = [];
const TRAIL = 2600;

function probeBounds() {
  // Deterministic pre-integration to find the true peri/apo and |z|max.
  let s = [st.R0 * KPC, 0, 0, st.vz * 1000];
  Rmin = s[0]; Rmax = s[0]; zMax = Math.abs(s[1]) + 1;
  for (let i = 0; i < 9000; i += 1) {
    s = leapfrogMeridional(s, DT, Mg, aD, bD, Lz);
    if (s[0] < Rmin) Rmin = s[0];
    if (s[0] > Rmax) Rmax = s[0];
    if (Math.abs(s[1]) > zMax) zMax = Math.abs(s[1]);
  }
  viewR = Rmax * 1.08;
  viewZ = Math.max(zMax * 1.15, 0.05 * KPC);
}

function reset() {
  Lz = st.R0 * KPC * st.vphi * 1000;                    // L_z = R0 * v_phi
  state = [st.R0 * KPC, 0, 0, st.vz * 1000];
  phi = 0; trailXY.length = 0; trailRz.length = 0;
  probeBounds();
  E0 = orbitEnergy(state, Mg, aD, bD, Lz);
}

sR.addEventListener('input', () => { st.R0 = parseFloat(sR.value); vRo.textContent = st.R0.toFixed(1); reset(); });
sV.addEventListener('input', () => { st.vphi = parseFloat(sV.value); vVo.textContent = st.vphi.toFixed(0); reset(); });
sVz.addEventListener('input', () => { st.vz = parseFloat(sVz.value); vVzo.textContent = st.vz.toFixed(0); reset(); });
btnR.addEventListener('click', () => { st.R0 = 8; st.vphi = 80; st.vz = 40; sR.value = '8'; vRo.textContent = '8.0'; sV.value = '80'; vVo.textContent = '80'; sVz.value = '40'; vVzo.textContent = '40'; reset(); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

function step() {
  for (let k = 0; k < SUB; k += 1) {
    phi += (Lz / (state[0] * state[0])) * DT;
    state = leapfrogMeridional(state, DT, Mg, aD, bD, Lz);
  }
  const R = state[0], z = state[1];
  trailXY.push([R * Math.cos(phi), R * Math.sin(phi)]);
  trailRz.push([R, z]);
  if (trailXY.length > TRAIL) { trailXY.shift(); trailRz.shift(); }
}

function render() {
  if (!CAPTURE_NAME && running) step();
  ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2e8f0'; ctx.font = '16px sans-serif';
  ctx.fillText('A disk-galaxy orbit never closes: it draws a rosette', 18, 26);

  // LEFT PANEL: face-on rosette in the galactic plane
  const lcx = 250, lcy = 318, lR = 232;
  const sXY = lR / viewR;
  const bg = ctx.createRadialGradient(lcx, lcy, 0, lcx, lcy, lR);
  bg.addColorStop(0, 'rgba(255,221,150,0.20)'); bg.addColorStop(0.35, 'rgba(120,110,200,0.07)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(lcx, lcy, lR, 0, 6.2832); ctx.fill();
  ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(91,192,235,0.45)'; ctx.beginPath(); ctx.arc(lcx, lcy, Rmax * sXY, 0, 6.2832); ctx.stroke();
  ctx.strokeStyle = 'rgba(239,71,111,0.45)'; ctx.beginPath(); ctx.arc(lcx, lcy, Rmin * sXY, 0, 6.2832); ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 1; i < trailXY.length; i += 1) {
    const p0 = trailXY[i - 1], p1 = trailXY[i];
    const aL = 0.10 + 0.85 * (i / trailXY.length);
    ctx.strokeStyle = `rgba(6,214,160,${aL.toFixed(3)})`; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(lcx + p0[0] * sXY, lcy - p0[1] * sXY);
    ctx.lineTo(lcx + p1[0] * sXY, lcy - p1[1] * sXY);
    ctx.stroke();
  }
  ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(lcx, lcy, 4, 0, 6.2832); ctx.fill();
  if (trailXY.length) {
    const pe = trailXY[trailXY.length - 1];
    ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(lcx + pe[0] * sXY, lcy - pe[1] * sXY, 5, 0, 6.2832); ctx.fill();
  }
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('face-on plane  (x, y)', lcx - lR + 4, lcy + lR + 16);
  ctx.fillStyle = 'rgba(91,192,235,0.8)'; ctx.fillText('apocentre', lcx + 60, lcy + lR + 16);
  ctx.fillStyle = 'rgba(239,71,111,0.8)'; ctx.fillText('pericentre', lcx + 140, lcy + lR + 16);

  // RIGHT PANEL: meridional (R, z) box inside the zero-velocity curve
  const px0 = 520, px1 = W - 22, py0 = 62, py1 = 470;
  const Rlo = Math.max(0.05 * KPC, Rmin * 0.7), Rhi = viewR;
  const zhi = viewZ;
  const RtoX = (R) => px0 + (R - Rlo) / (Rhi - Rlo) * (px1 - px0);
  const ztoY = (z) => (py0 + py1) / 2 - z / zhi * ((py1 - py0) / 2);
  ctx.fillStyle = '#0a0c14'; ctx.fillRect(px0, py0, px1 - px0, py1 - py0);
  const GX = 150, GY = 120;
  for (let j = 0; j < GY; j += 1) {
    const z = (1 - 2 * j / (GY - 1)) * zhi;
    for (let i = 0; i < GX; i += 1) {
      const R = Rlo + (Rhi - Rlo) * i / (GX - 1);
      if (effPotential(R, z, Mg, aD, bD, Lz) <= E0) {
        const x = px0 + i / (GX - 1) * (px1 - px0);
        const y = py0 + j / (GY - 1) * (py1 - py0);
        ctx.fillStyle = 'rgba(91,192,235,0.13)';
        ctx.fillRect(x, y, (px1 - px0) / GX + 1, (py1 - py0) / GY + 1);
      }
    }
  }
  ctx.strokeStyle = 'rgba(226,232,240,0.16)'; ctx.lineWidth = 1;
  ctx.strokeRect(px0 + 0.5, py0 + 0.5, px1 - px0 - 1, py1 - py0 - 1);
  ctx.beginPath(); ctx.moveTo(px0, ztoY(0)); ctx.lineTo(px1, ztoY(0)); ctx.stroke();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.3; ctx.beginPath();
  for (let i = 0; i < trailRz.length; i += 1) {
    const x = RtoX(trailRz[i][0]), y = ztoY(trailRz[i][1]);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  if (trailRz.length) {
    const e = trailRz[trailRz.length - 1];
    ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(RtoX(e[0]), ztoY(e[1]), 4, 0, 6.2832); ctx.fill();
  }
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('meridional plane  (R, z)   shaded: Phi_eff <= E', px0, py1 + 16);

  // CONSERVED QUANTITIES: the live invariant readout
  const E = orbitEnergy(state, Mg, aD, bD, Lz);
  const dE = Math.abs((E - E0) / E0);
  const Rk = state[0] / KPC, zk = state[1] / KPC;
  ctx.fillStyle = '#cbd5e1'; ctx.font = '12px ui-monospace, monospace';
  let yy = py0 + 14;
  ctx.fillText(`R   = ${Rk.toFixed(2)} kpc`, px0 + 8, yy); yy += 17;
  ctx.fillText(`z   = ${zk.toFixed(2)} kpc`, px0 + 8, yy); yy += 17;
  ctx.fillText(`peri/apo = ${(Rmin / KPC).toFixed(1)} / ${(Rmax / KPC).toFixed(1)} kpc`, px0 + 8, yy); yy += 17;
  ctx.fillStyle = '#06d6a0';
  ctx.fillText(`L_z = ${(Lz / (KPC * 1000)).toFixed(0)} kpc km/s  (const)`, px0 + 8, yy); yy += 17;
  ctx.fillText(`|dE/E| = ${dE.toExponential(1)}`, px0 + 8, yy);

  ctx.fillStyle = '#64748b'; ctx.font = '11px ui-monospace, monospace';
  const vc = vCirc(st.R0 * KPC) / 1000;
  ctx.fillText(`v_phi = ${st.vphi} km/s  (v_circ ~ ${vc.toFixed(0)});  v_phi < v_circ tightens the rosette`, 18, H - 10);

  rR.textContent = `|dE/E|=${dE.toExponential(1)}`;
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
function bootSync() {
  reset();
  const n = (CAPTURE_NAME && DETERMINISTIC)
    ? Math.round((Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0) * 1700) + 60
    : 360;
  for (let i = 0; i < n; i += 1) step();
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
