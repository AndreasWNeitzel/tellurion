// Heisenberg uncertainty in conjugate spaces. The primary scene shows
// the physical probability packets in position (|psi(x)|^2) and
// momentum (|phi(k)|^2) at once, with their widths sigma_x and
// sigma_p drawn as extent bars; a slow breathing modulates the
// squeeze so you watch the seesaw: as x narrows, p must broaden. The
// gauge tracks sigma_x sigma_p, which never drops below hbar/2 (only
// a Gaussian touches it). Numerics in sim.js. Reference: Griffiths,
// Introduction to Quantum Mechanics (3rd ed.), Sec. 1.6 and 3.5.

import { makeGrid, setShape, momentumDensity, sigmaX, sigmaP, HBAR_OVER_2 } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['shape', 'sigma_x', 'sigma_p', 'product', 'hbar/2', 'state'];
const rEls = {};
for (const kk of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = kk;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[kk] = b;
}

const N = 192, L = 26;
const st = { shape: 'gaussian', sigma: 1.0, breathe: 1, t: 0, running: 1 };
const g = makeGrid(N, L);

function curSigma() {
  // breathing modulates the squeeze (Q1 motion) around the slider base
  return st.breathe ? st.sigma * (1 + 0.45 * Math.sin(st.t * 0.9)) : st.sigma;
}

// geometry
const XP = { x: 28, y: 44, w: 568, h: 206 };     // |psi(x)|^2 panel
const KP = { x: 28, y: 292, w: 568, h: 206 };    // |phi(k)|^2 panel
const GA = { x: 604, y: 250, w: 120, h: 236 };   // sigma_x sigma_p gauge (below the DOM readout panel, no overlap)

function drawPacket(panel, dens, coord, sig, mean, color, label, unitMax) {
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
  let mx = 1e-12; for (const v of dens) mx = Math.max(mx, v);
  const n = dens.length, base = panel.y + panel.h - 14;
  const cx = (c) => panel.x + ((c + unitMax) / (2 * unitMax)) * panel.w;
  // filled probability density
  ctx.beginPath(); ctx.moveTo(panel.x, base);
  for (let i = 0; i < n; i += 1) { const X = cx(coord[i]); const Y = base - (dens[i] / mx) * (panel.h - 30); ctx.lineTo(X, Y); }
  ctx.lineTo(panel.x + panel.w, base); ctx.closePath();
  const fillg = ctx.createLinearGradient(0, panel.y, 0, base);
  fillg.addColorStop(0, color + 'b0'); fillg.addColorStop(1, color + '22');
  ctx.fillStyle = fillg; ctx.fill();
  // faint zero-coordinate guide so the panel is not empty space
  const xZero = cx(0);
  ctx.strokeStyle = 'rgba(150,160,180,0.18)'; ctx.beginPath();
  ctx.moveTo(xZero, panel.y + 4); ctx.lineTo(xZero, base); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = 2.0; ctx.beginPath();
  for (let i = 0; i < n; i += 1) { const X = cx(coord[i]); const Y = base - (dens[i] / mx) * (panel.h - 30); i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
  ctx.stroke(); ctx.lineWidth = 1;
  // sigma extent bar (mean +/- sigma)
  const x1 = cx(mean - sig), x2 = cx(mean + sig), yb = panel.y + 16;
  ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x1, yb); ctx.lineTo(x2, yb); ctx.moveTo(x1, yb - 5); ctx.lineTo(x1, yb + 5); ctx.moveTo(x2, yb - 5); ctx.lineTo(x2, yb + 5); ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = '#ffd24a'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(`2 sigma = ${(2 * sig).toFixed(2)}`, (x1 + x2) / 2, yb - 9);
  ctx.fillStyle = '#9aa0ad'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(label, panel.x + 8, panel.y + panel.h - 4);
  ctx.textAlign = 'left';
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  setShape(g, st.shape, curSigma());
  const xd = new Float64Array(N);
  for (let i = 0; i < N; i += 1) xd[i] = g.re[i] * g.re[i] + g.im[i] * g.im[i];
  const pd = momentumDensity(g);
  const sx = sigmaX(g), sp = sigmaP(g, pd);
  const prod = sx.sigma * sp.sigma;

  drawPacket(XP, xd, g.x, sx.sigma, sx.mean, '#7fd6ff', '|psi(x)|^2  (position space)', L / 2);
  drawPacket(KP, pd, g.k, sp.sigma, sp.mean, '#ff8a5d', '|phi(k)|^2  (momentum space)', Math.PI * N / L * 0.5);
  // seesaw arrows between the two panels
  ctx.fillStyle = '#9aa0ad'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('Fourier conjugates: narrow one, the other must broaden', XP.x + XP.w / 2, KP.y - 8);
  ctx.textAlign = 'left';

  // Uncertainty meter: one calm vertical bar = the product
  // sigma_x.sigma_p, with a single solid line marking the hbar/2 floor
  // it can never cross. Muted palette matched to the two packets
  // (cyan = position, soft amber = above the bound), no hatching or
  // gradients, labels spaced so it reads at a glance.
  const gcx = GA.x + GA.w / 2;
  ctx.fillStyle = '#0b0d13'; ctx.fillRect(GA.x, GA.y, GA.w, GA.h);
  ctx.strokeStyle = 'rgba(200,205,215,0.28)'; ctx.strokeRect(GA.x, GA.y, GA.w, GA.h);
  const pmax = 1.6, bot = GA.y + GA.h - 34, top = GA.y + 56;
  const py = (p) => bot - (Math.min(p, pmax) / pmax) * (bot - top);
  const yFloor = py(HBAR_OVER_2);
  const at = prod <= HBAR_OVER_2 * 1.03;
  // soft "impossible" region below the floor (flat low-alpha, no hatch)
  ctx.fillStyle = 'rgba(120,130,150,0.12)';
  ctx.fillRect(GA.x + 1, yFloor, GA.w - 2, bot - yFloor);
  // the product bar (single flat colour)
  const barC = at ? '#7fd6ff' : '#e3b061';
  ctx.fillStyle = barC;
  ctx.fillRect(gcx - 20, py(prod), 40, bot - py(prod));
  // hbar/2 floor: one clean solid line
  ctx.strokeStyle = '#e2e6ee'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(GA.x + 2, yFloor); ctx.lineTo(GA.x + GA.w - 2, yFloor); ctx.stroke();
  ctx.lineWidth = 1;
  // title + value (top), floor label (on the line), status (bottom)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c8ccd6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('uncertainty product', gcx, GA.y + 20);
  ctx.fillStyle = barC; ctx.font = '17px ui-monospace, monospace';
  ctx.fillText(prod.toFixed(3), gcx, GA.y + 42);
  ctx.fillStyle = 'rgba(226,230,238,0.85)'; ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('hbar/2 = 0.50  (hard limit)', gcx, yFloor - 5);
  ctx.fillStyle = '#9aa0ad';
  ctx.fillText('cannot go below', gcx, bot + 16);
  ctx.fillStyle = barC; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(at ? 'minimum (Gaussian)' : 'above the limit', gcx, bot + 30);
  ctx.textAlign = 'left';

  rEls['shape'].textContent = st.shape;
  rEls['sigma_x'].textContent = sx.sigma.toFixed(3);
  rEls['sigma_p'].textContent = sp.sigma.toFixed(3);
  rEls['product'].textContent = prod.toFixed(4);
  rEls['hbar/2'].textContent = '0.5000';
  rEls['state'].textContent = at ? 'minimum (Gaussian)' : 'above bound';
}

