// Lattice-Boltzmann fluid painter. A D2Q9 BGK channel flow (sim.js,
// DOM-free, exercised by invariants.test.mjs): steady inflow on the
// left, zero-gradient outflow on the right, half-way bounce-back at
// user-drawn obstacles. Click-drag paints obstacles into the stream
// and the flow reroutes live.
//
// The interactive regime is the STEADY laminar wake: at the stable
// relaxation window (tau >= 0.56) the BGK solver settles to a steady
// recirculation behind a bluff body, not an unsteady von Karman
// street. Sustained vortex shedding needs a Reynolds number this
// explicit, single-relaxation-time scheme cannot hold without
// diverging, so the card shows what it actually computes: the
// stagnation point, the flow accelerating around the shoulders, the
// shear layers bounding the wake, and the downstream velocity
// deficit. The companion Navier-Stokes card (FIS3025) carries the
// shedding street with a confinement-stabilised projection solver.
//
// The field is letterboxed at its true 2:1 aspect (a full-canvas
// stretch used to distort the round cylinder into a tall ellipse),
// coloured by speed or signed vorticity, with dye streaklines
// advected through the real velocity field and two quantitative
// wake profiles below.

import { createLBM, step as lbmStep, macro, addCircle, reset as lbmReset, fluidMass } from './sim.js';
import { viridis, divBlack } from '../../../shared/js/render/colormaps.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant') || { textContent: '' };
const readoutFrame = document.getElementById('readout-frame') || { textContent: '' };
const controlsEl   = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const NX = 192, NY = 96;
const D_OBST = 18;                       // default cylinder diameter (cells)

// Deterministic capture: a fraction-proportional warm-up so the five
// reference frames show the wake establishing from rest.
const CAP_WARMUP = 20;
const CAP_MAX = 1100;

// Colour calibration (measured from the developed default field):
// free stream |u| ~ 0.10, shoulder peak ~ 0.16, so VMAX = 0.17 keeps
// the stream mid-viridis and saturates the accelerated shoulders. The
// vorticity is concentrated in thin shear layers (95th percentile
// ~ 5e-3), so VORT_SCALE = 0.025 makes those layers read boldly while
// the irrotational free stream stays near the diverging-map centre.
const VMAX = 0.17;
const VORT_SCALE = 0.025;

const st = {
  tau: 0.57,
  uIn: 0.10,
  field: params.get('field') === 'vorticity' ? 'vorticity' : 'speed',
  tracer: true,
  running: !(DETERMINISTIC || prefersReducedMotion()),
};

const s = createLBM(NX, NY, { tau: st.tau, uIn: st.uIn, uClamp: 0.17 });
function freshFlow() {
  lbmReset(s);
  s.obstacle.fill(0);
  addCircle(s, Math.round(NX / 4), Math.round(NY / 2), D_OBST / 2);
  dye.fill(0);
  seedDye();
}

// Offscreen field buffer, blitted (smoothed) into the letterbox so the
// 192x96 grid renders as a clean continuous field, cylinder round.
const offCanvas = document.createElement('canvas');
offCanvas.width = NX; offCanvas.height = NY;
const offCtx = offCanvas.getContext('2d');
let off = null;

// Reused per-frame macroscopic velocity buffers (one macro() pass per
// render; vorticity is finite-differenced from these, not 4 macro()
// calls per cell).
const uxF = new Float64Array(NX * NY);
const uyF = new Float64Array(NX * NY);

