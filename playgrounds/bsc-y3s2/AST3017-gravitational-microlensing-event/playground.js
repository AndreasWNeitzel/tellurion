import { fontString } from '../../../shared/js/canvas-type.js';
// Gravitational lensing: an interactive image-plane sandbox. Drag (or
// let it drift) the background source; watch its lensed images move on
// the critical curves, an Einstein ring flash at alignment, and the
// magnification trace out the Paczynski bump (point lens) or sharp
// caustic spikes (binary lens). The lensing geometry is the primary
// view; the light curve is the diagnostic strip. Physics in sim.js.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  makeLenses, mapToSource, jacobianDet, imageMag, findImages,
  magnification as pointA, uOfT,
} from './sim.js';

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
const rng = makeRng(DEFAULT_SEED);

// Image-plane panel (primary) and the light-curve strip (diagnostic).
const PW = W, PH = Math.round(H * 0.70);
const LY = PH + 6, LH = H - LY - 6;
const RNG_TE = 1.6;                                   // source x-range, theta_E units
const VIEW = 2.2;                                     // half-extent of the image plane (tightened so the Einstein ring fills more of the scene; still covers the source track and the major image at ~2.08 theta_E)
const cx = PW / 2, cy = PH / 2, sc = (Math.min(PW, PH) / 2 - 16) / VIEW;
const SX = (x) => cx + x * sc, SY = (y) => cy - y * sc;

const state = {
  binary: false, uMin: 0.32, tE: 60, sep: 1.0, q: 0.5,
  t: -120, dragging: false, running: !prefersReducedMotion(),
};
const bgStars = (() => {
  const a = [];
  for (let i = 0; i < 200; i += 1) a.push({ x: rng() * W, y: rng() * PH, b: rng() * 0.6 + 0.15 });
  return a;
})();

let lenses = makeLenses(false);
let critical = [], caustic = [];
let lcSamples = [], lcMax = 1;

function sourceBeta() {
  // Straight trajectory across the source plane: closest approach uMin.
  return { x: (state.t / state.tE) * RNG_TE, y: state.uMin };
}
function totalMag(beta) {
  if (!state.binary) return pointA(Math.hypot(beta.x, beta.y));
  let m = 0;
  for (const im of findImages(lenses, beta, 40)) m += imageMag(lenses, im);
  return m;
}
// Cache the 200-point light curve: binary needs an image solve per
// sample, far too expensive to redo every animation frame.
function rebuildLC() {
  lcSamples = []; lcMax = 1e-6;
  for (let k = 0; k <= 140; k += 1) {
    const tt = -120 + 240 * k / 140;
    const b = { x: (tt / state.tE) * RNG_TE, y: state.uMin };
    const A = totalMag(b);
    lcSamples.push(A); if (A > lcMax) lcMax = A;
  }
}
function rebuildLenses() {
  lenses = makeLenses(state.binary, state.sep, state.q);
  // Critical curves: grid cells where det A changes sign vs the left
  // or bottom neighbour; their image under the lens map is the
  // caustic. Computed once per configuration, not per frame.
  critical = []; caustic = [];
  const N = 200, R = VIEW;
  const col = new Float64Array(N + 1);
  for (let i = 0; i <= N; i += 1) {
    const x = -R + 2 * R * i / N;
    let prevd = null;
    for (let j = 0; j <= N; j += 1) {
      const y = -R + 2 * R * j / N;
      const d = jacobianDet(lenses, { x, y });
      const fin = Number.isFinite(d);
      if (fin && ((prevd !== null && Number.isFinite(prevd) && Math.sign(prevd) !== Math.sign(d))
        || (i > 0 && Number.isFinite(col[j]) && Math.sign(col[j]) !== Math.sign(d)))) {
        const th = { x, y };
        critical.push(th);
        caustic.push(mapToSource(lenses, th));
      }
      prevd = d; col[j] = d;
    }
  }
  rebuildLC();
}
rebuildLenses();

