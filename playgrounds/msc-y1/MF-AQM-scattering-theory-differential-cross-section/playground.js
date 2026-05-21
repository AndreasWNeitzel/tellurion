// Quantum scattering. Panel A: the differential cross section drawn
// as a rotating surface of revolution about the beam axis, with the
// incident plane wave and the outgoing spherical wave. Panel B: the
// partial-wave phase shifts delta_l (hard sphere) or the potential
// V(r) (Born targets). Panel C: the polar dsigma/dOmega pattern with
// sigma_tot and the optical-theorem check. Gate-tested sim.js;
// deterministic. Sakurai Ch. 6; Griffiths QM Ch. 11; Taylor 1972.
import {
  hardSphereDeltas, amplitude, diffCrossSection, sigmaTotPartial,
  sigmaTotOptical, sigmaElasticIntegral, bornAmplitude, momentumTransfer, lMax,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rKa = document.getElementById('readout-ka');
const rSig = document.getElementById('readout-sig');
const rOpt = document.getElementById('readout-opt');
const rLm = document.getElementById('readout-lmax');
const selT = document.getElementById('select-target');
const sKa = document.getElementById('slider-ka'), vKa = document.getElementById('value-ka');
const sStr = document.getElementById('slider-str'), vStr = document.getElementById('value-str');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const DEF_T = 'hard', DEF_KA = 3.0, DEF_STR = 2.0;
const NTH = 60;
const st = { target: DEF_T, ka: DEF_KA, str: DEF_STR, running: !prefersReducedMotion(), ph: 0, deltas: null, R: null, sigma: 0, optRel: 0 };

function potential(r) {
  if (st.target === 'yukawa') return r === 0 ? 0 : st.str * Math.exp(-1.4 * r) / r;
  if (st.target === 'well') return r < 1 ? -st.str : 0;
  return 0;
}
function dcs(theta) {
  if (st.target === 'hard') return diffCrossSection(theta, st.deltas, st.ka);
  const q = momentumTransfer(theta, st.ka);
  const fb = bornAmplitude(q, potential);
  return fb * fb;
}

function rebuild() {
  st.deltas = hardSphereDeltas(st.ka);
  st.R = new Float64Array(NTH + 1);
  let mx = 1e-12;
  for (let i = 0; i <= NTH; i += 1) { const th = Math.PI * i / NTH; st.R[i] = dcs(th); if (st.R[i] > mx) mx = st.R[i]; }
  st.Rmax = mx;
  if (st.target === 'hard') {
    st.sigma = sigmaTotPartial(st.deltas, st.ka);
    st.optRel = Math.abs(st.sigma - sigmaTotOptical(st.deltas, st.ka)) / st.sigma;
  } else {
    // sigma = integral |f_B|^2 dOmega (Simpson in theta)
    let s = 0;
    for (let i = 0; i <= 400; i += 1) {
      const th = Math.PI * i / 400;
      const w = (i === 0 || i === 400) ? 1 : (i % 2 ? 4 : 2);
      s += w * dcs(th) * Math.sin(th);
    }
    st.sigma = 2 * Math.PI * (s * (Math.PI / 400) / 3);
    st.optRel = 0;                                     // optical theorem needs the full (non-Born) f
  }
  st.ph = 0; st.running = true;
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

function drawSurface(x, y, w, h) {
  panel(x, y, w, h, 'dsigma/dOmega surface of revolution about the beam axis (incident -> )');
  const cx = x + w * 0.56, cy = y + h * 0.54, S = Math.min(w * 0.5, h) * 0.62;
  const viewPhi = 0.6, tilt = 0.52;                    // fixed oblique 3D view
  const thProbe = st.ph * Math.PI;                     // swept polar-angle probe
  // incident plane-wave wavefronts sweeping in from the left
  ctx.strokeStyle = 'rgba(127,160,210,0.30)'; ctx.lineWidth = 1;
  for (let m = 0; m < 6; m += 1) {
    const wx = x + 16 + ((m * 26 + st.ph * 52) % 150);
    ctx.beginPath(); ctx.moveTo(wx, y + 26); ctx.lineTo(wx, y + h - 14); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(127,160,210,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('incident plane wave', x + 12, y + h - 8);
  // outgoing spherical wave
  ctx.strokeStyle = 'rgba(241,192,105,0.12)';
  for (let rr = 1; rr <= 3; rr += 1) { ctx.beginPath(); ctx.arc(cx, cy, rr * S * 0.5 + (st.ph * 16) % 22, 0, 2 * Math.PI); ctx.stroke(); }
  // surface of revolution: R(theta) revolved about the beam (X) axis
  const P3 = (th, ph) => {
    const Rr = (st.R[Math.round(th / Math.PI * NTH)] / st.Rmax);
    const u = Rr * Math.cos(th);                       // along beam
    const v = Rr * Math.sin(th) * Math.cos(ph);
    const ww = Rr * Math.sin(th) * Math.sin(ph);
    const vr = v * Math.cos(viewPhi) - ww * Math.sin(viewPhi);
    const wr = v * Math.sin(viewPhi) + ww * Math.cos(viewPhi);
    return { sx: cx + S * u, sy: cy - S * (vr * Math.cos(tilt) + 0.001 * wr), depth: wr };
  };
  const NPHI = 40;
  // meridians
  for (let j = 0; j < NPHI; j += 2) {
    const ph = 2 * Math.PI * j / NPHI;
    ctx.beginPath();
    for (let i = 0; i <= NTH; i += 1) {
      const p = P3(Math.PI * i / NTH, ph);
      const d = (p.depth + 1) / 2;
      ctx.strokeStyle = `rgba(${90 + 120 * d | 0},${150 + 80 * d | 0},255,${0.25 + 0.5 * d})`;
      i === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy);
    }
    ctx.stroke();
  }
  // latitude rings
  for (let i = 4; i <= NTH; i += 6) {
    ctx.beginPath();
    for (let j = 0; j <= NPHI; j += 1) {
      const p = P3(Math.PI * i / NTH, 2 * Math.PI * j / NPHI);
      j === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy);
    }
    ctx.strokeStyle = 'rgba(150,180,230,0.35)'; ctx.stroke();
  }
  // swept polar-angle probe: a bright ring at theta = thProbe
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let j = 0; j <= NPHI; j += 1) {
    const p = P3(thProbe, 2 * Math.PI * j / NPHI);
    j === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,209,102,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`theta = ${(thProbe * 180 / Math.PI).toFixed(0)} deg`, x + w - 150, y + 28);
  // beam axis arrow
  ctx.strokeStyle = 'rgba(241,192,105,0.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - S * 1.25, cy); ctx.lineTo(cx + S * 1.35, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + S * 1.35, cy); ctx.lineTo(cx + S * 1.28, cy - 5); ctx.lineTo(cx + S * 1.28, cy + 5); ctx.closePath(); ctx.fillStyle = 'rgba(241,192,105,0.8)'; ctx.fill();
  ctx.fillStyle = 'rgba(241,192,105,0.85)'; ctx.fillText('forward (theta=0)', cx + S * 0.6, cy - 8);
}

function drawPartial(x, y, w, h) {
  if (st.target === 'hard') {
    panel(x, y, w, h, 'partial-wave phase shifts delta_l [cyan] and sin^2 delta_l [amber]');
    const x0 = x + 34, x1 = x + w - 12;
    // top band: signed delta_l about an axis; bottom band: sin^2 delta_l
    const tTop = y + 28, tAx = y + h * 0.40, tBot = y + h * 0.52;   // delta_l band
    const sTop = y + h * 0.60, sBot = y + h - 24;                   // sin^2 band
    const L = Math.min(st.deltas.length - 1, lMax(st.ka));
    const bw = (x1 - x0) / (L + 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.moveTo(x0, tAx); ctx.lineTo(x1, tAx); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, sBot); ctx.lineTo(x1, sBot); ctx.stroke();
    for (let l = 0; l <= L; l += 1) {
      const d = st.deltas[l];
      const dn = Math.max(-1, Math.min(1, d / (Math.PI / 2)));
      const half = (dn >= 0 ? (tAx - tTop) : (tBot - tAx)) * Math.abs(dn);
      ctx.fillStyle = '#7fd1ff';
      ctx.fillRect(x0 + l * bw + 2, dn >= 0 ? tAx - half : tAx, Math.max(2, bw - 4), Math.max(1, half));
      const s2 = Math.sin(d) ** 2;
      ctx.fillStyle = 'rgba(241,192,105,0.8)';
      ctx.fillRect(x0 + l * bw + 2, sBot - (sBot - sTop) * s2, Math.max(2, bw - 4), (sBot - sTop) * s2);
    }
    ctx.fillStyle = 'rgba(127,209,255,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText('delta_l', x + 6, tTop + 4);
    ctx.fillStyle = 'rgba(241,192,105,0.8)'; ctx.fillText('sin^2', x + 6, sTop + 8);
    ctx.fillStyle = 'rgba(200,215,240,0.65)'; ctx.fillText('l ->', x1 - 24, sBot + 14);
  } else {
    panel(x, y, w, h, 'potential V(r): the Born amplitude is its Fourier transform');
    const x0 = x + 34, x1 = x + w - 12, y0 = y + 26, y1 = y + h - 24;
    const rMax = 5;
    let vmin = 0, vmax = 0;
    for (let i = 0; i <= 120; i += 1) { const v = potential(rMax * i / 120 + 1e-3); vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); }
    const span = Math.max(1e-6, vmax - vmin);
    const X = (r) => x0 + (x1 - x0) * r / rMax;
    const Y = (v) => y1 - (y1 - y0) * (v - vmin) / span;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(x0, Y(0)); ctx.lineTo(x1, Y(0)); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#8fe39b'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 240; i += 1) { const r = rMax * i / 240 + 1e-3; const xx = X(r), yy = Y(potential(r)); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(200,215,240,0.65)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText('r ->', x1 - 24, y1 + 14); ctx.fillText('V(r)', x + 6, y0 + 2);
  }
}