// Passive dye for streaklines, semi-Lagrangian advected through uxF/uyF.
let dye  = new Float64Array(NX * NY);
let dye2 = new Float64Array(NX * NY);
function seedDye() {
  // Thin streaklines spaced across the inlet so each one is legible as
  // it bends around painted obstacles.
  for (let y = 4; y < NY - 2; y += 8) dye[y * NX + 2] = 1;
}
function sampleDye(field, x, y) {
  if (x < 0) x = 0; else if (x > NX - 1) x = NX - 1;
  if (y < 0) y = 0; else if (y > NY - 1) y = NY - 1;
  const x0 = x | 0, y0 = y | 0;
  const x1 = Math.min(NX - 1, x0 + 1), y1 = Math.min(NY - 1, y0 + 1);
  const fx = x - x0, fy = y - y0;
  const a = field[y0 * NX + x0], b = field[y0 * NX + x1];
  const c = field[y1 * NX + x0], d = field[y1 * NX + x1];
  return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
}
function advectDye(dt) {
  for (let y = 0; y < NY; y += 1) {
    for (let x = 0; x < NX; x += 1) {
      const i = y * NX + x;
      if (s.obstacle[i]) { dye2[i] = 0; continue; }
      const xp = x - uxF[i] * dt;
      const yp = y - uyF[i] * dt;
      dye2[i] = sampleDye(dye, xp, yp) * 0.996;   // mild fade -> finite streak length
    }
  }
  const tmp = dye; dye = dye2; dye2 = tmp;
  seedDye();
}

function computeField() {
  for (let i = 0; i < NX * NY; i += 1) {
    const m = macro(s, i);
    uxF[i] = m.ux; uyF[i] = m.uy;
  }
}
function vortAt(x, y) {
  const xm = x > 0 ? x - 1 : 0, xp = x < NX - 1 ? x + 1 : NX - 1;
  const ym = y > 0 ? y - 1 : 0, yp = y < NY - 1 ? y + 1 : NY - 1;
  return 0.5 * ((uyF[y * NX + xp] - uyF[y * NX + xm]) - (uxF[yp * NX + x] - uxF[ym * NX + x]));
}

// --- Letterbox geometry --------------------------------------------------
const TOP_H = 150;                                   // title + colour scale band
const BLIT = { x: 0, y: TOP_H, w: W, h: Math.round(W * NY / NX) };  // 820 x 410
const FIELD_BOT = BLIT.y + BLIT.h;                   // 560
let peakSpeed = 0;

function reynolds() { return st.uIn * D_OBST / ((st.tau - 0.5) / 3); }

function paintField() {
  if (!off) off = offCtx.createImageData(NX, NY);
  const d = off.data;
  const vort = st.field === 'vorticity';
  peakSpeed = 0;
  for (let y = 0; y < NY; y += 1) {
    for (let x = 0; x < NX; x += 1) {
      const i = y * NX + x, j = i * 4;
      if (s.obstacle[i]) { d[j] = 24; d[j + 1] = 26; d[j + 2] = 32; d[j + 3] = 255; continue; }
      const sp = Math.hypot(uxF[i], uyF[i]);
      if (sp > peakSpeed) peakSpeed = sp;
      let c;
      if (vort) {
        const t = Math.max(0, Math.min(1, 0.5 + 0.5 * vortAt(x, y) / VORT_SCALE));
        c = divBlack(t);
      } else {
        c = viridis(Math.min(1, sp / VMAX));
      }
      d[j] = c.r; d[j + 1] = c.g; d[j + 2] = c.b; d[j + 3] = 255;
    }
  }
  if (st.tracer) {
    for (let i = 0; i < NX * NY; i += 1) {
      if (dye[i] > 0.04 && !s.obstacle[i]) {
        const a = Math.min(1, dye[i]), j = i * 4;
        d[j]     = 246 * a + d[j]     * (1 - a);
        d[j + 1] = 248 * a + d[j + 1] * (1 - a);
        d[j + 2] = 255 * a + d[j + 2] * (1 - a);
      }
    }
  }
  offCtx.putImageData(off, 0, 0);
}

