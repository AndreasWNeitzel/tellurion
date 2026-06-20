// playground.js
// Gravity-assist slingshot. A hyperbolic flyby in the planet rest frame
// (symmetric: |v_in| = |v_out|, only the direction turns). The slingshot
// appears in the Sun frame, where adding the planet's velocity makes the
// craft leave faster than it arrived, with no fuel.
//
// Vertical 4:5 composition:
//   1. SCENE: the planet-frame hyperbola, the animated spacecraft, and the
//      incoming/outgoing velocity arrows (same length: planet-frame speed is
//      unchanged).
//   2. SUN FRAME: the velocity composition. v_before and v_after are the
//      craft's heliocentric velocity; their lengths differ, and that
//      difference is the free speed the flyby steals from the planet.

import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? 'NaN');
let probePhase = 0;

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const controlsEl = document.getElementById('controls');

const state = {
  r_min: 2.0,     // periapsis distance (planet radii)
  v_inf: 1.0,     // hyperbolic excess speed (units of v_planet)
  approach: 2.0,  // entry angle (rad); ~2 rad passes behind the planet -> a boost
};

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.5 },
    { name: 'frame', weight: 1.5 },
  ]);
}

function hyperbola(r_min, v_inf, GM) {
  const v_peri = Math.sqrt(v_inf * v_inf + 2 * GM / r_min);
  const h = r_min * v_peri;
  const p = h * h / GM;
  const e = p / r_min - 1;
  const delta = 2 * Math.asin(1 / e);
  return { v_peri, h, p, e, delta };
}
function sampleHyperbola(orbit, n) {
  const { p, e } = orbit;
  const thetaMax = Math.acos(-1 / e) * 0.985;
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const t = (i / (n - 1)) * 2 - 1;
    const theta = t * thetaMax;
    const r = p / (1 + e * Math.cos(theta));
    pts.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
  }
  return pts;
}
function rotate(pts, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  return pts.map((p) => ({ x: p.x * c - p.y * s, y: p.x * s + p.y * c }));
}
function unit(v) { const m = Math.hypot(v.x, v.y) || 1; return { x: v.x / m, y: v.y / m }; }

function arrowHead(x1, y1, ux, uy, col) {
  const ah = 8, ang = Math.atan2(uy, ux);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ah * Math.cos(ang - 0.4), y1 - ah * Math.sin(ang - 0.4));
  ctx.lineTo(x1 - ah * Math.cos(ang + 0.4), y1 - ah * Math.sin(ang + 0.4));
  ctx.closePath(); ctx.fill();
}
function vec(x0, y0, x1, y1, col, w) {
  ctx.strokeStyle = col; ctx.lineWidth = w || 2;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const u = unit({ x: x1 - x0, y: y1 - y0 });
  arrowHead(x1, y1, u.x, u.y, col);
}