function drawPolar(x, y, w, h) {
  panel(x, y, w, h, 'polar dsigma/dOmega(theta): forward peak to the right');
  const cx = x + w * 0.5, cy = y + h * 0.56, S = Math.min(w, h) * 0.36;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  for (const fr of [0.33, 0.66, 1]) { ctx.beginPath(); ctx.arc(cx, cy, S * fr, 0, 2 * Math.PI); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(cx - S, cy); ctx.lineTo(cx + S * 1.15, cy); ctx.stroke();
  const norm = st.Rmax;
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 2 * NTH; i += 1) {
    const th = (i <= NTH) ? Math.PI * i / NTH : Math.PI * (2 * NTH - i) / NTH;
    const rr = Math.sqrt(Math.max(0, st.R[Math.round(th / Math.PI * NTH)] / norm));
    const sign = i <= NTH ? 1 : -1;
    const px = cx + S * rr * Math.cos(th), py = cy - sign * S * rr * Math.sin(th);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.stroke();
  // probe marker at theta = st.ph * pi
  const thP = st.ph * Math.PI;
  const rP = Math.sqrt(Math.max(0, st.R[Math.round(thP / Math.PI * NTH)] / norm));
  ctx.strokeStyle = 'rgba(255,209,102,0.6)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + S * Math.cos(thP), cy - S * Math.sin(thP)); ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(cx + S * rP * Math.cos(thP), cy - S * rP * Math.sin(thP), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(241,192,105,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('theta=0', cx + S * 0.9, cy - 6); ctx.fillText('theta=pi', cx - S - 4, cy - 6);
  ctx.fillStyle = 'rgba(200,215,240,0.7)';
  ctx.fillText(`sigma_tot = ${st.sigma.toFixed(3)}   dsigma/dOmega(${(thP * 180 / Math.PI).toFixed(0)}) = ${st.R[Math.round(thP / Math.PI * NTH)].toFixed(2)}`, x + 10, y + h - 10);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawSurface(20, 22, W - 40, 232);
  drawPartial(20, 270, (W - 52) / 2, H - 270 - 16);
  drawPolar(20 + (W - 52) / 2 + 12, 270, (W - 52) / 2, H - 270 - 16);
  rKa.textContent = st.ka.toFixed(2);
  rSig.textContent = st.sigma.toFixed(3);
  rOpt.textContent = st.target === 'hard' ? `${(st.optRel * 100).toExponential(1)}%` : 'n/a (Born)';
  rLm.textContent = String(lMax(st.ka));
}

const LIVE_FRAC = 1 / 360;
function tick() {
  if (st.running) {
    st.ph += LIVE_FRAC;
    if (st.ph >= 1) { st.ph = 0; }                     // continuous spin of the 3D surface
  }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vKa.textContent = st.ka.toFixed(2); vStr.textContent = st.str.toFixed(2); }
selT.addEventListener('change', () => { st.target = selT.value; rebuild(); draw(); });
sKa.addEventListener('input', () => { st.ka = parseFloat(sKa.value) / 100; syncLabels(); rebuild(); draw(); });
sStr.addEventListener('input', () => { st.str = parseFloat(sStr.value) / 100; syncLabels(); rebuild(); draw(); });
bR.addEventListener('click', () => {
  st.target = DEF_T; st.ka = DEF_KA; st.str = DEF_STR;
  selT.value = DEF_T; sKa.value = String(DEF_KA * 100); sStr.value = String(DEF_STR * 100);
  syncLabels(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { target: st.target, ka: st.ka.toFixed(2), str: st.str.toFixed(2) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.target) { st.target = s.target; selT.value = s.target; }
  if (s.ka) { st.ka = parseFloat(s.ka); sKa.value = String(Math.round(st.ka * 100)); }
  if (s.str) { st.str = parseFloat(s.str); sStr.value = String(Math.round(st.str * 100)); }
}

function boot() {
  restoreState(); syncLabels(); rebuild();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.ph = f;
    draw();
  } else {
    draw();
  }
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
