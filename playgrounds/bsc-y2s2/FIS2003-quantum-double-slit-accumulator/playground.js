// Quantum double slit, one particle at a time. Each detection is a
// single dot whose screen position is drawn by the Born rule from
// P(y); the dots pile up into interference fringes. A which-path
// detector (gamma from 1 down to 0) erases the fringes, leaving the
// single-slit envelope. The side panel is the running histogram
// against the analytic P(y) with the live visibility. Numerics in
// sim.js. Reference: Eisberg and Resnick, Quantum Physics of Atoms
// (2nd ed.), Ch. 3 and 5.

import { intensity, fringeSpacing, sampleScreen, visibility } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const NMAX = 4000;                    // total particles at the terminal frame
const SEED = 0xC0FFEE;
const READOUTS = ['detector', 'count', 'fringe dy', 'visibility', 'lambda', 'phase'];
const rEls = {};
for (const kk of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = kk;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[kk] = b;
}

// detector in [0,1]: 0 = off (full fringes, gamma=1), 1 = full
// which-path (no fringes, gamma=0)
const st = { detector: 0.0, d: 1.0, lambda: 1.0, a: 1.0, count: 0, running: 1 };
const BASE = { lambda: 5e-7, L: 2, a: 2e-5 };
function gammaC() { return 1 - st.detector; }
function P() { return { lambda: BASE.lambda * st.lambda, L: BASE.L, d: 1e-4 * st.d, a: BASE.a * st.a, gamma: gammaC() }; }
// Schematic apparatus geometry in pixels: the physical slit separation
// and width are microns against a 0.07 m screen window, so a literal
// scaling is sub-pixel. These give the barrier a visible, slider-driven
// response (the fringe physics still uses the physical P()).
function slitGapPx() { return 10 + st.d * 46; }        // d: 0.5..2.5 -> 33..125 px
function slitHalfPx() { return 3 + st.a * 6; }         // a: 0.5..2.0 -> 6..15 px
// Fixed detector half-height (independent of lambda and d) so changing
// the wavelength visibly stretches the fringes instead of being
// cancelled by an auto-scaled window.
function screenY() { return 1.4 * BASE.lambda * BASE.L / BASE.a; }

let hits = new Float64Array(0);
function rebuild(n) {
  hits = sampleScreen(P(), NMAX, screenY(), SEED);
  st.count = Math.max(0, Math.min(NMAX, n | 0));
}
rebuild(0);

// geometry
const AX = 30, AY = 60, AW = 250, SCX = 300, SCW = 250, SCY = 40, SCH = 420; // apparatus + screen
const HX = 588, HW = 286, HY = 196, HH = 348;                                 // histogram panel (below the HUD)

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const p = P(), Y = screenY();
  const yPix = (y) => SCY + ((y + Y) / (2 * Y)) * SCH;

  // apparatus: source, double-slit barrier, faint two paths
  const srcX = AX + 8, srcY = SCY + SCH / 2, barX = AX + AW;
  ctx.strokeStyle = 'rgba(220,225,235,0.4)'; ctx.strokeRect(AX, SCY, SCX + SCW - AX, SCH);
  ctx.fillStyle = '#ffe46b'; ctx.beginPath(); ctx.arc(srcX, srcY, 5, 0, 6.2832); ctx.fill();
  const slitGap = slitGapPx(), slitH = slitHalfPx();
  ctx.fillStyle = '#3a3f4b'; ctx.fillRect(barX - 4, SCY, 8, SCH);
  for (const sgn of [-1, 1]) {
    ctx.clearRect(barX - 4, srcY + sgn * slitGap - slitH, 8, 2 * slitH);
    ctx.fillStyle = '#0a0c12'; ctx.fillRect(barX - 4, srcY + sgn * slitGap - slitH, 8, 2 * slitH);
    ctx.strokeStyle = 'rgba(127,214,255,0.7)'; ctx.lineWidth = 1.4;
    ctx.strokeRect(barX - 4, srcY + sgn * slitGap - slitH, 8, 2 * slitH); ctx.lineWidth = 1;
  }
  ctx.strokeStyle = 'rgba(127,214,255,0.22)';
  for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(srcX, srcY); ctx.lineTo(barX, srcY + sgn * slitGap); ctx.lineTo(SCX, srcY); ctx.stroke(); }
  // separation caliper so the slider's effect on the slits is unmistakable
  ctx.strokeStyle = 'rgba(255,228,107,0.55)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(barX + 10, srcY - slitGap); ctx.lineTo(barX + 10, srcY + slitGap); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,228,107,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`d = ${st.d.toFixed(2)}x`, barX + 14, srcY - slitGap + 4);
  ctx.fillText(`a = ${st.a.toFixed(2)}x`, barX + 14, srcY + slitGap + 12);
  ctx.textAlign = 'left';
  // which-path detector glyphs at the slits when gamma < 1
  if (st.detector > 0.001) {
    ctx.fillStyle = `rgba(255,120,110,${0.3 + 0.6 * st.detector})`;
    for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.arc(barX + 14, srcY + sgn * slitGap, 5, 0, 6.2832); ctx.fill(); }
    ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
    ctx.fillText('which-path', barX + 22, srcY - slitGap - 8);
  }

  // detection screen: accumulated one-by-one dots
  ctx.fillStyle = '#0c0f16'; ctx.fillRect(SCX, SCY, SCW, SCH);
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.strokeRect(SCX, SCY, SCW, SCH);
  let rng = 2166136261;
  const rand = () => { rng = (rng * 16777619) >>> 0; return rng / 4294967296; };
  for (let i = 0; i < st.count; i += 1) {
    const x = SCX + 10 + rand() * (SCW - 20), y = yPix(hits[i]);
    ctx.fillStyle = 'rgba(255,235,170,0.55)';
    ctx.fillRect(x, y - 1, 1.6, 1.6);
  }
  // a few in-flight particles
  const inflight = (st.count % 60) / 60;
  for (let q = 0; q < 3; q += 1) {
    const f = (inflight + q / 3) % 1, yi = hits[(st.count + q) % NMAX];
    const px = srcX + f * (SCX - srcX), py = srcY + (yPix(yi) - srcY) * f;
    ctx.fillStyle = '#ffe46b'; ctx.beginPath(); ctx.arc(px, py, 2.4, 0, 6.2832); ctx.fill();
  }
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('source -> double slit -> detection screen (one particle at a time)', (AX + SCX + SCW) / 2, SCY + SCH + 20);
  ctx.textAlign = 'left';

  // histogram panel vs analytic P(y)
  ctx.fillStyle = '#0b0d13'; ctx.fillRect(HX, HY, HW, HH);
  ctx.strokeStyle = 'rgba(200,205,215,0.32)'; ctx.strokeRect(HX, HY, HW, HH);
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('counts vs Born |psi|^2', HX + HW / 2, HY - 6);
  const BINS = 90, hist = new Float64Array(BINS);
  for (let i = 0; i < st.count; i += 1) { const b = Math.floor(((hits[i] + Y) / (2 * Y)) * BINS); if (b >= 0 && b < BINS) hist[b] += 1; }
  let hmax = 1; for (const v of hist) hmax = Math.max(hmax, v);
  ctx.fillStyle = 'rgba(255,235,170,0.5)';
  for (let b = 0; b < BINS; b += 1) { const yy = HY + (b / BINS) * HH, bw = (hist[b] / hmax) * (HW - 12); ctx.fillRect(HX + 4, yy, bw, HH / BINS - 0.5); }
  let imax = 1e-12; for (let b = 0; b < BINS; b += 1) imax = Math.max(imax, intensity(-Y + (2 * Y * (b + 0.5)) / BINS, p));
  ctx.strokeStyle = '#7fd6ff'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let b = 0; b <= BINS; b += 1) { const yv = -Y + (2 * Y * b) / BINS; const I = intensity(yv, p) / imax; const X = HX + 4 + I * (HW - 12), Yy = HY + (b / BINS) * HH; b === 0 ? ctx.moveTo(X, Yy) : ctx.lineTo(X, Yy); }
  ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('counts / |psi|^2', HX + HW / 2, HY + HH + 14);
  ctx.save(); ctx.translate(HX - 7, HY + HH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('screen y', 0, 0); ctx.restore();
  ctx.textAlign = 'left';

  const V = visibility(p);
  rEls['detector'].textContent = st.detector < 0.001 ? 'off' : `on (${(st.detector * 100).toFixed(0)}%)`;
  rEls['count'].textContent = String(st.count);
  rEls['fringe dy'].textContent = fringeSpacing(p).toExponential(2);
  rEls['visibility'].textContent = V.toFixed(3);
  rEls['lambda'].textContent = (BASE.lambda * st.lambda).toExponential(2);
  rEls['phase'].textContent = (st.count / NMAX).toFixed(2);
}

