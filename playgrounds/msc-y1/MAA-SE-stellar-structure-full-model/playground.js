// Eddington standard model (n = 3 polytrope). Panel A: a pseudo-3D
// sliced star, the burning core, radiative and convective zones and the
// photosphere, temperature-coloured. Panel B: the run of T, rho, P and
// L. Panel C: the pp / CNO / triple-alpha energy generation and the HR
// position on the ZAMS. Gate-tested sim.js; deterministic. Carroll and
// Ostlie Ch. 10; Hansen and Kawaler; Chandrasekhar 1939.
import {
  stellarModel, zamsTrack, zamsPoint, MSUN, RSUN, LSUN,
  epsPP, epsCNO, epsTriAlpha,
} from './sim.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rM = document.getElementById('readout-m');
const rTc = document.getElementById('readout-tc');
const rPc = document.getElementById('readout-pc');
const rL = document.getElementById('readout-l');
const slM = document.getElementById('slider-m'), vM = document.getElementById('value-m');
const slX = document.getElementById('slider-x'), vX = document.getElementById('value-x');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const DEF_M = 0, DEF_X = 70;
const TOUR_LO = -52, TOUR_HI = 118;        // main-sequence tour: 0.30 -> 15 Msun
const st = { mRaw: DEF_M, xRaw: DEF_X, running: true, ph: 0, model: null, tour: true, frame: 0 };
const massMsun = () => Math.pow(10, st.mRaw / 100);
const Xfrac = () => st.xRaw / 100;

function rebuild() {
  const Mr = massMsun(), X = Xfrac(), Z = 0.02, Y = Math.max(0.02, 1 - X - Z);
  st.model = stellarModel({ M: Mr * MSUN, R: Math.pow(Mr, 0.7) * RSUN, X, Y, nShell: 360 });
}

// Blackbody-like heat ramp: a star reads as glowing, hot core white,
// cool outer layers deep red. viridis (purple-green-yellow) made the
// temperature structure imperceptible and unphysical here.
const HEAT = [
  [0.00, [60, 8, 6]], [0.25, [150, 26, 10]], [0.45, [224, 70, 16]],
  [0.65, [255, 142, 38]], [0.82, [255, 214, 120]], [1.00, [240, 244, 255]],
];
function vcol(t, a = 1) {
  const u = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < HEAT.length - 2 && u > HEAT[i + 1][0]) i += 1;
  const [t0, c0] = HEAT[i], [t1, c1] = HEAT[i + 1];
  const f = (u - t0) / (t1 - t0 || 1);
  const r = c0[0] + (c1[0] - c0[0]) * f;
  const g = c0[1] + (c1[1] - c0[1]) * f;
  const b = c0[2] + (c1[2] - c0[2]) * f;
  return `rgba(${r | 0},${g | 0},${b | 0},${a})`;
}
function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px monospace';
  ctx.fillText(title, x + 8, y + 14);
}

function zoneOf(m, i) {
  const n = m.r.length - 1;
  if (i >= n - Math.round(n * 0.018)) return 3;          // photosphere skin
  if (m.conv[i]) return 2;                                // convective
  if (m.Lr[i] < 0.985 * m.Ltot) return 0;                 // energy-generating core
  return 1;                                               // radiative
}
const ZONE = [
  ['burning core', '#ffd166'],
  ['radiative', '#6fb4ff'],
  ['convective', '#ff9d6f'],
  ['photosphere', '#e8eefc'],
];

