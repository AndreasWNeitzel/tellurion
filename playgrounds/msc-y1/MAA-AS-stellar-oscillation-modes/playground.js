// Stellar oscillation modes: surface displacement Y_l^m(theta, phi) cos(omega t)
// drawn on a 2D projection of a sphere. Color: red = outward, blue = inward.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant') || { textContent: '' };
const readoutFrame = document.getElementById('readout-frame') || { textContent: '' };
const controlsEl   = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const state = { n: 1, l: 2, m: 0, t: 0 };

// Associated Legendre P_l^m using a small recurrence (l up to 5).
function factorial(k) { let r = 1; for (let i = 2; i <= k; i += 1) r *= i; return r; }
function plgndr(l, m, x) {
  let pmm = 1;
  if (m > 0) {
    const somx2 = Math.sqrt((1 - x) * (1 + x));
    let fact = 1;
    for (let i = 1; i <= m; i += 1) { pmm *= -fact * somx2; fact += 2; }
  }
  if (l === m) return pmm;
  let pmmp1 = x * (2 * m + 1) * pmm;
  if (l === m + 1) return pmmp1;
  let pll = 0;
  for (let ll = m + 2; ll <= l; ll += 1) {
    pll = (x * (2 * ll - 1) * pmmp1 - (ll + m - 1) * pmm) / (ll - m);
    pmm = pmmp1; pmmp1 = pll;
  }
  return pll;
}
function realYlm(l, m, theta, phi) {
  const x = Math.cos(theta);
  const mm = Math.abs(m);
  const norm = Math.sqrt((2 * l + 1) / (4 * Math.PI) * factorial(l - mm) / factorial(l + mm));
  const p = plgndr(l, mm, x);
  if (m > 0) return Math.SQRT2 * norm * p * Math.cos(mm * phi);
  if (m < 0) return Math.SQRT2 * norm * p * Math.sin(mm * phi);
  return norm * p;
}

