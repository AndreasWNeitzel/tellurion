// Chandrasekhar dynamical friction. A perturber moves through a Maxwellian
// star field; gravitational focusing builds a trailing wake that decelerates
// it per the Chandrasekhar formula.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params        = new URLSearchParams(location.search);
const SEED          = parseInt(params.get('seed') ?? DEFAULT_SEED, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant') || { textContent: '' };
const readoutFrame = document.getElementById('readout-frame') || { textContent: '' };
const controlsEl   = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const rng = makeRng(SEED);

const N = 200;
const SIGMA = 0.6;
const LNLAMBDA = 3;
const G = 1, MP = 1;

function gaussian() {
  // Box-Muller from the project RNG.
  const u1 = Math.max(rng(), 1e-9), u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const state = { vPerturber: 1.5, t: 0 };
let bg, perturber;

function reset() {
  bg = [];
  for (let i = 0; i < N; i += 1) {
    bg.push({
      x: rng() * W, y: rng() * H,
      vx: SIGMA * gaussian() * 40, vy: SIGMA * gaussian() * 40,
    });
  }
  perturber = { x: 60, y: H / 2, vx: state.vPerturber * 80, vy: 0 };
  state.t = 0;
}
reset();

function fOfX(X) {
  return erf(X) - 2 * X * Math.exp(-X * X) / Math.sqrt(Math.PI);
}
function erf(x) {
  // Abramowitz & Stegun 7.1.26.
  const s = x < 0 ? -1 : 1; x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}

const dt = 0.02;
function step() {
  // Background particles fall in the perturber's softened potential.
  for (const p of bg) {
    const dx = perturber.x - p.x, dy = perturber.y - p.y;
    const r2 = dx * dx + dy * dy + 400;
    const a = 4000 * G * MP / r2;
    const r = Math.sqrt(r2);
    p.vx += a * dx / r * dt;
    p.vy += a * dy / r * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < 0) p.x += W; if (p.x > W) p.x -= W;
    if (p.y < 0) p.y += H; if (p.y > H) p.y -= H;
  }
  // Perturber decelerates per Chandrasekhar.
  const V = Math.hypot(perturber.vx, perturber.vy);
  const Vphys = V / 80;
  const X = Vphys / (Math.SQRT2 * SIGMA);
  const rho = N / (W * H) * 6e6;
  const aFric = 4 * Math.PI * G * G * MP * rho * LNLAMBDA * fOfX(X) / Math.max(Vphys * Vphys, 1e-3);
  const decel = Math.min(aFric * 1e-4, V * 0.5);
  perturber.vx -= decel * perturber.vx / Math.max(V, 1e-6);
  perturber.vy -= decel * perturber.vy / Math.max(V, 1e-6);
  perturber.x += perturber.vx * dt; perturber.y += perturber.vy * dt;
  if (perturber.x > W - 40) reset();
  state.t += dt;
}

function render() {
  ctx.fillStyle = '#080810';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#7c9cff';
  for (const p of bg) { ctx.fillRect(p.x, p.y, 2, 2); }
  // Perturber.
  ctx.fillStyle = '#ffd57f';
  ctx.beginPath(); ctx.arc(perturber.x, perturber.y, 10, 0, 2 * Math.PI); ctx.fill();
  const V = Math.hypot(perturber.vx, perturber.vy) / 80;
  readoutInv.textContent = `V=${V.toFixed(3)}  X=V/(sqrt2 sigma)=${(V / (Math.SQRT2 * SIGMA)).toFixed(2)}  f(X)=${fOfX(V / (Math.SQRT2 * SIGMA)).toFixed(3)}`;
  readoutFrame.textContent = state.t.toFixed(1);
}

function buildControls() {
  controlsEl.innerHTML = '';
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = 'vp'; lab.textContent = 'V perturber';
  const inp = document.createElement('input'); inp.id = 'vp'; inp.type = 'range';
  inp.min = '0.2'; inp.max = '4'; inp.step = '0.1'; inp.value = String(state.vPerturber);
  inp.setAttribute('aria-label', 'Perturber initial velocity');
  const val = document.createElement('span'); val.className = 'value'; val.textContent = state.vPerturber.toFixed(1);
  inp.addEventListener('input', () => { state.vPerturber = parseFloat(inp.value); val.textContent = state.vPerturber.toFixed(1); reset(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row);
}

let raf;
function tick() { step(); render(); if (!CAPTURE_NAME) raf = requestAnimationFrame(tick); }
buildControls();
if (DETERMINISTIC) {
  for (let i = 0; i < 60; i += 1) step();
  render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  raf = requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  const f3 = fOfX(3 / Math.SQRT2 / SIGMA * SIGMA);   // X at V=3 sigma is 3/sqrt2
  const fHi = fOfX(3 / Math.SQRT2);
  const fLo = fOfX(0.1 / Math.SQRT2);
  if (fHi <= 0.9) return { name: 'friction at V=3 sigma', pass: false, msg: `f(X)=${fHi.toFixed(3)}` };
  if (fLo >= 0.05) return { name: 'friction at V=0.1 sigma', pass: false, msg: `f(X)=${fLo.toFixed(3)}` };
  return { name: 'Chandrasekhar f(X) limits', pass: true, msg: `f(3 sigma)=${fHi.toFixed(3)}, f(0.1 sigma)=${fLo.toFixed(3)}` };
};
