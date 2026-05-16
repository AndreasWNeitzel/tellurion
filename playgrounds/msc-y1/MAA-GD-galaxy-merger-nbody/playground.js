// Galaxy-merger N-body. Two Hernquist halos sampled as tracer particles
// orbit each other. Each tracer feels the analytic potential of BOTH halos;
// the halo centers integrate as a softened 2-body. Tidal tails appear.

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

const G  = 1;          // toy units
const N  = 600;        // tracers per galaxy
const Mh = 1;          // halo mass each
const aH = 1.0;        // Hernquist scale length

const state = {
  impact:   1.5,
  vRel:     0.8,
  running:  true,
};

// Hernquist enclosed-mass profile: M(<r) = M r^2 / (r + a)^2
// Phi(r) = -G M / (r + a)
function phiHernquist(r) { return -G * Mh / (r + aH); }
function aHernquist(rx, ry) {
  const r = Math.hypot(rx, ry) + 1e-6;
  const dphidr = G * Mh / (r + aH) ** 2;
  return { ax: -dphidr * rx / r, ay: -dphidr * ry / r };
}

function sampleHernquist() {
  // Hernquist cumulative DF in 1D radius: r = a * sqrt(q) / (1 - sqrt(q)).
  const out = [];
  for (let i = 0; i < N; i += 1) {
    const q = rng();
    const r = aH * Math.sqrt(q) / Math.max(1 - Math.sqrt(q), 1e-4);
    const theta = rng() * 2 * Math.PI;
    out.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), vx: 0, vy: 0 });
  }
  // Circular velocity from M(<r) / r at each radius.
  for (const p of out) {
    const r = Math.hypot(p.x, p.y) + 1e-6;
    const M_enc = Mh * r * r / ((r + aH) ** 2);
    const v_circ = Math.sqrt(G * M_enc / r);
    // Random direction in tangent.
    const dir = rng() > 0.5 ? 1 : -1;
    p.vx = -dir * v_circ * p.y / r;
    p.vy =  dir * v_circ * p.x / r;
  }
  return out;
}

let halo1, halo2, tracers1, tracers2, elapsed = 0;

function reset() {
  // Start well separated with a real CLOSING velocity along x, the impact
  // parameter as a y-offset, and vRel setting the approach speed. This
  // guarantees the galaxies actually fly into each other and merge.
  const sep = 9, b = state.impact;
  halo1 = { x: -sep, y: -b / 2, vx:  state.vRel, vy: 0 };
  halo2 = { x:  sep, y:  b / 2, vx: -state.vRel, vy: 0 };
  tracers1 = sampleHernquist();
  tracers2 = sampleHernquist();
  for (const p of tracers1) { p.x += halo1.x; p.y += halo1.y; p.vx += halo1.vx; p.vy += halo1.vy; }
  for (const p of tracers2) { p.x += halo2.x; p.y += halo2.y; p.vx += halo2.vx; p.vy += halo2.vy; }
  elapsed = 0;
}
reset();

const dt = 0.02;
const GM_HALO = 6;     // stronger pair attraction so they decisively merge
function step() {
  function pairForce(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const eps = 1.2;                       // softening (merged-core size)
    const r2 = dx * dx + dy * dy + eps * eps;
    const r = Math.sqrt(r2);
    const f = G * GM_HALO / r2;
    return { ax: f * dx / r, ay: f * dy / r };
  }
  const f12 = pairForce(halo1, halo2);
  const f21 = { ax: -f12.ax, ay: -f12.ay };
  halo1.vx += f12.ax * dt; halo1.vy += f12.ay * dt;
  halo2.vx += f21.ax * dt; halo2.vy += f21.ay * dt;
  halo1.x  += halo1.vx * dt; halo1.y += halo1.vy * dt;
  halo2.x  += halo2.vx * dt; halo2.y += halo2.vy * dt;
  elapsed += dt;
  // Auto-replay: once the encounter has long finished (cores recede or it
  // has run a while), restart so the page stays active.
  if (elapsed > 36) reset();
  // Tracers: feel both halos.
  function update(p) {
    const a1 = aHernquist(p.x - halo1.x, p.y - halo1.y);
    const a2 = aHernquist(p.x - halo2.x, p.y - halo2.y);
    p.vx += (a1.ax + a2.ax) * dt;
    p.vy += (a1.ay + a2.ay) * dt;
    p.x  += p.vx * dt;
    p.y  += p.vy * dt;
  }
  for (const p of tracers1) update(p);
  for (const p of tracers2) update(p);
}

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2;
  const sc = Math.min(W, H) * 0.045;       // fit the full 9-unit encounter
  ctx.fillStyle = '#7c9cff';
  for (const p of tracers1) {
    ctx.fillRect(cx + p.x * sc, cy + p.y * sc, 1.6, 1.6);
  }
  ctx.fillStyle = '#fdb56a';
  for (const p of tracers2) {
    ctx.fillRect(cx + p.x * sc, cy + p.y * sc, 1.6, 1.6);
  }
  // Halo cores.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(cx + halo1.x * sc, cy + halo1.y * sc, 3, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ffd57f';
  ctx.beginPath(); ctx.arc(cx + halo2.x * sc, cy + halo2.y * sc, 3, 0, 2 * Math.PI); ctx.fill();

  readoutInv.textContent = `dist=${Math.hypot(halo2.x - halo1.x, halo2.y - halo1.y).toFixed(2)}`;
}

let raf;
function tick() {
  if (state.running) step();
  render();
  if (!CAPTURE_NAME) raf = requestAnimationFrame(tick);
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
  // Dials relaunch the encounter immediately so they are not inert.
  slider('impact', 'impact b',     0, 6, 0.1, state.impact, v => { state.impact = v; reset(); });
  slider('vRel',   'v_rel',        0.1, 2.5, 0.1, state.vRel, v => { state.vRel = v; reset(); });
  const row = document.createElement('div'); row.className = 'row';
  const launch = document.createElement('button'); launch.type = 'button'; launch.textContent = 'Launch';
  launch.addEventListener('click', () => { reset(); state.running = true; });
  row.appendChild(launch); controlsEl.appendChild(row);
}

buildControls();
if (DETERMINISTIC) {
  // ~12 time units of warmup so the captured frame shows the galaxies
  // mid-encounter (tidal tails forming) rather than still far apart.
  for (let i = 0; i < 600; i += 1) step();
  render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  raf = requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  // Total halo-pair momentum should be conserved exactly (no external force).
  const p1 = halo1.vx + halo2.vx;
  const p2 = halo1.vy + halo2.vy;
  if (Math.abs(p1) + Math.abs(p2) > 1e-6) return { name: 'momentum conservation', pass: false, msg: `(p_x, p_y) = (${p1}, ${p2})` };
  return { name: 'halo pair momentum', pass: true, msg: 'two-body momentum exactly conserved' };
};