function render() {
  ctx.fillStyle = '#0B0C12'; ctx.fillRect(0, 0, W, H);
  // sky
  for (const s of bgStars) { ctx.fillStyle = `rgba(210,214,236,${s.b})`; ctx.fillRect(s.x, s.y, 1.4, 1.4); }
  // caustic (source-plane curve the source crosses) and critical curve
  ctx.fillStyle = 'rgba(255,110,210,0.85)';
  for (const c of caustic) ctx.fillRect(SX(c.x) - 0.8, SY(c.y) - 0.8, 1.6, 1.6);
  ctx.fillStyle = 'rgba(120,210,255,0.7)';
  for (const c of critical) ctx.fillRect(SX(c.x) - 0.8, SY(c.y) - 0.8, 1.6, 1.6);
  // Einstein ring (unit circle) for orientation
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(SX(0), SY(0), sc, 0, 2 * Math.PI); ctx.stroke();
  // lens mass(es)
  for (const L of lenses) {
    ctx.fillStyle = '#e08a3a';
    ctx.beginPath(); ctx.arc(SX(L.x), SY(L.y), 3 + 5 * L.m, 0, 2 * Math.PI); ctx.fill();
  }
  // source (true position) + its lensed images
  const beta = sourceBeta();
  ctx.fillStyle = '#9fb4ff';
  ctx.beginPath(); ctx.arc(SX(beta.x), SY(beta.y), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(159,180,255,0.4)';
  ctx.beginPath(); ctx.arc(SX(beta.x), SY(beta.y), 9, 0, 2 * Math.PI); ctx.stroke();
  const imgs = findImages(lenses, beta, 60);
  let totM = 0;
  for (const im of imgs) {
    const mg = imageMag(lenses, im); totM += mg;
    const rad = 3 + 5 * Math.min(2.4, Math.sqrt(mg));
    const g = ctx.createRadialGradient(SX(im.x), SY(im.y), 0, SX(im.x), SY(im.y), rad * 2);
    g.addColorStop(0, 'rgba(255,226,150,0.95)'); g.addColorStop(1, 'rgba(255,226,150,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(SX(im.x), SY(im.y), rad * 2, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#ffe296'; ctx.beginPath(); ctx.arc(SX(im.x), SY(im.y), rad, 0, 2 * Math.PI); ctx.fill();
  }
  const Atot = state.binary ? totM : pointA(Math.hypot(beta.x, beta.y));
  // labels
  ctx.fillStyle = 'rgba(220,224,236,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`${state.binary ? 'binary' : 'point'} lens   images: ${imgs.length}   A = ${Atot.toFixed(2)}`, 12, 20);
  ctx.fillStyle = 'rgba(255,110,210,0.85)'; ctx.fillText('caustic', 12, 38);
  ctx.fillStyle = 'rgba(120,210,255,0.85)'; ctx.fillText('critical curve', 84, 38);
  ctx.fillStyle = '#9fb4ff'; ctx.fillText('source', 196, 38);
  ctx.fillStyle = '#ffe296'; ctx.fillText('images', 262, 38);
  ctx.fillStyle = 'rgba(200,206,228,0.7)'; ctx.fillText('drag the source', W - 130, 20);

  // light-curve strip (diagnostic) with A and time axes
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, LY, W, LH);
  ctx.strokeStyle = 'rgba(200,205,225,0.25)'; ctx.strokeRect(0.5, LY + 0.5, W - 1, LH - 1);
  const mxA = lcMax;
  const ax = 46, aw = W - 60, ay = LY + 24, ah = LH - 44;
  const Xt = (k) => ax + (k / (lcSamples.length - 1)) * aw;
  const Ya = (A) => ay + ah - (Math.min(A, mxA) / mxA) * ah;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax, Ya(1)); ctx.lineTo(ax + aw, Ya(1)); ctx.stroke();
  ctx.fillStyle = 'rgba(124,156,255,0.12)'; ctx.beginPath(); ctx.moveTo(ax, ay + ah);
  for (let k = 0; k < lcSamples.length; k += 1) ctx.lineTo(Xt(k), Ya(lcSamples[k]));
  ctx.lineTo(ax + aw, ay + ah); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#7c9cff'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let k = 0; k < lcSamples.length; k += 1) { const x = Xt(k), y = Ya(lcSamples[k]); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke();
  const xm = ax + ((state.t + 120) / 240) * aw;
  ctx.strokeStyle = 'rgba(255,213,127,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xm, ay); ctx.lineTo(xm, ay + ah); ctx.stroke();
  ctx.fillStyle = '#ffd57f'; ctx.beginPath(); ctx.arc(xm, Ya(Atot), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + ah); ctx.lineTo(ax + aw, ay + ah); ctx.stroke();
  ctx.fillStyle = 'rgba(220,224,236,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('light curve: magnification A(t)', ax, LY + 14);
  ctx.fillStyle = 'rgba(200,206,228,0.7)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(mxA.toFixed(1), ax - 5, Ya(mxA)); ctx.fillText('1', ax - 5, Ya(1));
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('-t_E', Xt(0) + 14, ay + ah + 5); ctx.fillText('peak', ax + aw / 2, ay + ah + 5); ctx.fillText('+t_E', ax + aw - 14, ay + ah + 5);
  ctx.textBaseline = 'alphabetic';

  readoutInv.textContent = `A=${Atot.toFixed(3)}  images=${imgs.length}  ${state.binary ? `sep=${state.sep.toFixed(2)} q=${state.q.toFixed(2)}` : `u=${Math.hypot(beta.x, beta.y).toFixed(3)}`}`;
  readoutFrame.textContent = String(Math.round(state.t));
}

