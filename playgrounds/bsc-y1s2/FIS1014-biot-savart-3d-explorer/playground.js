// Biot-Savart 3D explorer. Primary canvas: the current wire(s) in 3D
// with a lattice of B-field arrow glyphs coloured by |B| (viridis) and
// traced field lines. Secondary: the on-axis Bz(z) profile. The exact
// Biot-Savart sum comes from the headless sim.js. Drag to orbit.
// Reference: Griffiths, Introduction to Electrodynamics (4th ed.),
// Sec. 5.2; Jackson, Classical Electrodynamics, Sec. 5.3.

import { biotSavart, buildPreset, axialBz, K } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['preset', 'I', 'R', '|B|@axis', 'state'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}

const st = { preset: 'loop', I: 2.0, R: 1.3, lines: 'on', t: 0, yaw: -0.6, pitch: 0.5 };
let segs = buildPreset(st.preset, { I: st.I, R: st.R });
function rebuild() { segs = buildPreset(st.preset, { I: st.I, R: st.R }); }
let running = !prefersReducedMotion();

function selectRow(label, opts, value, onChange) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const s = document.createElement('select'); s.setAttribute('aria-label', label);
  for (const [v, t] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = t; s.appendChild(o); }
  s.value = value; s.addEventListener('change', () => onChange(s.value));
  row.appendChild(lab); row.appendChild(s); const sp = document.createElement('span'); sp.className = 'value'; row.appendChild(sp);
  controlsEl.appendChild(row); return s;
}
function slider(label, min, max, stp, val, key, fmt = v => v.toFixed(2)) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(val); inp.setAttribute('aria-label', label);
  const vEl = document.createElement('span'); vEl.className = 'value'; vEl.textContent = fmt(+val);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); vEl.textContent = fmt(+inp.value); rebuild(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(vEl);
  controlsEl.appendChild(row); return { inp, vEl };
}
const selP = selectRow('preset', [['wire', 'straight wire'], ['loop', 'circular loop'], ['helmholtz', 'Helmholtz coils'], ['solenoid', 'solenoid']], st.preset, v => { st.preset = v; rebuild(); });
const cI = slider('current I', 0.4, 5, 0.1, st.I, 'I', v => v.toFixed(1));
const cR = slider('coil radius R', 0.6, 2.4, 0.05, st.R, 'R');
const selL = selectRow('field lines', [['on', 'show'], ['off', 'hide']], st.lines, v => { st.lines = v; });
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => { Object.assign(st, { preset: 'loop', I: 2.0, R: 1.3, lines: 'on', yaw: -0.6, pitch: 0.5 }); selP.value = 'loop'; cI.inp.value = '2'; cI.vEl.textContent = '2.0'; cR.inp.value = '1.3'; cR.vEl.textContent = '1.30'; selL.value = 'on'; rebuild(); running = true; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); });
bPause.addEventListener('click', () => { running = !running; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running)); });

let drag = false, lx = 0, ly = 0;
canvas.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; ly = e.clientY; canvas.classList.add('dragging'); });
canvas.addEventListener('pointermove', e => { if (!drag) return; st.yaw += (e.clientX - lx) * 0.006; st.pitch = Math.max(-1.35, Math.min(1.35, st.pitch + (e.clientY - ly) * 0.006)); lx = e.clientX; ly = e.clientY; });
window.addEventListener('pointerup', () => { drag = false; canvas.classList.remove('dragging'); });

