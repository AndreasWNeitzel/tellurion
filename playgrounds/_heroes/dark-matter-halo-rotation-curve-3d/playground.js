// Dark-matter halo + rotation curve playground. Left half: 3D disk
// galaxy with transparent halo. Right half: rotation curve v_c(r)
// decomposed by component.

import { vCirc, vCircVisible, massBulge, massDisk, massDM, MW_PARAMS, G } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rVp = document.getElementById('readout-vp');
const rRatio = document.getElementById('readout-ratio');
const rDm = document.getElementById('readout-dm');
const sMDM = document.getElementById('slider-MDM'), vMDM = document.getElementById('value-MDM');
const sC = document.getElementById('slider-c'), vC = document.getElementById('value-c');
const sRs = document.getElementById('slider-rs'), vRs = document.getElementById('value-rs');
const tDM = document.getElementById('toggle-dm');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  M_DM: 80, c: 12, r_s: 20, includeDM: true,
  running: !prefersReducedMotion(),
  rotAngle: 0,
};

function getParams() {
  return { ...MW_PARAMS, M_DM: st.M_DM, c: st.c, r_s: st.r_s, includeDM: st.includeDM };
}

// 3D projection for the left panel.
function project3D(x, y, z, cx, cy, scale) {
  const tilt = 0.5;
  const ca = Math.cos(st.rotAngle), sa = Math.sin(st.rotAngle);
  const xp = ca * x - sa * y;
  const yp = sa * x + ca * y;
  const ct = Math.cos(tilt), stl = Math.sin(tilt);
  const yr = ct * yp - stl * z;
  const zr = stl * yp + ct * z;
  const cam = 50;
  const f = 1 / (1 + zr / cam);
  return { x: cx + xp * scale * f, y: cy - yr * scale * f, depth: zr };
}

