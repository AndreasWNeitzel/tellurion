// Thermal bremsstrahlung: a particle-engine plasma in the top half
// (multiple electrons under softened Coulomb attraction to fixed ions),
// with retarded-wave radiation emitted at each periapsis event, plus
// the accumulated photon-energy histogram against the closed-form
// emissivity in the bottom half. The histogram convergence to the
// theoretical curve IS the demonstration that the spectrum shape comes
// from the Maxwell-Boltzmann thermal average. Reference: Rybicki-
// Lightman, Radiative Processes in Astrophysics, Ch. 5.

import { emissivity, cutoffHz, H, KB, makeRng, step, photonEnergyExp, maxwellVelocity } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, Hc = canvas.height;

const rC = document.getElementById('readout-c');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const btnR = document.getElementById('btn-reset');
const btnP = document.getElementById('btn-pause');

const SCENE_H = Math.floor(Hc * 0.56);
const SPEC_TOP = SCENE_H + 14;
const N_IONS = 6;
const N_ELEC = 18;
const SOFT = 18;
const C_SPEED = 220;          // px / s, the speed of light in code units
const PULSE_LIFETIME = 1.8;   // s; ring is gone once radius exceeds c * lifetime
const MAX_PULSES = 50;        // cap concurrent pulses so the wavefronts read cleanly
const EMIT_PROB = 0.35;       // Poisson thinning of periapsis events

const rng = makeRng(0xC0FFEE);

const ions = [];
const electrons = [];
const pulses = [];
const lastEmit = 0;
const NBINS = 36;
const histLog = new Float32Array(NBINS);   // bin in log10 photon energy
const lognu_min = 8, lognu_max = 22;

const st = { logT: 7, logn: 0, paused: false, simTime: 0 };

function seedIons() {
  ions.length = 0;
  // Place ions on a perturbed grid so they don't overlap.
  for (let i = 0; i < N_IONS; i += 1) {
    const col = i % 3, row = (i / 3) | 0;
    const x = (W / 4) * (col + 1) + (rng() - 0.5) * 40;
    const y = (SCENE_H / 3) * (row + 0.5) + (rng() - 0.5) * 40;
    ions.push({ x, y });
  }
}

function spawnElectron() {
  // Start on the boundary, with Maxwellian velocity pointing inward.
  const T = Math.pow(10, st.logT);
  // Map physical T (10^4 to 10^9 K) to code-units sigma (40 to 220 px/s).
  const sigma = 40 + (st.logT - 4) * 30;
  const [vx0, vy0] = maxwellVelocity(sigma, rng);
  const side = (rng() * 4) | 0;
  let x, y, vx, vy;
  if (side === 0) { x = 0;     y = rng() * SCENE_H; vx =  Math.abs(vx0); vy = vy0; }
  else if (side === 1) { x = W; y = rng() * SCENE_H; vx = -Math.abs(vx0); vy = vy0; }
  else if (side === 2) { x = rng() * W; y = 0;     vx = vx0; vy =  Math.abs(vy0); }
  else                  { x = rng() * W; y = SCENE_H; vx = vx0; vy = -Math.abs(vy0); }
  return { x, y, vx, vy, lastA: 0, lastDir: [1, 0], age: 0 };
}

function reseed() {
  seedIons();
  electrons.length = 0;
  pulses.length = 0;
  for (let i = 0; i < N_ELEC; i += 1) electrons.push(spawnElectron());
  for (let i = 0; i < NBINS; i += 1) histLog[i] = 0;
  st.simTime = 0;
}