// drag the source
function evToBeta(e) {
  const r = canvas.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width * W, py = (e.clientY - r.top) / r.height * H;
  if (py > PH) return null;
  const bx = (px - cx) / sc, by = -(py - cy) / sc;
  return { bx, by };
}
canvas.addEventListener('pointerdown', (e) => {
  const b = evToBeta(e); if (!b) return;
  state.dragging = true; state.uMin = Math.max(0.02, Math.abs(b.by)); state.t = (b.bx / RNG_TE) * state.tE;
  rebuildLC(); syncLabels(); render();
});
canvas.addEventListener('pointermove', (e) => {
  if (!state.dragging) return;
  const b = evToBeta(e); if (!b) return;
  state.uMin = Math.max(0.02, Math.abs(b.by)); state.t = Math.max(-120, Math.min(120, (b.bx / RNG_TE) * state.tE));
  rebuildLC(); syncLabels(); render();
});
window.addEventListener('pointerup', () => { state.dragging = false; });

function tick() {
  if (state.running && !state.dragging) { state.t += 0.6; if (state.t > 120) state.t = -120; }   // slowed from 1.4
  render();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

let sU, sT, sSep, sQ;
function syncLabels() {
  if (sU) sU.val.textContent = state.uMin.toFixed(2);
  if (sT) sT.val.textContent = state.tE.toFixed(0);
  if (sSep) sSep.val.textContent = state.sep.toFixed(2);
  if (sQ) sQ.val.textContent = state.q.toFixed(2);
}
function buildControls() {
  controlsEl.innerHTML = '';
  const r0 = document.createElement('div'); r0.className = 'row';
  const l0 = document.createElement('label'); l0.className = 'label'; l0.htmlFor = 'lens-mode'; l0.textContent = 'lens';
  const sel = document.createElement('select'); sel.id = 'lens-mode'; sel.setAttribute('aria-label', 'lens mode');
  for (const [v, t] of [['point', 'point mass'], ['binary', 'binary']]) { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); }
  sel.value = state.binary ? 'binary' : 'point';
  sel.addEventListener('change', () => { state.binary = sel.value === 'binary'; rebuildLenses(); render(); });
  r0.appendChild(l0); r0.appendChild(sel); const sp0 = document.createElement('span'); sp0.className = 'value'; r0.appendChild(sp0);
  controlsEl.appendChild(r0);
  function slider(id, label, min, max, step, value, onInput, fmt = (v) => v.toFixed(2)) {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
    const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
    inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(value);
    inp.setAttribute('aria-label', label);
    const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
    inp.addEventListener('input', () => { const v = parseFloat(inp.value); val.textContent = fmt(v); onInput(v); render(); });
    row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
    controlsEl.appendChild(row); return { inp, val };
  }
  sU = slider('u-min', 'u_min', 0.02, 1.2, 0.01, state.uMin, (v) => { state.uMin = v; rebuildLC(); });
  sT = slider('t-E', 't_E (d)', 10, 200, 1, state.tE, (v) => { state.tE = v; rebuildLC(); }, (v) => v.toFixed(0));
  sSep = slider('sep', 'binary sep', 0.3, 1.8, 0.02, state.sep, (v) => { state.sep = v; rebuildLenses(); });
  sQ = slider('q', 'mass ratio q', 0.1, 1.0, 0.02, state.q, (v) => { state.q = v; rebuildLenses(); });
  // Preset events: a quick tour of the characteristic light-curve shapes.
  const rp = document.createElement('div'); rp.className = 'row buttons';
  rp.style.cssText = 'display:flex; flex-wrap:wrap; gap:6px; grid-column:1 / -1;';
  const presets = [
    ['High-mag', { binary: false, uMin: 0.05, tE: 60 }],
    ['Grazing', { binary: false, uMin: 0.7, tE: 60 }],
    ['Binary caustic', { binary: true, uMin: 0.08, sep: 1.0, q: 0.5, tE: 60 }],
    ['Planet', { binary: true, uMin: 0.05, sep: 1.12, q: 0.1, tE: 60 }],
  ];
  for (const [name, cfg] of presets) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = name;
    b.addEventListener('click', () => { Object.assign(state, cfg); state.t = -120; rebuildLenses(); buildControls(); render(); });
    rp.appendChild(b);
  }
  controlsEl.appendChild(rp);
}
buildControls();