function drawGalaxy3D() {
  const cx = 220, cy = 230;
  const scale = 4;

  // Dark matter halo: large transparent purple sphere.
  if (st.includeDM) {
    const haloR = st.r_s * st.c / 4 * scale;
    const g = ctx.createRadialGradient(cx, cy, haloR * 0.4, cx, cy, haloR);
    g.addColorStop(0, 'rgba(170, 130, 220, 0.10)');
    g.addColorStop(1, 'rgba(170, 130, 220, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, haloR, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = 'rgba(170, 130, 220, 0.25)';
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.arc(cx, cy, haloR, 0, 2 * Math.PI); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(170, 130, 220, 0.65)';
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NFW dark halo', cx, cy + haloR + 14);
  }

  // Disk: many star dots in an exponential disk.
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) | 0;
    return ((seed >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF;
  };
  for (let k = 0; k < 800; k += 1) {
    const u = rand();
    const r = -3 * Math.log(1 - u * 0.98);
    const phi = rand() * 2 * Math.PI;
    const z = (rand() - 0.5) * 0.6 * Math.exp(-r / 4);
    const x = r * Math.cos(phi);
    const y = r * Math.sin(phi);
    const p = project3D(x, y, z, cx, cy, scale);
    ctx.fillStyle = `rgba(180, 220, 255, ${0.4 + 0.5 * Math.exp(-r / 6)})`;
    ctx.fillRect(p.x - 0.7, p.y - 0.7, 1.4, 1.4);
  }
  // Bulge: bright core
  const pc = project3D(0, 0, 0, cx, cy, scale);
  const g = ctx.createRadialGradient(pc.x, pc.y, 0, pc.x, pc.y, 14);
  g.addColorStop(0, 'rgba(255, 230, 140, 0.85)');
  g.addColorStop(1, 'rgba(255, 230, 140, 0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(pc.x, pc.y, 14, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(pc.x, pc.y, 5, 0, 2 * Math.PI); ctx.fill();

  // Top label
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '12px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`3D galactic disk + DM halo`, 24, 22);
  ctx.fillStyle = st.includeDM ? 'rgba(170, 130, 220, 0.85)' : 'rgba(120, 120, 130, 0.65)';
  ctx.fillText(st.includeDM ? `dark halo: M_DM = ${st.M_DM.toFixed(0)}, c = ${st.c.toFixed(1)}, r_s = ${st.r_s.toFixed(0)}` : `dark halo OFF (visible mass only)`, 24, 40);
}

function drawRotationCurve() {
  // Right panel: v_c(r) decomposition.
  const x0 = 460, y0 = 60, w = 410, h = 380;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);

  const pad = { l: 50, r: 14, t: 26, b: 28 };
  const ax = x0 + pad.l, ay = y0 + pad.t;
  const aw = w - pad.l - pad.r, ah = h - pad.t - pad.b;

  // Axes
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + ah); ctx.lineTo(ax + aw, ay + ah);
  ctx.stroke();

  const R_MAX = 80;
  const V_MAX = 1.6;
  const xToPx = (r) => ax + (r / R_MAX) * aw;
  const yToPx = (v) => ay + (1 - v / V_MAX) * ah;

  // Y-axis ticks
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '10px ui-monospace, monospace';
  ctx.textAlign = 'right';
  for (let v = 0; v <= V_MAX; v += 0.4) {
    ctx.fillText(v.toFixed(1), ax - 4, yToPx(v) + 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath(); ctx.moveTo(ax, yToPx(v)); ctx.lineTo(ax + aw, yToPx(v)); ctx.stroke();
  }
  ctx.textAlign = 'center';
  for (let r = 0; r <= R_MAX; r += 20) {
    ctx.fillText(String(r), xToPx(r), ay + ah + 14);
  }
  ctx.fillText('r', ax + aw - 6, ay + ah + 22);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.textAlign = 'left';
  ctx.fillText('v_c(r)', ax - 10, ay - 6);

  // Sample the curve.
  const p = getParams();
  const NPTS = 200;
  const rs = new Float64Array(NPTS);
  const vb = new Float64Array(NPTS), vd = new Float64Array(NPTS), vh = new Float64Array(NPTS);
  const vvis = new Float64Array(NPTS), vtot = new Float64Array(NPTS);
  for (let i = 0; i < NPTS; i += 1) {
    const r = (i + 0.5) / NPTS * R_MAX;
    rs[i] = r;
    vb[i] = Math.sqrt(G * massBulge(r, p.M_b, p.a_b) / r);
    vd[i] = Math.sqrt(G * massDisk(r, p.M_d, p.h_d) / r);
    vh[i] = p.includeDM ? Math.sqrt(G * massDM(r, p.M_DM, p.r_s, p.c) / r) : 0;
    vvis[i] = vCircVisible(r, p);
    vtot[i] = vCirc(r, p);
  }

  function plotLine(values, color, dash) {
    ctx.strokeStyle = color;
    ctx.lineWidth = dash ? 1.0 : 1.6;
    if (dash) ctx.setLineDash([4, 3]);
    ctx.beginPath();
    for (let i = 0; i < NPTS; i += 1) {
      const px = xToPx(rs[i]);
      const py = yToPx(values[i]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    if (dash) ctx.setLineDash([]);
  }
  plotLine(vb, 'rgba(255, 209, 102, 0.8)');
  plotLine(vd, 'rgba(91, 192, 235, 0.8)');
  if (p.includeDM) plotLine(vh, 'rgba(170, 130, 220, 0.8)');
  plotLine(vvis, 'rgba(150, 220, 255, 0.5)', true);          // visible-only dashed
  plotLine(vtot, 'rgba(255, 255, 255, 0.95)');               // total

  // Legend
  const legendX = ax + aw - 140, legendY = ay + 10;
  const legend = [
    { label: 'bulge', color: 'rgba(255, 209, 102, 0.9)' },
    { label: 'disk', color: 'rgba(91, 192, 235, 0.9)' },
    p.includeDM ? { label: 'dark halo (NFW)', color: 'rgba(170, 130, 220, 0.9)' } : null,
    { label: 'visible only', color: 'rgba(150, 220, 255, 0.6)', dash: true },
    { label: 'total', color: 'rgba(255, 255, 255, 0.95)' },
  ].filter(Boolean);
  ctx.textAlign = 'left';
  ctx.font = '11px ui-monospace, monospace';
  for (let i = 0; i < legend.length; i += 1) {
    const item = legend[i];
    const yy = legendY + i * 14;
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 2;
    if (item.dash) ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(legendX, yy); ctx.lineTo(legendX + 18, yy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = item.color;
    ctx.fillText(item.label, legendX + 22, yy + 3);
  }

  // Plateau value at r=50.
  return { vPlateau: vtot[Math.floor(50 / R_MAX * NPTS)] };
}

function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  drawGalaxy3D();
  const stats = drawRotationCurve();

  // Bottom HUD: Rubin-Ford historical note.
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Rubin and Ford 1970: flat rotation curves out to many disk scale lengths require dark matter', W / 2, H - 14);

  const p = getParams();
  const Mvis = p.M_b + p.M_d;
  rVp.textContent = stats.vPlateau.toFixed(2);
  rRatio.textContent = (p.M_DM / Mvis).toFixed(1);
  rDm.textContent = p.includeDM ? 'ON' : 'OFF';
}

function tick() {
  if (st.running) {
    st.rotAngle += 0.005;
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vMDM.textContent = String(st.M_DM);
  vC.textContent = st.c.toFixed(1);
  vRs.textContent = String(st.r_s);
}

sMDM.addEventListener('input', () => { st.M_DM = parseFloat(sMDM.value); syncLabels(); });
sC.addEventListener('input', () => { st.c = parseFloat(sC.value); syncLabels(); });
sRs.addEventListener('input', () => { st.r_s = parseFloat(sRs.value); syncLabels(); });
tDM.addEventListener('change', () => { st.includeDM = tDM.checked; });
btnReset.addEventListener('click', () => {
  st.M_DM = 80; st.c = 12; st.r_s = 20; st.includeDM = true;
  sMDM.value = '80'; sC.value = '12'; sRs.value = '20'; tDM.checked = true;
  syncLabels();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { M_DM: st.M_DM, c: st.c, include_DM: st.includeDM ? 1 : 0 }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.M_DM) { st.M_DM = parseFloat(s.M_DM); sMDM.value = String(st.M_DM); }
  if (s.c) { st.c = parseFloat(s.c); sC.value = String(st.c); }
  if (s.include_DM !== undefined) { st.includeDM = String(s.include_DM) === '1'; tDM.checked = st.includeDM; }
}

function bootSync() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  syncLabels();
  if (CAPTURE_NAME) {
    // Sweep: t-000 visible-only -> t-100 with DM at concentration 4..20.
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    if (f < 0.25) {
      st.includeDM = false; tDM.checked = false;
    } else {
      st.includeDM = true; tDM.checked = true;
      st.c = 4 + (f - 0.25) / 0.75 * 16;
      sC.value = String(st.c);
    }
    st.rotAngle = f * 1.2;
    syncLabels();
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