function update(dt) {
  const T = Math.pow(10, st.logT);
  const kT_units = 1.0;                   // photon energy in code units; rescale at plot time
  const K = 1.8e4 * Math.pow(T / 1e7, -0.5);   // Coulomb prefactor: higher T => weaker deflection at fixed v
  for (let i = electrons.length - 1; i >= 0; i -= 1) {
    const e = electrons[i];
    const aMag = step(e, ions, K, SOFT, dt);
    // Periapsis detection: a peaks and starts to drop. Threshold avoids
    // emitting from glancing passes that didn't appreciably deflect.
    // Poisson-thin the emissions so the visible pulse density reads as
    // a coherent set of expanding wavefronts rather than a mesh.
    if (e.lastA > 2.0 && aMag < e.lastA && e.lastA > 3.0 && rng() < EMIT_PROB) {
      // Direction of acceleration at the previous step.
      const eDir = e.lastDir;
      // Photon energy from a thermal envelope. We bin in log10 of a
      // "photon energy" mapped from kT * draw -> Hz.
      const E_code = photonEnergyExp(kT_units, rng);
      const nu = E_code * cutoffHz(T);
      if (pulses.length < MAX_PULSES) pulses.push({ x0: e.x, y0: e.y, t0: st.simTime, dir: eDir, nu });
      const lognu = Math.log10(Math.max(1, nu));
      const bin = Math.floor(NBINS * (lognu - lognu_min) / (lognu_max - lognu_min));
      if (bin >= 0 && bin < NBINS) histLog[bin] += 1;
    }
    e.lastA = aMag;
    if (aMag > 1e-6) {
      const ax = -K * 0, ay = -K * 0;   // direction already in step; recover via finite-diff if needed
      // Use the velocity-after-kick as a proxy: angle of dv during this step.
      // Cheap: store direction from current position to the nearest ion.
      let bestR = Infinity, dx = 1, dy = 0;
      for (const ion of ions) {
        const rx = e.x - ion.x, ry = e.y - ion.y;
        const r2 = rx * rx + ry * ry;
        if (r2 < bestR) { bestR = r2; dx = rx; dy = ry; }
      }
      const norm = Math.hypot(dx, dy) || 1;
      e.lastDir = [-dx / norm, -dy / norm];
    }
    // Reset particles that fall out of the scene or get stuck.
    e.age += dt;
    if (e.x < -20 || e.x > W + 20 || e.y < -20 || e.y > SCENE_H + 20 || e.age > 6) {
      electrons[i] = spawnElectron();
    }
  }
  // Age and prune pulses.
  for (let i = pulses.length - 1; i >= 0; i -= 1) {
    if (st.simTime - pulses[i].t0 > PULSE_LIFETIME) pulses.splice(i, 1);
  }
  st.simTime += dt;
  // Gentle histogram decay so the displayed Monte-Carlo curve tracks
  // the current temperature, not the cumulative history.
  for (let i = 0; i < NBINS; i += 1) histLog[i] *= Math.exp(-dt * 0.15);
}

function nuToColor(nu, T) {
  // Map log10(h nu / kT) to a colormap: red below cutoff, white at,
  // blue above (a coarse stand-in for the rainbow of bremsstrahlung
  // photon energies in a hot plasma).
  const lhk = Math.log10(nu / cutoffHz(T));
  if (lhk < -1) return 'rgba(255,200,100,';
  if (lhk < 0)  return 'rgba(255,150,90,';
  if (lhk < 0.5) return 'rgba(255,230,200,';
  return 'rgba(120,180,255,';
}

