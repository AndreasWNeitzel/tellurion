// Cosmic-ray air shower playground. Atmosphere column with primary
// entering at the top, Heitler cascade of secondaries inside, and
// the Gaisser-Hillas longitudinal profile on the right.

import {
  X_0, LAMBDA_I, E_C_EM, E_C_HAD,
  emShowerMax, emShowerXmax, hadronicXmax, nMuons, gaisserHillas,
  depthAtAltitude_gcm2, altitudeAtDepth_km, PRIMARIES, makeRng,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rPrim = document.getElementById('readout-prim');
const rE = document.getElementById('readout-E');
const rXmax = document.getElementById('readout-Xmax');
const rNmax = document.getElementById('readout-Nmax');
const rNmu = document.getElementById('readout-Nmu');

const selPrim = document.getElementById('select-primary'), vPrim = document.getElementById('value-primary');
const sLogE = document.getElementById('slider-logE'), vLogE = document.getElementById('value-logE');
const sDepth = document.getElementById('slider-depth'), vDepth = document.getElementById('value-depth');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  primary: 'proton',
  logE: 18.0,
  depth: 1.0,            // fraction of max depth (1030 g/cm^2 at sea level)
  speed: 2,
  zenithDeg: 0,          // zenith angle (0 = vertical, 90 = horizontal)
  running: !prefersReducedMotion(),
  rng: makeRng(0xC0FFEE),
  particles: [],         // live cascade particles (animated)
  cycle: 0,              // shower-cycle counter for periodic reseed
  t: 0,
};

function Avalue() {
  return (PRIMARIES.find(p => p.name === st.primary) || PRIMARIES[0]).A;
}
function E_GeV() { return Math.pow(10, st.logE - 9); }    // eV -> GeV
function Xmax() { return hadronicXmax(E_GeV(), Avalue()); }
function Nmax() { return emShowerMax(E_GeV()); }

// Scene: left 60% = 3D atmosphere column, right 40% = Gaisser-Hillas profile.
const SCENE = { x: 0, y: 0, w: 0.55 * W, h: H };
const PROF = { x: 0.58 * W, y: 30, w: W - 0.58 * W - 14, h: H - 60 };

// Atmosphere extent: from 0 km (sea level) to 40 km top.
const ALT_TOP_KM = 40;
const ALT_BOT_KM = 0;

function altToScreenY(h_km) {
  const u = 1 - (h_km - ALT_BOT_KM) / (ALT_TOP_KM - ALT_BOT_KM);
  return SCENE.y + 30 + u * (SCENE.h - 60);
}

function drawAtmosphere() {
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, W, H);
  // Atmosphere gradient: dark blue at top, faint orange-brown at bottom.
  const grad = ctx.createLinearGradient(0, SCENE.y, 0, SCENE.h);
  grad.addColorStop(0, 'rgba(20, 30, 80, 0.15)');
  grad.addColorStop(0.85, 'rgba(100, 60, 80, 0.20)');
  grad.addColorStop(1, 'rgba(80, 50, 30, 0.30)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, SCENE.y, SCENE.w, SCENE.h);
  // Ground
  ctx.fillStyle = 'rgba(80, 40, 30, 0.95)';
  ctx.fillRect(0, altToScreenY(0), SCENE.w, SCENE.h - altToScreenY(0) + 30);
  // Altitude tick marks.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (let h = 0; h <= ALT_TOP_KM; h += 5) {
    const y = altToScreenY(h);
    ctx.fillText(`${h} km`, 6, y + 3);
    ctx.fillStyle = 'rgba(220, 230, 255, 0.15)';
    ctx.fillRect(35, y, SCENE.w - 50, 1);
    ctx.fillStyle = 'rgba(220, 230, 255, 0.55)';
  }
}

