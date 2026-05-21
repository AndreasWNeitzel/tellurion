import { wienPeakNm, LINES, planckLambda } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rPeak = document.getElementById('readout-peak');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const selS = document.getElementById('select-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { T: 5800, depth: 1, scale: 'lin', tA: 0 };
let running = !prefersReducedMotion();
sT.addEventListener('input', () => { st.T = parseFloat(sT.value); vT.textContent = st.T.toFixed(0); });
sD.addEventListener('input', () => { st.depth = parseFloat(sD.value); vD.textContent = st.depth.toFixed(2); });
selS.addEventListener('change', () => { st.scale = selS.value; });
btnR.addEventListener('click', () => { st.tA = 0; st.T = 5800; sT.value = 5800; vT.textContent = '5800'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();

// Approximate visible-wavelength (nm) to sRGB for the spectrum band.
function nmToRGB(nm) {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else if (nm <= 750) { r = 1; }
  let f = 1;
  if (nm < 420) f = 0.3 + 0.7 * (nm - 380) / 40;
  else if (nm > 700) f = 0.3 + 0.7 * (750 - nm) / 50;
  return `rgb(${Math.round(255 * r * f)},${Math.round(255 * g * f)},${Math.round(255 * b * f)})`;
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const lamMin = 200, lamMax = 1200, W = canvas.width, H = canvas.height;
  const pad = { l: 60, r: 30, t: 40, b: 50 };
  const xOf = (lam) => pad.l + (lam - lamMin) / (lamMax - lamMin) * (W - pad.l - pad.r);

  // Visible-spectrum colour band along the wavelength axis.
  const bandY = H - pad.b - 12, bandH = 12;
  for (let lam = 380; lam <= 750; lam += 2) {
    ctx.fillStyle = nmToRGB(lam);
    const x = xOf(lam);
    ctx.fillRect(x, bandY, (W - pad.l - pad.r) / (lamMax - lamMin) * 2 + 1, bandH);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('visible', xOf(560) - 14, bandY - 2);
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  for (let lam = 300; lam <= 1100; lam += 100) {
    const x = pad.l + (lam - lamMin) / (lamMax - lamMin) * (W - pad.l - pad.r);
    ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = 1; ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, H - pad.b); ctx.stroke();
    ctx.fillStyle = '#9aa0a6'; ctx.fillText(lam, x - 12, H - pad.b + 14);
  }
  ctx.fillText('λ (nm)', W / 2 - 30, H - 12);
  ctx.fillText('flux', 12, pad.t + 10);
  // The physical lines are ~0.2 nm wide; on a 1000 nm axis that is far
  // below one pixel, so the true dips alias away to nothing. For the
  // drawn curve only, give each line a visualization width floor so the
  // absorption carves a clearly visible notch into the blackbody. The
  // analytic sim.spectrum() (invariant-tested) is left exact; this is a
  // rendering choice, and the markers still sit on the true centres.
  const SIG_VIZ = 2.6;
  const displayFlux = (lam) => {
    const B = planckLambda(lam * 1e-9, st.T);
    let a = 0;
    for (const L of LINES) {
      const s = Math.max(L.sigma, SIG_VIZ);
      const z = (lam - L.lam) / s;
      a += L.depth * st.depth * Math.exp(-(z * z));
    }
    return B * Math.max(0, 1 - Math.min(1, a));
  };
  // Dense sampling so the notches are traced cleanly.
  const N = 2400;
  let yMax = 0;
  for (let i = 0; i < N; i += 1) {
    const lam = lamMin + (lamMax - lamMin) * i / (N - 1);
    const c = planckLambda(lam * 1e-9, st.T);
    if (c > yMax) yMax = c;
  }
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const lam = lamMin + (lamMax - lamMin) * i / (N - 1);
    const x = pad.l + (lam - lamMin) / (lamMax - lamMin) * (W - pad.l - pad.r);
    const f = displayFlux(lam);
    let y = f / yMax;
    if (st.scale === 'log') y = Math.log10(1 + f) / Math.log10(1 + yMax);
    const py = H - pad.b - y * (H - pad.t - pad.b);
    if (i === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(91,192,235,0.35)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const lam = lamMin + (lamMax - lamMin) * i / (N - 1);
    const x = pad.l + (lam - lamMin) / (lamMax - lamMin) * (W - pad.l - pad.r);
    let yC = planckLambda(lam * 1e-9, st.T) / yMax;
    if (st.scale === 'log') yC = Math.log10(1 + planckLambda(lam * 1e-9, st.T)) / Math.log10(1 + yMax);
    const py = H - pad.b - yC * (H - pad.t - pad.b);
    if (i === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
  }
  ctx.stroke();
  // Absorption-line markers: each line is a thick SOLID vertical drawn
  // in the colour of its own wavelength (UV -> violet, IR -> deep red),
  // capped by a downward triangle glyph and a colour-matched label. This
  // is deliberately distinct from the faint thin grey wavelength grid
  // above so the two never read as the same kind of line.
  ctx.font = fontString(canvas, 'tick', 'mono', 600);
  ctx.lineWidth = 1; ctx.setLineDash([]);
  const sorted = LINES.slice().sort((a, b) => a.lam - b.lam);
  for (let li = 0; li < sorted.length; li += 1) {
    const L = sorted[li];
    const x = xOf(L.lam);
    if (x < pad.l || x > W - pad.r) continue;
    const col = (L.lam >= 380 && L.lam <= 750)
      ? nmToRGB(L.lam)
      : (L.lam < 380 ? 'rgb(150,90,255)' : 'rgb(225,80,70)');
    // Solid coloured vertical from just below the labels down to the
    // top of the visible colour band (so it visually points at its hue).
    ctx.strokeStyle = col; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(x, pad.t + 16); ctx.lineTo(x, bandY); ctx.stroke();
    // Downward triangle cap, a glyph the grid lines never have.
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x - 4, pad.t + 16); ctx.lineTo(x + 4, pad.t + 16); ctx.lineTo(x, pad.t + 22);
    ctx.closePath(); ctx.fill();
    const rowY = pad.t + 12 + (li % 3) * 12;
    ctx.fillStyle = col; ctx.textAlign = 'center';
    ctx.fillText(L.name, x, rowY);
  }
  ctx.lineWidth = 1; ctx.textAlign = 'left';
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`T = ${st.T.toFixed(0)} K, λ_peak = ${wienPeakNm(st.T).toFixed(0)} nm`, 12, H - 30);
  rPeak.textContent = `${wienPeakNm(st.T).toFixed(0)} nm`;
}
// Physical stellar temperatures only: sweep stays within 3000-10000 K.
const T_MIN = 3000, T_MAX = 10000;
function tick(now) {
  const dt = (now - last) / 1000; last = now;
  if (running) {
    st.tA += dt;
    st.T = 6500 + 3500 * Math.sin(st.tA * 0.4);     // [3000, 10000]
    sT.value = String(Math.round(st.T)); vT.textContent = st.T.toFixed(0);
  }
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  st.T = T_MIN + (T_MAX - T_MIN) * (0.5 + 0.5 * Math.sin(CAPTURE_FRAC * Math.PI * 2));
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


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