// controls
function buildSlider(label, min, max, stp, value, key, fmt) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value); rebuild(st.count); render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row); return { inp, val };
}
const cG = buildSlider('which-path detector', 0, 1, 0.02, st.detector, 'detector', v => v < 0.01 ? 'off' : v.toFixed(2));
const cD = buildSlider('slit separation d', 0.5, 2.5, 0.05, st.d, 'd', v => v.toFixed(2) + 'x');
const cA = buildSlider('slit width a', 0.5, 2.0, 0.05, st.a, 'a', v => v.toFixed(2) + 'x');
const cL = buildSlider('wavelength', 0.5, 2.0, 0.05, st.lambda, 'lambda', v => v.toFixed(2) + 'x');
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { detector: 0.0, d: 1.0, lambda: 1.0, a: 1.0, count: 0, running: 1 });
  cG.inp.value = '0'; cG.val.textContent = 'off'; cD.inp.value = '1'; cD.val.textContent = '1.00x';
  cA.inp.value = '1'; cA.val.textContent = '1.00x'; cL.inp.value = '1'; cL.val.textContent = '1.00x';
  rebuild(0); bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render();
});
bPause.addEventListener('click', () => { st.running = st.running ? 0 : 1; bPause.textContent = st.running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!st.running)); });

let acc = 0, lastT = performance.now();
function tick(now) {
  const dr = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.running && st.count < NMAX) { acc += dr * 900; const add = Math.floor(acc); if (add > 0) { st.count = Math.min(NMAX, st.count + add); acc -= add; } }
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  // start with a populated screen so the fringes are visible at once
  // (and slider changes re-sample a visible pattern)
  rebuild(CAPTURE_NAME ? Math.round(CAPTURE_FRAC * NMAX) : 900);
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const p = { lambda: 5e-7, L: 2, d: 1e-4, a: 2e-5, gamma: 1 };
  const dy = fringeSpacing(p);
  if (Math.abs(dy - p.lambda * p.L / p.d) > 1e-12) return { name: 'fringe spacing', pass: false, msg: `${dy}` };
  const vOn = visibility({ ...p, gamma: 1 }), vOff = visibility({ ...p, gamma: 0 });
  if (vOn < 0.98 || vOff > 0.02) return { name: 'which-path visibility', pass: false, msg: `on=${vOn} off=${vOff}` };
  return { name: 'fringe spacing + which-path visibility', pass: true, msg: `dy=lambda L/d; V 1->0 with detector` };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


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