function drawStar(x, y, w, h) {
  const m = st.model;
  panel(x, y, w, h, `sliced star: ${massMsun().toFixed(2)} Msun, R = ${(m.R / RSUN).toFixed(2)} Rsun`);
  const cx = x + w / 2, cy = y + h / 2 + 6, Rpx = Math.min(w, h) / 2 - 42;
  const n = m.r.length - 1;
  const Tc = m.Tc, Ts = Math.max(m.T[n - 2], 1);
  // draw from outside in as filled discs, temperature-coloured, with a
  // limb-darkening alpha; mark zones by an overlay tint
  for (let i = n; i >= 1; i -= 2) {
    const rr = (m.r[i] / m.R) * Rpx;
    const tT = (Math.log10(Math.max(m.T[i], Ts)) - Math.log10(Ts)) / (Math.log10(Tc) - Math.log10(Ts) || 1);
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 2 * Math.PI);
    ctx.fillStyle = vcol(tT, 1); ctx.fill();
  }
  // convective bubbling overlay
  for (let i = n; i >= 1; i -= 1) {
    if (!m.conv[i]) continue;
    const rr = (m.r[i] / m.R) * Rpx;
    if (i % 6 === 0) {
      const a = (i * 0.7 + st.ph * 6.283) % 6.283;
      ctx.strokeStyle = 'rgba(255,180,120,0.30)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 0; k <= 24; k += 1) {
        const ang = 2 * Math.PI * k / 24;
        const wob = rr + 3 * Math.sin(5 * ang + a);
        const px = cx + wob * Math.cos(ang), py = cy + wob * Math.sin(ang);
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }
  // limb shading for a spherical look
  const g = ctx.createRadialGradient(cx - Rpx * 0.3, cy - Rpx * 0.3, Rpx * 0.1, cx, cy, Rpx);
  g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(0.7, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, Rpx, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, Rpx, 0, 2 * Math.PI); ctx.stroke();
  // zone ring markers (radii where the zone changes)
  let prev = -1;
  for (let i = 1; i <= n; i += 1) {
    const z = zoneOf(m, i);
    if (z !== prev && prev !== -1) {
      const rr = (m.r[i] / m.R) * Rpx;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
    }
    prev = z;
  }
  // legend (only zones that occur)
  const present = new Set(); for (let i = 1; i <= n; i += 1) present.add(zoneOf(m, i));
  let ly = y + h - 10;
  ctx.font = '10px monospace';
  let lx = x + 10;
  for (let z = 0; z < 4; z += 1) {
    if (!present.has(z)) continue;
    ctx.fillStyle = ZONE[z][1]; ctx.fillRect(lx, ly - 9, 10, 9);
    ctx.fillStyle = 'rgba(220,228,245,0.8)'; ctx.fillText(ZONE[z][0], lx + 14, ly);
    lx += 14 + ZONE[z][0].length * 6 + 12;
  }
}

