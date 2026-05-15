// Lattice Boltzmann D2Q9 fluid solver (main thread, modest grid for browser).
// Click-drag to draw obstacles; the flow visualizes velocity magnitude.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant');
const readoutFrame = document.getElementById('readout-frame');
const controlsEl   = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const NX = 192, NY = 96;
const cellW = W / NX, cellH = H / NY;

// D2Q9 weights and lattice vectors.
const w  = [4/9, 1/9, 1/9, 1/9, 1/9, 1/36, 1/36, 1/36, 1/36];
const cx = [0,  1, 0, -1,  0,  1, -1, -1,  1];
const cy = [0,  0, 1,  0, -1,  1,  1, -1, -1];
const opp = [0, 3, 4, 1, 2, 7, 8, 5, 6];

let f  = new Float64Array(NX * NY * 9);
let f2 = new Float64Array(NX * NY * 9);
const isObstacle = new Uint8Array(NX * NY);
let tau = 0.6;
const uIn = 0.10;

function init() {
  for (let y = 0; y < NY; y += 1) for (let x = 0; x < NX; x += 1) {
    const idx = (y * NX + x);
    for (let k = 0; k < 9; k += 1) f[idx * 9 + k] = w[k];
  }
  // Initial obstacle: a circle.
  const ox = NX / 4, oy = NY / 2, or = 6;
  for (let y = 0; y < NY; y += 1) for (let x = 0; x < NX; x += 1) {
    if ((x - ox) ** 2 + (y - oy) ** 2 < or * or) isObstacle[y * NX + x] = 1;
  }
}

function step() {
  // Inflow on left edge: equilibrium for (rho, u) = (1, uIn).
  for (let y = 0; y < NY; y += 1) {
    const idx = (y * NX + 0);
    const rho = 1.0, ux = uIn, uy = 0;
    for (let k = 0; k < 9; k += 1) {
      const cu = 3 * (cx[k] * ux + cy[k] * uy);
      f[idx * 9 + k] = w[k] * rho * (1 + cu + 0.5 * cu * cu - 1.5 * (ux * ux + uy * uy));
    }
  }
  // Collision.
  for (let y = 0; y < NY; y += 1) for (let x = 0; x < NX; x += 1) {
    const idx = y * NX + x;
    if (isObstacle[idx]) continue;
    let rho = 0, ux = 0, uy = 0;
    for (let k = 0; k < 9; k += 1) {
      const v = f[idx * 9 + k];
      rho += v;
      ux  += cx[k] * v;
      uy  += cy[k] * v;
    }
    ux /= rho; uy /= rho;
    for (let k = 0; k < 9; k += 1) {
      const cu = 3 * (cx[k] * ux + cy[k] * uy);
      const feq = w[k] * rho * (1 + cu + 0.5 * cu * cu - 1.5 * (ux * ux + uy * uy));
      f[idx * 9 + k] += -(f[idx * 9 + k] - feq) / tau;
    }
  }
  // Streaming with bounce-back at obstacles and at walls.
  for (let y = 0; y < NY; y += 1) for (let x = 0; x < NX; x += 1) {
    for (let k = 0; k < 9; k += 1) {
      const xn = x + cx[k], yn = y + cy[k];
      if (xn < 0 || xn >= NX || yn < 0 || yn >= NY) {
        // Bounce off wall.
        f2[((y * NX) + x) * 9 + opp[k]] = f[(y * NX + x) * 9 + k];
      } else if (isObstacle[yn * NX + xn]) {
        f2[((y * NX) + x) * 9 + opp[k]] = f[(y * NX + x) * 9 + k];
      } else {
        f2[(yn * NX + xn) * 9 + k] = f[(y * NX + x) * 9 + k];
      }
    }
  }
  const tmp = f; f = f2; f2 = tmp;
}

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < NY; y += 1) for (let x = 0; x < NX; x += 1) {
    const idx = y * NX + x;
    if (isObstacle[idx]) {
      ctx.fillStyle = '#dcdde2';
    } else {
      let rho = 0, ux = 0, uy = 0;
      for (let k = 0; k < 9; k += 1) {
        const v = f[idx * 9 + k];
        rho += v; ux += cx[k] * v; uy += cy[k] * v;
      }
      ux /= rho; uy /= rho;
      const speed = Math.min(0.25, Math.hypot(ux, uy));
      const t = speed / 0.25;
      const r = Math.floor(20 + 235 * t * t);
      const g = Math.floor(60 + 195 * t);
      const b = Math.floor(120 + 50 * (1 - t));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
    }
    ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
  }
}

canvas.addEventListener('mousedown', (e) => { drawing = true; modifyAt(e); });
canvas.addEventListener('mousemove', (e) => { if (drawing) modifyAt(e); });
canvas.addEventListener('mouseup',   () => { drawing = false; });
let drawing = false;
function modifyAt(e) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / rect.width * NX);
  const y = Math.floor((e.clientY - rect.top) / rect.height * NY);
  const erase = e.shiftKey;
  for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) {
    const xx = x + dx, yy = y + dy;
    if (xx < 0 || xx >= NX || yy < 0 || yy >= NY) continue;
    isObstacle[yy * NX + xx] = erase ? 0 : 1;
  }
}

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
  slider('tau', 'tau (visc)', 0.52, 1.0, 0.01, tau, v => { tau = v; });
  const row = document.createElement('div'); row.className = 'row';
  const clear = document.createElement('button'); clear.type = 'button'; clear.textContent = 'Clear obstacles';
  clear.addEventListener('click', () => { isObstacle.fill(0); });
  const reset = document.createElement('button'); reset.type = 'button'; reset.textContent = 'Reset flow';
  reset.addEventListener('click', () => { init(); });
  row.appendChild(clear); row.appendChild(reset); controlsEl.appendChild(row);
  const tip = document.createElement('div'); tip.className = 'row';
  tip.innerHTML = '<span class="label">Tip</span><span class="value">Click-drag to draw; shift-drag to erase.</span>';
  controlsEl.appendChild(tip);
}

init();
buildControls();
let stepCount = 0;
function tick() {
  for (let s = 0; s < 4; s += 1) { step(); stepCount += 1; }
  render();
  if (stepCount % 16 === 0) {
    let totalRho = 0;
    for (let i = 0; i < NX * NY; i += 1) {
      if (isObstacle[i]) continue;
      for (let k = 0; k < 9; k += 1) totalRho += f[i * 9 + k];
    }
    readoutInv.textContent = `tau=${tau.toFixed(2)}  steps=${stepCount}  total rho=${totalRho.toFixed(1)}`;
    readoutFrame.textContent = String(stepCount);
  }
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
if (DETERMINISTIC) {
  for (let i = 0; i < 30; i += 1) step();
  render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  // After init, with no obstacle, total rho should be ~ NX*NY (each cell starts at sum_k w[k] = 1).
  isObstacle.fill(0); init();
  let total = 0;
  for (let i = 0; i < NX * NY; i += 1) for (let k = 0; k < 9; k += 1) total += f[i * 9 + k];
  if (Math.abs(total - NX * NY) > 1e-6) return { name: 'mass init', pass: false, msg: `total rho = ${total}, expected ${NX*NY}` };
  return { name: 'D2Q9 mass init', pass: true, msg: `total rho = ${total.toFixed(2)} (= NX*NY)` };
};