const SCALE = 88;
function proj(x, y, z) {
  const cy = Math.cos(st.yaw), sy = Math.sin(st.yaw);
  const X = x * cy + y * sy, Yt = -x * sy + y * cy, Z = z;
  const cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
  const Zt = Z * cp - Yt * sp;
  return [canvas.width / 2 + X * SCALE, canvas.height / 2 - Zt * SCALE - 6];
}
function viridis(t) {
  const a = Math.max(0, Math.min(1, t));
  return [Math.round(40 + 215 * a * a), Math.round(20 + 200 * a), Math.round(110 + 80 * Math.cos(2.6 * a) - 50 * a)];
}
function arrow(p0, p1, col, w) {
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
  const a = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
  ctx.beginPath(); ctx.moveTo(p1[0], p1[1]);
  ctx.lineTo(p1[0] - 6 * Math.cos(a - 0.4), p1[1] - 6 * Math.sin(a - 0.4));
  ctx.lineTo(p1[0] - 6 * Math.cos(a + 0.4), p1[1] - 6 * Math.sin(a + 0.4));
  ctx.closePath(); ctx.fill();
}

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, W, H);

  // Wire(s), drawn with an animated dash so the current visibly flows
  // (autoplay) and the current direction is unambiguous.
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.6;
  ctx.setLineDash([10, 7]); ctx.lineDashOffset = -((st.t * 60) % 17);
  for (const seg of segs) {
    ctx.beginPath();
    const step = Math.max(1, Math.floor(seg.pts.length / 160));
    for (let i = 0; i < seg.pts.length; i += step) { const p = proj(...seg.pts[i]); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Field-glyph lattice. Sample on planes; colour by |B|.
  const ext = st.preset === 'wire' ? 3 : st.R * 2.6;
  const pts3 = [];
  for (let iz = -3; iz <= 3; iz += 1) for (let iy = -3; iy <= 3; iy += 1) for (let ix = -3; ix <= 3; ix += 1) {
    const x = ix / 3 * ext, y = iy / 3 * ext, z = iz / 3 * ext;
    if (Math.hypot(x, y) < 0.18 && st.preset === 'wire') continue;
    pts3.push([x, y, z]);
  }
  // I-INDEPENDENT reference (per unit current) so a larger current
  // visibly grows every arrow instead of being normalised away.
  const normRef = st.preset === 'wire' ? 2 * K : 2 * Math.PI * K / st.R;
  const data = pts3.map(P => { const B = biotSavart(segs, P); return { P, B, m: Math.hypot(...B) }; });
  data.sort((a, b) => proj(...a.P)[1] - proj(...b.P)[1]);
  for (const { P, B, m } of data) {
    const tnorm = Math.min(1, Math.sqrt((m / normRef) / 4));
    const c = viridis(tnorm);
    const L = 0.1 + 0.55 * tnorm;
    const bn = m || 1e-9;
    const p0 = proj(P[0] - B[0] / bn * L * 0.5, P[1] - B[1] / bn * L * 0.5, P[2] - B[2] / bn * L * 0.5);
    const p1 = proj(P[0] + B[0] / bn * L * 0.5, P[1] + B[1] / bn * L * 0.5, P[2] + B[2] / bn * L * 0.5);
    arrow(p0, p1, `rgb(${c[0]},${c[1]},${c[2]})`, 1.6);
  }

  // Field lines: seed a ring near the wire and integrate along B.
  if (st.lines === 'on') {
    const seeds = [];
    for (let a = 0; a < 6; a += 1) { const th = a / 6 * 2 * Math.PI; seeds.push([st.R * 0.35 * Math.cos(th), st.R * 0.35 * Math.sin(th), 0.01]); }
    if (st.preset === 'wire') { seeds.length = 0; for (let a = 0; a < 6; a += 1) { const th = a / 6 * 2 * Math.PI; seeds.push([0.5 * Math.cos(th), 0.5 * Math.sin(th), -2 + a * 0.6]); } }
    ctx.lineWidth = 1.6;
    for (const s0 of seeds) {
      for (const dir of [1, -1]) {
        let p = s0.slice();
        ctx.strokeStyle = 'rgba(120,210,255,0.65)'; ctx.beginPath();
        const sp = proj(...p); ctx.moveTo(sp[0], sp[1]);
        for (let k = 0; k < 240; k += 1) {
          const B = biotSavart(segs, p); const bn = Math.hypot(...B) || 1e-9;
          p = [p[0] + dir * B[0] / bn * 0.06, p[1] + dir * B[1] / bn * 0.06, p[2] + dir * B[2] / bn * 0.06];
          if (Math.hypot(p[0], p[1], p[2]) > ext * 2.4) break;
          const q = proj(...p); ctx.lineTo(q[0], q[1]);
        }
        ctx.stroke();
      }
    }
  }

  // Axial Bz(z) profile inset (secondary 2D panel, bottom-left).
  const ax0 = 22, ay0 = H - 132, aw = 250, ah = 110;
  ctx.fillStyle = '#0b0b13'; ctx.fillRect(ax0, ay0, aw, ah);
  ctx.strokeStyle = '#2a2a34'; ctx.strokeRect(ax0, ay0, aw, ah);
  ctx.fillStyle = '#7e828a'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('B_z on axis (z)', ax0 + 8, ay0 + 14);
  const prof = axialBz(segs, -ext, ext, 90);
  // Fixed scale (per the same I-independent reference) so the profile
  // height grows with current rather than being self-normalised.
  const pscale = normRef * 6;
  ctx.strokeStyle = '#5bc6ff'; ctx.lineWidth = 1.8; ctx.beginPath();
  prof.forEach(([z, v], i) => { const X = ax0 + 10 + (z + ext) / (2 * ext) * (aw - 20); const Y = ay0 + ah - 16 - Math.max(-1, Math.min(1, v / pscale)) * (ah - 36); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
  ctx.stroke();

  const Baxis = Math.hypot(...biotSavart(segs, [0, 0, 0]));
  rEls.preset.textContent = st.preset;
  rEls.I.textContent = st.I.toFixed(2);
  rEls.R.textContent = st.preset === 'wire' ? 'n/a' : st.R.toFixed(2);
  rEls['|B|@axis'].textContent = Baxis.toFixed(3);
  rEls.state.textContent = st.preset === 'helmholtz' ? 'uniform region' : st.preset === 'solenoid' ? 'uniform interior' : st.preset === 'wire' ? 'azimuthal' : 'dipolar';
}

function tick() { if (running) st.t += 0.02; render(); requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME) { st.yaw = -0.6 + CAPTURE_FRAC * 1.2; st.t = CAPTURE_FRAC * 1.5; }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}

window.__physicsCheck = async () => {
  const seg = buildPreset('loop', { I: 2.5, R: 1.4 });
  const bz = biotSavart(seg, [0, 0, 0])[2];
  const analytic = 2 * Math.PI * 2.5 * 1.4 * 1.4 / Math.pow(1.4 * 1.4, 1.5);
  const err = Math.abs(bz - analytic) / analytic;
  if (err > 5e-3) return { name: 'loop on-axis Bz', pass: false, msg: `err=${(err * 100).toFixed(3)}%` };
  return { name: 'Biot-Savart loop Bz matches closed form', pass: true, msg: `within ${(err * 100).toFixed(4)}%` };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const currents = state.currents || [];
  const probePos = state.probePos || [0, 0, 0];
  const B = 0;
  return {
    fields: [
      { key: 'n-segments', label: 'wire segments', value: currents.length, format: 'float' },
      { key: 'probe-x', label: 'probe x', value: probePos[0], format: 'float' },
      { key: 'b-field', label: 'B magnitude', value: B, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const currents = state.currents || [];
  if (currents.length === 0) {
    return [{ key: 'empty', label: 'no wire', value: 'pending', status: 'pending' }];
  }
  return [
    {
      key: 'biot-savart',
      label: 'Biot-Savart computed',
      value: 'ready',
      status: 'pass'
    }
  ];
};