function modeFrequency(n, l) {
  // Asymptotic p-mode: omega proportional to Delta_nu (n + l/2 + epsilon).
  return (n + l * 0.5 + 1.5) * 60.0; // microhertz
}

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);

  const cx = W * 0.32, cy = H * 0.5;
  const R = Math.min(W, H) * 0.28;
  // Render the visible hemisphere by scanning a screen-aligned disk and back-projecting.
  const phase = Math.cos(state.t);
  for (let dy = -R; dy <= R; dy += 1) {
    for (let dx = -R; dx <= R; dx += 1) {
      const d2 = dx * dx + dy * dy;
      if (d2 > R * R) continue;
      // (dx, dy) on screen -> spherical (theta, phi).
      const z = Math.sqrt(R * R - d2);
      const xN = dx / R, yN = dy / R, zN = z / R;
      const theta = Math.acos(-yN);
      const phi   = Math.atan2(xN, zN);
      const v = realYlm(state.l, state.m, theta, phi) * phase;
      const a = Math.max(-1, Math.min(1, v * 2.5));
      // Map a in [-1,1] to a diverging colormap (blue to white to red).
      let r, g, b;
      if (a >= 0) { r = 220 * a + 240 * (1 - a); g = 110 * a + 240 * (1 - a); b = 60 * a + 240 * (1 - a); }
      else { r = 80 * (-a) + 240 * (1 + a); g = 130 * (-a) + 240 * (1 + a); b = 220 * (-a) + 240 * (1 + a); }
      // Lambertian shading.
      const shade = 0.5 + 0.5 * zN;
      ctx.fillStyle = `rgb(${(r * shade) | 0},${(g * shade) | 0},${(b * shade) | 0})`;
      ctx.fillRect(cx + dx, cy + dy, 1.05, 1.05);
    }
  }

  // Propagation diagram (placeholder Lamb and Brunt-Vaisala for an n=3 polytrope).
  const px0 = W * 0.55, py0 = H * 0.2, pw = W * 0.4, ph = H * 0.6;
  ctx.strokeStyle = 'rgba(220,220,240,0.4)'; ctx.strokeRect(px0, py0, pw, ph);
  ctx.fillStyle = '#dcdde2'; ctx.font = '13px sans-serif';
  ctx.fillText('Propagation diagram (n=3 polytrope)', px0 + 8, py0 + 16);
  ctx.fillText('r/R', px0 + pw - 28, py0 + ph - 6);
  ctx.fillText('freq (uHz)', px0 + 6, py0 + 14 + 14);

  const G = 100;
  for (let curve = 0; curve < 2; curve += 1) {
    ctx.strokeStyle = curve === 0 ? '#7c9cff' : '#fdb56a';
    ctx.beginPath();
    for (let i = 0; i < G; i += 1) {
      const xr = i / (G - 1);
      // Toy N(r) peaks near r=0.3, vanishes at center and surface
      const N = 200 * Math.exp(-((xr - 0.3) ** 2) / 0.02);
      // Lamb S_l: increases sharply near surface, l(l+1)/r^2 c_s^2
      const Sl = Math.sqrt(state.l * (state.l + 1)) * 30 / Math.max(xr, 0.05);
      const y = curve === 0 ? N : Sl;
      const sx = px0 + xr * pw;
      const sy = py0 + ph - Math.min(1, y / 500) * (ph - 30) - 20;
      if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }
  // Mode frequency line.
  const omega = modeFrequency(state.n, state.l);
  const lineY = py0 + ph - Math.min(1, omega / 500) * (ph - 30) - 20;
  ctx.strokeStyle = '#ffd57f'; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(px0, lineY); ctx.lineTo(px0 + pw, lineY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffd57f';
  ctx.fillText(`omega = ${omega.toFixed(1)} uHz`, px0 + pw - 110, lineY - 4);
  const type = omega > Math.sqrt(state.l * (state.l + 1)) * 30 ? 'p-mode' : 'g-mode';
  ctx.fillStyle = '#dcdde2';
  ctx.fillText(`type: ${type}`, px0 + 8, py0 + ph - 8);

  readoutInv.textContent = `(n, l, m) = (${state.n}, ${state.l}, ${state.m})  omega = ${omega.toFixed(1)} uHz`;
  readoutFrame.textContent = state.t.toFixed(2);
}

function tick() {
  state.t += 0.05;
  render();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

function buildControls() {
  controlsEl.innerHTML = '';
  function slider(id, label, min, max, step, value, onInput, fmt = v => v.toFixed(0)) {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
    const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
    inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(value);
    inp.setAttribute('aria-label', label);
    const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
    inp.addEventListener('input', () => { const v = parseFloat(inp.value); val.textContent = fmt(v); onInput(v); });
    row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
    controlsEl.appendChild(row);
  }
  slider('n-mode', 'n', 0, 5, 1, state.n, v => state.n = v);
  slider('l-mode', 'l', 0, 4, 1, state.l, v => {
    state.l = v;
    // Maintain |m| <= l invariant (BLOCKER fix: plgndr returns 0 for m > l).
    state.m = Math.max(-state.l, Math.min(state.l, state.m));
  });
  slider('m-mode', 'm', -4, 4, 1, state.m, v => { state.m = Math.max(-state.l, Math.min(state.l, v)); });

}

buildControls();
render();
if (DETERMINISTIC) {
  for (let i = 0; i < 30; i += 1) { state.t += 0.1; render(); }
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  // Y_0^0 should be constant 1/(2 sqrt(pi)).
  const v00 = realYlm(0, 0, Math.PI / 3, 0.7);
  const expected = 1 / (2 * Math.sqrt(Math.PI));
  if (Math.abs(v00 - expected) > 1e-9) return { name: 'Y_0^0 normalization', pass: false, msg: `${v00} vs ${expected}` };
  return { name: 'Y_l^m surface harmonic', pass: true, msg: `Y_0^0 = ${v00.toFixed(6)}` };
};
