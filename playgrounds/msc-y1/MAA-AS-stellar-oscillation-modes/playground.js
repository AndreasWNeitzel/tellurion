// Stellar oscillation modes. The surface shows the angular part of a mode, the
// real spherical harmonic Y_l^m(theta, phi) cos(omega t), drawn as a radially
// displaced, depth-sorted sphere with its nodal lines. The diagnostic shows the
// radial part, the eigenfunction xi_r(r) of a real n_poly = 3 polytrope, whose
// number of interior nodes is the radial order n. Canvas2D only.
//
// Reference: Aerts, Christensen-Dalsgaard and Kurtz, Asteroseismology (2010),
// Ch. 3; Unno et al., Nonradial Oscillations of Stars (1989).

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { rdbu } from '../../../shared/js/render/colormaps.js';
import {
  realYlm, plgndr, modeFrequency, radialEigenfunction, turningRadius, surfaceNodes,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const controlsEl = document.getElementById('controls');

const state = { n: 2, l: 3, m: 1, t: 0 };
// optional initial mode from the URL (also the share-state keys).
const clampInt = (v, lo, hi, dflt) => (v === null || !Number.isFinite(+v) ? dflt : Math.max(lo, Math.min(hi, parseInt(v, 10))));
state.n = clampInt(params.get('n'), 0, 5, state.n);
state.l = clampInt(params.get('l'), 0, 6, state.l);
state.m = clampInt(params.get('m'), -state.l, state.l, state.m);
let running = !DETERMINISTIC;

let view = { w: 900, h: 600, dpr: 1 };
let REG = null;
// cached radial structure, rebuilt only when (n, l) changes.
let eig = null, freq = 0, rt = 0;
function rebuildRadial() {
  eig = radialEigenfunction(state.n, state.l);
  freq = modeFrequency(state.n, state.l);
  rt = turningRadius(state.n, state.l);
}

function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.7 },
    { name: 'diagnostic', weight: 1.05 },
  ]);
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#08090d',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)',
  };
}