// =========================================================================
// LIVE CASCADE V3. Multiple simultaneous showers, fast moving, dense
// branching at each interaction, with bright flash markers at every
// branch point. Maxes out at ~ 800 live particles; capped by total
// budget so the page doesn't lag.
// =========================================================================
const MAX_PARTICLES = 800;
const flashes = [];          // {x, y, age, intensity}
function newShower() {
  const cx = SCENE.x + SCENE.w / 2;
  const zen = (st.zenithDeg * Math.PI) / 180;
  const startH = ALT_TOP_KM - 0.5;
  // Randomize horizontal entry within the visible scene.
  const dx_screen = (st.rng() - 0.5) * SCENE.w * 0.4 - SCENE.w * 0.30 * Math.sin(zen);
  st.particles.push({
    x: cx + dx_screen, h_km: startH,
    dx: Math.sin(zen), dh: -Math.cos(zen),
    E: E_GeV(),
    kind: 'primary',
    age: 0,
    interacted: false,
    nextInteractH_km: altitudeAtDepth_km(LAMBDA_I) - st.rng() * 5,
    trail: [{ x: cx + dx_screen, h_km: startH }],
  });
  st.cycle += 1;
}
function spawnPrimary() {
  st.particles.length = 0;
  flashes.length = 0;
  // Three simultaneous primaries staggered slightly in launch time.
  for (let i = 0; i < 3; i += 1) newShower();
}
function stepCascade(dt) {
  // Faster propagation: 6 km/sec of wall-clock at speed 2; one shower
  // clears the atmosphere in ~ 6-7 seconds.
  const v_km = 4.0 * st.speed;
  const newParts = [];
  for (const p of st.particles) {
    p.h_km += p.dh * v_km * dt;
    p.x += p.dx * v_km * dt * (SCENE.w * 0.4 / ALT_TOP_KM);
    p.age += dt;
    // Interaction check.
    if (!p.interacted && p.h_km <= p.nextInteractH_km && p.kind !== 'muon') {
      p.interacted = true;
      // Burst flash at the interaction point.
      flashes.push({ x: p.x, y: altToScreenY(p.h_km), age: 0, intensity: p.kind === 'primary' ? 1.0 : 0.6 });
      // Many secondaries: 6-10 for primary/hadronic, 4-6 for EM.
      const nBranch = p.kind === 'primary' ? 10 : p.kind === 'hadronic' ? 6 + Math.floor(st.rng() * 4) : 3 + Math.floor(st.rng() * 3);
      for (let k = 0; k < nBranch; k += 1) {
        if (st.particles.length + newParts.length >= MAX_PARTICLES) break;
        const E_new = p.E / nBranch;
        if (E_new < 0.005) continue;
        // Wider opening angle for "spectacle".
        const dTheta = 0.12 + 0.18 / Math.max(0.5, Math.sqrt(E_new));
        const ang = (st.rng() - 0.5) * dTheta;
        const ca = Math.cos(ang), sa = Math.sin(ang);
        const ndx = p.dx * ca - p.dh * sa;
        const ndh = p.dx * sa + p.dh * ca;
        const r = st.rng();
        const kind = r < 0.70 ? 'em' : r < 0.95 ? 'hadronic' : 'muon';
        const dX = kind === 'em' ? X_0 : (kind === 'hadronic' ? LAMBDA_I : 1e6);
        const nextH = altitudeAtDepth_km(Math.min(1030, depthAtAltitude_gcm2(p.h_km) + dX * (0.6 + st.rng() * 0.8)));
        newParts.push({
          x: p.x, h_km: p.h_km, dx: ndx, dh: ndh,
          E: E_new, kind, age: 0,
          interacted: false,
          nextInteractH_km: nextH,
          trail: [{ x: p.x, h_km: p.h_km }],
        });
      }
      p.kind = 'dead';
    }
    p.trail.push({ x: p.x, h_km: p.h_km });
    if (p.trail.length > 12) p.trail.shift();
  }
  for (const np of newParts) st.particles.push(np);
  st.particles = st.particles.filter((p) => p.kind !== 'dead' && p.h_km > -1);
  // Update flashes.
  for (let i = flashes.length - 1; i >= 0; i -= 1) {
    flashes[i].age += dt;
    if (flashes[i].age > 0.6) flashes.splice(i, 1);
  }
  // Maintain a steady rain of primaries.
  if (st.particles.length < 40 && st.cycle - flashes.length < 1000) {
    newShower();
  }
}