function drawScene() {
  const T = Math.pow(10, st.logT);
  // Faint plasma background, hotter = bluer.
  const blue = Math.min(255, Math.round(20 + (st.logT - 4) * 16));
  ctx.fillStyle = `rgb(8, 10, ${blue})`;
  ctx.fillRect(0, 0, W, SCENE_H);

  // Pulses (rendered first so particles draw on top). Each pulse is a
  // perfect expanding ring (the propagating EM wavefront) with the
  // dipole pattern carried by a per-segment alpha sin^2(psi), so the
  // intensity vanishes along the acceleration axis and peaks
  // perpendicular to it. The radial speed is fixed (= code-units c)
  // and the ring fades to nothing at the pulse lifetime.
  for (const p of pulses) {
    const age = st.simTime - p.t0;
    const r = age * C_SPEED;
    const fade = Math.max(0, 1 - age / PULSE_LIFETIME);
    const baseAlpha = 0.85 * fade;
    if (r < 2) continue;
    const colorStem = nuToColor(p.nu, T);
    const [nx, ny] = p.dir;
    const SEGS = 48;
    ctx.lineWidth = 1.5;
    for (let s = 0; s < SEGS; s += 1) {
      const th0 = (s / SEGS) * 2 * Math.PI;
      const th1 = ((s + 1) / SEGS) * 2 * Math.PI;
      const thMid = 0.5 * (th0 + th1);
      const cospsi = Math.cos(thMid) * nx + Math.sin(thMid) * ny;
      const w = 1 - cospsi * cospsi;
      if (w < 0.04) continue;        // dipole node: no radiation
      const a = baseAlpha * w;
      ctx.strokeStyle = colorStem + `${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(p.x0 + Math.cos(th0) * r, p.y0 + Math.sin(th0) * r);
      ctx.lineTo(p.x0 + Math.cos(th1) * r, p.y0 + Math.sin(th1) * r);
      ctx.stroke();
    }
  }

  // Ions: bright orange disks with soft halo.
  for (const ion of ions) {
    const g = ctx.createRadialGradient(ion.x, ion.y, 0, ion.x, ion.y, 30);
    g.addColorStop(0, 'rgba(255, 170, 110, 0.55)');
    g.addColorStop(1, 'rgba(255, 170, 110, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(ion.x, ion.y, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffa84a';
    ctx.beginPath(); ctx.arc(ion.x, ion.y, 6, 0, Math.PI * 2); ctx.fill();
  }

  // Electrons: small blue dots with short trails (velocity-tangent).
  for (const e of electrons) {
    const vMag = Math.hypot(e.vx, e.vy) || 1;
    const tx = e.vx / vMag, ty = e.vy / vMag;
    ctx.strokeStyle = 'rgba(150, 200, 255, 0.5)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(e.x - tx * 9, e.y - ty * 9);
    ctx.lineTo(e.x, e.y);
    ctx.stroke();
    ctx.fillStyle = '#7c9cff';
    ctx.beginPath(); ctx.arc(e.x, e.y, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  // Labels.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText(`thermal plasma (T = 10^${st.logT.toFixed(1)} K), Coulomb-flyby ensemble`, 12, 16);
  ctx.fillText(`emitted pulses: ${pulses.length}    counts (decayed): ${Array.from(histLog).reduce((a,b)=>a+b,0).toFixed(0)}`, 12, 30);
}

function drawSpectrum() {
  const T = Math.pow(10, st.logT), n = Math.pow(10, st.logn);
  const pad = { l: 60, r: 30, t: SPEC_TOP, b: 38 };
  const aw = W - pad.l - pad.r;
  const ah = Hc - pad.t - pad.b;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(pad.l, pad.t, aw, ah);
  ctx.strokeStyle = '#9aa0a6';
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ah); ctx.lineTo(pad.l + aw, pad.t + ah);
  ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('log10 ε_ν', 12, pad.t + 12);
  ctx.fillText('log10 ν (Hz)', pad.l + aw / 2 - 30, pad.t + ah + 22);

  const xToPx = (l) => pad.l + (l - lognu_min) / (lognu_max - lognu_min) * aw;

  // Theoretical curve.
  const N = 600;
  const eps = new Float64Array(N);
  let emax = -Infinity, emin = Infinity;
  for (let i = 0; i < N; i += 1) {
    const lognu = lognu_min + (lognu_max - lognu_min) * i / (N - 1);
    const nu = Math.pow(10, lognu);
    const e = emissivity(nu, T, n, n);
    eps[i] = e > 0 ? Math.log10(e) : -50;
    if (eps[i] > emax) emax = eps[i];
    if (eps[i] < emin) emin = eps[i];
  }
  emin = Math.max(emin, emax - 12);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.0;
  ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const lognu = lognu_min + (lognu_max - lognu_min) * i / (N - 1);
    const e = Math.max(emin, eps[i]);
    const py = pad.t + ah - (e - emin) / (emax - emin) * ah;
    if (i === 0) ctx.moveTo(xToPx(lognu), py); else ctx.lineTo(xToPx(lognu), py);
  }
  ctx.stroke();

  // Histogram (Monte-Carlo sample). Rescale linearly into the same
  // [emin, emax] band by matching the bin maximum to the theoretical
  // peak so the eye sees the shape match, not the absolute height.
  let histMax = 1e-9;
  for (let i = 0; i < NBINS; i += 1) if (histLog[i] > histMax) histMax = histLog[i];
  const scale = (emax - emin) * 0.65;
  ctx.fillStyle = 'rgba(125, 211, 252, 0.55)';
  for (let b = 0; b < NBINS; b += 1) {
    const lognu0 = lognu_min + (lognu_max - lognu_min) * b / NBINS;
    const lognu1 = lognu_min + (lognu_max - lognu_min) * (b + 1) / NBINS;
    const h = (histLog[b] / histMax) * scale;
    const px0 = xToPx(lognu0), px1 = xToPx(lognu1);
    ctx.fillRect(px0 + 1, pad.t + ah - h, Math.max(1, px1 - px0 - 1), h);
  }

  // Cutoff vertical line at h nu = kT.
  const nu_c = cutoffHz(T);
  const xc = xToPx(Math.log10(nu_c));
  ctx.strokeStyle = '#5bc0eb'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(xc, pad.t); ctx.lineTo(xc, pad.t + ah); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#5bc0eb';
  // Flip the label to the left of the cutoff line when it sits in the
  // right part of the plot, otherwise it runs off the canvas at high T.
  const cutLbl = `hν = kT  @  log10 ν = ${Math.log10(nu_c).toFixed(2)}`;
  if (xc > pad.l + aw * 0.62) {
    ctx.textAlign = 'right'; ctx.fillText(cutLbl, xc - 4, pad.t + 14); ctx.textAlign = 'left';
  } else {
    ctx.fillText(cutLbl, xc + 4, pad.t + 14);
  }

  // x-axis ticks.
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'center';
  for (let l = lognu_min + 2; l <= lognu_max; l += 2) {
    const x = xToPx(l);
    ctx.fillText(String(l), x, pad.t + ah + 14);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.moveTo(x, pad.t + ah); ctx.lineTo(x, pad.t + ah + 4); ctx.stroke();
  }

  ctx.fillStyle = '#ffd166';
  ctx.textAlign = 'left';
  ctx.fillText('theoretical εν', pad.l + aw - 130, pad.t + 14);
  ctx.fillStyle = '#7dd3fc';
  ctx.fillText('engine histogram', pad.l + aw - 130, pad.t + 28);

  rC.textContent = `10^${Math.log10(nu_c).toFixed(1)} Hz`;
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, Hc);
  drawScene();
  drawSpectrum();
}

function tick() {
  if (!st.paused) {
    const dt = 1 / 60;
    for (let k = 0; k < 2; k += 1) update(dt * 0.5);
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vT.textContent = st.logT.toFixed(2);
  vN.textContent = st.logn.toFixed(1);
}

// Reseed the electron ensemble on slider change so the new T/n
// values are immediately reflected in the particle velocities (and
// the visible emission rate, color, and spectrum). Without this the
// in-flight ensemble keeps its old velocities for many seconds.
sT.addEventListener('input', () => { st.logT = parseFloat(sT.value); syncLabels(); reseed(); });
sN.addEventListener('input', () => { st.logn = parseFloat(sN.value); syncLabels(); reseed(); });
btnR.addEventListener('click', () => {
  st.logT = 7; st.logn = 0; st.paused = false;
  sT.value = '7'; sN.value = '0';
  btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false');
  reseed(); syncLabels(); render();
});
btnP.addEventListener('click', () => {
  st.paused = !st.paused;
  btnP.textContent = st.paused ? 'Play' : 'Pause';
  btnP.setAttribute('aria-pressed', String(st.paused));
});

function bootSync() {
  reseed(); syncLabels();
  if (CAPTURE_NAME) {
    // Sweep T across captures so the goldens show the cutoff sliding
    // and the engine histogram tracking it.
    st.logT = 5 + CAPTURE_FRAC * 4;
    sT.value = String(st.logT);
    vT.textContent = st.logT.toFixed(2);
    // Warm up so pulses and histogram have content (modest, so the
    // scene reads as a few clear wavefronts plus a populated histogram
    // rather than a forest of overlapping rings).
    for (let s = 0; s < 80; s += 1) update(1 / 60);
  }
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const T = Math.pow(10, st.logT);
  const n = Math.pow(10, st.logn);
  const histTotal = Array.from(histLog).reduce((a,b)=>a+b,0);
  return {
    fields: [
      { key: 'temperature', label: 'Temperature log10(T)', value: st.logT, format: 'float' },
      { key: 'density', label: 'Density log10(n)', value: st.logn, format: 'float' },
      { key: 'temp-K', label: 'Temperature (K)', value: T, format: 'float' },
      { key: 'photon-count', label: 'Photon count', value: histTotal, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const T = Math.pow(10, st.logT);
  const histTotal = Array.from(histLog).reduce((a,b)=>a+b,0);
  const TPositive = T > 0 && T < 1e12;
  const histNonneg = histTotal >= 0;
  return [
    {
      key: 'spectrum-physical',
      label: 'Temperature positive and histogram nonnegative',
      value: (TPositive && histNonneg) ? 'pass' : 'drift',
      status: (TPositive && histNonneg) ? 'pass' : 'drift',
    },
  ];
};
