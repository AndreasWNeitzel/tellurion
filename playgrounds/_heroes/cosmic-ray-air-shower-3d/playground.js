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
  running: !prefersReducedMotion(),
  rng: makeRng(0xC0FFEE),
  particles: [],
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
  ctx.font = '10px ui-monospace, monospace';
  for (let h = 0; h <= ALT_TOP_KM; h += 5) {
    const y = altToScreenY(h);
    ctx.fillText(`${h} km`, 6, y + 3);
    ctx.fillStyle = 'rgba(220, 230, 255, 0.15)';
    ctx.fillRect(35, y, SCENE.w - 50, 1);
    ctx.fillStyle = 'rgba(220, 230, 255, 0.55)';
  }
}

function drawCascade() {
  // Sample particles from the Gaisser-Hillas profile + a Heitler-like
  // multiplication tree. We render points whose density follows N(X)
  // and whose horizontal spread grows with sqrt(X / X_max).
  const cx = SCENE.x + SCENE.w / 2;
  const Xmax_v = Xmax();
  const Nmax_v = Nmax();
  const X1 = LAMBDA_I;
  // Sample 2500 particles, x-position distributed Gaussian about the
  // shower axis with width sigma ~ Moliere radius (~78 m at sea level,
  // 200 m at 5 km, etc. We just use a depth-dependent width).
  const N_PART = 2500;
  const maxDepth = 1030 * st.depth;     // up to sea level
  for (let i = 0; i < N_PART; i++) {
    // Pick a depth from G-H distribution by inverse-CDF approx (use
    // rejection on a uniform sample).
    let X = 0;
    for (let trial = 0; trial < 30; trial++) {
      const u = st.rng() * maxDepth;
      const gh = gaisserHillas(u, 1, Xmax_v, X1);
      if (st.rng() < gh) {
        X = u;
        break;
      }
    }
    if (X <= 0) continue;
    const h_km = altitudeAtDepth_km(X);
    const y = altToScreenY(h_km);
    // x-spread.
    const sigma_x = 10 + 80 * Math.sqrt(X / Math.max(1, maxDepth));
    const dx = (st.rng() - 0.5) * 2 * sigma_x;
    // Species: rough split. EM = 80%, hadronic = 10%, muons = 10%.
    const r = st.rng();
    let col;
    if (r < 0.80) col = 'rgba(120, 220, 255, 0.65)';     // EM
    else if (r < 0.90) col = 'rgba(255, 130, 110, 0.75)'; // hadronic
    else col = 'rgba(255, 230, 120, 0.85)';               // muon
    ctx.fillStyle = col;
    ctx.fillRect(cx + dx - 0.7, y - 0.7, 1.4, 1.4);
  }
  // Primary ray (yellow streak from top down to first interaction).
  const X1_y = altToScreenY(altitudeAtDepth_km(X1));
  ctx.strokeStyle = 'rgba(255, 255, 220, 0.85)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(cx, altToScreenY(ALT_TOP_KM));
  ctx.lineTo(cx, X1_y);
  ctx.stroke();
  // First-interaction marker.
  ctx.fillStyle = 'rgba(255, 255, 220, 0.95)';
  ctx.beginPath(); ctx.arc(cx, X1_y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`first interaction X_1 = ${X1.toFixed(0)} g cm^-2`, cx + 10, X1_y + 4);
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
  ctx.fillText(`X_max = ${Xmax_v.toFixed(0)} g cm^-2`, 50, Xmax_y - 6);
  // Labels.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`primary ${st.primary}, E_0 = 10^${st.logE.toFixed(1)} eV`, 50, 24);
}

function drawProfile() {
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(PROF.x, PROF.y, PROF.w, PROF.h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(PROF.x + 0.5, PROF.y + 0.5, PROF.w - 1, PROF.h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = 'bold 13px system-ui, sans-serif';
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
  ctx.font = '11px ui-monospace, monospace';
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
  ctx.font = '11px ui-monospace, monospace';
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
    ctx.font = '11px ui-monospace, monospace';
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

[selPrim, sLogE, sDepth, sSpeed].forEach(el => el.addEventListener('input', readSliders));
selPrim.addEventListener('change', readSliders);
btnReset.addEventListener('click', () => { st.rng = makeRng(0xC0FFEE); });
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
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) st.t += dt;
    // Re-seed RNG each frame so particles look "live" rather than static.
    st.rng = makeRng((st.t * 1000) | 0);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}