function drawCascade() {
  const cx = SCENE.x + SCENE.w / 2;
  const Xmax_v = Xmax();
  const X1 = LAMBDA_I;

  // X_max marker (horizontal dashed line).
  const Xmax_y = altToScreenY(altitudeAtDepth_km(Xmax_v));
  ctx.strokeStyle = 'rgba(255, 220, 140, 0.65)';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(40, Xmax_y); ctx.lineTo(SCENE.w - 20, Xmax_y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`X_max = ${Xmax_v.toFixed(0)} g cm^-2`, 50, Xmax_y - 6);

  // Interaction-point bright flashes (additive blend).
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const f of flashes) {
    const a = Math.max(0, 1 - f.age / 0.6);
    const r = (10 + 30 * (1 - a)) * f.intensity;
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
    g.addColorStop(0, `rgba(255, 255, 230, ${(0.85 * a).toFixed(2)})`);
    g.addColorStop(0.5, `rgba(255, 200, 110, ${(0.45 * a).toFixed(2)})`);
    g.addColorStop(1, 'rgba(255, 200, 110, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // LIVE PARTICLES with motion trails.
  for (const p of st.particles) {
    const trail = p.trail || p.parentTrail || [];
    if (trail.length < 2) continue;
    let col, lw;
    if (p.kind === 'primary') { col = 'rgba(255, 255, 220, 0.95)'; lw = 2.4; }
    else if (p.kind === 'em') { col = 'rgba(120, 220, 255, 0.85)'; lw = 1.4; }
    else if (p.kind === 'hadronic') { col = 'rgba(255, 130, 110, 0.85)'; lw = 1.6; }
    else if (p.kind === 'muon') { col = 'rgba(255, 230, 120, 0.85)'; lw = 1.4; }
    else continue;
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    for (let k = 0; k < trail.length; k += 1) {
      const px = trail[k].x;
      const py = altToScreenY(trail[k].h_km);
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Glowing leading dot.
    const last = trail[trail.length - 1];
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(last.x, altToScreenY(last.h_km), p.kind === 'primary' ? 4 : 2.2, 0, Math.PI * 2); ctx.fill();
  }

  // Header.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`primary ${st.primary}, E_0 = 10^${st.logE.toFixed(1)} eV  ·  zenith = ${st.zenithDeg.toFixed(0)}°`, 50, 24);
  ctx.fillText(`live particles: ${st.particles.length}    cycle ${st.cycle}`, 50, 42);
  // Species legend.
  let lyx = 50, lyy = SCENE.h - 18;
  function leg(col, txt) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lyx, lyy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(220, 230, 255, 0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(txt, lyx + 8, lyy + 4);
    lyx += ctx.measureText(txt).width + 30;
  }
  leg('rgba(120, 220, 255, 0.95)', 'EM (e±, γ)');
  leg('rgba(255, 130, 110, 0.95)', 'hadronic (π, K)');
  leg('rgba(255, 230, 120, 0.95)', 'muon');
  leg('rgba(255, 255, 220, 0.95)', 'primary');
}

function drawProfile() {
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(PROF.x, PROF.y, PROF.w, PROF.h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(PROF.x + 0.5, PROF.y + 0.5, PROF.w - 1, PROF.h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('Gaisser-Hillas N(X)', PROF.x + 8, PROF.y - 6);

  // Plot N(X) for X in [0, 1500] g cm^-2.
  const X_MAX_PLOT = 1500;
  const N_PTS = 200;
  let Npeak = Nmax();
  ctx.strokeStyle = 'rgba(120, 220, 255, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let k = 0; k < N_PTS; k++) {
    const X = (k / (N_PTS - 1)) * X_MAX_PLOT;
    const N = gaisserHillas(X, Npeak, Xmax(), LAMBDA_I);
    const xx = PROF.x + 38 + (X / X_MAX_PLOT) * (PROF.w - 60);
    const yy = PROF.y + PROF.h - 30 - Math.min(1, N / Npeak) * (PROF.h - 50);
    if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  // X_max marker.
  const xMaxX = PROF.x + 38 + (Xmax() / X_MAX_PLOT) * (PROF.w - 60);
  ctx.strokeStyle = 'rgba(255, 220, 140, 0.75)';
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xMaxX, PROF.y + 12); ctx.lineTo(xMaxX, PROF.y + PROF.h - 30); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`X_max`, xMaxX + 4, PROF.y + 22);

  // Sea-level marker.
  const xSL = PROF.x + 38 + (1030 / X_MAX_PLOT) * (PROF.w - 60);
  ctx.strokeStyle = 'rgba(255, 130, 110, 0.5)';
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xSL, PROF.y + 12); ctx.lineTo(xSL, PROF.y + PROF.h - 30); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 130, 110, 0.85)';
  ctx.fillText('sea level', xSL + 4, PROF.y + 38);

  // Axes.
  ctx.fillStyle = 'rgba(200, 210, 230, 0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('0', PROF.x + 30, PROF.y + PROF.h - 12);
  ctx.fillText('1500', PROF.x + PROF.w - 38, PROF.y + PROF.h - 12);
  ctx.fillText('X (g cm^-2)', PROF.x + PROF.w / 2 - 36, PROF.y + PROF.h - 12);
  ctx.fillText('N(X)', PROF.x + 8, PROF.y + 18);

  // Compare protons vs iron at the same energy (background reference).
  if (st.primary !== 'iron-56') {
    const X_iron = hadronicXmax(E_GeV(), 56);
    const xIron = PROF.x + 38 + (X_iron / X_MAX_PLOT) * (PROF.w - 60);
    ctx.strokeStyle = 'rgba(180, 180, 180, 0.5)';
    ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(xIron, PROF.y + 12); ctx.lineTo(xIron, PROF.y + PROF.h - 30); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(180, 180, 180, 0.75)';
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText('iron X_max', xIron - 60, PROF.y + 56);
  }
}

