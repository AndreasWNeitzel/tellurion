// Interactive Laplace solver. The primary canvas is the potential
// field itself: an RdBu image of phi with electric-field streamlines,
// relaxed live by SOR (the same scheme as the headless sim.js). Drag to
// paint conductors; presets and a voltage slider drive it; a view
// selector switches between phi, |E| and equipotential contours.
// Reference: Griffiths, Introduction to Electrodynamics (4th ed.),
// Sec. 2.5; Press et al., Numerical Recipes, Sec. 20.5.

import { createGrid, sweep, fieldAt, maxResidual, applyPreset, setFixed } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const N = 150;
const g = createGrid(N);
const st = { preset: 'plates', volt: 1.0, view: 'phi', brush: '+', t: 0 };
let running = true, residual = 1;

function reseed() {
  applyPreset(g, st.preset);
  // Scale conductor values by the chosen voltage.
  for (let k = 0; k < N * N; k += 1) if (g.fixed[k]) { g.val[k] *= st.volt; g.phi[k] = g.val[k]; }
  residual = 1;
}
reseed();

const READOUTS = ['preset', 'V', 'residual', 'view', 'state'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}
function selectRow(label, opts, value, onChange) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const s = document.createElement('select'); s.setAttribute('aria-label', label);
  for (const [v, t] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = t; s.appendChild(o); }
  s.value = value; s.addEventListener('change', () => onChange(s.value));
  row.appendChild(lab); row.appendChild(s); const sp = document.createElement('span'); sp.className = 'value'; row.appendChild(sp);
  controlsEl.appendChild(row); return s;
}
const selP = selectRow('preset', [['plates', 'parallel plates'], ['coax', 'coaxial cable'], ['dipole', 'dipole'], ['sphere', 'charged sphere']], st.preset, v => { st.preset = v; reseed(); });
const row = document.createElement('div'); row.className = 'row';
const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = 'voltage V';
const vInp = document.createElement('input'); vInp.type = 'range'; vInp.min = '0.2'; vInp.max = '3'; vInp.step = '0.1'; vInp.value = String(st.volt); vInp.setAttribute('aria-label', 'voltage V');
const vVal = document.createElement('span'); vVal.className = 'value'; vVal.textContent = st.volt.toFixed(1);
vInp.addEventListener('input', () => { st.volt = parseFloat(vInp.value); vVal.textContent = st.volt.toFixed(1); reseed(); });
row.appendChild(lab); row.appendChild(vInp); row.appendChild(vVal); controlsEl.appendChild(row);
const selV = selectRow('view', [['phi', 'potential φ (RdBu)'], ['efield', '|E| (inferno)'], ['contour', 'equipotentials']], st.view, v => { st.view = v; });
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bPlus = document.createElement('button'); bPlus.type = 'button'; bPlus.textContent = 'draw +V';
const bMinus = document.createElement('button'); bMinus.type = 'button'; bMinus.textContent = 'draw -V';
const bErase = document.createElement('button'); bErase.type = 'button'; bErase.textContent = 'erase';
bPlus.addEventListener('click', () => { st.brush = '+'; });
bMinus.addEventListener('click', () => { st.brush = '-'; });
bErase.addEventListener('click', () => { st.brush = '0'; });
bRow.appendChild(bPlus); bRow.appendChild(bMinus); bRow.appendChild(bErase); controlsEl.appendChild(bRow);
const b2 = document.createElement('div'); b2.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
const bSpace = document.createElement('span');
b2.appendChild(bReset); b2.appendChild(bPause); b2.appendChild(bSpace); controlsEl.appendChild(b2);
bReset.addEventListener('click', () => { st.preset = 'plates'; st.volt = 1; selP.value = 'plates'; vInp.value = '1'; vVal.textContent = '1.0'; reseed(); running = true; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); });
bPause.addEventListener('click', () => { running = !running; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running)); });

// Mouse painting of conductors.
function paintAt(cx, cy) {
  const i = Math.round(cx / canvas.width * (N - 1)), j = Math.round(cy / canvas.height * (N - 1));
  const v = st.brush === '+' ? st.volt : st.brush === '-' ? -st.volt : 0;
  const R = 6;
  for (let dj = -R; dj <= R; dj += 1) for (let di = -R; di <= R; di += 1) {
    if (di * di + dj * dj > R * R) continue;
    const ii = i + di, jj = j + dj; if (ii < 1 || jj < 1 || ii >= N - 1 || jj >= N - 1) continue;
    const k = jj * N + ii;
    if (st.brush === '0') { g.fixed[k] = 0; g.val[k] = 0; } else { g.fixed[k] = 1; g.val[k] = v; g.phi[k] = v; }
  }
  residual = 1;
}
let drawing = false;
canvas.addEventListener('pointerdown', e => { drawing = true; const r = canvas.getBoundingClientRect(); paintAt((e.clientX - r.left) * canvas.width / r.width, (e.clientY - r.top) * canvas.height / r.height); });
canvas.addEventListener('pointermove', e => { if (!drawing) return; const r = canvas.getBoundingClientRect(); paintAt((e.clientX - r.left) * canvas.width / r.width, (e.clientY - r.top) * canvas.height / r.height); });
window.addEventListener('pointerup', () => { drawing = false; });