function panel(r, title) {
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

function render() {
  if (!REG) relayout();
  ctx.fillStyle = '#07090f';
  ctx.fillRect(0, 0, view.w, view.h);
  const orbit = hyperbola(state.r_min, state.v_inf, 1);
  const pts = rotate(sampleHyperbola(orbit, 240), state.approach);
  const uin = unit({ x: pts[1].x - pts[0].x, y: pts[1].y - pts[0].y });
  const n = pts.length;
  const uout = unit({ x: pts[n - 1].x - pts[n - 2].x, y: pts[n - 1].y - pts[n - 2].y });

  // ---- SCENE: planet-frame flyby ----
  const S = REG.scene;
  panel(S, null);
  let xmin = 0, xmax = 0, ymin = 0, ymax = 0;
  for (const p of pts) { if (p.x < xmin) xmin = p.x; if (p.x > xmax) xmax = p.x; if (p.y < ymin) ymin = p.y; if (p.y > ymax) ymax = p.y; }
  // Cap the view to the periapsis region so the planet and the bend dominate
  // (the asymptotes run off the panel, which is clipped).
  const maxE = state.r_min * 4.5;
  xmin = Math.max(xmin, -maxE); xmax = Math.min(xmax, maxE);
  ymin = Math.max(ymin, -maxE); ymax = Math.min(ymax, maxE);
  const padS = 42;
  const domW = (xmax - xmin) || 1, domH = (ymax - ymin) || 1;
  const scale = Math.min((S.w - 2 * padS) / domW, (S.h - 2 * padS) / domH);
  const ox = S.x + padS + ((S.w - 2 * padS) - domW * scale) / 2 - xmin * scale;
  const oy = S.y + padS + ((S.h - 2 * padS) - domH * scale) / 2 - ymin * scale;
  const X = (x) => ox + x * scale, Y = (y) => oy + y * scale;

  ctx.save();
  ctx.beginPath(); ctx.rect(S.x + 1, S.y + 1, S.w - 2, S.h - 2); ctx.clip();
  // Planet (radius 1 unit).
  const px = X(0), py = Y(0), R = Math.max(9, scale);
  ctx.save();
  ctx.beginPath(); ctx.arc(px, py, R, 0, 6.28); ctx.clip();
  const pg = ctx.createRadialGradient(px - R * 0.35, py - R * 0.4, R * 0.1, px, py, R);
  pg.addColorStop(0, '#f0b070'); pg.addColorStop(0.6, '#cf7f3a'); pg.addColorStop(1, '#5e3413');
  ctx.fillStyle = pg; ctx.fillRect(px - R, py - R, 2 * R, 2 * R);
  ctx.fillStyle = 'rgba(90,45,15,0.35)';
  for (let b = -0.7; b <= 0.7; b += 0.28) ctx.fillRect(px - R, py + b * R - R * 0.05, 2 * R, R * 0.1);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(px, py, R, 0, 6.28); ctx.stroke();

  // Trajectory.
  ctx.strokeStyle = '#7c9cff'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < n; i += 1) { const p = [X(pts[i].x), Y(pts[i].y)]; i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
  ctx.stroke();

  // Spacecraft + comet trail.
  const pi = Math.min(n - 1, Math.max(0, Math.floor(probePhase * (n - 1))));
  for (let k = Math.max(1, pi - 26); k <= pi; k += 1) {
    ctx.strokeStyle = `rgba(124,255,170,${(0.06 + 0.5 * (k - (pi - 26)) / 26).toFixed(3)})`; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(X(pts[k - 1].x), Y(pts[k - 1].y)); ctx.lineTo(X(pts[k].x), Y(pts[k].y)); ctx.stroke();
  }
  const gx = X(pts[pi].x), gy = Y(pts[pi].y);
  const gl = ctx.createRadialGradient(gx, gy, 0, gx, gy, 12);
  gl.addColorStop(0, 'rgba(170,255,200,0.95)'); gl.addColorStop(1, 'rgba(170,255,200,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(gx, gy, 12, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#d9ffe6'; ctx.beginPath(); ctx.arc(gx, gy, 3.5, 0, 6.28); ctx.fill();

  // Velocity arrows in/out (planet frame): same length.
  const aLen = Math.min(scale * 1.6, S.w * 0.16);
  vec(X(pts[0].x), Y(pts[0].y), X(pts[0].x) + uin.x * aLen, Y(pts[0].y) + uin.y * aLen, '#7c9cff', 2.4);
  vec(X(pts[n - 1].x), Y(pts[n - 1].y), X(pts[n - 1].x) + uout.x * aLen, Y(pts[n - 1].y) + uout.y * aLen, '#ffd57f', 2.4);
  ctx.restore();

  // Title + readout.
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('flyby (planet frame)', S.x + 8, S.y + 7);
  ctx.font = fontString(canvas, 'mono', 'mono'); ctx.textAlign = 'right'; ctx.fillStyle = '#e8e8e8';
  ctx.fillText(`turn ${(orbit.delta * 180 / Math.PI).toFixed(0)}°   r_min ${state.r_min.toFixed(1)}`, S.x + S.w - 8, S.y + 7);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('same arrow length in, out: planet-frame speed unchanged', S.x + S.w / 2, S.y + S.h - 4);

  // ---- SUN FRAME: velocity composition (the boost) ----
  const F = REG.frame;
  panel(F, 'Sun frame: the speed it steals');
  const vp = { x: 1, y: 0 };
  const vBefore = { x: state.v_inf * uin.x + vp.x, y: state.v_inf * uin.y + vp.y };
  const vAfter = { x: state.v_inf * uout.x + vp.x, y: state.v_inf * uout.y + vp.y };
  const speedBefore = Math.hypot(vBefore.x, vBefore.y);
  const speedAfter = Math.hypot(vAfter.x, vAfter.y);
  const gain = speedAfter - speedBefore;
  const vmaxMag = Math.max(speedBefore, speedAfter, 1) * 1.15;
  const fpadL = 16, fpadT = 28, fpadB = 28;
  const oxF = F.x + fpadL + 10;
  const cyF = F.y + fpadT + (F.h - fpadT - fpadB) / 2;
  const vScale = Math.min((F.w - fpadL - 90) / vmaxMag, (F.h - fpadT - fpadB) / 2 / vmaxMag * 1.4);
  const O = { x: oxF, y: cyF };
  // y is up in velocity space; screen y down.
  const VX = (vx) => O.x + vx * vScale;
  const VY = (vy) => O.y - vy * vScale;
  // planet velocity (gray), before (cool), after (warm).
  vec(O.x, O.y, VX(vp.x), VY(vp.y), 'rgba(180,184,190,0.9)', 2);
  vec(O.x, O.y, VX(vBefore.x), VY(vBefore.y), '#7c9cff', 2.6);
  vec(O.x, O.y, VX(vAfter.x), VY(vAfter.y), '#ffd57f', 2.6);
  // delta-v from before-tip to after-tip.
  vec(VX(vBefore.x), VY(vBefore.y), VX(vAfter.x), VY(vAfter.y), gain >= 0 ? '#7fff8a' : '#ff7f7f', 2);
  // labels.
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(180,184,190,0.95)'; ctx.fillText('planet', VX(vp.x) + 4, VY(vp.y));
  ctx.fillStyle = '#7c9cff'; ctx.fillText('before', VX(vBefore.x) + 4, VY(vBefore.y));
  ctx.fillStyle = '#ffd57f'; ctx.fillText('after', VX(vAfter.x) + 4, VY(vAfter.y));
  // speed comparison readout (right side).
  ctx.font = fontString(canvas, 'mono', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  const rx = F.x + F.w - 8;
  ctx.fillStyle = '#7c9cff'; ctx.fillText(`before ${speedBefore.toFixed(2)}`, rx, F.y + 26);
  ctx.fillStyle = '#ffd57f'; ctx.fillText(`after  ${speedAfter.toFixed(2)}`, rx, F.y + 42);
  ctx.fillStyle = gain >= 0 ? '#7fff8a' : '#ff7f7f';
  ctx.fillText(`${gain >= 0 ? '+' : ''}${gain.toFixed(2)} ${gain >= 0 ? 'boost' : 'brake'}`, rx, F.y + 58);
}

function buildControls() {
  controlsEl.innerHTML = '';
  function slider(id, label, min, max, step, value, onInput, fmt = (v) => v.toFixed(2)) {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
    const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
    inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(value);
    inp.setAttribute('aria-label', label);
    const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
    inp.addEventListener('input', () => { const v = parseFloat(inp.value); val.textContent = fmt(v); onInput(v); render(); });
    row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
    controlsEl.appendChild(row);
  }
  slider('r-min', 'r_min', 1.1, 8.0, 0.05, state.r_min, (v) => { state.r_min = v; });
  slider('v-inf', 'v_inf', 0.3, 2.5, 0.05, state.v_inf, (v) => { state.v_inf = v; });
  slider('approach', 'approach', -Math.PI, Math.PI, 0.05, state.approach, (v) => { state.approach = v; });
}

if (typeof ResizeObserver !== 'undefined') {
  let raf = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { relayout(); render(); });
  });
  ro.observe(canvas);
}

