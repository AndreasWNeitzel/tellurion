import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for scattering off a central potential. Top region: a
// parallel beam, colored by impact parameter b, fans out after the encounter
// (hard sphere, Coulomb, or screened Yukawa center). Bottom region: the
// deflection function chi(b), with a cursor at the selected impact parameter.
//
// Reference: Goldstein, Classical Mechanics (3rd ed.), Ch. 3.7;
// Landau and Lifshitz, Mechanics (3rd ed.), Sec. 18-19.

import { chiOf, relTrajectory } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const controlsEl = document.getElementById('controls');

const P = { kind: 'coulomb', alpha: 2.0, lambda: 3.0, mu: 1.0, E: 1.5, R: 2.5, bSel: 1.6 };
const v0 = () => Math.sqrt(2 * P.E / P.mu);
const bMax = () => (P.kind === 'hard' ? P.R * 1.15 : 6);
const simParams = () => ({ kind: P.kind, alpha: P.alpha, lambda: P.lambda, mu: P.mu, v0: v0(), E: P.E, R: P.R });

let running = !DETERMINISTIC;
let fan = [];
let chiCurve = [];
let selTraj = null;
let phase = 0;

function rebuild() {
  const p = simParams();
  const bm = bMax();
  fan = [];
  for (const f of [0.2, 0.4, 0.6, 0.8, 1.0]) {
    for (const sgn of [1, -1]) {
      const b = f * bm;
      const pts = relTrajectory(b, p).map(([x, y]) => [x, sgn * y]);
      fan.push({ b: sgn * b, absb: b, t: f, pts });
    }
  }
  const NB = p.kind === 'yukawa' ? 44 : 90;
  chiCurve = [];
  for (let i = 0; i <= NB; i++) {
    const b = (i / NB) * bm;
    chiCurve.push({ b, chi: chiOf(Math.max(1e-3, b), p) });
  }
  updateSel();
}
function updateSel() {
  selTraj = relTrajectory(Math.max(1e-3, P.bSel), simParams());
}

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.7 },
    { name: 'diagnostic', weight: 1.5 },
  ]);
}

// === Controls (built here, appended to #controls) ===
function buildButtonRow(items, extraClass) {
  const row = document.createElement('div');
  row.className = 'row buttons' + (extraClass ? ' ' + extraClass : '');
  const btns = {};
  for (const [key, label] of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.dataset.key = key;
    row.appendChild(b);
    btns[key] = b;
  }
  controlsEl.appendChild(row);
  return btns;
}
function buildSlider(label, min, max, step, value, onInput, fmt = (v) => v.toFixed(1)) {
  const row = document.createElement('div');
  row.className = 'row';
  const lab = document.createElement('span');
  lab.className = 'label';
  lab.textContent = label;
  const inp = document.createElement('input');
  inp.type = 'range';
  inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(value);
  inp.setAttribute('aria-label', label);
  const val = document.createElement('span');
  val.className = 'value';
  val.textContent = fmt(+value);
  inp.addEventListener('input', () => { val.textContent = fmt(+inp.value); onInput(parseFloat(inp.value)); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row);
  return { inp, val, lab };
}

const kindBtns = buildButtonRow([['hard', 'hard sphere'], ['coulomb', 'Coulomb'], ['yukawa', 'Yukawa']]);
function setKindPressed() {
  for (const k of Object.keys(kindBtns)) kindBtns[k].setAttribute('aria-pressed', String(k === P.kind));
}
const bCtl = buildSlider('impact b', 0.1, bMax(), 0.05, P.bSel, (v) => { P.bSel = v; updateSel(); render(); }, (v) => v.toFixed(2));
const strengthCtl = buildSlider('strength', 0.5, 6, 0.1, P.alpha, (v) => {
  if (P.kind === 'hard') P.R = v; else P.alpha = v;
  rebuild(); render();
});
const energyCtl = buildSlider('energy E', 0.5, 4, 0.1, P.E, (v) => { P.E = v; rebuild(); render(); }, (v) => v.toFixed(2));

function reconfigureStrength() {
  if (P.kind === 'hard') {
    strengthCtl.inp.min = '0.8'; strengthCtl.inp.max = '4'; strengthCtl.inp.step = '0.1';
    strengthCtl.inp.value = String(P.R); strengthCtl.val.textContent = P.R.toFixed(1);
    strengthCtl.lab.textContent = 'radius R';
  } else {
    strengthCtl.inp.min = '0.5'; strengthCtl.inp.max = '6'; strengthCtl.inp.step = '0.1';
    strengthCtl.inp.value = String(P.alpha); strengthCtl.val.textContent = P.alpha.toFixed(1);
    strengthCtl.lab.textContent = 'strength';
  }
}
function setKind(k) {
  P.kind = k;
  setKindPressed();
  reconfigureStrength();
  const bm = bMax();
  bCtl.inp.max = bm.toFixed(2);
  if (P.bSel > bm) { P.bSel = bm * 0.8; bCtl.inp.value = String(P.bSel); bCtl.val.textContent = P.bSel.toFixed(2); }
  rebuild(); render();
}
for (const k of Object.keys(kindBtns)) kindBtns[k].addEventListener('click', () => setKind(k));

const ctrlRow = buildButtonRow([['reset', 'Reset'], ['pause', 'Pause']], 'two');
ctrlRow.reset.addEventListener('click', () => {
  P.kind = 'coulomb'; P.alpha = 2.0; P.E = 1.5; P.R = 2.5; P.bSel = 1.6;
  setKindPressed(); reconfigureStrength();
  bCtl.inp.max = bMax().toFixed(2); bCtl.inp.value = '1.6'; bCtl.val.textContent = '1.60';
  energyCtl.inp.value = '1.5'; energyCtl.val.textContent = '1.50';
  running = true; ctrlRow.pause.textContent = 'Pause'; ctrlRow.pause.setAttribute('aria-pressed', 'false');
  rebuild(); render();
});
ctrlRow.pause.setAttribute('aria-pressed', 'false');
ctrlRow.pause.addEventListener('click', () => {
  running = !running;
  ctrlRow.pause.textContent = running ? 'Pause' : 'Play';
  ctrlRow.pause.setAttribute('aria-pressed', String(!running));
});
setKindPressed();
reconfigureStrength();

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    center: '#ff6b6b',
    border: 'rgba(255,255,255,0.12)',
    grid: 'rgba(255,255,255,0.08)',
  };
}

