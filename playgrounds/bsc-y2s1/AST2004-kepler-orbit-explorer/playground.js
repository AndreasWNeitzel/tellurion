import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Kepler orbit explorer, Canvas2D only. The focus is one orbit you control by
// semi-major axis a and eccentricity e, showing all three of Kepler's laws on
// it: the ellipse with the Sun at a focus (first law), the equal-area sweep
// (second law: the radius vector sweeps equal areas in equal time, so the body
// races at perihelion and crawls at aphelion), and, in the diagnostic, the
// period-size relation T^2 proportional to a^3 (third law). The inner planets
// can be toggled on as context. The bodies move under the real inverse-square
// force, integrated with an energy-conserving symplectic scheme.
//
// Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics, 2nd
// ed., Ch. 2.

import { PLANETS, createSwarm, stepSwarm, bodyPosition, keplerThirdLaw, DEFAULT_DT } from './sim.js';
import { snapshot } from '../../../shared/js/engine/symplectic.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderA = document.getElementById('slider-a');
const sliderE = document.getElementById('slider-e');
const sliderSpeed = document.getElementById('slider-speed');
const selPlanets = document.getElementById('select-planets');
const valueA = document.getElementById('value-a');
const valueE = document.getElementById('value-e');
const valueSpeed = document.getElementById('value-speed');
const valuePlanets = document.getElementById('value-planets');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const COMET = '#67d98c', SUN = '#ffd24a';
const PCOL = ['#9aa0a6', '#e0b070', '#5b8def', '#ef5466'];   // Mercury..Mars
const PNAME = ['Mercury', 'Venus', 'Earth', 'Mars'];
const NW = 16, OMEGA = 0.35;     // equal-time wedges; orbit orientation
let running = !DETERMINISTIC;
let swarm = null, bodies = [], trail = [], E0 = 0, VIEW = 3, wedges = [], dAdt = 0;

const cometA = () => parseFloat(sliderA.value);
const cometE = () => parseFloat(sliderE.value);
const speed = () => parseFloat(sliderSpeed.value);
const showPlanets = () => selPlanets.value === 'on';

function totalEnergy() {
  const s = snapshot(swarm.inst); let E = 0;
  for (let i = 0; i < swarm.N; i += 1) { const x = s.q[2 * i], y = s.q[2 * i + 1], vx = s.qdot[2 * i], vy = s.qdot[2 * i + 1]; E += 0.5 * (vx * vx + vy * vy) - 1 / Math.hypot(x, y); }
  return E;
}

// Equal-time samples of the comet's ellipse via Kepler's equation, so the
// wedges between consecutive samples all enclose the same area (2nd law).
function buildWedges() {
  const a = cometA(), e = cometE();
  const pts = [];
  for (let k = 0; k <= NW; k += 1) {
    const M = 2 * Math.PI * k / NW;
    let E = M; for (let it = 0; it < 40; it += 1) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(e ? E : 0) || 1) * 1; // placeholder
    // robust Newton for E - e sinE = M
    E = M; for (let it = 0; it < 60; it += 1) { const f = E - e * Math.sin(E) - M, fp = 1 - e * Math.cos(E); E -= f / fp; }
    const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    const r = a * (1 - e * Math.cos(E));
    pts.push([r * Math.cos(nu + OMEGA), r * Math.sin(nu + OMEGA), nu]);
  }
  wedges = pts;
  // area swept per unit time = (pi a b)/T = constant; report it.
  const b = a * Math.sqrt(1 - e * e), T = keplerThirdLaw(a);
  dAdt = Math.PI * a * b / T;
}

function rebuild() {
  const list = [{ a: cometA(), e: cometE(), omega: OMEGA }];
  if (showPlanets()) for (const p of PLANETS) list.push({ a: p.a, e: p.e, omega: p.omega });
  bodies = list;
  swarm = createSwarm(bodies);
  trail = [];
  E0 = totalEnergy();
  const apo = cometA() * (1 + cometE());
  VIEW = 1.14 * Math.max(apo, showPlanets() ? 1.66 : 0);
  buildWedges();
}
function syncVals() { valueA.textContent = cometA().toFixed(2); valueE.textContent = cometE().toFixed(2); valueSpeed.textContent = speed().toFixed(1); valuePlanets.textContent = showPlanets() ? 'shown' : 'hidden'; }
sliderA.addEventListener('input', () => { syncVals(); rebuild(); render(); });
sliderE.addEventListener('input', () => { syncVals(); rebuild(); render(); });
sliderSpeed.addEventListener('input', syncVals);
selPlanets.addEventListener('change', () => { syncVals(); rebuild(); render(); });
btnReset.addEventListener('click', () => {
  sliderA.value = '1.5'; sliderE.value = '0.6'; sliderSpeed.value = '1'; selPlanets.value = 'off';
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); rebuild(); render();
});
btnPlay.addEventListener('click', () => { running = !running; btnPlay.textContent = running ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(!running)); });