relayout();
buildControls();
if (CAPTURE_NAME) {
  probePhase = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
  render();
} else if (prefersReducedMotion()) {
  probePhase = 0.5;
  render();
} else {
  let raf;
  function tick() { probePhase = (probePhase + 0.004) % 1; render(); raf = requestAnimationFrame(tick); }
  render();
  raf = requestAnimationFrame(tick);
}

if (DETERMINISTIC) {
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
}

window.__physicsCheck = async () => {
  const orbit = hyperbola(state.r_min, state.v_inf, 1);
  const pts = sampleHyperbola(orbit, 240);
  function energy(p, q) {
    const v = Math.hypot(p.x - q.x, p.y - q.y);
    const r = Math.hypot((p.x + q.x) / 2, (p.y + q.y) / 2);
    return 0.5 * v * v - 1 / r;
  }
  const ein = energy(pts[1], pts[0]);
  const eout = energy(pts[pts.length - 1], pts[pts.length - 2]);
  if (Math.abs(ein - eout) / Math.max(Math.abs(ein), 1e-6) > 0.01) {
    return { name: 'energy symmetric', pass: false, msg: `E_in=${ein.toFixed(4)} E_out=${eout.toFixed(4)}` };
  }
  return { name: 'hyperbola energy symmetric', pass: true, msg: `E_in=${ein.toFixed(4)} E_out=${eout.toFixed(4)} (delta < 1%)` };
};

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const orbit = hyperbola(state.r_min, state.v_inf, 1);
  const pts = rotate(sampleHyperbola(orbit, 60), state.approach);
  const uin = unit({ x: pts[1].x - pts[0].x, y: pts[1].y - pts[0].y });
  const uout = unit({ x: pts[59].x - pts[58].x, y: pts[59].y - pts[58].y });
  const vp = { x: 1, y: 0 };
  const sB = Math.hypot(state.v_inf * uin.x + vp.x, state.v_inf * uin.y + vp.y);
  const sA = Math.hypot(state.v_inf * uout.x + vp.x, state.v_inf * uout.y + vp.y);
  return {
    fields: [
      { key: 'periapsis', label: 'periapsis distance', value: state.r_min, format: 'float' },
      { key: 'v-inf', label: 'hyperbolic excess speed', value: state.v_inf, format: 'float' },
      { key: 'turning-angle', label: 'turning angle (deg)', value: orbit.delta * 180 / Math.PI, format: 'float' },
      { key: 'speed-gain', label: 'Sun-frame speed gain', value: sA - sB, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const orbit = hyperbola(state.r_min, state.v_inf, 1);
  const pts = sampleHyperbola(orbit, 240);
  const n = pts.length;
  const rIn = Math.hypot(pts[0].x, pts[0].y);
  const rOut = Math.hypot(pts[n - 1].x, pts[n - 1].y);
  const chordIn = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
  const chordOut = Math.hypot(pts[n - 1].x - pts[n - 2].x, pts[n - 1].y - pts[n - 2].y);
  const drift = Math.max(Math.abs(rIn - rOut) / Math.max(1e-9, rIn), Math.abs(chordIn - chordOut) / Math.max(1e-9, chordIn));
  return [{
    key: 'flyby-symmetry',
    label: 'flyby symmetric: incoming speed = outgoing speed (planet frame)',
    value: drift.toExponential(2),
    status: drift < 1e-6 ? 'pass' : (drift < 1e-3 ? 'pending' : 'drift'),
  }];
};
