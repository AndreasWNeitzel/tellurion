// Black Hole LEGEND. A multi-mode laboratory for Schwarzschild and
// Kerr black holes. Mode tabs: Overview, Photons, Lensing, Frame
// drag, Spacetime (Flamm embedding).
//
// All overlays (horizon, photon sphere, ISCO, ergosphere, grid,
// traces) toggle independently. Visual unit: the central BH always
// renders at fixed pixel radius BH_PX (== R_s); other distances scale
// in multiples of R_s.

import {
  schwarzschildRadius_m, photonSphereRadius_m, criticalImpactParameter_m,
  iscoRadius_m, kerrHorizonRadius_m, ergosphereEquator_m,
  lightBendingAngle_rad, einsteinRingRadius_rad, lensImagePositions_rad,
  lensMagnification, hawkingTemperature_K, gravRedshift, diskDopplerFactor,
  tracePhoton, classifyPhoton, makeRng, rsKm,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const DEG = Math.PI / 180;

// Readouts.
const rM = document.getElementById('readout-M');
const rChi = document.getElementById('readout-chi');
const rRs = document.getElementById('readout-rs');
const rIsco = document.getElementById('readout-isco');
const rMode = document.getElementById('readout-mode');

// Inputs.
const selMode = document.getElementById('select-mode'), vMode = document.getElementById('value-mode');
const sLogM = document.getElementById('slider-logM'), vLogM = document.getElementById('value-logM');
const sChi = document.getElementById('slider-chi'), vChi = document.getElementById('value-chi');
const sIncl = document.getElementById('slider-incl'), vIncl = document.getElementById('value-incl');
const sB = document.getElementById('slider-b'), vB = document.getElementById('value-b');
const sBeta = document.getElementById('slider-beta'), vBeta = document.getElementById('value-beta');
const tHorizon = document.getElementById('t-horizon');
const tPhotonsphere = document.getElementById('t-photonsphere');
const tIsco = document.getElementById('t-isco');
const tErgo = document.getElementById('t-ergo');
const tGrid = document.getElementById('t-grid');
const tTraces = document.getElementById('t-traces');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  mode: 'overview',
  logM: 6.0,
  chi: 0.0,
  incl: 60,
  b_rs: 2.65,           // impact parameter in R_s units
  beta_te: 0.30,        // source offset in theta_E units
  flags: {
    horizon: true, photonsphere: true, isco: true,
    ergo: false, grid: false, traces: true,
  },
  running: !prefersReducedMotion(),
  t: 0,
  rng: makeRng(0xC0FFEE),
  photonTraces: null,    // cached for performance
};

function M_solar() { return Math.pow(10, st.logM); }
function rsM() { return schwarzschildRadius_m(M_solar()); }
function rIscoRs() { return iscoRadius_m(M_solar(), st.chi) / rsM(); }
function rHorizonRs() { return kerrHorizonRadius_m(M_solar(), st.chi) / rsM(); }
function rPhotonSphereRs() { return 1.5; }       // Schwarzschild; Kerr varies but we keep schematic.
function rErgoEqRs() { return 1.0; }            // ergosphere outer = 2M = R_s at equator.
function bCritRs() { return 3 * Math.sqrt(3) / 2; }

// Scene-to-canvas. The BH event horizon takes ~ 50 pixels radius in
// the main 3D viewport. World coords are in units of R_s.
const CENTER = { x: W * 0.4, y: H * 0.5 };
const SCALE_PX_PER_RS = 50;

function w2s(x_rs, y_rs) {
  return { x: CENTER.x + x_rs * SCALE_PX_PER_RS, y: CENTER.y - y_rs * SCALE_PX_PER_RS };
}

// Background sky (starfield with slight color tint).
function drawSky() {
  ctx.fillStyle = '#02030a';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 220; i++) {
    const ix = (i * 23.7) % W;
    const iy = (i * 31.1) % H;
    const sb = 0.15 + 0.55 * ((i * 7) % 17) / 17;
    ctx.fillStyle = `rgba(200, 220, 255, ${sb})`;
    ctx.fillRect(ix, iy, 1, 1);
  }
}

