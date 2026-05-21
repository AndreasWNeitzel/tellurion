// Huygens construction made physical: a wavefront is replaced by N
// secondary point sources, their circular wavelets superpose, and the
// envelope is the reconstructed wavefront. Flat aperture gives single-
// slit diffraction; a concave arc of equal-phase wavelets focuses. The
// side panel is the far-field amplitude against angle (the sinc
// envelope for a uniform aperture). Reference: Hecht, Optics (5th
// ed.), Sec. 10.1-10.2.

import { sourcesLine, sourcesArc, fieldAt, farFieldAmplitude, apertureAmplitude } from './sim.js';
import { divBlack, fieldToImageData } from '../../../shared/js/render/colormaps.js';
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

const GN = 150;                       // field-eval grid
const FMAX = 64;                      // sources summed into the field map
const PERIOD_FR = 240;                // capture cycle length (frames)
const READOUTS = ['shape', 'N sources', 'lambda', 'aperture a', 'sim t'];
const rEls = {};
for (const k of READOUTS) {
  const aEl = document.createElement('span'); aEl.className = 'label'; aEl.textContent = k;
  const bEl = document.createElement('span'); bEl.className = 'value'; bEl.textContent = '--';
  readoutEl.appendChild(aEl); readoutEl.appendChild(bEl); rEls[k] = bEl;
}

const st = { shape: 'flat', N: 24, lambda: 26, aperture: 300, t: 0, running: 1 };
// world box mapped to the field square: x in [0, WX], y in [-WY, WY]
const WX = 760, WY = 380;
let sources = [];
function rebuild() {
  const x0 = 120, y0 = 0, a = st.aperture, R = 520;
  sources = st.shape === 'arc' ? sourcesArc(st.N, a, R, x0, y0) : sourcesLine(st.N, a, x0, y0);
}
rebuild();

// geometry
const FX = 16, FY = 16, FPX = 560, CELL = FPX / GN;
const PX = 596, PW = 256, PY = 210, PH = 330;
const wx = (X) => FX + (X / WX) * FPX;
const wy = (Y) => FY + ((Y + WY) / (2 * WY)) * FPX;

let imgData = new ImageData(GN, GN);
const disp = new Float32Array(GN * GN);
const off = document.createElement('canvas'); off.width = GN; off.height = GN;
const offCtx = off.getContext('2d');

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const k = 2 * Math.PI / st.lambda, omega = k, t = st.t;
  const fsrc = sources.length > FMAX ? sources.filter((_, i) => i % Math.ceil(sources.length / FMAX) === 0) : sources;
  // superposed wavelet field; auto-scale the tanh knee to the field
  // maximum so the pattern is visible for any N, lambda, aperture
  let maxAbs = 1e-6;
  for (let gy = 0; gy < GN; gy += 1) {
    const Y = -WY + (gy / (GN - 1)) * 2 * WY;
    for (let gx = 0; gx < GN; gx += 1) {
      const X = (gx / (GN - 1)) * WX;
      const f = fieldAt(fsrc, X, Y, k, omega, t);
      disp[gy * GN + gx] = f;
      const af = Math.abs(f); if (af > maxAbs) maxAbs = af;
    }
  }
  const uref = 0.55 * maxAbs;
  for (let i = 0; i < GN * GN; i += 1) disp[i] = Math.tanh(disp[i] / uref);
  imgData = fieldToImageData(disp, GN, GN, -1, 1, divBlack, imgData);
  offCtx.putImageData(imgData, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, FX, FY, FPX, FPX);
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(FX, FY, FPX, FPX);

  // Huygens wavelets: a circle of common radius cR about each source
  // sweeping left to right; the bright tangent envelope is the
  // reconstructed wavefront
  const cyc = ((t / PERIOD_FR) % 1 + 1) % 1;
  const cR = 24 + cyc * (WX * 0.6);
  ctx.strokeStyle = 'rgba(150,210,235,0.30)'; ctx.lineWidth = 1;
  for (const s of sources) {
    ctx.beginPath(); ctx.arc(wx(s.x), wy(s.y), (cR / WX) * FPX, 0, 6.2832); ctx.stroke();
  }
  ctx.fillStyle = '#ffe46b';
  for (const s of sources) { ctx.beginPath(); ctx.arc(wx(s.x), wy(s.y), 2.4, 0, 6.2832); ctx.fill(); }
  // reconstructed wavefront (envelope): flat -> a plane at x0+cR;
  // arc -> a converging circular front toward the focus
  ctx.strokeStyle = 'rgba(127,214,255,0.9)'; ctx.lineWidth = 2; ctx.beginPath();
  if (st.shape === 'flat') {
    const xf = 120 + cR; ctx.moveTo(wx(xf), wy(-st.aperture / 2)); ctx.lineTo(wx(xf), wy(st.aperture / 2));
  } else {
    const R = 520, fx = 120 + R;
    const rr = Math.max(4, R - cR);
    ctx.arc(wx(fx), wy(0), (rr / WX) * FPX, Math.PI - 0.6, Math.PI + 0.6);
  }
  ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('Huygens wavelets (faint) and the reconstructed wavefront (blue)', FX + FPX / 2, FY + FPX + 18);
  ctx.textAlign = 'left';

  // side panel: far-field amplitude vs angle
  ctx.fillStyle = '#0b0d13'; ctx.fillRect(PX, PY, PW, PH);
  ctx.strokeStyle = 'rgba(200,205,215,0.32)'; ctx.strokeRect(PX, PY, PW, PH);
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('far-field amplitude vs angle', PX + PW / 2, PY - 6);
  const thMax = 0.5;
  const yOf = (th) => PY + ((th + thMax) / (2 * thMax)) * PH;
  // analytic sinc envelope (uniform aperture) for reference
  ctx.strokeStyle = 'rgba(232,200,74,0.6)'; ctx.beginPath();
  for (let p = 0; p <= PH; p += 2) { const th = -thMax + (p / PH) * 2 * thMax; const v = apertureAmplitude(th, st.aperture, st.lambda); const X = PX + 4 + v * (PW - 8); p === 0 ? ctx.moveTo(X, PY + p) : ctx.lineTo(X, PY + p); }
  ctx.stroke();
  // numerical array far field
  ctx.strokeStyle = '#7fd6ff'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let p = 0; p <= PH; p += 2) { const th = -thMax + (p / PH) * 2 * thMax; const v = farFieldAmplitude(sources, th, k); const X = PX + 4 + v * (PW - 8); p === 0 ? ctx.moveTo(X, PY + p) : ctx.lineTo(X, PY + p); }
  ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('amplitude', PX + PW / 2, PY + PH + 14);
  ctx.save(); ctx.translate(PX - 7, PY + PH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('angle', 0, 0); ctx.restore();
  ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(232,200,74,0.9)'; ctx.fillText('sinc envelope', PX + 8, PY + 14);
  ctx.fillStyle = '#7fd6ff'; ctx.fillText('array of N', PX + 8, PY + 28);

  rEls['shape'].textContent = st.shape;
  rEls['N sources'].textContent = String(st.N);
  rEls['lambda'].textContent = st.lambda.toFixed(0);
  rEls['aperture a'].textContent = st.aperture.toFixed(0);
  rEls['sim t'].textContent = t.toFixed(1);
}