const img = ctx.createImageData(N, N);
// Diverging RdBu through a near-white centre, continuous at 0.
const C_POS = [178, 24, 43], C_MID = [244, 244, 248], C_NEG = [33, 102, 172];
function rdbu(t) {
  const a = Math.max(-1, Math.min(1, t));
  const e = Math.sign(a) * Math.pow(Math.abs(a), 0.7);   // perceptual ramp
  const [A, B] = e >= 0 ? [C_MID, C_POS] : [C_MID, C_NEG];
  const f = Math.abs(e);
  return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f];
}
function inferno(t) {
  const a = Math.max(0, Math.min(1, t));
  return [20 + 235 * Math.pow(a, 0.8), 14 + 120 * a * a, 50 + 110 * a * (1 - a) * 2];
}

function render() {
  const W = canvas.width, H = canvas.height;
  let vmax = 1e-6;
  for (let k = 0; k < N * N; k += 1) vmax = Math.max(vmax, Math.abs(g.phi[k]));
  for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) {
    const k = j * N + i; let c;
    if (st.view === 'efield') {
      const ii = Math.max(1, Math.min(N - 2, i)), jj = Math.max(1, Math.min(N - 2, j));
      const [ex, ey] = fieldAt(g, ii, jj); const m = Math.hypot(ex, ey);
      c = inferno(Math.min(1, m / (0.06 * vmax + 1e-6)));
    } else if (st.view === 'contour') {
      const band = Math.abs((g.phi[k] / vmax * 8) % 1);
      const s = band < 0.12 ? 1 : 0.16;
      c = [s * 230, s * 235, s * 245];
    } else {
      c = rdbu(g.phi[k] / vmax);
    }
    if (g.fixed[k]) { c = g.val[k] > 0 ? [255, 120, 110] : g.val[k] < 0 ? [110, 150, 255] : [150, 156, 166]; }
    const o = k * 4; img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
  }
  // Upscale the NxN field to the canvas.
  const off = render._off || (render._off = (() => { const cc = document.createElement('canvas'); cc.width = N; cc.height = N; return cc; })());
  off.getContext('2d').putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, 0, 0, W, H);

  // Streamlines of E = -grad phi (only meaningful for phi/efield views).
  if (st.view !== 'contour') {
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
    const ph = (st.t * 0.6) % 1;
    for (let sy = 6; sy < N; sy += 9) for (let sx = 6; sx < N; sx += 9) {
      let x = sx + 0.001, y = sy + (ph * 9 - 4.5);
      ctx.beginPath(); ctx.moveTo(x / N * W, y / N * H);
      for (let s = 0; s < 16; s += 1) {
        const i = Math.max(1, Math.min(N - 2, Math.round(x))), j = Math.max(1, Math.min(N - 2, Math.round(y)));
        const [ex, ey] = fieldAt(g, i, j); const m = Math.hypot(ex, ey) || 1e-9;
        x += ex / m * 1.4; y += ey / m * 1.4;
        if (x < 1 || y < 1 || x > N - 2 || y > N - 2) break;
        ctx.lineTo(x / N * W, y / N * H);
      }
      ctx.stroke();
    }
  }

  rEls.preset.textContent = st.preset;
  rEls.V.textContent = st.volt.toFixed(2);
  rEls.residual.textContent = residual.toExponential(1);
  rEls.view.textContent = st.view;
  rEls.state.textContent = residual < 2e-3 ? 'converged' : 'relaxing';
}

function tick(now) {
  if (running) {
    st.t += 0.016;
    for (let s = 0; s < 14; s += 1) residual = sweep(g, 1.92);
  }
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  // Relax to convergence for a deterministic captured frame.
  const sweeps = CAPTURE_NAME ? 600 + Math.round(CAPTURE_FRAC * 1200) : 0;
  for (let s = 0; s < sweeps; s += 1) residual = sweep(g, 1.92);
  st.t = CAPTURE_NAME ? CAPTURE_FRAC * 2 : 0;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}

window.__physicsCheck = async () => {
  const tg = createGrid(96);
  for (let i = 0; i < 96; i += 1) { setFixed(tg, i, 0, 0); setFixed(tg, i, 95, 0); setFixed(tg, 0, i, 0); setFixed(tg, 95, i, 0); }
  for (let j = 12; j < 84; j += 1) { setFixed(tg, 30, j, 1); setFixed(tg, 66, j, -1); }
  for (let s = 0; s < 4000; s += 1) sweep(tg, 1.92);
  const [ex] = fieldAt(tg, 48, 48);
  const analytic = 2 / 36;
  const err = Math.abs(Math.abs(ex) - analytic) / analytic;
  if (err > 0.01) return { name: 'parallel-plate E=V/d', pass: false, msg: `err=${(err * 100).toFixed(2)}%` };
  return { name: 'Laplace SOR: parallel-plate E=V/d within 1%', pass: true, msg: `E=${Math.abs(ex).toFixed(4)} vs ${analytic.toFixed(4)}` };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