function drawProfiles(x, y, w, h) {
  panel(x, y, w, h, 'structure: T, rho, P, L vs r/R (each normalised to its peak)');
  const m = st.model, n = m.r.length - 1;
  const px = x + 30, py = y + 24, pw = w - 42, ph = h - 50;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
  const series = [
    ['T', m.T, m.Tc, '#ff9d6f'],
    ['rho', m.rho, m.rhoC, '#6fb4ff'],
    ['P', m.P, m.Pc, '#9be8b0'],
    ['L', m.Lr, m.Ltot || 1, '#ffd166'],
  ];
  for (const [, arr, norm, col] of series) {
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= n; i += 1) {
      const xx = px + pw * (m.r[i] / m.R);
      const yy = py + ph * (1 - Math.max(0, Math.min(1, arr[i] / norm)));
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(10,11,16,0.85)'; ctx.fillRect(px + 2, py + 2, 150, 16);
  let lx = px + 6;
  for (const [name, , , col] of series) {
    ctx.fillStyle = col; ctx.fillText(name, lx, py + 13); lx += name.length * 7 + 16;
  }
  ctx.fillStyle = 'rgba(200,210,235,0.6)';
  ctx.fillText('0', px - 4, py + ph + 14); ctx.fillText('r/R', px + pw / 2 - 8, py + ph + 14); ctx.fillText('1', px + pw - 6, py + ph + 14);
}

function drawEpsHR(x, y, w, h) {
  panel(x, y, w, h, 'energy generation eps(r) and the HR / ZAMS position');
  const m = st.model, n = m.r.length - 1;
  // left: eps pp/CNO/3a, log-y normalised
  const ax = x + 32, ay = y + 24, aw = w * 0.46, ah = h - 50;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(ax, ay, aw, ah);
  let emax = 1e-30;
  for (let i = 0; i <= n; i += 1) emax = Math.max(emax, m.eps[i]);
  const logMax = Math.log10(emax), span = 12;
  const Ye = (e) => ay + ah * (1 - Math.max(0, Math.min(1, (Math.log10(Math.max(e, 1e-40)) - (logMax - span)) / span)));
  const comps = [
    ['pp', (i) => epsParts(m, i).pp, '#ffd166'],
    ['CNO', (i) => epsParts(m, i).cno, '#ff6f9d'],
    ['3a', (i) => epsParts(m, i).tri, '#9b6fff'],
  ];
  for (const [, fn, col] of comps) {
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
    let started = false;
    for (let i = 0; i <= n; i += 1) {
      const v = fn(i); if (v <= 0) { continue; }
      const xx = ax + aw * (m.r[i] / m.R), yy = Ye(v);
      if (!started) { ctx.moveTo(xx, yy); started = true; } else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(10,11,16,0.85)'; ctx.fillRect(ax + 2, ay + 2, 96, 16);
  let lx = ax + 6;
  for (const [name, , col] of comps) { ctx.fillStyle = col; ctx.fillText(name, lx, ay + 13); lx += name.length * 7 + 14; }
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.fillText('eps(r), log', ax + 4, ay + ah - 6);
  ctx.fillText('r/R', ax + aw / 2 - 8, ay + ah + 14);
  // right: HR diagram, Teff reversed, log L
  const hx = x + w * 0.54, hy = y + 24, hw = w * 0.42, hh = h - 50;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(hx, hy, hw, hh);
  const track = zamsTrack(80);
  const tMin = 3.5, tMax = 4.7;                            // log Teff
  const lMin = -2, lMax = 6;                               // log L/Lsun
  // Clamp to the panel: at the high-mass end of the tour the ZAMS
  // point/track would otherwise leave the box (the curve "escaping
  // the plot limits" the user reported).
  const HX = (lt) => Math.max(hx, Math.min(hx + hw, hx + hw * (tMax - lt) / (tMax - tMin)));
  const HY = (ll) => Math.max(hy, Math.min(hy + hh, hy + hh * (1 - (ll - lMin) / (lMax - lMin))));
  ctx.strokeStyle = '#7fd6a0'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < track.length; i += 1) {
    const xx = HX(Math.log10(track[i].Teff)), yy = HY(Math.log10(track[i].L));
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  const zp = zamsPoint(massMsun());
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(HX(Math.log10(zp.Teff)), HY(Math.log10(zp.L)), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = '10px monospace';
  ctx.fillText('ZAMS', hx + 6, hy + 12);
  ctx.fillText('hot  <- log Teff', hx + 4, hy + hh + 14);
  ctx.save(); ctx.translate(hx - 4, hy + hh / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('log L/Lsun', -28, 0); ctx.restore();
}

// recompute the three eps components at shell i from the model state
function epsParts(m, i) {
  return {
    pp: epsPP(m.rho[i], m.T[i], m.X),
    cno: epsCNO(m.rho[i], m.T[i], m.X, m.Z),
    tri: epsTriAlpha(m.rho[i], m.T[i], m.Y),
  };
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const m = st.model;
  const half = (W - 52) / 2;
  drawStar(20, 20, half, H - 34);
  drawProfiles(20 + half + 12, 20, half, (H - 46) / 2);
  drawEpsHR(20 + half + 12, 20 + (H - 46) / 2 + 6, half, (H - 46) / 2);
  rM.textContent = `${massMsun().toFixed(2)} Msun`;
  rTc.textContent = `${m.Tc.toExponential(2)} K`;
  rPc.textContent = `${m.Pc.toExponential(1)} Pa`;
  rL.textContent = `${(m.Ltot / LSUN).toExponential(2)} Lsun`;
}

function tick() {
  if (st.running) {
    st.ph = (st.ph + 1 / 360) % 1;
    if (st.tour) {
      // Slow automatic tour up and down the main sequence so the model
      // is perceptibly alive on load. The mass slider takes over the
      // moment the user drags it (st.tour := false). The model rebuild
      // is throttled to hold 60 fps; draw() still runs every frame.
      st.frame = (st.frame + 1) % 600;
      if (st.frame % 6 === 0) {
        const u = 0.5 - 0.5 * Math.cos(st.ph * 2 * Math.PI);
        const mRaw = Math.round(TOUR_LO + (TOUR_HI - TOUR_LO) * u);
        if (mRaw !== st.mRaw) { st.mRaw = mRaw; slM.value = String(mRaw); rebuild(); sync(); }
      }
    }
  }
  draw();
  requestAnimationFrame(tick);
}

function sync() { vM.textContent = massMsun().toFixed(2); vX.textContent = Xfrac().toFixed(2); }
slM.addEventListener('input', () => { st.tour = false; st.mRaw = parseInt(slM.value, 10); rebuild(); sync(); draw(); });
slX.addEventListener('input', () => { st.xRaw = parseInt(slX.value, 10); rebuild(); sync(); draw(); });
bR.addEventListener('click', () => {
  st.mRaw = DEF_M; st.xRaw = DEF_X; st.running = true; st.tour = true; st.frame = 0; rebuild();
  slM.value = String(DEF_M); slX.value = String(DEF_X);
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); sync(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { m: String(st.mRaw), x: String(st.xRaw) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.m) { st.mRaw = parseInt(s.m, 10); slM.value = s.m; }
  if (s.x) { st.xRaw = parseInt(s.x, 10); slX.value = s.x; }
}

function boot() {
  restoreState(); rebuild();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  sync();
  if (CAPTURE_NAME) {
    // Sweep the stellar mass across the five frames (0.30 -> 15 Msun),
    // the controlling parameter of stellar structure. Each frame is the
    // correct model for that mass, so the sliced star, the T/rho/P/L
    // profiles, the convective/radiative zoning, the pp/CNO/3-alpha
    // balance and the HR/ZAMS position all change. The default 1 Msun
    // model has almost no convective shells, so the old st.ph-only
    // capture produced five byte-identical frames.
    const fr = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.tour = false;
    st.mRaw = Math.round(TOUR_LO + (TOUR_HI - TOUR_LO) * fr);
    slM.value = String(st.mRaw);
    st.ph = fr; rebuild(); sync(); draw();
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