// controls
function buildSlider(label, min, max, stp, value, key, fmt) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value); rebuild(); render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row); return { inp, val };
}
const shRow = document.createElement('div'); shRow.className = 'row';
const shLab = document.createElement('span'); shLab.className = 'label'; shLab.textContent = 'wavefront';
const shSel = document.createElement('select'); shSel.setAttribute('aria-label', 'wavefront shape');
for (const [v, t2] of [['flat', 'flat aperture'], ['arc', 'concave arc (focus)']]) { const o = document.createElement('option'); o.value = v; o.textContent = t2; shSel.appendChild(o); }
shSel.value = st.shape;
shSel.addEventListener('change', () => { st.shape = shSel.value; rebuild(); render(); });
shRow.appendChild(shLab); shRow.appendChild(shSel); const shsp = document.createElement('span'); shsp.className = 'value'; shRow.appendChild(shsp);
controlsEl.appendChild(shRow);
const cN = buildSlider('N sources', 1, 100, 1, st.N, 'N', v => v.toFixed(0));
const cL = buildSlider('wavelength', 10, 60, 1, st.lambda, 'lambda', v => v.toFixed(0));
const cA = buildSlider('aperture a', 80, 600, 10, st.aperture, 'aperture', v => v.toFixed(0));
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { shape: 'flat', N: 24, lambda: 26, aperture: 300, t: 0, running: 1 });
  shSel.value = 'flat'; cN.inp.value = '24'; cN.val.textContent = '24'; cL.inp.value = '26'; cL.val.textContent = '26'; cA.inp.value = '300'; cA.val.textContent = '300';
  rebuild(); bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render();
});
bPause.addEventListener('click', () => { st.running = st.running ? 0 : 1; bPause.textContent = st.running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!st.running)); });

let lastT = performance.now();
function tick(now) {
  const dr = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.running) st.t += dr * 26;
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  st.t = CAPTURE_NAME ? CAPTURE_FRAC * PERIOD_FR : 0;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const lambda = 8, k = 2 * Math.PI / lambda, a = 140;
  const src = sourcesLine(500, a, 0, 0);
  const thMin = Math.asin(lambda / a);
  let best = 1e9, bestTh = 0;
  for (let th = thMin * 0.6; th <= thMin * 1.4; th += thMin * 0.01) { const v = farFieldAmplitude(src, th, k); if (v < best) { best = v; bestTh = th; } }
  if (Math.abs(bestTh - thMin) > 0.02 || best > 0.05) return { name: 'sinc first minimum', pass: false, msg: `min at ${bestTh.toFixed(3)} vs ${thMin.toFixed(3)}` };
  return { name: 'aperture first zero at sin th = lambda/a', pass: true, msg: `|dtheta|=${Math.abs(bestTh - thMin).toExponential(1)}` };
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
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
