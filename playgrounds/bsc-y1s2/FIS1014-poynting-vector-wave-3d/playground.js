// Plane EM wave in a 3D oblique-projected scene. The E (red/blue) and
// B (orange) field vectors are drawn along the propagation axis with
// their tip-ribbons; the white Poynting arrows show the energy flux;
// moving ghost planes are the wavefronts. Drag to orbit. The exact
// closed-form fields come from the headless sim.js.
// Reference: Griffiths, Introduction to Electrodynamics (4th ed.),
// Sec. 9.2; Jackson, Classical Electrodynamics, Ch. 7.

import { fields, avgPoynting, dot, norm } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['mode', 'λ', '⟨S⟩', 'E·B', 'state'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}

const st = { mode: 'linear', lambda: 3.0, E0: 1.0, pol: 0, t: 0, yaw: -0.7, pitch: 0.42 };
let running = true;

function selectRow(label, opts, value, onChange) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const s = document.createElement('select'); s.setAttribute('aria-label', label);
  for (const [v, t] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = t; s.appendChild(o); }
  s.value = value; s.addEventListener('change', () => { onChange(s.value); });
  row.appendChild(lab); row.appendChild(s); const sp = document.createElement('span'); sp.className = 'value'; row.appendChild(sp);
  controlsEl.appendChild(row); return s;
}
function slider(label, min, max, stp, val, key, fmt = v => v.toFixed(2)) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(val); inp.setAttribute('aria-label', label);
  const vEl = document.createElement('span'); vEl.className = 'value'; vEl.textContent = fmt(+val);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); vEl.textContent = fmt(+inp.value); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(vEl);
  controlsEl.appendChild(row); return { inp, vEl };
}
const selM = selectRow('mode', [['linear', 'linear'], ['circular', 'circular (helix)'], ['elliptical', 'elliptical'], ['standing', 'standing wave']], st.mode, v => { st.mode = v; });
const cL = slider('wavelength λ', 1.2, 6, 0.1, st.lambda, 'lambda', v => v.toFixed(1));
const cA = slider('amplitude E₀', 0.3, 2, 0.05, st.E0, 'E0');
const cP = slider('pol angle (deg)', 0, 180, 1, 0, 'polDeg', v => v.toFixed(0));
cP.inp.addEventListener('input', () => { st.pol = st.polDeg * Math.PI / 180; });
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => { Object.assign(st, { mode: 'linear', lambda: 3.0, E0: 1.0, pol: 0, polDeg: 0, t: 0, yaw: -0.7, pitch: 0.42 }); selM.value = 'linear'; cL.inp.value = '3'; cL.vEl.textContent = '3.0'; cA.inp.value = '1'; cA.vEl.textContent = '1.00'; cP.inp.value = '0'; cP.vEl.textContent = '0'; running = true; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); });
bPause.addEventListener('click', () => { running = !running; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running)); });

// Drag to orbit.
let drag = false, lx = 0, ly = 0;
canvas.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; ly = e.clientY; canvas.classList.add('dragging'); });
canvas.addEventListener('pointermove', e => { if (!drag) return; st.yaw += (e.clientX - lx) * 0.006; st.pitch = Math.max(-1.3, Math.min(1.3, st.pitch + (e.clientY - ly) * 0.006)); lx = e.clientX; ly = e.clientY; });
window.addEventListener('pointerup', () => { drag = false; canvas.classList.remove('dragging'); });