function panel(col, r, title) {
  ctx.fillStyle = col.panel;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.fillStyle = col.muted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 8, r.y + 7);
  }
}
function vrgb(t) { const c = viridis(t); return `rgb(${c.r | 0},${c.g | 0},${c.b | 0})`; }

function drawScene(col, r) {
  panel(col, r, 'A beam scatters off the center');

  const titleH = 22, stripH = 28;
  const box = { x: r.x + 10, y: r.y + titleH + 4, w: r.w - 20, h: r.h - titleH - 4 - stripH - 6 };

  // World view window (units of the relative coordinate): crop the long
  // incoming flight to the encounter region, keep the impact spread in view.
  const bm = bMax();
  const xMin = -13, xMax = 17, yAbs = bm + 1.6;
  const scale = Math.min(box.w / (xMax - xMin), box.h / (2 * yAbs));
  const cx = box.x + box.w / 2 - ((xMin + xMax) / 2) * scale;
  const cy = box.y + box.h / 2;
  const sx = (wx) => cx + wx * scale;
  const sy = (wy) => cy - wy * scale;

  ctx.save();
  clipTo(ctx, box);

  // Incoming-beam guide line at the left.
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.setLineDash([2, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sx(xMin + 0.5), sy(yAbs));
  ctx.lineTo(sx(xMin + 0.5), sy(-yAbs));
  ctx.stroke();
  ctx.setLineDash([]);

  // Fan trajectories (faint full paths).
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1.4;
  for (const tr of fan) {
    ctx.strokeStyle = vrgb(tr.t);
    ctx.beginPath();
    tr.pts.forEach((pt, i) => { const X = sx(pt[0]), Y = sy(pt[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Moving particles: a few dots per trajectory, staggered.
  for (const tr of fan) {
    const n = tr.pts.length;
    ctx.fillStyle = vrgb(tr.t);
    for (let k = 0; k < 3; k++) {
      const f = (phase + k / 3) % 1;
      const pt = tr.pts[Math.min(n - 1, Math.floor(f * (n - 1)))];
      ctx.beginPath();
      ctx.arc(sx(pt[0]), sy(pt[1]), 2.6, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // Highlighted selected impact parameter.
  if (selTraj && selTraj.length) {
    ctx.strokeStyle = col.accent;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    selTraj.forEach((pt, i) => { const X = sx(pt[0]), Y = sy(pt[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
    ctx.stroke();
    const n = selTraj.length;
    const pt = selTraj[Math.min(n - 1, Math.floor(phase * (n - 1)))];
    ctx.fillStyle = col.accent;
    ctx.beginPath();
    ctx.arc(sx(pt[0]), sy(pt[1]), 4, 0, 2 * Math.PI);
    ctx.fill();
    // impact-parameter marker on the incoming side.
    ctx.strokeStyle = 'rgba(255,209,102,0.5)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx(xMin + 0.5), sy(P.bSel));
    ctx.lineTo(sx(0), sy(P.bSel));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = col.accent;
    ctx.font = fontString(canvas, 'tick', 'mono', 700);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('b', sx(xMin + 1.2), sy(P.bSel) - 2);
  }

  // Scattering center.
  if (P.kind === 'hard') {
    ctx.fillStyle = 'rgba(255,107,107,0.18)';
    ctx.strokeStyle = col.center;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx(0), sy(0), P.R * scale, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  } else {
    for (let ri = 3; ri >= 1; ri--) {
      ctx.fillStyle = `rgba(255,107,107,${0.05 * ri})`;
      ctx.beginPath();
      ctx.arc(sx(0), sy(0), ri * (P.kind === 'yukawa' ? P.lambda : 2) * scale * 0.5, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = col.center;
    ctx.beginPath();
    ctx.arc(sx(0), sy(0), 5, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.restore();

  // Readout strip.
  const chi = chiOf(Math.max(1e-3, P.bSel), simParams());
  const ry = r.y + r.h - stripH / 2 + 1;
  const items = [
    [P.kind === 'hard' ? 'hard sphere' : (P.kind === 'coulomb' ? 'Coulomb' : 'Yukawa'), col.fg],
    [`b = ${P.bSel.toFixed(2)}`, col.accent],
    [`χ = ${(chi * 180 / Math.PI).toFixed(0)}°`, col.accent],
    [`E = ${P.E.toFixed(2)}`, col.muted],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, ry); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Deflection function: scattering angle vs impact parameter');

  const inner = { x: r.x + 46, y: r.y + 28, w: r.w - 46 - 14, h: r.h - 28 - 40 };
  const bm = bMax();
  const xOf = (b) => inner.x + (b / bm) * inner.w;
  const yOf = (chi) => inner.y + inner.h - (chi / Math.PI) * inner.h;

  // Grid + y ticks (0, 90, 180 deg).
  ctx.strokeStyle = col.grid;
  ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const [chi, lab] of [[0, '0'], [Math.PI / 2, '90'], [Math.PI, '180']]) {
    const y = yOf(chi);
    ctx.beginPath();
    ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y);
    ctx.stroke();
    ctx.fillText(lab, inner.x - 5, y);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i <= 3; i++) {
    const b = (i / 3) * bm;
    ctx.fillText(b.toFixed(1), xOf(b), inner.y + inner.h + 4);
  }
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // chi(b) curve, colored by b to match the beam.
  ctx.lineWidth = 2.6;
  for (let i = 1; i < chiCurve.length; i++) {
    const a = chiCurve[i - 1], b = chiCurve[i];
    ctx.strokeStyle = vrgb(b.b / bm);
    ctx.beginPath();
    ctx.moveTo(xOf(a.b), yOf(a.chi));
    ctx.lineTo(xOf(b.b), yOf(b.chi));
    ctx.stroke();
  }

  // Cursor at selected b.
  const chiSel = chiOf(Math.max(1e-3, P.bSel), simParams());
  const bx = xOf(Math.min(bm, P.bSel));
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx, inner.y); ctx.lineTo(bx, inner.y + inner.h);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = col.accent;
  ctx.beginPath();
  ctx.arc(bx, yOf(chiSel), 4, 0, 2 * Math.PI);
  ctx.fill();

  // Axis labels.
  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('impact parameter b', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save();
  ctx.translate(inner.x - 32, inner.y + inner.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('deflection χ (deg)', 0, 0);
  ctx.restore();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) phase = (phase + dt * 0.28) % 1;
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    phase = f % 1;
  }
  rebuild();
  relayout();
  render();
}

window.addEventListener('load', bootSync);
if (document.readyState !== 'loading') bootSync();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => { relayout(); render(); }).observe(canvas);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else if (!CAPTURE_NAME) {
  requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const chi = chiOf(Math.max(1e-3, P.bSel), simParams());
  return {
    fields: [
      { key: 'kind', label: 'potential', value: P.kind, format: 'text' },
      { key: 'b', label: 'impact parameter $b$', value: P.bSel, format: 'float' },
      { key: 'chi', label: 'deflection $\\chi$ (deg)', value: chi * 180 / Math.PI, format: 'float' },
      { key: 'E', label: 'energy $E$', value: P.E, format: 'float' },
    ],
  };
};

window.playground.getInvariants = function () {
  try {
    if (!selTraj || selTraj.length < 4) return [];
    // The integrated orbit should reproduce the analytic deflection law:
    // measure the outgoing direction of the highlighted trajectory and
    // compare it to chi(b). Tight for the closed-form cases, a few percent
    // for the display integrator on the close Coulomb approach.
    const n = selTraj.length;
    const dx = selTraj[n - 1][0] - selTraj[n - 2][0];
    const dy = selTraj[n - 1][1] - selTraj[n - 2][1];
    const chiTraj = Math.atan2(Math.abs(dy), dx);
    const chiTh = chiOf(Math.max(1e-3, P.bSel), simParams());
    const err = Math.abs(chiTraj - chiTh) / Math.max(0.05, chiTh);
    return [{
      key: 'deflection',
      label: 'orbit matches χ(b) law (rel.)',
      value: err.toExponential(2),
      status: err < 3e-2 ? 'pass' : (err < 1e-1 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
