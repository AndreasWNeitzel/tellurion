// Stellar-interior visualization of the g-mode period spacing. The
// left half of the canvas renders a vertical cross-section of an
// evolved star with the radial WKB displacement xi_n(r) modulated by
// the dipole/quadrupole angular factor and the time-harmonic cos(omega
// t). The right side shows the Brunt-Vaisala N(r) profile that sets
// the cavity, and the resulting period comb. See sim.js for the
// closed-form WKB construction and references.
import { PROFILES, brunt, phaseIntegral, pi1FromProfile, Pi_l, evolutionStage, modeProfileArray } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rPi = document.getElementById('readout-pi');
const rS = document.getElementById('readout-s');
const rPn = document.getElementById('readout-pn');
const selProfile = document.getElementById('select-profile');
const selL = document.getElementById('select-l');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const vProfile = document.getElementById('value-profile');
const vL = document.getElementById('value-l');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const NR = 240;
const st = { profile: 'rgb', l: 1, n: 14, speed: 1, running: !prefersReducedMotion(), t: 0, modeArr: null, Pi1: 80, P_n: 1500 };

// Diverging red-blue colormap for the displacement amplitude in [-1, 1].
// Negative side cool, positive side warm, midpoint a near-black so the
// nodal surfaces read as dark contour lines rather than washed gray.
function divergingRB(v) {
  const x = Math.max(-1, Math.min(1, v));
  if (x >= 0) {
    const t = x;
    return { r: Math.round(20 + 220 * t), g: Math.round(28 + 50 * t), b: Math.round(40 + 30 * t) };
  } else {
    const t = -x;
    return { r: Math.round(28 + 30 * t), g: Math.round(40 + 90 * t), b: Math.round(60 + 190 * t) };
  }
}

function recompute() {
  const p = PROFILES[st.profile];
  st.modeArr = modeProfileArray(p, st.n, NR);
  const Pi_0 = pi1FromProfile(p) * Math.sqrt(2);      // recover Pi_0 from Pi_1
  st.Pi1 = Pi_l(Pi_0, st.l === 1 ? 1 : 2);
  st.P_n = (st.n + 0.5) * st.Pi1;
  st.t = 0;
}

function sampleMode(r) {
  // Linear interp into the precomputed xi_n grid.
  if (r >= 1) return 0;
  const idx = r * NR;
  const i0 = Math.floor(idx), i1 = Math.min(NR, i0 + 1);
  const a = idx - i0;
  return (1 - a) * st.modeArr[i0] + a * st.modeArr[i1];
}

// Legendre P_l(cos theta) evaluated by direct formula for l = 1, 2.
function P_l(cosTheta, l) {
  if (l === 1) return cosTheta;
  return 0.5 * (3 * cosTheta * cosTheta - 1);
}