function drawHeader() {
  const cbX = 70, cbW = W - 140, cbY = 96, cbH = 24;
  const vort = st.field === 'vorticity';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(222,230,246,0.94)';
  ctx.font = fontString(canvas, 'body', 'mono', 600); ctx.textAlign = 'center';
  ctx.fillText('Lattice-Boltzmann flow past obstacles', W / 2, 44);
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(200,210,235,0.88)';
  ctx.fillText(vort ? 'vorticity  curl u  (red cw, blue ccw)' : 'speed  |u|  in lattice units  (viridis)', cbX, cbY - 8);
  ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(180,190,212,0.9)';
  ctx.fillText(`Re = ${reynolds().toFixed(0)}    tau = ${st.tau.toFixed(2)}`, cbX + cbW, cbY - 8);
  for (let i = 0; i < cbW; i += 1) {
    const t = i / (cbW - 1);
    const c = vort ? divBlack(t) : viridis(t);
    ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
    ctx.fillRect(cbX + i, cbY, 1, cbH);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
  ctx.strokeRect(cbX + 0.5, cbY + 0.5, cbW - 1, cbH - 1);
  ctx.fillStyle = 'rgba(165,175,198,0.85)'; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'left';  ctx.fillText(vort ? `-${VORT_SCALE}` : '0', cbX, cbY + cbH + 15);
  ctx.textAlign = 'right'; ctx.fillText(vort ? `+${VORT_SCALE}` : VMAX.toFixed(2), cbX + cbW, cbY + cbH + 15);
}

// Light 3-point smoothing for the plotted profiles only (removes the
// BGK odd-even checkerboard speckle in the slow wake; the physics field
// is untouched).
function smooth(arr) {
  const out = new Float64Array(arr.length);
  for (let i = 0; i < arr.length; i += 1) {
    const a = arr[Math.max(0, i - 1)], b = arr[i], c = arr[Math.min(arr.length - 1, i + 1)];
    out[i] = 0.25 * a + 0.5 * b + 0.25 * c;
  }
  return out;
}

// Diagnostic 1: transverse speed profile just behind the body. The deep
// central notch is the momentum deficit the wake carves into the flow.
function drawWakeDeficit() {
  const bx0 = 70, bw = W - 140, by0 = 588, bh = 196;
  const xCol = Math.round(NX * 0.35);
  ctx.fillStyle = 'rgba(120,170,235,0.05)'; ctx.fillRect(bx0, by0, bw, bh);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.strokeRect(bx0 + 0.5, by0 + 0.5, bw - 1, bh - 1);
  ctx.fillStyle = 'rgba(205,214,238,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('transverse |u|(y) at x = 0.35 L   (central dip = wake deficit; dashed = inflow U)', bx0, by0 - 8);
  const prof = new Float64Array(NY);
  for (let y = 0; y < NY; y += 1) { const i = y * NX + xCol; prof[y] = s.obstacle[i] ? 0 : Math.hypot(uxF[i], uyF[i]); }
  const sm = smooth(prof);
  const PX = (y) => bx0 + (y / (NY - 1)) * bw;
  const PY = (v) => by0 + bh - 8 - Math.max(0, Math.min(1, v / VMAX)) * (bh - 18);
  ctx.strokeStyle = 'rgba(120,135,160,0.45)'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(bx0, PY(st.uIn)); ctx.lineTo(bx0 + bw, PY(st.uIn)); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2; ctx.beginPath();
  for (let y = 0; y < NY; y += 1) { const px = PX(y), py = PY(sm[y]); y ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke();
}

// Diagnostic 2: speed along the centreline. The flow stagnates to ~0
// at the upstream face, accelerates around the body, then recovers
// downstream as the wake closes.
function drawCenterline() {
  const bx0 = 70, bw = W - 140, by0 = 820, bh = 192;
  const yc = Math.round(NY / 2);
  ctx.fillStyle = 'rgba(120,170,235,0.05)'; ctx.fillRect(bx0, by0, bw, bh);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.strokeRect(bx0 + 0.5, by0 + 0.5, bw - 1, bh - 1);
  ctx.fillStyle = 'rgba(205,214,238,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('centreline |u|(x) along the flow   (stagnates at the body, recovers downstream)', bx0, by0 - 8);
  const prof = new Float64Array(NX);
  for (let x = 0; x < NX; x += 1) { const i = yc * NX + x; prof[x] = s.obstacle[i] ? 0 : Math.hypot(uxF[i], uyF[i]); }
  const sm = smooth(prof);
  const PX = (x) => bx0 + (x / (NX - 1)) * bw;
  const PY = (v) => by0 + bh - 8 - Math.max(0, Math.min(1, v / VMAX)) * (bh - 18);
  ctx.strokeStyle = 'rgba(120,135,160,0.45)'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(bx0, PY(st.uIn)); ctx.lineTo(bx0 + bw, PY(st.uIn)); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#f6c453'; ctx.lineWidth = 2; ctx.beginPath();
  for (let x = 0; x < NX; x += 1) { const px = PX(x), py = PY(sm[x]); x ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke();
  // mark the obstacle band
  let xa = NX, xb = 0;
  for (let x = 0; x < NX; x += 1) if (s.obstacle[yc * NX + x]) { if (x < xa) xa = x; if (x > xb) xb = x; }
  if (xb >= xa) {
    ctx.fillStyle = 'rgba(120,130,150,0.18)';
    ctx.fillRect(PX(xa), by0 + 1, PX(xb) - PX(xa), bh - 2);
  }
}

function render() {
  computeField();
  paintField();
  ctx.fillStyle = '#06070a'; ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(offCanvas, 0, 0, NX, NY, BLIT.x, BLIT.y, BLIT.w, BLIT.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1;
  ctx.strokeRect(BLIT.x + 0.5, BLIT.y + 0.5, BLIT.w - 1, BLIT.h - 1);
  drawHeader();
  drawWakeDeficit();
  drawCenterline();
}

// --- Obstacle painting ---------------------------------------------------
let drawing = false;
canvas.addEventListener('pointerdown', (e) => { drawing = true; modifyAt(e); });
canvas.addEventListener('pointermove', (e) => { if (drawing) modifyAt(e); });
window.addEventListener('pointerup', () => { drawing = false; });
function modifyAt(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = (e.clientX - rect.left) / rect.width * W;
  const sy = (e.clientY - rect.top) / rect.height * H;
  if (sy < BLIT.y || sy > FIELD_BOT) return;          // clicks land only on the flow field
  const x = Math.floor((sx - BLIT.x) / BLIT.w * NX);
  const y = Math.floor((sy - BLIT.y) / BLIT.h * NY);
  const erase = e.shiftKey;
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const xx = x + dx, yy = y + dy;
      if (xx < 1 || xx >= NX - 1 || yy < 1 || yy >= NY - 1) continue;
      s.obstacle[yy * NX + xx] = erase ? 0 : 1;
    }
  }
}

// --- Controls ------------------------------------------------------------
function buildControls() {
  controlsEl.innerHTML = '';
  function slider(id, label, min, max, step_, value, onInput, fmt = v => v.toFixed(2)) {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
    const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
    inp.min = String(min); inp.max = String(max); inp.step = String(step_); inp.value = String(value);
    inp.setAttribute('aria-label', label);
    const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
    inp.addEventListener('input', () => { const v = parseFloat(inp.value); val.textContent = fmt(v); onInput(v); });
    row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
    controlsEl.appendChild(row);
  }
  function select(id, label, options, value, onChange) {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
    const sel = document.createElement('select'); sel.id = id; sel.setAttribute('aria-label', label);
    for (const o of options) { const op = document.createElement('option'); op.value = o.value; op.textContent = o.text; if (o.value === value) op.selected = true; sel.appendChild(op); }
    const val = document.createElement('span'); val.className = 'value'; val.textContent = '';
    sel.addEventListener('change', () => onChange(sel.value));
    row.appendChild(lab); row.appendChild(sel); row.appendChild(val);
    controlsEl.appendChild(row);
  }
  // Inflow speed sets the Reynolds number with the obstacle size and viscosity.
  slider('uin', 'inflow U', 0.04, 0.14, 0.005, st.uIn, v => { st.uIn = v; s.uIn = v; });
  // Floor tau at 0.56 (nu = 0.02): below this BGK LBM is unconditionally
  // unstable for user-drawn high-Re geometry and diverges.
  slider('tau', 'viscosity tau', 0.56, 0.9, 0.01, Math.max(0.56, st.tau), v => { st.tau = Math.max(0.56, v); s.tau = st.tau; });
  select('field', 'field', [{ value: 'speed', text: 'speed |u|' }, { value: 'vorticity', text: 'vorticity' }], st.field, v => { st.field = v; });
  select('tracer', 'dye streaklines', [{ value: 'on', text: 'on' }, { value: 'off', text: 'off' }], st.tracer ? 'on' : 'off', v => { st.tracer = v === 'on'; if (st.tracer) seedDye(); });

  const row = document.createElement('div'); row.className = 'row buttons';
  const clear = document.createElement('button'); clear.type = 'button'; clear.textContent = 'Clear obstacles';
  clear.addEventListener('click', () => { s.obstacle.fill(0); });
  const reset = document.createElement('button'); reset.type = 'button'; reset.textContent = 'Reset flow';
  reset.addEventListener('click', () => { freshFlow(); });
  row.appendChild(clear); row.appendChild(reset); controlsEl.appendChild(row);
  const tip = document.createElement('div'); tip.className = 'row';
  tip.innerHTML = '<span class="label">Tip</span><span class="value">Click-drag to draw; shift-drag to erase.</span>';
  controlsEl.appendChild(tip);
}
buildControls();

function updateReadout() {
  readoutInv.textContent = `Re=${reynolds().toFixed(0)}  tau=${st.tau.toFixed(2)}  steps=${s.steps}  mass=${fluidMass(s).toFixed(1)}`;
  readoutFrame.textContent = String(s.steps);
}

freshFlow();

function tick() {
  if (st.running) {
    for (let i = 0; i < 4; i += 1) lbmStep(s);
    if (s.steps % 16 === 0) {
      const m = fluidMass(s);
      if (!Number.isFinite(m) || m <= 0) freshFlow();        // self-heal extreme geometry
    }
    computeField();
    advectDye(4);
  }
  render();
  if (s.steps % 16 === 0) updateReadout();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

if (DETERMINISTIC) {
  const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
  const nSteps = Math.round(CAP_WARMUP + frac * (CAP_MAX - CAP_WARMUP));
  for (let i = 0; i < nSteps; i += 1) lbmStep(s);
  computeField();
  for (let i = 0; i < 420; i += 1) advectDye(3);             // build streaklines across the developed field
  render();
  updateReadout();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  requestAnimationFrame(tick);
}

// Headless physics smoke check (mass finite and bounded over a short
// closed run); rigorous invariants live in invariants.test.mjs.
window.__physicsCheck = async () => {
  const t = createLBM(NX, NY, { tau: 0.6, uIn: 0.10 });
  const m0 = fluidMass(t);
  for (let i = 0; i < 50; i += 1) lbmStep(t);
  const m1 = fluidMass(t);
  const ok = Number.isFinite(m1) && m1 > 0 && Math.abs(m1 - m0) / m0 < 0.05;
  return { name: 'D2Q9 mass bounded', pass: ok, msg: `fluid mass ${m0.toFixed(1)} -> ${m1.toFixed(1)} over 50 steps` };
};

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const rho_avg = fluidMass(s) / (s.NX * s.NY);
  return {
    fields: [
      { key: 'reynolds', label: 'Reynolds number Re', value: reynolds(), format: 'float' },
      { key: 'inlet-velocity', label: 'inflow U (lattice)', value: st.uIn, format: 'float' },
      { key: 'relaxation-tau', label: 'relaxation time tau', value: st.tau, format: 'float' },
      { key: 'peak-speed', label: 'peak speed |u|', value: peakSpeed, format: 'float' },
      { key: 'mean-density', label: 'mean density rho', value: rho_avg, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const nu = (st.tau - 0.5) / 3;
  const rho_avg = fluidMass(s) / (s.NX * s.NY);
  return [
    {
      key: 'viscosity-positive',
      label: 'viscosity nu = (tau - 1/2)/3 > 0',
      value: nu.toFixed(3),
      status: nu > 0 ? 'pass' : 'drift',
    },
    {
      key: 'mass-conserved',
      label: 'mean density ~ 1 (mass conserved)',
      value: rho_avg.toFixed(3),
      status: Math.abs(rho_avg - 1) < 0.05 ? 'pass' : 'pending',
    },
  ];
};
