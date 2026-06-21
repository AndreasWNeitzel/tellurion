import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for Fresnel reflection and Brewster's angle, Canvas2D
// only. Top region: a beam striking a dielectric interface, splitting
// into a reflected and a refracted ray whose brightness tracks the
// Fresnel reflectance; at Brewster's angle the p-polarized reflection
// vanishes and the reflected and refracted rays sit at a right angle.
// Bottom region: reflectance R versus incidence angle for s and p
// polarization, with the Brewster zero and the critical angle.
//
// Reference: Hecht, Optics, 5th ed., Ch. 4 (Fresnel equations).

import { fresnelR, fresnelAmplitudes, brewsterAngle, criticalAngle, snellRefract } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selInterface = document.getElementById('select-interface');
const selPol = document.getElementById('select-pol');
const sliderAngle = document.getElementById('slider-angle');
const valueInterface = document.getElementById('value-interface');
const valuePol = document.getElementById('value-pol');
const valueAngle = document.getElementById('value-angle');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const MEDIA = {
  'air-glass': { n1: 1.0, n2: 1.5, label: '→glass' },
  'air-water': { n1: 1.0, n2: 1.33, label: '→water' },
  'glass-air': { n1: 1.5, n2: 1.0, label: 'glass→air' },
  'water-air': { n1: 1.33, n2: 1.0, label: 'water→air' },
};
let running = !DETERMINISTIC;
let phase = 0;
function media() { return MEDIA[selInterface.value]; }
function thetaDeg() { return parseFloat(sliderAngle.value); }
function thetaRad() { return thetaDeg() * Math.PI / 180; }

function syncVals() {
  valueInterface.textContent = media().label;
  valuePol.textContent = selPol.value === 's' ? 's' : selPol.value === 'u' ? 'unpol' : 'p';
  valueAngle.textContent = `${thetaDeg().toFixed(0)}°`;
}
[selInterface, selPol, sliderAngle].forEach((el) => el.addEventListener('input', () => { syncVals(); render(); }));
selInterface.addEventListener('change', () => { syncVals(); render(); });
selPol.addEventListener('change', () => { syncVals(); render(); });
btnReset.addEventListener('click', () => {
  selInterface.value = 'air-glass'; selPol.value = 'p'; sliderAngle.value = '56';
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); render();
});
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.9 },
    { name: 'diagnostic', weight: 1.1 },
  ]);
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    s: '#5bc0eb', p: '#ef476f', beam: '#ffe08a',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
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

function selReflect(R) { return selPol.value === 's' ? R.Rs : selPol.value === 'u' ? 0.5 * (R.Rs + R.Rp) : R.Rp; }