if (DETERMINISTIC) {
  if (CAPTURE_NAME) {
    // Sweep the source across the lens so the five frames show the
    // event rise, the Einstein-ring alignment at peak, and the fade.
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    state.t = -120 + f * 240;
  } else {
    state.t = -40;
  }
  render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  const A = pointA(0.3);
  if (Math.abs(A - 3.4448) > 0.005) return { name: 'Paczynski formula', pass: false, msg: `A(0.3) = ${A.toFixed(4)} expected 3.4448` };
  const im = findImages(makeLenses(false), { x: 0.3, y: 0 });
  if (im.length !== 2) return { name: 'point-lens images', pass: false, msg: `found ${im.length}, expected 2` };
  return { name: 'Paczynski A(u) + 2 point-lens images', pass: true, msg: `A(0.3)=${A.toFixed(4)}, ${im.length} images` };
};


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const A = pointA(state.uMin);
  const u = Math.abs(state.uMin);
  return { fields: [
    { key: 'impact-parameter', label: 'Impact parameter u', value: u, format: 'float' },
    { key: 'time', label: 'Time t (Einstein years)', value: state.t, format: 'float' },
    { key: 'magnification', label: 'Magnification A(u)', value: A, format: 'float' },
    { key: 'einstein-time', label: 'Einstein timescale tE (days)', value: state.tE, format: 'float' },
  ]};
};
window.playground.getInvariants = function () {
  const A = pointA(state.uMin);
  const AFormula = (state.uMin * state.uMin + 2) / (state.uMin * Math.sqrt(state.uMin * state.uMin + 4));
  const formulaOk = Math.abs(A - AFormula) < 1e-8;
  return [{ key: 'paczynski-formula', label: 'Paczynski magnification formula', value: formulaOk ? 'pass' : 'drift', status: formulaOk ? 'pass' : 'drift' }];
};