// Project a world point (x,y,z) -> screen, with yaw about y and pitch
// about x, then orthographic. z is the propagation axis.
function proj(x, y, z) {
  const cy = Math.cos(st.yaw), sy = Math.sin(st.yaw);
  let X = x * cy + z * sy, Z = -x * sy + z * cy, Y = y;
  const cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
  const Y2 = Y * cp - Z * sp;
  return [canvas.width / 2 + X * SCALE, canvas.height / 2 - Y2 * SCALE - 10];
}
const SCALE = 40;
function arrow(p0, p1, col, w) {
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
  const a = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
  ctx.beginPath(); ctx.moveTo(p1[0], p1[1]);
  ctx.lineTo(p1[0] - 8 * Math.cos(a - 0.4), p1[1] - 8 * Math.sin(a - 0.4));
  ctx.lineTo(p1[0] - 8 * Math.cos(a + 0.4), p1[1] - 8 * Math.sin(a + 0.4));
  ctx.closePath(); ctx.fill();
}

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, W, H);
  const k = 2 * Math.PI / st.lambda;
  const Zmax = 7, Zmin = -7;
  const par = { mode: st.mode, k, E0: st.E0, pol: st.pol };

  // Propagation axis.
  arrow(proj(0, 0, Zmin), proj(0, 0, Zmax + 0.6), 'rgba(150,156,166,0.7)', 1.5);
  const za = proj(0, 0, Zmax + 0.9);
  ctx.fillStyle = 'rgba(5,6,10,0.8)'; ctx.fillRect(za[0] - 34, za[1] - 40, 132, 18);
  ctx.fillStyle = '#cdd1d6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('z (propagation)', za[0] - 30, za[1] - 27);

  // Moving wavefront planes (equiphase squares).
  const w = k;                              // omega = c k, c = 1
  for (let m = -3; m <= 3; m += 1) {
    const zf = ((w * st.t / k) + m * st.lambda) % (Zmax - Zmin);
    const z = Zmin + ((zf % (Zmax - Zmin)) + (Zmax - Zmin)) % (Zmax - Zmin);
    ctx.strokeStyle = 'rgba(120,150,210,0.18)';
    const c1 = proj(-1.6, -1.6, z), c2 = proj(1.6, -1.6, z), c3 = proj(1.6, 1.6, z), c4 = proj(-1.6, 1.6, z);
    ctx.beginPath(); ctx.moveTo(c1[0], c1[1]); ctx.lineTo(c2[0], c2[1]); ctx.lineTo(c3[0], c3[1]); ctx.lineTo(c4[0], c4[1]); ctx.closePath(); ctx.stroke();
  }

  // Sample the wave: E ribbon, B ribbon, S arrows.
  const NS = 90;
  const eTips = [], bTips = [];
  for (let i = 0; i <= NS; i += 1) {
    const z = Zmin + (Zmax - Zmin) * i / NS;
    const { E, B } = fields(z, st.t, par);
    eTips.push(proj(E[0], E[1], z));
    bTips.push(proj(B[0], B[1], z));
  }
  // E ribbon (sign-coloured) and stems every few samples.
  for (let i = 1; i <= NS; i += 1) {
    const z = Zmin + (Zmax - Zmin) * i / NS;
    const { E } = fields(z, st.t, par);
    const sgn = (E[0] * Math.cos(st.pol) + E[1] * Math.sin(st.pol)) >= 0;
    ctx.strokeStyle = sgn ? 'rgba(239,71,111,0.85)' : 'rgba(91,160,255,0.85)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(eTips[i - 1][0], eTips[i - 1][1]); ctx.lineTo(eTips[i][0], eTips[i][1]); ctx.stroke();
    if (i % 7 === 0) { const ax = proj(0, 0, z); arrow(ax, eTips[i], sgn ? '#ef476f' : '#5ba0ff', 1.5); }
  }
  // B ribbon (orange) + stems.
  ctx.strokeStyle = '#ffb24d'; ctx.lineWidth = 2; ctx.beginPath();
  bTips.forEach((p, i) => { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke();
  for (let i = 7; i <= NS; i += 7) { const z = Zmin + (Zmax - Zmin) * i / NS; arrow(proj(0, 0, z), bTips[i], 'rgba(255,178,77,0.8)', 1.3); }
  // Poynting arrows along +z.
  for (let i = 6; i <= NS; i += 12) {
    const z = Zmin + (Zmax - Zmin) * i / NS;
    const { S } = fields(z, st.t, par);
    const mag = Math.min(1.4, Math.hypot(S[0], S[1], S[2]));
    if (mag < 0.02) continue;
    arrow(proj(0, 0, z), proj(0, 0, z + 0.5 + mag * 0.6), 'rgba(255,255,255,0.8)', 2);
  }

  // Probe point readout.
  const { E, B, S } = fields(0, st.t, par);
  rEls.mode.textContent = st.mode;
  rEls['λ'].textContent = st.lambda.toFixed(2);
  rEls['⟨S⟩'].textContent = (st.mode === 'standing' ? 0 : avgPoynting(st.E0)).toFixed(3);
  rEls['E·B'].textContent = dot(E, B).toExponential(1);
  rEls.state.textContent = st.mode === 'standing' ? 'standing' : norm(S) > 1e-6 ? 'flux +z' : 'null';
}

function tick() { if (running) st.t += 0.03; render(); requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME) st.t = CAPTURE_FRAC * 6;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}

window.__physicsCheck = async () => {
  for (let i = 0; i < 10; i += 1) {
    const { E, B } = fields(0.6 * i, 0.2 * i, { mode: 'circular', k: 1.2, E0: 1 });
    if (Math.abs(dot(E, B)) > 1e-12) return { name: 'transverse', pass: false, msg: `E.B=${dot(E, B).toExponential(2)}` };
    if (Math.abs(norm(E) - norm(B)) > 1e-6) return { name: '|E|=c|B|', pass: false, msg: `${norm(E)} vs ${norm(B)}` };
  }
  return { name: 'plane wave: E perp B, |E|=c|B|', pass: true, msg: 'transverse and equal-magnitude (c=1 units)' };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