function panel(col, r, title) {
  ctx.fillStyle = col.panel;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

// Map a radial displacement (already scaled to roughly [-1, 1]) to a diverging
// red (outward) / blue (inward) colour with depth shading.
function dispColor(d, shade) {
  const c = rdbu(0.5 + 0.5 * Math.max(-1, Math.min(1, d)));
  return `rgb(${(c.r * shade) | 0},${(c.g * shade) | 0},${(c.b * shade) | 0})`;
}

// 3D oblique projection of the pulsating surface. Returns the projector closure
// so nodal lines can reuse the exact same transform.
function makeProjector(cx, cy, R, phase, az) {
  const ca = Math.cos(az), sa = Math.sin(az);
  const tilt = 0.46, ct = Math.cos(tilt), stl = Math.sin(tilt);
  const amp = 0.20;
  return function project(theta, phi, displaced = true) {
    const disp = realYlm(state.l, state.m, theta, phi) * phase;
    const rr = displaced ? 1 + amp * disp : 1;
    const x = rr * Math.sin(theta) * Math.cos(phi);
    const y = rr * Math.cos(theta);
    const z = rr * Math.sin(theta) * Math.sin(phi);
    const xr = ca * x + sa * z;
    const zr = -sa * x + ca * z;
    const yr = ct * y - stl * zr;
    const depth = stl * y + ct * zr;
    return { sx: cx + xr * R, sy: cy - yr * R, depth, disp };
  };
}

function drawScene(col, r) {
  panel(col, r, 'Surface displacement  Y_l^m(theta, phi) cos(omega t)');
  const titleH = 22, stripH = 26;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const cx = draw.x + draw.w / 2, cy = draw.y + draw.h / 2;
  const R = Math.min(draw.w, draw.h) * 0.42;
  const phase = Math.cos(state.t);
  const az = state.t * 0.10;
  const project = makeProjector(cx, cy, R, phase, az);

  ctx.save();
  clipTo(ctx, draw);

  // depth-sorted quad mesh.
  const NLAT = 40, NLON = 72;
  const quads = [];
  for (let i = 0; i < NLAT; i += 1) {
    const th0 = Math.PI * i / NLAT, th1 = Math.PI * (i + 1) / NLAT;
    for (let j = 0; j < NLON; j += 1) {
      const ph0 = 2 * Math.PI * j / NLON, ph1 = 2 * Math.PI * (j + 1) / NLON;
      const p00 = project(th0, ph0), p01 = project(th0, ph1);
      const p11 = project(th1, ph1), p10 = project(th1, ph0);
      quads.push({
        p00, p01, p11, p10,
        dispMid: 0.25 * (p00.disp + p01.disp + p11.disp + p10.disp),
        depthMid: 0.25 * (p00.depth + p01.depth + p11.depth + p10.depth),
      });
    }
  }
  quads.sort((a, b) => a.depthMid - b.depthMid);
  for (const q of quads) {
    const shade = 0.5 + 0.5 * Math.max(0, Math.min(1, (q.depthMid + 1.25) / 2.5));
    ctx.fillStyle = dispColor(q.dispMid * 2.6, shade);
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.beginPath();
    ctx.moveTo(q.p00.sx, q.p00.sy); ctx.lineTo(q.p01.sx, q.p01.sy);
    ctx.lineTo(q.p11.sx, q.p11.sy); ctx.lineTo(q.p10.sx, q.p10.sy);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  drawNodalLines(project, col);
  ctx.restore();

  // readout strip.
  const sn = surfaceNodes(state.l, state.m);
  const items = [
    [`(n,l,m)=(${state.n},${state.l},${state.m})`, col.fg],
    [`${freq.toFixed(0)} uHz`, col.accent],
    [`${state.n} r-nodes`, '#7cc6ff'],
    [`surf ${sn.latitudes}+${sn.meridians}`, '#ff8a8a'],
  ];
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  let widest = 0; for (const [t] of items) widest = Math.max(widest, ctx.measureText(t).width);
  if (widest > r.w / 4 - 8) ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

// Nodal lines of Y_l^m: l - |m| circles of latitude (P_l^|m| = 0) and, for
// m != 0, 2|m| meridians (cos(m phi) = 0). Only the front-facing arc is drawn.
function drawNodalLines(project, col) {
  const mm = Math.abs(state.m);
  ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(245,247,255,0.92)';

  // latitude circles: scan theta for sign changes of P_l^mm(cos theta).
  const thetaNodes = [];
  let prev = plgndr(state.l, mm, Math.cos(0.001));
  for (let i = 1; i <= 400; i += 1) {
    const th = Math.PI * i / 400;
    const val = plgndr(state.l, mm, Math.cos(th));
    if (prev === 0 || (val < 0) !== (prev < 0)) thetaNodes.push(th - Math.PI / 800);
    prev = val;
  }
  for (const thN of thetaNodes) strokeRing(project, (phi) => [thN, phi], 0, 2 * Math.PI);

  // meridians: cos(m phi) = 0 at phi = (2k+1) pi / (2 mm).
  if (mm > 0) {
    for (let k = 0; k < 2 * mm; k += 1) {
      const phiN = (2 * k + 1) * Math.PI / (2 * mm);
      strokeRing(project, (th) => [th, phiN], 0, Math.PI);
    }
  }
}

// Stroke a parametric curve on the (undisplaced) unit sphere, breaking the path
// wherever the surface turns away from the camera so only the near side shows.
function strokeRing(project, paramAt, t0, t1) {
  const N = 160;
  ctx.beginPath();
  let pen = false;
  for (let i = 0; i <= N; i += 1) {
    const t = t0 + (t1 - t0) * i / N;
    const [th, phi] = paramAt(t);
    const p = project(th, phi, false);
    if (p.depth > 0.02) { if (pen) ctx.lineTo(p.sx, p.sy); else { ctx.moveTo(p.sx, p.sy); pen = true; } }
    else pen = false;
  }
  ctx.stroke();
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Radial eigenfunction of an n=3 polytrope (JWKB, n interior nodes)');
  const inner = { x: r.x + 40, y: r.y + 30, w: r.w - 40 - 16, h: r.h - 30 - 44 };
  const xOf = (x) => inner.x + x * inner.w;
  const yOf = (v) => inner.y + inner.h / 2 - v * (inner.h / 2 - 8);
  const phase = Math.cos(state.t);

  // p-mode cavity [r_t, 1] shaded; evanescent core [0, r_t] left dark.
  if (rt > 0) {
    ctx.fillStyle = 'rgba(124,198,255,0.07)';
    ctx.fillRect(xOf(rt), inner.y, inner.w * (1 - rt), inner.h);
  }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // zero line.
  ctx.strokeStyle = col.grid; ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.stroke();

  // turning point.
  if (rt > 0) {
    ctx.strokeStyle = 'rgba(124,198,255,0.6)'; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(xOf(rt), inner.y); ctx.lineTo(xOf(rt), inner.y + inner.h); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#7cc6ff'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('turning point', xOf(rt), inner.y + 4);
  }

  // eigenfunction, scaled by the same instantaneous phase as the sphere.
  ctx.strokeStyle = col.accent; ctx.lineWidth = 2.2; ctx.beginPath();
  for (let i = 0; i < eig.x.length; i += 1) {
    const X = xOf(eig.x[i]), Y = yOf(eig.xi[i] * phase);
    if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
  }
  ctx.stroke();

  // node markers on the zero line.
  ctx.fillStyle = '#ff8a8a';
  for (const xn of eig.nodes) { ctx.beginPath(); ctx.arc(xOf(xn), yOf(0), 3, 0, 2 * Math.PI); ctx.fill(); }

  // axes labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const x of [0, 0.25, 0.5, 0.75, 1]) ctx.fillText(x.toFixed(2), xOf(x), inner.y + inner.h + 6);
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('radius  r / R', inner.x + inner.w / 2, inner.y + inner.h + 22);
  ctx.save(); ctx.translate(inner.x - 26, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('radial displacement', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  if (!eig) rebuildRadial();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

function tick() {
  if (running) state.t += 0.045;
  render();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

// --- controls --------------------------------------------------------------
function buildControls() {
  controlsEl.innerHTML = '';
  const refs = {};
  function slider(id, label, min, max, value, onInput) {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
    const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
    inp.min = String(min); inp.max = String(max); inp.step = '1'; inp.value = String(value);
    inp.setAttribute('aria-label', label);
    const val = document.createElement('span'); val.className = 'value'; val.textContent = String(value);
    inp.addEventListener('input', () => { const v = parseInt(inp.value, 10); val.textContent = String(v); onInput(v, val); });
    row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
    controlsEl.appendChild(row);
    refs[id] = { inp, val };
  }
  slider('n-mode', 'radial order n', 0, 5, state.n, (v) => { state.n = v; rebuildRadial(); render(); });
  slider('l-mode', 'degree l', 0, 6, state.l, (v) => {
    state.l = v;
    state.m = Math.max(-v, Math.min(v, state.m));
    refs['m-mode'].inp.value = String(state.m); refs['m-mode'].val.textContent = String(state.m);
    rebuildRadial(); render();
  });
  slider('m-mode', 'azimuthal m', -6, 6, state.m, (v) => {
    state.m = Math.max(-state.l, Math.min(state.l, v));
    refs['m-mode'].inp.value = String(state.m); refs['m-mode'].val.textContent = String(state.m);
    render();
  });

  const brow = document.createElement('div'); brow.className = 'row buttons';
  const play = document.createElement('button'); play.type = 'button'; play.textContent = running ? 'Pause' : 'Play';
  play.setAttribute('aria-pressed', String(!running));
  play.addEventListener('click', () => { running = !running; play.textContent = running ? 'Pause' : 'Play'; play.setAttribute('aria-pressed', String(!running)); });
  const reset = document.createElement('button'); reset.type = 'button'; reset.textContent = 'Reset';
  reset.addEventListener('click', () => {
    state.n = 2; state.l = 3; state.m = 1; state.t = 0; running = true; play.textContent = 'Pause'; play.setAttribute('aria-pressed', 'false');
    for (const id of ['n-mode', 'l-mode', 'm-mode']) { refs[id].inp.value = String(state[id[0]]); refs[id].val.textContent = String(state[id[0]]); }
    rebuildRadial(); render();
  });
  brow.appendChild(play); brow.appendChild(reset); controlsEl.appendChild(brow);
}

buildControls();
relayout();
rebuildRadial();
render();

if (DETERMINISTIC) {
  state.t = 2.5;             // a phase with strong, non-zero displacement
  render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  requestAnimationFrame(tick);
}

window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// physics self-check kept for the visual-test harness.
window.__physicsCheck = async () => {
  const v00 = realYlm(0, 0, Math.PI / 3, 0.7);
  const expected = 1 / (2 * Math.sqrt(Math.PI));
  if (Math.abs(v00 - expected) > 1e-9) return { name: 'Y_0^0 normalization', pass: false, msg: `${v00} vs ${expected}` };
  return { name: 'Y_l^m surface harmonic', pass: true, msg: `Y_0^0 = ${v00.toFixed(6)}` };
};

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const sn = surfaceNodes(state.l, state.m);
  return {
    fields: [
      { key: 'radial-order', label: 'Radial order n', value: state.n, format: 'float' },
      { key: 'degree-l', label: 'Degree l', value: state.l, format: 'float' },
      { key: 'azimuth-m', label: 'Azimuthal m', value: state.m, format: 'float' },
      { key: 'frequency', label: 'Frequency (uHz)', value: freq, format: 'float' },
      { key: 'turning', label: 'p-mode turning point r/R', value: rt, format: 'float' },
      { key: 'surface-nodes', label: 'Surface nodes (lat+merid)', value: `${sn.latitudes}+${sn.meridians}`, format: 'text' },
    ],
  };
};
window.playground.getInvariants = function () {
  const mBound = Math.abs(state.m) <= state.l;
  const nodesOk = eig && eig.nodes.length === state.n;
  return [
    { key: 'azimuth-bound', label: 'Azimuthal number |m| <= l', value: mBound ? 'pass' : 'fail', status: mBound ? 'pass' : 'drift' },
    { key: 'radial-nodes', label: 'Radial nodes equal n', value: nodesOk ? 'pass' : `${eig ? eig.nodes.length : '?'} != ${state.n}`, status: nodesOk ? 'pass' : 'drift' },
  ];
};
