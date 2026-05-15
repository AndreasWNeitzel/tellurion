// Slow-roll inflation: a ball rolls down V(phi) under Hubble friction.
// Slow-roll parameters and (n_s, r) plotted on a Planck-style plane.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant') || { textContent: '' };
const readoutFrame = document.getElementById('readout-frame') || { textContent: '' };
const controlsEl   = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const state = { model: 'phi2', phi: 8.0, phid: 0, t: 0 };

function V(phi) {
  if (state.model === 'phi2') return 0.5 * phi * phi;
  if (state.model === 'phi4') return 0.25 * phi * phi * phi * phi;
  return Math.pow(1 - Math.exp(-Math.sqrt(2 / 3) * phi), 2);
}
function Vp(phi) {
  if (state.model === 'phi2') return phi;
  if (state.model === 'phi4') return phi * phi * phi;
  const e = Math.exp(-Math.sqrt(2 / 3) * phi);
  return 2 * Math.sqrt(2 / 3) * (1 - e) * e;
}
function Vpp(phi) {
  if (state.model === 'phi2') return 1;
  if (state.model === 'phi4') return 3 * phi * phi;
  const e = Math.exp(-Math.sqrt(2 / 3) * phi);
  return 2 * (2 / 3) * (2 * e * e - e + e * e * (-1));
}
function epsilon(phi) { const v = V(phi); return v > 1e-12 ? 0.5 * (Vp(phi) / v) ** 2 : 0; }
function eta(phi)     { const v = V(phi); return v > 1e-12 ? Vpp(phi) / v : 0; }

function step(dt) {
  const H_Hubble = Math.sqrt(Math.max(V(state.phi) / 3, 1e-12));
  state.phid += (-3 * H_Hubble * state.phid - Vp(state.phi)) * dt;
  state.phi  += state.phid * dt;
  state.t    += dt;
  if (state.phi < 0.05) { state.phi = 8; state.phid = 0; state.t = 0; }
}

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);
  // Plot V(phi) curve.
  const x0 = 50, y0 = H * 0.7, plotW = W * 0.6, plotH = H * 0.55;
  let mxV = 0;
  for (let i = 0; i <= 100; i += 1) {
    const phi = (i / 100) * 12;
    mxV = Math.max(mxV, V(phi));
  }
  ctx.strokeStyle = 'rgba(220,220,240,0.4)';
  ctx.strokeRect(x0, y0 - plotH, plotW, plotH);
  ctx.strokeStyle = '#7c9cff'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 100; i += 1) {
    const phi = (i / 100) * 12;
    const x = x0 + (phi / 12) * plotW;
    const y = y0 - (V(phi) / mxV) * (plotH - 20);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Ball.
  const bx = x0 + (state.phi / 12) * plotW;
  const by = y0 - (V(state.phi) / mxV) * (plotH - 20);
  ctx.fillStyle = '#ffd57f';
  ctx.beginPath(); ctx.arc(bx, by - 4, 6, 0, 2 * Math.PI); ctx.fill();
  // 3-A: epsilon = 1 marker (end of slow-roll). Scan phi for the crossing.
  let phiEnd = -1;
  for (let i = 1; i <= 200; i += 1) {
    const phi = (i / 200) * 12;
    if (epsilon(phi) >= 1) { phiEnd = phi; break; }
  }
  if (phiEnd > 0) {
    const ex = x0 + (phiEnd / 12) * plotW;
    ctx.strokeStyle = '#ff5d5d'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ex, y0 - plotH); ctx.lineTo(ex, y0); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff5d5d'; ctx.font = '11px sans-serif';
    ctx.fillText('epsilon = 1 (inflation ends)', ex + 4, y0 - plotH + 28);
  }
  ctx.fillStyle = '#dcdde2'; ctx.font = '13px sans-serif';
  ctx.fillText('Inflaton potential V(phi)', x0 + 8, y0 - plotH + 16);

  // (n_s, r) plane on the right.
  const px0 = W - 280, py0 = 40, pw = 240, ph = 240;
  ctx.strokeStyle = 'rgba(220,220,240,0.4)';
  ctx.strokeRect(px0, py0, pw, ph);
  ctx.fillStyle = '#dcdde2';
  ctx.fillText('(n_s, r) plane', px0 + 8, py0 + 16);
  // Axes.
  function plot(ns, r) {
    const x = px0 + ((ns - 0.92) / 0.08) * pw;
    const y = py0 + ph - (r / 0.4) * ph;
    return { x, y };
  }
  // Trace points along inflation history.
  ctx.fillStyle = '#fdb56a';
  for (let i = 0; i < 60; i += 1) {
    const phi = 8 - i * 0.05;
    if (phi < 0.5) break;
    const e = epsilon(phi), n = eta(phi);
    const ns = 1 - 6 * e + 2 * n;
    const r  = 16 * e;
    const p = plot(Math.min(Math.max(ns, 0.92), 1.0), Math.min(r, 0.4));
    ctx.fillRect(p.x, p.y, 2, 2);
  }
  // Current point.
  const eCur = epsilon(state.phi), nCur = eta(state.phi);
  const ns_cur = Math.min(Math.max(1 - 6 * eCur + 2 * nCur, 0.92), 1.0);
  const r_cur  = Math.min(16 * eCur, 0.4);
  const cur = plot(ns_cur, r_cur);
  ctx.fillStyle = '#ffd57f';
  ctx.beginPath(); ctx.arc(cur.x, cur.y, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#dcdde2';
  ctx.fillText(`n_s=${ns_cur.toFixed(3)}  r=${r_cur.toFixed(3)}`, px0 + 8, py0 + ph - 8);

  readoutInv.textContent = `phi=${state.phi.toFixed(2)}  eps=${eCur.toFixed(4)}  eta=${nCur.toFixed(4)}`;
  readoutFrame.textContent = state.t.toFixed(2);
}

let raf;
function tick() {
  for (let s = 0; s < 4; s += 1) step(0.02);
  render();
  if (!CAPTURE_NAME) raf = requestAnimationFrame(tick);
}

function buildControls() {
  controlsEl.innerHTML = '';
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = 'model'; lab.textContent = 'Model';
  const sel = document.createElement('select'); sel.id = 'model';
  sel.setAttribute('aria-label', 'Inflaton potential');
  for (const [v, t] of [['phi2', 'V = phi^2 / 2'], ['phi4', 'V = phi^4 / 4'], ['starobinsky', 'Starobinsky']]) {
    const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o);
  }
  sel.value = state.model;
  sel.addEventListener('change', () => { state.model = sel.value; state.phi = 8; state.phid = 0; state.t = 0; });
  row.appendChild(lab); row.appendChild(sel);
  controlsEl.appendChild(row);
}

buildControls();
if (DETERMINISTIC) {
  for (let i = 0; i < 60; i += 1) step(0.02);
  render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  raf = requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  // For V = phi^2/2 at phi=8: epsilon = 1/(2*32) = 1/64 ~ 0.0156.
  const expected = 1 / 64;
  const e = epsilon(8);
  if (Math.abs(e - expected) > 1e-4) return { name: 'epsilon', pass: false, msg: `e(8) = ${e}` };
  return { name: 'slow-roll epsilon', pass: true, msg: `epsilon_phi2(8) = ${e.toFixed(4)} (expected 0.0156)` };
};