function updateReadout() {
  rPrim.textContent = st.primary;
  rE.textContent = `10^${st.logE.toFixed(1)} eV`;
  rXmax.textContent = Xmax().toFixed(0);
  rNmax.textContent = Nmax().toExponential(2);
  rNmu.textContent = nMuons(E_GeV(), Avalue()).toExponential(2);
}

function draw() {
  drawAtmosphere();
  drawCascade();
  drawProfile();
  updateReadout();
}

function readSliders() {
  st.primary = selPrim.value;
  st.logE = parseFloat(sLogE.value);
  st.depth = parseFloat(sDepth.value);
  st.speed = parseInt(sSpeed.value, 10);
  vPrim.textContent = st.primary.slice(0, 4);
  vLogE.textContent = st.logE.toFixed(1);
  vDepth.textContent = st.depth.toFixed(2);
  vSpeed.textContent = String(st.speed);
}

// Zenith-angle slider lookup (it may not exist yet in the HTML).
const sZen = document.getElementById('slider-zen');
const vZen = document.getElementById('value-zen');
if (sZen) {
  sZen.addEventListener('input', () => { st.zenithDeg = parseFloat(sZen.value); if (vZen) vZen.textContent = `${st.zenithDeg.toFixed(0)}°`; spawnPrimary(); });
}
[selPrim, sLogE, sDepth, sSpeed].forEach(el => el.addEventListener('input', readSliders));
selPrim.addEventListener('change', readSliders);
selPrim.addEventListener('change', () => spawnPrimary());
sLogE.addEventListener('change', () => spawnPrimary());
btnReset.addEventListener('click', () => { st.rng = makeRng(0xC0FFEE); spawnPrimary(); });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  primary: { get: () => st.primary, set: v => { st.primary = v; selPrim.value = v; }, parse: x => x },
  log_E_eV: { get: () => st.logE, set: v => { st.logE = parseFloat(v); sLogE.value = v; }, parse: parseFloat },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

if (CAPTURE_NAME) {
  // For capture, sweep depth from 0.3 to 1.0 across the fraction.
  st.depth = 0.3 + 0.7 * (CAPTURE_FRAC || 0);
  sDepth.value = String(st.depth);
  st.rng = makeRng(0xC0FFEE);     // deterministic
  draw();
  window.__simulationReady = true;
} else {
  spawnPrimary();
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) { st.t += dt; stepCascade(dt); }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'primary-energy-ev', label: 'Primary energy', value: st.primaryEnergy || 1e18, format: 'float' },
      { key: 'cascade-depth', label: 'Cascade depth', value: st.showerDepth || 0, format: 'float' },
      { key: 'particle-count', label: 'Particle count', value: st.particleCount || 0, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  // Check energy conservation: sum of secondary particle energies <= primary.
  const primaryEnergy = st.primaryEnergy || 1e18;
  const secondarySum = (st.secondaryParticles || []).reduce((s, p) => s + (p.energy || 0), 0);
  const loss = primaryEnergy - secondarySum;
  const lossRatio = Math.abs(loss / primaryEnergy);
  const status = lossRatio < 0.5 ? 'pass' : 'drift';
  return [
    {
      key: 'energy-budget',
      label: 'Energy loss fraction',
      value: lossRatio.toExponential(2),
      status: status
    }
  ];
};