let view = { w: 760, h: 950, dpr: 1 };
let REG = null, SCN = null;
function computeSceneTransform() {
  const r = REG.scene;
  const titleH = 22, stripH = 26;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const size = Math.min(draw.w, draw.h);
  SCN = { draw, ox: draw.x + draw.w / 2, oy: draw.y + draw.h / 2, scale: size / (2 * VIEW) };
}
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.95 }, { name: 'diagnostic', weight: 1.05 }]);
  computeSceneTransform();
}
const WX = (x) => SCN.ox + x * SCN.scale;
const WY = (y) => SCN.oy - y * SCN.scale;

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608', panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) { ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7); }
}

function ellipsePath(a, e, omega) {
  ctx.beginPath();
  for (let k = 0; k <= 160; k += 1) { const nu = 2 * Math.PI * k / 160; const rr = a * (1 - e * e) / (1 + e * Math.cos(nu)); const x = rr * Math.cos(nu + omega), y = rr * Math.sin(nu + omega); if (k) ctx.lineTo(WX(x), WY(y)); else ctx.moveTo(WX(x), WY(y)); }
  ctx.closePath();
}

function drawScene(col, r) {
  panel(col, r, 'Equal areas in equal time: the second law made visible');
  ctx.save(); clipTo(ctx, SCN.draw);

  // planets (context, faint) when shown.
  if (showPlanets()) {
    for (let i = 1; i < bodies.length; i += 1) {
      const pi = i - 1;
      ctx.strokeStyle = PCOL[pi]; ctx.globalAlpha = 0.3; ctx.lineWidth = 1; ellipsePath(bodies[i].a, bodies[i].e, bodies[i].omega); ctx.stroke(); ctx.globalAlpha = 1;
      const p = bodyPosition(swarm, i);
      ctx.fillStyle = PCOL[pi]; ctx.beginPath(); ctx.arc(WX(p.x), WY(p.y), 3.5, 0, 2 * Math.PI); ctx.fill();
    }
  }

  // equal-area wedges of the comet orbit (alternating shades).
  for (let k = 0; k < NW; k += 1) {
    const p0 = wedges[k], p1 = wedges[k + 1];
    ctx.beginPath(); ctx.moveTo(WX(0), WY(0)); ctx.lineTo(WX(p0[0]), WY(p0[1]));
    // arc edge along the ellipse between the two samples.
    const a = cometA(), e = cometE();
    const n0 = p0[2], n1raw = p1[2]; let n1 = n1raw; if (n1 < n0) n1 += 2 * Math.PI;
    for (let s = 1; s <= 6; s += 1) { const nu = n0 + (n1 - n0) * s / 6; const rr = a * (1 - e * e) / (1 + e * Math.cos(nu)); ctx.lineTo(WX(rr * Math.cos(nu + OMEGA)), WY(rr * Math.sin(nu + OMEGA))); }
    ctx.closePath();
    ctx.fillStyle = k % 2 === 0 ? 'rgba(103,217,140,0.22)' : 'rgba(103,217,140,0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(103,217,140,0.35)'; ctx.lineWidth = 0.8; ctx.stroke();
  }
  // comet orbit outline.
  ctx.strokeStyle = COMET; ctx.lineWidth = 1.6; ellipsePath(cometA(), cometE(), OMEGA); ctx.stroke();

  // comet trail + body + radius vector.
  const c = bodyPosition(swarm, 0);
  if (trail.length > 1) { ctx.strokeStyle = COMET; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.6; ctx.beginPath(); trail.forEach((p, k) => { if (k) ctx.lineTo(WX(p[0]), WY(p[1])); else ctx.moveTo(WX(p[0]), WY(p[1])); }); ctx.stroke(); ctx.globalAlpha = 1; }
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(WX(0), WY(0)); ctx.lineTo(WX(c.x), WY(c.y)); ctx.stroke();
  ctx.fillStyle = COMET; ctx.beginPath(); ctx.arc(WX(c.x), WY(c.y), 5.5, 0, 2 * Math.PI); ctx.fill();

  // Sun at the focus.
  ctx.fillStyle = SUN; ctx.beginPath(); ctx.arc(WX(0), WY(0), 8, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();

  // readout strip.
  const a = cometA(), e = cometE(), T = keplerThirdLaw(a) / (2 * Math.PI);
  const speedNow = Math.hypot(snapshot(swarm.inst).qdot[0], snapshot(swarm.inst).qdot[1]);
  const items = [[`a ${a.toFixed(2)}`, COMET], [`e ${e.toFixed(2)}`, col.accent], [`T ${T.toFixed(2)}yr`, col.fg], [`speed ${speedNow.toFixed(2)}`, col.muted]];
  ctx.font = fontString(canvas, 'caption', 'mono', 700); ctx.textBaseline = 'middle';
  let need = 0; for (const [t] of items) need += ctx.measureText(t).width + 18;
  if (need <= r.w) { ctx.textAlign = 'center'; items.forEach(([t, cc], i) => { ctx.fillStyle = cc; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); }); }
  else { ctx.textAlign = 'center'; items.forEach(([t, cc], i) => { ctx.fillStyle = cc; ctx.fillText(t, r.x + r.w * ((i % 2) + 0.5) / 2, r.y + r.h - (i < 2 ? 22 : 8)); }); }
}