// Draw a ray from (ax,ay) to (bx,by); photons flow start -> end, so the
// light propagates in the physical direction of travel.
function drawRay(ax, ay, bx, by, intensity, color, label) {
  const len = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / len, uy = (by - ay) / len;
  const a = Math.max(0.06, intensity);
  ctx.strokeStyle = color; ctx.globalAlpha = Math.min(1, 0.25 + 0.75 * a); ctx.lineWidth = 1 + 4 * a;
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  ctx.globalAlpha = 1;
  if (intensity > 0.03) {
    const spacing = 26, n = Math.floor(len / spacing);
    ctx.fillStyle = color;
    for (let k = 0; k < n; k++) {
      const t = ((phase * 60 + k * spacing) % len);
      ctx.globalAlpha = Math.min(1, 0.3 + 0.7 * intensity);
      ctx.beginPath(); ctx.arc(ax + ux * t, ay + uy * t, 2.4, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (label) {
    ctx.fillStyle = color; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + ux * 16, by + uy * 16);
  }
}

function drawScene(col, r) {
  const { n1, n2 } = media();
  panel(col, r, 'A beam splits at the interface (brightness = intensity)');

  const titleH = 22, stripH = 28;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const iy = draw.y + draw.h * 0.52;
  const P = { x: draw.x + draw.w / 2, y: iy };
  const L = Math.min(draw.w, draw.h) * 0.42;
  const th = thetaRad();
  const R = fresnelR(th, n1, n2);
  const tt = R.theta_t;
  const Rsel = selReflect(R), Tsel = tt === null ? 0 : 1 - Rsel;
  const polColor = selPol.value === 's' ? col.s : selPol.value === 'u' ? col.accent : col.p;

  ctx.save();
  clipTo(ctx, draw);

  // media tints.
  ctx.fillStyle = `rgba(120,160,220,${(n1 - 1) * 0.10 + 0.015})`; ctx.fillRect(draw.x, draw.y, draw.w, iy - draw.y);
  ctx.fillStyle = `rgba(120,160,220,${(n2 - 1) * 0.10 + 0.015})`; ctx.fillRect(draw.x, iy, draw.w, draw.y + draw.h - iy);
  ctx.strokeStyle = 'rgba(220,228,240,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(draw.x, iy); ctx.lineTo(draw.x + draw.w, iy); ctx.stroke();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText(`n₁ = ${n1.toFixed(2)}`, draw.x + 8, iy - 5);
  ctx.textBaseline = 'top'; ctx.fillText(`n₂ = ${n2.toFixed(2)}`, draw.x + 8, iy + 5);

  // normal (dashed vertical).
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(P.x, draw.y); ctx.lineTo(P.x, draw.y + draw.h); ctx.stroke(); ctx.setLineDash([]);

  // rays (light flows: incident into P, reflected and refracted out of P).
  const Ax = P.x - Math.sin(th) * L, Ay = P.y - Math.cos(th) * L;
  drawRay(Ax, Ay, P.x, P.y, 1, col.beam, '');                                       // incident, into P
  drawRay(P.x, P.y, P.x + Math.sin(th) * L, P.y - Math.cos(th) * L, Rsel, polColor, 'reflected');
  if (tt !== null) drawRay(P.x, P.y, P.x + Math.sin(tt) * L, P.y + Math.cos(tt) * L, Tsel, col.beam, 'refracted');
  ctx.fillStyle = col.beam; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('incident', Ax + Math.sin(th) * 4, Ay - 12);

  // Brewster right-angle marker.
  const tB = brewsterAngle(n1, n2);
  if (tt !== null && Math.abs(th - tB) < 0.035) {
    const m = 16;
    const u = { x: Math.sin(th), y: -Math.cos(th) }, v = { x: Math.sin(tt), y: Math.cos(tt) };
    ctx.strokeStyle = col.accent; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(P.x + u.x * m, P.y + u.y * m);
    ctx.lineTo(P.x + (u.x + v.x) * m, P.y + (u.y + v.y) * m);
    ctx.lineTo(P.x + v.x * m, P.y + v.y * m);
    ctx.stroke();
  }

  // incidence-point glow.
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(P.x, P.y, 3.5, 0, 2 * Math.PI); ctx.fill();

  // TIR label.
  if (tt === null) {
    ctx.fillStyle = col.accent; ctx.font = fontString(canvas, 'caption', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('total internal reflection', P.x, draw.y + draw.h - 24);
  }

  ctx.restore();

  // readout strip.
  const items = [
    [media().label, col.fg],
    [`θ ${thetaDeg().toFixed(0)}°`, col.fg],
    [`θ_B ${(tB * 180 / Math.PI).toFixed(0)}°`, col.accent],
    [`R ${(Rsel).toFixed(2)}`, polColor],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - stripH / 2 + 1); });
}

function drawDiagnostic(col, r) {
  const { n1, n2 } = media();
  panel(col, r, 'Reflectance vs incidence angle (s and p)');

  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 16, h: r.h - 28 - 42 };
  const xOf = (deg) => inner.x + deg / 90 * inner.w;
  const yOf = (R) => inner.y + inner.h - R * inner.h;

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const R of [0, 0.5, 1]) { const y = yOf(R); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(R.toFixed(1), inner.x - 5, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const d of [0, 30, 60, 90]) ctx.fillText(`${d}°`, xOf(d), inner.y + inner.h + 6);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // critical angle shading (TIR region).
  const tc = criticalAngle(n1, n2);
  if (tc !== null) {
    const xc = xOf(tc * 180 / Math.PI);
    ctx.fillStyle = 'rgba(255,209,102,0.10)'; ctx.fillRect(xc, inner.y, inner.x + inner.w - xc, inner.h);
    ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(xc, inner.y); ctx.lineTo(xc, inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  }

  // curves.
  const plot = (key, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.beginPath();
    for (let d = 0; d <= 90; d++) { const R = fresnelR(d * Math.PI / 180, n1, n2); const X = xOf(d), Y = yOf(R[key]); if (d) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
    ctx.stroke();
  };
  plot('Rs', col.s);
  plot('Rp', col.p);

  // Brewster marker (Rp = 0).
  const tB = brewsterAngle(n1, n2) * 180 / Math.PI;
  ctx.strokeStyle = 'rgba(239,71,111,0.6)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(tB), inner.y); ctx.lineTo(xOf(tB), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.p; ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText(`θ_B ${tB.toFixed(0)}°`, xOf(tB), inner.y + inner.h - 4);

  // current angle marker.
  const d0 = thetaDeg(); const R0 = fresnelR(thetaRad(), n1, n2);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(xOf(d0), inner.y); ctx.lineTo(xOf(d0), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.s; ctx.beginPath(); ctx.arc(xOf(d0), yOf(R0.Rs), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = col.p; ctx.beginPath(); ctx.arc(xOf(d0), yOf(R0.Rp), 4, 0, 2 * Math.PI); ctx.fill();

  // labels + legend.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('incidence angle', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 30, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('reflectance R', 0, 0); ctx.restore();
  ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.s; ctx.fillText('R_s', inner.x + 8, inner.y + 6);
  ctx.fillStyle = col.p; ctx.fillText('R_p', inner.x + 42, inner.y + 6);
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
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) phase += 0.18 * dt;
  render();
  requestAnimationFrame(tick);
}

function bootSync() { syncVals(); relayout(); render(); }

window.addEventListener('load', bootSync);
if (document.readyState !== 'loading') bootSync();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => { relayout(); render(); }).observe(canvas);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else if (!CAPTURE_NAME) {
  requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const { n1, n2 } = media();
  const R = fresnelR(thetaRad(), n1, n2);
  return {
    fields: [
      { key: 'theta', label: 'incidence angle (deg)', value: thetaDeg(), format: 'float' },
      { key: 'brewster', label: 'Brewster angle (deg)', value: brewsterAngle(n1, n2) * 180 / Math.PI, format: 'float' },
      { key: 'Rs', label: 'reflectance $R_s$', value: R.Rs, format: 'float' },
      { key: 'Rp', label: 'reflectance $R_p$', value: R.Rp, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // Energy conservation at the interface: R + T = 1 for each
    // polarization (no absorption), with T weighted by the angle factor.
    const { n1, n2 } = media();
    const th = thetaRad();
    const a = fresnelAmplitudes(th, n1, n2);
    let err;
    if (a.theta_t === null) { const R = fresnelR(th, n1, n2); err = Math.max(Math.abs(R.Rs - 1), Math.abs(R.Rp - 1)); }
    else {
      const ci = Math.cos(th), ct = Math.cos(a.theta_t), f = (n2 * ct) / (n1 * ci);
      const ss = a.rs * a.rs + f * a.ts * a.ts, sp = a.rp * a.rp + f * a.tp * a.tp;
      err = Math.max(Math.abs(ss - 1), Math.abs(sp - 1));
    }
    return [{
      key: 'energy',
      label: 'R + T = 1 (energy conserved)',
      value: err.toExponential(2),
      status: err < 1e-6 ? 'pass' : (err < 1e-3 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