// controls
function buildSlider(label, min, max, stp, value, key, fmt) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value); render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row); return { inp, val };
}
function buildSelect(label, opts, key, after) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const sel = document.createElement('select'); sel.setAttribute('aria-label', label);
  for (const [v, t] of opts) { const o = document.createElement('option'); o.value = String(v); o.textContent = t; sel.appendChild(o); }
  sel.value = String(st[key]);
  sel.addEventListener('change', () => { st[key] = isNaN(+sel.value) ? sel.value : +sel.value; if (after) after(); render(); });
  const sp = document.createElement('span'); sp.className = 'value';
  row.appendChild(lab); row.appendChild(sel); row.appendChild(sp);
  controlsEl.appendChild(row); return sel;
}
const cShape = buildSelect('shape', [['gaussian', 'Gaussian (minimum)'], ['box', 'box'], ['triangle', 'triangle'], ['double', 'double bump']], 'shape', null);
const cSig = buildSlider('squeeze sigma', 0.4, 2.4, 0.05, st.sigma, 'sigma', v => v.toFixed(2));
const cBr = buildSelect('breathing', [[1, 'on (seesaw)'], [0, 'off']], 'breathe', null);
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { shape: 'gaussian', sigma: 1.0, breathe: 1, t: 0, running: 1 });
  cShape.value = 'gaussian'; cSig.inp.value = '1'; cSig.val.textContent = '1.00'; cBr.value = '1';
  bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render();
});
bPause.addEventListener('click', () => { st.running = st.running ? 0 : 1; bPause.textContent = st.running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!st.running)); });

let lastT = performance.now();
function tick(now) {
  const dr = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.running) st.t += dr;
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) {
    // Sweep the squeeze monotonically across the five frames so they
    // are five clearly distinct conjugate states (x narrow / k broad
    // ... x broad / k narrow), not three aliased copies at the
    // breathing zero-crossing. Live mode keeps the sinusoidal seesaw.
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.breathe = 0;
    st.sigma = 0.5 + 1.7 * f;
    st.t = 0;
  } else {
    st.t = 0;
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const a = makeGrid(256, 24); setShape(a, 'gaussian', 1.0);
  const pr = sigmaX(a).sigma * sigmaP(a).sigma;
  if (Math.abs(pr - 0.5) / 0.5 > 0.02) return { name: 'Gaussian minimum', pass: false, msg: `sxsp=${pr}` };
  const b = makeGrid(256, 24); setShape(b, 'triangle', 1.0);
  if (sigmaX(b).sigma * sigmaP(b).sigma <= 0.5) return { name: 'uncertainty bound', pass: false, msg: 'triangle below 1/2' };
  return { name: 'sigma_x sigma_p >= hbar/2, =1/2 for Gaussian', pass: true, msg: 'saturated by the Gaussian only' };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