function drawDiagnostic(col, r) {
  panel(col, r, "Kepler's third law: T² grows as a³");
  const inner = { x: r.x + 52, y: r.y + 28, w: r.w - 52 - 16, h: r.h - 28 - 42 };
  const aMax = Math.max(cometA(), showPlanets() ? 1.524 : cometA());
  const x3Max = Math.pow(aMax, 3) * 1.14, y2Max = Math.pow(keplerThirdLaw(aMax), 2) * 1.14;
  const xOf = (a3) => inner.x + a3 / x3Max * inner.w;
  const yOf = (t2) => inner.y + inner.h - t2 / y2Max * inner.h;
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const f of [0, 0.5, 1]) { const y = inner.y + inner.h - f * inner.h; ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText((y2Max * f).toFixed(0), inner.x - 5, y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // theory line T^2 = 4 pi^2 a^3.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(xOf(0), yOf(0)); ctx.lineTo(xOf(x3Max), yOf(4 * Math.PI * Math.PI * x3Max)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('T² = 4π²a³', xOf(x3Max * 0.34) + 6, yOf(4 * Math.PI * Math.PI * x3Max * 0.34) + 6);
  // planet points.
  if (showPlanets()) for (let pi = 0; pi < PLANETS.length; pi += 1) { const a3 = Math.pow(PLANETS[pi].a, 3), t2 = Math.pow(keplerThirdLaw(PLANETS[pi].a), 2); ctx.fillStyle = PCOL[pi]; ctx.beginPath(); ctx.arc(xOf(a3), yOf(t2), 4, 0, 2 * Math.PI); ctx.fill(); }
  // comet point.
  const a3 = Math.pow(cometA(), 3), t2 = Math.pow(keplerThirdLaw(cometA()), 2);
  ctx.fillStyle = COMET; ctx.beginPath(); ctx.arc(xOf(a3), yOf(t2), 6, 0, 2 * Math.PI); ctx.fill();
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('your orbit', xOf(a3) + 6, yOf(t2) - 3);
  // labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('semi-major axis cubed  a³', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 40, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('period squared  T²', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  if (!swarm) rebuild();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

function advance() {
  const n = Math.max(1, Math.round(speed() * 6));
  for (let s = 0; s < n; s += 1) stepSwarm(swarm, DEFAULT_DT);
  const c = bodyPosition(swarm, 0); trail.push([c.x, c.y]); if (trail.length > 150) trail.shift();
}
let last = performance.now();
function tick(now) { last = now; if (running) advance(); render(); requestAnimationFrame(tick); }

function bootSync() {
  if (Number.isFinite(parseFloat(params.get('a')))) sliderA.value = params.get('a');
  if (Number.isFinite(parseFloat(params.get('e')))) sliderE.value = params.get('e');
  if (params.get('planets') === 'on') selPlanets.value = 'on';
  syncVals(); rebuild(); relayout();
  for (let i = 0; i < 200; i += 1) advance();
  render();
  if (CAPTURE_NAME && DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } })); }));
}
window.addEventListener('load', bootSync);
if (document.readyState !== 'loading') bootSync();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else if (!CAPTURE_NAME) { requestAnimationFrame(tick); }

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'a', label: 'semi-major axis a', value: cometA(), format: 'float' },
      { key: 'e', label: 'eccentricity e', value: cometE(), format: 'float' },
      { key: 'T', label: 'period (yr)', value: keplerThirdLaw(cometA()) / (2 * Math.PI), format: 'float' },
      { key: 'dAdt', label: 'area sweep rate dA/dt', value: dAdt, format: 'float' },
      { key: 'drift', label: 'energy drift (rel.)', value: swarm ? Math.abs(totalEnergy() - E0) / Math.abs(E0) : 0, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    const drift = Math.abs(totalEnergy() - E0) / Math.abs(E0);
    return [{ key: 'energy', label: 'total energy conserved (rel. drift)', value: drift.toExponential(2), status: drift < 1e-2 ? 'pass' : (drift < 1e-1 ? 'pending' : 'drift') }];
  } catch (e) { return []; }
};