function drawHorizon() {
  if (!st.flags.horizon) return;
  const r = rHorizonRs() * SCALE_PX_PER_RS;
  // Outer photon-ring glow.
  const halo = ctx.createRadialGradient(CENTER.x, CENTER.y, r * 0.9, CENTER.x, CENTER.y, r * 3.0);
  halo.addColorStop(0, 'rgba(255, 170, 90, 0.55)');
  halo.addColorStop(0.5, 'rgba(255, 90, 200, 0.18)');
  halo.addColorStop(1, 'rgba(60, 80, 220, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(CENTER.x, CENTER.y, r * 3.0, 0, Math.PI * 2); ctx.fill();
  // Event horizon (black disc).
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(CENTER.x, CENTER.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 180, 100, 0.70)';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(CENTER.x, CENTER.y, r, 0, Math.PI * 2); ctx.stroke();
}

function drawPhotonSphere() {
  if (!st.flags.photonsphere) return;
  const r = rPhotonSphereRs() * SCALE_PX_PER_RS;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.arc(CENTER.x, CENTER.y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('photon sphere', CENTER.x + r * 0.7, CENTER.y - r * 0.7);
}

function drawISCO() {
  if (!st.flags.isco) return;
  const r = rIscoRs() * SCALE_PX_PER_RS;
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.85)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.ellipse(CENTER.x, CENTER.y, r, r * Math.cos(st.incl * DEG), 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255, 220, 120, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`ISCO @ ${rIscoRs().toFixed(2)} R_s`, CENTER.x - r, CENTER.y - r * Math.cos(st.incl * DEG) - 6);
}

function drawErgo() {
  if (!st.flags.ergo) return;
  // At inclination 0 the ergosphere appears as a flattened ellipse
  // since r_e varies with theta. We draw the equatorial profile as
  // an ellipse with a/b inversion proportional to chi.
  const re = rErgoEqRs() * SCALE_PX_PER_RS;
  const rh = rHorizonRs() * SCALE_PX_PER_RS;
  const flatten = Math.cos(st.incl * DEG);
  ctx.strokeStyle = 'rgba(220, 120, 255, 0.85)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.ellipse(CENTER.x, CENTER.y, re, re * flatten, 0, 0, Math.PI * 2); ctx.stroke();
  // Inner: outer horizon.
  ctx.strokeStyle = 'rgba(180, 100, 220, 0.65)';
  ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.ellipse(CENTER.x, CENTER.y, rh, rh * flatten, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(220, 120, 255, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('ergosphere', CENTER.x + re * 0.9, CENTER.y + re * flatten + 12);
}

function drawCoordinateGrid() {
  if (!st.flags.grid) return;
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.16)';
  ctx.lineWidth = 1;
  for (let r = 1; r <= 6; r++) {
    const px = r * SCALE_PX_PER_RS;
    ctx.beginPath(); ctx.arc(CENTER.x, CENTER.y, px, 0, Math.PI * 2); ctx.stroke();
  }
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(CENTER.x, CENTER.y);
    ctx.lineTo(CENTER.x + 6 * SCALE_PX_PER_RS * Math.cos(a), CENTER.y + 6 * SCALE_PX_PER_RS * Math.sin(a));
    ctx.stroke();
  }
}

// Accretion disk (Doppler-beamed thin disk, used in Overview mode).
function drawAccretionDisk() {
  const r_inner = Math.max(rIscoRs(), rHorizonRs() * 1.1);
  const r_outer = 6;
  const N_r = 40, N_phi = 90;
  const incl = st.incl * DEG;
  const sin_i = Math.sin(incl), cos_i = Math.cos(incl);
  // Render in back-to-front order based on apparent y of each cell.
  const cells = [];
  for (let ir = 0; ir < N_r; ir++) {
    const t = (ir + 0.5) / N_r;
    const r = r_inner + (r_outer - r_inner) * t;
    for (let iphi = 0; iphi < N_phi; iphi++) {
      const phi = (iphi / N_phi) * 2 * Math.PI + st.t * 0.3 / Math.max(0.5, r);
      const x = r * Math.cos(phi);
      const z = r * Math.sin(phi);
      // Project: inclination tilts about world-x axis. Disk in xy-plane.
      const ys = z * sin_i;
      const xs = x;
      const depth = z * cos_i;          // for sort
      cells.push({ xs, ys, r, phi, depth });
    }
  }
  cells.sort((a, b) => a.depth - b.depth);
  for (const c of cells) {
    const p = w2s(c.xs, c.ys);
    const Rs = rsM();
    // Doppler beaming: factor ~ delta^4. Use Newtonian v + relativistic
    // boost; clamp.
    const D4 = diskDopplerFactor(M_solar(), c.r * Rs, incl, c.phi);
    // Gravitational redshift factor.
    const gz = 1 / (1 + gravRedshift(M_solar(), c.r * Rs));
    const intensity = Math.min(1.5, D4 * gz);
    const huePhase = 1 - Math.min(1, (c.r - r_inner) / (r_outer - r_inner));
    const baseR = 255, baseG = Math.round(140 + 80 * huePhase), baseB = Math.round(60 + 40 * huePhase);
    const alpha = Math.min(0.95, 0.25 + 0.55 * intensity);
    const r_px = 2.2;
    ctx.fillStyle = `rgba(${Math.round(baseR * Math.min(1, intensity))}, ${Math.round(baseG * Math.min(1, intensity))}, ${Math.round(baseB * Math.min(1, intensity))}, ${alpha.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, r_px, 0, Math.PI * 2); ctx.fill();
  }
}

// Photon traces. For Photons mode we shoot a fan of rays.
function drawPhotonsMode() {
  // Use cached traces if parameters are unchanged.
  const Rs = rsM();
  // Shoot 7 rays around the user-selected b for variety: 0.85b to 1.15b.
  const b_target = st.b_rs * Rs;
  const bs = [];
  for (let k = 0; k < 7; k++) {
    const u = -3 + k;       // -3..3
    bs.push(b_target * (1 + 0.12 * u));
  }
  for (const b of bs) {
    const { path, captured } = tracePhoton(M_solar(), b);
    const cls = classifyPhoton(M_solar(), b);
    // Color by classification.
    let color;
    if (cls === 'capture') color = 'rgba(255, 90, 110, 0.85)';
    else if (cls === 'orbit') color = 'rgba(255, 230, 110, 0.95)';
    else color = 'rgba(120, 220, 255, 0.85)';
    ctx.strokeStyle = color;
    ctx.lineWidth = (Math.abs(b - b_target) < 1e-9) ? 2.2 : 1.2;
    ctx.beginPath();
    for (let i = 0; i < path.length; i++) {
      const r = path[i].r / Rs;
      const phi = path[i].phi;
      const x = r * Math.cos(phi);
      const y = r * Math.sin(phi);
      const p = w2s(x, y);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    // Endpoint dot.
    if (path.length) {
      const last = path[path.length - 1];
      const x = (last.r / Rs) * Math.cos(last.phi);
      const y = (last.r / Rs) * Math.sin(last.phi);
      const p = w2s(x, y);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Asymptote arrow on the right.
  const cls = classifyPhoton(M_solar(), b_target);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`b / R_s = ${st.b_rs.toFixed(2)},   b_c = ${bCritRs().toFixed(3)}`, 14, H - 36);
  ctx.fillText(`outcome at chosen b: ${cls.toUpperCase()}`, 14, H - 18);
  // Critical impact parameter dashed line vertical.
  const bc_px = bCritRs() * SCALE_PX_PER_RS;
  ctx.strokeStyle = 'rgba(255, 230, 110, 0.4)';
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CENTER.x + bc_px, 0);
  ctx.lineTo(CENTER.x + bc_px, H);
  ctx.moveTo(CENTER.x - bc_px, 0);
  ctx.lineTo(CENTER.x - bc_px, H);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 230, 110, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('b = +b_c', CENTER.x + bc_px + 6, 14);
  ctx.fillText('b = -b_c', CENTER.x - bc_px - 58, 14);
}

// Lensing mode: a background source at (beta, 0) in theta_E units;
// two images at x_+/-.
function drawLensingMode() {
  // Use angular units: theta_E sets the visual scale.
  // The lens (BH) is at origin. Place source and images as colored
  // dots/arcs.
  const theta_E_px = 4 * SCALE_PX_PER_RS;    // visually adequate.
  const beta_px = st.beta_te * theta_E_px;

  // Background galaxy/source (true, unlensed position).
  ctx.strokeStyle = 'rgba(255, 220, 140, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.arc(CENTER.x, CENTER.y, theta_E_px, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 220, 140, 0.75)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('Einstein-ring (theta_E)', CENTER.x + theta_E_px + 8, CENTER.y - theta_E_px + 4);
  const beta_px_x = CENTER.x + beta_px;
  const beta_px_y = CENTER.y;
  // The source ghost (where it would be without lensing).
  ctx.fillStyle = 'rgba(120, 220, 200, 0.85)';
  ctx.beginPath(); ctx.arc(beta_px_x, beta_px_y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(120, 220, 200, 0.85)';
  ctx.fillText('source (no lens)', beta_px_x + 8, beta_px_y + 4);
  // Two image positions x_+ and x_-.
  const tE = 1.0;    // in units where theta_E = 1, x = beta/2 +/- sqrt(beta^2/4 + 1).
  const beta = st.beta_te;
  const u = Math.sqrt(beta * beta + 4 * tE * tE);
  const x_plus = 0.5 * (beta + u);
  const x_minus = 0.5 * (beta - u);
  const mu = lensMagnification(st.beta_te, 1.0);
  // Draw the two images as crescent arcs around the BH.
  ctx.fillStyle = 'rgba(255, 200, 120, 0.95)';
  ctx.beginPath(); ctx.arc(CENTER.x + x_plus * theta_E_px, CENTER.y, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(CENTER.x + x_minus * theta_E_px, CENTER.y, 7, 0, Math.PI * 2); ctx.fill();
  // Crescent arcs (a hint of the actual image shape for a finite source).
  ctx.strokeStyle = 'rgba(255, 200, 120, 0.75)';
  ctx.lineWidth = 2.0;
  const arcR_p = x_plus * theta_E_px;
  const arcR_m = -x_minus * theta_E_px;
  const arcSpan = 0.6 + 0.4 / (Math.abs(beta) + 0.1);
  ctx.beginPath();
  ctx.arc(CENTER.x, CENTER.y, arcR_p, -arcSpan * 0.5, arcSpan * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(CENTER.x, CENTER.y, arcR_m, Math.PI - arcSpan * 0.5, Math.PI + arcSpan * 0.5);
  ctx.stroke();
  // Readout.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`beta / theta_E = ${st.beta_te.toFixed(2)}`, 14, H - 50);
  ctx.fillText(`x_+ = ${x_plus.toFixed(2)} theta_E,  x_- = ${x_minus.toFixed(2)} theta_E`, 14, H - 32);
  ctx.fillText(`magnification mu = ${mu.toFixed(2)}`, 14, H - 14);
}

// Frame-drag mode: draws the ergosphere as a flattened shape and the
// retreating ISCO with a precessing test orbit.
function drawFrameDragMode() {
  // Already draws ergosphere + ISCO via toggles; here force them on.
  if (!st.flags.ergo) {
    // Temporarily push.
    const saved = st.flags.ergo;
    st.flags.ergo = true;
    drawErgo();
    st.flags.ergo = saved;
  }
  // Lense-Thirring precession indicator: a test orbit at r = 2.5 R_s
  // precesses with rate Omega_LT = 2 J / (c^2 r^3). We draw the orbit
  // and a small arrow showing the precession direction.
  const r_orbit_rs = Math.max(rIscoRs() * 1.2, 2.0);
  const r_px = r_orbit_rs * SCALE_PX_PER_RS;
  const flatten = Math.cos(st.incl * DEG);
  // The orbit precesses; precession rate proportional to chi.
  const prec_angle = st.t * 0.4 * st.chi;
  ctx.strokeStyle = 'rgba(140, 240, 200, 0.7)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.save();
  ctx.translate(CENTER.x, CENTER.y);
  ctx.rotate(prec_angle);
  ctx.ellipse(0, 0, r_px, r_px * flatten, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Test particle dot.
  const phi = st.t * (1.5 / Math.pow(r_orbit_rs, 1.5));
  const px = r_px * Math.cos(phi);
  const py = r_px * flatten * Math.sin(phi);
  ctx.fillStyle = 'rgba(255, 255, 240, 1)';
  ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Annotations.
  ctx.fillStyle = 'rgba(140, 240, 200, 0.85)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`Lense-Thirring orbit at r = ${r_orbit_rs.toFixed(1)} R_s`, 14, H - 50);
  ctx.fillText(`prograde ISCO = ${rIscoRs().toFixed(2)} R_s (chi = ${st.chi.toFixed(2)})`, 14, H - 32);
  ctx.fillText(`outer horizon r_+ = ${rHorizonRs().toFixed(2)} R_s`, 14, H - 14);
}

// Spacetime mode: Flamm-paraboloid embedding diagram of the spatial
// slice. z = 2 sqrt(R_s (r - R_s)) for r > R_s.
function drawSpacetimeMode() {
  const N_r = 30, N_phi = 60;
  const r_min = 1.001, r_max = 6.0;       // R_s units
  const cellsByDepth = [];
  // For each (r, phi) compute the embedding z = 2 sqrt(R_s(r - R_s)).
  // Visualize as a 3D wireframe rotated into perspective.
  const tilt = (90 - st.incl) * DEG;
  const cT = Math.cos(tilt), sT = Math.sin(tilt);
  // Vertex grid.
  const grid = [];
  for (let ir = 0; ir < N_r; ir++) {
    const u = ir / (N_r - 1);
    const r = r_min + (r_max - r_min) * u;
    const z = 2 * Math.sqrt(Math.max(0, r - 1));     // in R_s units; R_s = 1
    const row = [];
    for (let iphi = 0; iphi < N_phi; iphi++) {
      const phi = (iphi / N_phi) * 2 * Math.PI;
      const x = r * Math.cos(phi);
      const y = r * Math.sin(phi);
      // Rotate about x-axis by tilt: (x, y_rot, z_rot)
      // where y_rot = y * cT - (-z) * sT (the throat goes "into" the
      // page; we flip z so deeper = down).
      const yRot = y * cT + (z) * sT;
      const depth = -y * sT + z * cT;
      row.push({ x, y: yRot, depth, r, phi });
    }
    grid.push(row);
  }
  // Project.
  const proj = grid.map(row => row.map(p => {
    const k = 1 / (1 + p.depth / 12);
    return { x: CENTER.x + p.x * SCALE_PX_PER_RS * k, y: CENTER.y - p.y * SCALE_PX_PER_RS * k, depth: p.depth };
  }));
  // Draw wireframe (azimuthal lines + radial lines).
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.55)';
  ctx.lineWidth = 1.0;
  for (let ir = 0; ir < N_r; ir++) {
    ctx.beginPath();
    for (let iphi = 0; iphi < N_phi; iphi++) {
      const p = proj[ir][iphi];
      if (iphi === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  for (let iphi = 0; iphi < N_phi; iphi += 4) {
    ctx.beginPath();
    for (let ir = 0; ir < N_r; ir++) {
      const p = proj[ir][iphi];
      if (ir === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  // BH at center (throat).
  ctx.fillStyle = 'rgba(0, 0, 0, 1)';
  ctx.beginPath(); ctx.arc(CENTER.x, CENTER.y, SCALE_PX_PER_RS * 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 180, 100, 0.7)';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(CENTER.x, CENTER.y, SCALE_PX_PER_RS * 0.7, 0, Math.PI * 2); ctx.stroke();
  // Annotations.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Flamm embedding: z = 2 sqrt(R_s (r - R_s))', 14, H - 32);
  ctx.fillText('the depression is the spatial geometry, not a "well" in space', 14, H - 14);
}

function drawSidePanel() {
  // Mode-specific info panel on the right.
  const x = 0.78 * W, y = 30, w = W - x - 14, h = H - 60;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('BH diagnostics', x + 8, y - 6);

  let yy = y + 24;
  const row = (k, v, c = '#e0e8ff') => {
    ctx.fillStyle = 'rgba(180, 190, 215, 0.85)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(k, x + 10, yy);
    ctx.fillStyle = c;
    ctx.font = '12px ui-monospace, monospace';
    ctx.fillText(v, x + 10, yy + 14);
    yy += 32;
  };
  const M = M_solar();
  row('mass M (M_sun)', M.toExponential(2));
  row('spin chi = a/M', st.chi.toFixed(2));
  row('R_s (km)', rsKm(M).toExponential(2));
  row('r_+ / R_s', rHorizonRs().toFixed(3));
  row('r_ph (Schw) / R_s', '1.500');
  row('r_ISCO / R_s', rIscoRs().toFixed(3));
  row('b_c / R_s', bCritRs().toFixed(3));
  row('T_H (K)', hawkingTemperature_K(M).toExponential(2));
  row('mode', st.mode, '#ffd28a');
}

function drawModeTab() {
  // Top-left mode header.
  ctx.fillStyle = 'rgba(20, 28, 44, 0.85)';
  ctx.fillRect(10, 8, 260, 26);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.40)';
  ctx.lineWidth = 1;
  ctx.strokeRect(10.5, 8.5, 259, 25);
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  const labels = {
    overview: 'OVERVIEW  (disk + horizon + ISCO)',
    photons: 'PHOTONS  (impact-parameter scan)',
    lensing: 'LENSING  (Einstein ring)',
    framedrag: 'FRAME DRAG  (Kerr ergosphere)',
    spacetime: 'SPACETIME  (Flamm embedding)',
  };
  ctx.fillText(labels[st.mode] || st.mode, 20, 26);
}

function updateReadout() {
  rM.textContent = `1e${st.logM.toFixed(1)}`;
  rChi.textContent = st.chi.toFixed(2);
  rRs.textContent = rsKm(M_solar()).toExponential(2) + ' km';
  rIsco.textContent = rIscoRs().toFixed(3);
  rMode.textContent = st.mode;
}

function draw() {
  drawSky();
  drawCoordinateGrid();
  // Mode-specific main content.
  if (st.mode === 'overview') {
    drawAccretionDisk();
    drawErgo();
    drawHorizon();
    drawPhotonSphere();
    drawISCO();
  } else if (st.mode === 'photons') {
    drawPhotonSphere();
    drawHorizon();
    if (st.flags.traces) drawPhotonsMode();
  } else if (st.mode === 'lensing') {
    drawHorizon();
    drawLensingMode();
  } else if (st.mode === 'framedrag') {
    drawErgo();
    drawHorizon();
    drawPhotonSphere();
    drawISCO();
    drawFrameDragMode();
  } else if (st.mode === 'spacetime') {
    drawSpacetimeMode();
    drawHorizon();
  }
  drawSidePanel();
  drawModeTab();
  updateReadout();
}

function readSliders() {
  st.mode = selMode.value;
  st.logM = parseFloat(sLogM.value);
  st.chi = parseFloat(sChi.value);
  st.incl = parseFloat(sIncl.value);
  st.b_rs = parseFloat(sB.value);
  st.beta_te = parseFloat(sBeta.value);
  st.flags.horizon = tHorizon.checked;
  st.flags.photonsphere = tPhotonsphere.checked;
  st.flags.isco = tIsco.checked;
  st.flags.ergo = tErgo.checked;
  st.flags.grid = tGrid.checked;
  st.flags.traces = tTraces.checked;
  vMode.textContent = st.mode.slice(0, 5);
  vLogM.textContent = st.logM.toFixed(1);
  vChi.textContent = st.chi.toFixed(2);
  vIncl.textContent = String(st.incl);
  vB.textContent = st.b_rs.toFixed(2);
  vBeta.textContent = st.beta_te.toFixed(2);
}

[selMode, sLogM, sChi, sIncl, sB, sBeta].forEach(el => el.addEventListener('input', readSliders));
[tHorizon, tPhotonsphere, tIsco, tErgo, tGrid, tTraces].forEach(el => el.addEventListener('change', readSliders));
btnReset.addEventListener('click', () => { st.t = 0; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  mass_solar: { get: () => st.logM, set: v => { st.logM = parseFloat(v); sLogM.value = v; }, parse: parseFloat },
  spin_chi: { get: () => st.chi, set: v => { st.chi = parseFloat(v); sChi.value = v; }, parse: parseFloat },
  mode: { get: () => st.mode, set: v => { st.mode = v; selMode.value = v; }, parse: x => x },
  inclination_deg: { get: () => st.incl, set: v => { st.incl = parseFloat(v); sIncl.value = v; }, parse: parseFloat },
  impact_b_rs: { get: () => st.b_rs, set: v => { st.b_rs = parseFloat(v); sB.value = v; }, parse: parseFloat },
  source_beta_arcsec: { get: () => st.beta_te, set: v => { st.beta_te = parseFloat(v); sBeta.value = v; }, parse: parseFloat },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

// Map CAPTURE_FRAC to different modes for the 5-frame golden:
//   0.00 -> overview, 0.25 -> photons, 0.50 -> lensing,
//   0.75 -> framedrag, 1.00 -> spacetime.
function captureModeForFraction(f) {
  if (f < 0.1) return 'overview';
  if (f < 0.35) return 'photons';
  if (f < 0.6) return 'lensing';
  if (f < 0.85) return 'framedrag';
  return 'spacetime';
}

if (CAPTURE_NAME) {
  st.mode = captureModeForFraction(CAPTURE_FRAC || 0);
  selMode.value = st.mode;
  if (st.mode === 'framedrag') { st.chi = 0.9; sChi.value = '0.9'; readSliders(); }
  st.t = (CAPTURE_FRAC || 0) * 4;
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) st.t += dt;
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}