function drawCrossSection(ox, oy, R) {
  // Render a vertical-plane cross-section of the star. The "depth into
  // the page" axis is collapsed; what we draw is the (r, theta) slice
  // at one azimuth. Pixels outside the disk are left as the background.
  const t = st.t;
  const cosWt = Math.cos(t);
  const px = Math.floor(R);
  const img = ctx.getImageData(ox - px, oy - px, 2 * px, 2 * px);
  const data = img.data;
  const w = 2 * px;
  const p = PROFILES[st.profile];
  for (let yy = 0; yy < w; yy += 1) {
    for (let xx = 0; xx < w; xx += 1) {
      const dx = xx - px, dy = yy - px;
      const rr = Math.hypot(dx, dy);
      const idx = (yy * w + xx) * 4;
      if (rr >= px - 0.5) continue;          // outside the disk
      const rNorm = rr / px;
      const cosTheta = dy === 0 && dx === 0 ? 0 : (-dy) / rr;   // +y is "up"
      // Background star color from a simple T(r) gradient: hot core,
      // cool envelope (just a static tint, the displacement layers
      // on top via the diverging colormap).
      // Convective core gets a slightly orange tint; radiative tints to
      // yellow-white; envelope tints to deep red.
      const Nloc = brunt(rNorm, p);
      let bgR, bgG, bgB;
      if (rNorm < p.r_cc) { bgR = 60; bgG = 38; bgB = 22; }
      else if (Nloc > 0.01) { bgR = 40 + Math.round(20 * Nloc / 8); bgG = 32; bgB = 26; }
      else { bgR = 55; bgG = 22; bgB = 18; }
      // Where the BV cavity exists, render the displacement. The
      // threshold is set low so the colormap fills the visible cavity
      // (not just the BV peak), and the WKB envelope is clipped near
      // zero to avoid the 1/sqrt(N) singularity.
      if (Nloc > 0.005) {
        const xi = sampleMode(rNorm);
        const ang = P_l(cosTheta, st.l);
        const amp = xi * ang * cosWt;
        const col = divergingRB(amp);
        // Blend: cavity displacement dominates by 80%, hot interior
        // tint shows through faintly so the photosphere reads as a
        // continuous body.
        data[idx]     = Math.round(0.85 * col.r + 0.15 * bgR);
        data[idx + 1] = Math.round(0.85 * col.g + 0.15 * bgG);
        data[idx + 2] = Math.round(0.85 * col.b + 0.15 * bgB);
        data[idx + 3] = 255;
      } else {
        data[idx]     = bgR;
        data[idx + 1] = bgG;
        data[idx + 2] = bgB;
        data[idx + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, ox - px, oy - px);

  // Outline the photosphere (smooth circle on top of the pixel disk).
  ctx.strokeStyle = 'rgba(255,210,160,0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(ox, oy, R, 0, Math.PI * 2); ctx.stroke();

  // Outline the g-mode cavity inner and outer turning radii.
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.55)';
  ctx.setLineDash([4, 3]); ctx.lineWidth = 1.0;
  ctx.beginPath(); ctx.arc(ox, oy, R * p.r_env, 0, Math.PI * 2); ctx.stroke();
  if (p.r_cc > 0) { ctx.beginPath(); ctx.arc(ox, oy, R * p.r_cc, 0, Math.PI * 2); ctx.stroke(); }
  ctx.setLineDash([]);

  // Labels.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('photosphere', ox + R + 4, oy - R + 6);
  ctx.fillStyle = 'rgba(120,200,255,0.75)';
  ctx.fillText('g-mode cavity', ox + R + 4, oy - R + 20);
  if (p.r_cc > 0) ctx.fillText('conv. core (N=0)', ox + R + 4, oy - R + 34);
}

function drawBruntPanel(x0, y0, w, h) {
  const p = PROFILES[st.profile];
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);

  // Axes.
  const pad = { l: 36, r: 8, t: 18, b: 22 };
  const ax = x0 + pad.l, ay = y0 + pad.t;
  const aw = w - pad.l - pad.r, ah = h - pad.t - pad.b;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + ah); ctx.lineTo(ax + aw, ay + ah); ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'right';
  ctx.fillText('8', ax - 4, ay + 8);
  ctx.fillText('0', ax - 4, ay + ah);
  ctx.textAlign = 'left';
  ctx.fillText('r/R*', ax + aw - 24, ay + ah + 14);
  ctx.fillText('N(r)', ax - 32, ay - 4);

  // Cavity shading.
  ctx.fillStyle = 'rgba(120,200,255,0.10)';
  const xCC = ax + p.r_cc * aw;
  const xEnv = ax + p.r_env * aw;
  ctx.fillRect(xCC, ay, xEnv - xCC, ah);

  // N(r) curve.
  ctx.strokeStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const r = i / 200;
    const N = brunt(r, p);
    const px = ax + r * aw;
    const py = ay + ah - (N / 8) * ah;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Highlight the current mode's radial nodes as small ticks along the
  // bottom: count of ticks visually matches n.
  const arr = st.modeArr;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  let prev = arr[1];
  for (let i = 2; i <= NR; i += 1) {
    const cur = arr[i];
    if (prev * cur < 0) {
      const r = i / NR;
      const px = ax + r * aw;
      ctx.beginPath();
      ctx.moveTo(px, ay + ah - 4);
      ctx.lineTo(px, ay + ah + 0);
      ctx.stroke();
    }
    prev = cur;
  }
}

function drawCombPanel(x0, y0, w, h) {
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);

  const pad = { l: 28, r: 8, t: 18, b: 22 };
  const ax = x0 + pad.l, ay = y0 + pad.t;
  const aw = w - pad.l - pad.r, ah = h - pad.t - pad.b;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.moveTo(ax, ay + ah); ctx.lineTo(ax + aw, ay + ah); ctx.stroke();

  // Comb spans 2 P_n centered on the current mode.
  const Pmin = Math.max(0, st.P_n - 1.0 * st.Pi1 * 8);
  const Pmax = st.P_n + 1.0 * st.Pi1 * 8;
  const xToPx = (P) => ax + (P - Pmin) / (Pmax - Pmin) * aw;

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`P (s),  Π_${st.l} = ${st.Pi1.toFixed(1)}`, ax, ay - 4);

  // Tick marks at every 100 s.
  for (let P = Math.ceil(Pmin / 100) * 100; P <= Pmax; P += 100) {
    const px = xToPx(P);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.moveTo(px, ay + ah); ctx.lineTo(px, ay + ah + 4); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'center';
    ctx.fillText(String(P), px, ay + ah + 14);
  }

  // Comb lines for n in [n-8, n+8].
  for (let kk = -8; kk <= 8; kk += 1) {
    const nn = st.n + kk;
    const P = (nn + 0.5) * st.Pi1;
    if (P < Pmin || P > Pmax) continue;
    const px = xToPx(P);
    if (kk === 0) {
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(px, ay + 6); ctx.lineTo(px, ay + ah); ctx.stroke();
      ctx.fillStyle = '#ffd166';
      ctx.textAlign = 'center';
      ctx.fillText(`n=${nn}`, px, ay + 4);
    } else {
      ctx.strokeStyle = st.l === 1 ? 'rgba(255,209,102,0.55)' : 'rgba(91,192,235,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, ay + 16); ctx.lineTo(px, ay + ah); ctx.stroke();
    }
  }
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);

  // Star cross-section on the left.
  const ox = 220, oy = 270, R = 220;
  drawCrossSection(ox, oy, R);

  // Title strip under the star.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '12px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`profile: ${st.profile.toUpperCase()}    ℓ = ${st.l}    n = ${st.n}`, 20, 22);
  const stage = evolutionStage(Pi_l(pi1FromProfile(PROFILES[st.profile]) * Math.sqrt(2), 1));
  ctx.fillText(`Π_1 = ${pi1FromProfile(PROFILES[st.profile]).toFixed(1)} s    stage: ${stage}    P_n = ${st.P_n.toFixed(1)} s`, 20, 40);

  // Brunt-Vaisala panel: top-right.
  drawBruntPanel(490, 60, 370, 200);

  // Period comb panel: bottom-right.
  drawCombPanel(490, 290, 370, 200);

  rPi.textContent = `${pi1FromProfile(PROFILES[st.profile]).toFixed(1)} s`;
  rS.textContent = stage;
  rPn.textContent = `${st.P_n.toFixed(1)} s`;
}

function tick() {
  if (st.running) {
    st.t += 0.06 * (st.speed || 0);
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vN.textContent = String(st.n);
  vSpeed.textContent = String(st.speed);
  vProfile.textContent = st.profile === 'rgb' ? 'RGB' : 'RC';
  vL.textContent = String(st.l);
}

selProfile.addEventListener('change', () => { st.profile = selProfile.value; recompute(); syncLabels(); render(); });
selL.addEventListener('change', () => { st.l = parseInt(selL.value, 10); recompute(); syncLabels(); render(); });
sN.addEventListener('input', () => { st.n = parseInt(sN.value, 10); recompute(); syncLabels(); render(); });
sSpeed.addEventListener('input', () => { st.speed = parseInt(sSpeed.value, 10); syncLabels(); });
btnReset.addEventListener('click', () => {
  st.profile = 'rgb'; st.l = 1; st.n = 14; st.speed = 1; st.running = true; st.t = 0;
  selProfile.value = 'rgb'; selL.value = '1'; sN.value = '14'; sSpeed.value = '1';
  btnPause.textContent = 'Pause'; btnPause.setAttribute('aria-pressed', 'false');
  recompute(); syncLabels(); render();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

function bootSync() {
  recompute(); syncLabels();
  if (CAPTURE_NAME) {
    // Reference capture sweeps profile, mode order, and phase so the
    // five goldens are visually distinct: t-000 RGB low n, t-025 RGB
    // high n, t-050 transition, t-075 RC low n, t-100 RC high n.
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    if (f < 0.4) {
      st.profile = 'rgb';
      st.n = Math.round(8 + (f / 0.4) * 14);
    } else if (f < 0.6) {
      st.profile = 'rgb';
      st.n = 28;        // tail end of RGB
    } else {
      st.profile = 'rc';
      st.n = Math.round(8 + ((f - 0.6) / 0.4) * 14);
    }
    selProfile.value = st.profile;
    sN.value = String(st.n);
    st.t = f * 2 * Math.PI;
    recompute(); syncLabels();
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
