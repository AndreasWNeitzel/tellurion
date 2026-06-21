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

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

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

// Thin guide line marking a ray direction, with an arrowhead and label, drawn
// faint over the wavefront field so the geometry (the angles) stays legible.
function drawGuide(ax, ay, bx, by, color, label) {
  const len = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / len, uy = (by - ay) / len;
  ctx.strokeStyle = color; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.2; ctx.setLineDash([6, 5]);
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha = 0.85;
  const ang = Math.atan2(uy, ux);
  ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx - 8 * Math.cos(ang - 0.4), by - 8 * Math.sin(ang - 0.4));
  ctx.lineTo(bx - 8 * Math.cos(ang + 0.4), by - 8 * Math.sin(ang + 0.4));
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  if (label) {
    ctx.fillStyle = color; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + ux * 16, by + uy * 16);
  }
}

// --- wavefront field --------------------------------------------------------
// The real plane-wave field: incident + reflected interference above the
// interface, the refracted wave (shifted angle, shorter/longer wavelength)
// below, or an evanescent skin under total internal reflection. Rendered to a
// small offscreen ImageData and scaled up. Cached by a key so a paused or
// captured frame is not recomputed every animation frame.
let fieldCv = null, fieldCtx = null, fieldImg = null, fieldKey = '';
function drawWavefronts(draw, P, iy, th, n1, n2) {
  const cell = 5;
  const FW = Math.max(2, Math.round(draw.w / cell)), FH = Math.max(2, Math.round(draw.h / cell));
  if (!fieldCv) fieldCv = document.createElement('canvas');
  if (fieldCv.width !== FW || fieldCv.height !== FH) { fieldCv.width = FW; fieldCv.height = FH; fieldCtx = fieldCv.getContext('2d'); fieldImg = fieldCtx.createImageData(FW, FH); }
  const key = `${selInterface.value}|${selPol.value}|${thetaDeg().toFixed(1)}|${phase.toFixed(3)}|${FW}x${FH}`;
  if (key !== fieldKey) {
    fieldKey = key;
    const a = fresnelAmplitudes(th, n1, n2), tt = a.theta_t;
    const isS = selPol.value !== 'p';
    const r = isS ? a.rs : a.rp, t = isS ? a.ts : a.tp;
    const lambda1 = Math.min(draw.w, draw.h) * 0.13;
    const k1 = 2 * Math.PI / lambda1, k2 = k1 * n2 / n1;
    const sinI = Math.sin(th), cosI = Math.cos(th);
    const sinT = tt !== null ? Math.sin(tt) : 0, cosT = tt !== null ? Math.cos(tt) : 1;
    const kappa = tt === null ? k1 * Math.sqrt(Math.max(0, sinI * sinI - (n2 / n1) * (n2 / n1))) : 0;
    const wt = phase, Emax = 1.9, d = fieldImg.data;
    for (let j = 0; j < FH; j += 1) {
      const sy = draw.y + (j + 0.5) / FH * draw.h, y = sy - iy;
      const above = sy < iy;
      for (let i = 0; i < FW; i += 1) {
        const sx = draw.x + (i + 0.5) / FW * draw.w, x = sx - P.x;
        let E;
        if (above) {
          E = Math.cos(k1 * (x * sinI + y * cosI) - wt) + r * Math.cos(k1 * (x * sinI - y * cosI) - wt);
        } else if (tt !== null) {
          E = t * Math.cos(k2 * (x * sinT + y * cosT) - wt);
        } else {
          E = 2 * Math.exp(-kappa * y) * Math.cos(k1 * x * sinI - wt);   // evanescent skin
        }
        const e = clamp(E / Emax, -1, 1);
        const idx = (j * FW + i) * 4;
        const b0 = above ? 10 : 14, g0 = above ? 12 : 16, bb0 = above ? 18 : 30;  // medium-2 base slightly bluer
        let R, G, B;
        if (e >= 0) { R = b0 + e * 225; G = g0 + e * 158; B = bb0 + e * 70; }
        else { const m = -e; R = b0 + m * 55; G = g0 + m * 120; B = bb0 + m * 215; }
        d[idx] = R; d[idx + 1] = G; d[idx + 2] = B; d[idx + 3] = 255;
      }
    }
    fieldCtx.putImageData(fieldImg, 0, 0);
  }
  const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true;
  ctx.drawImage(fieldCv, draw.x, draw.y, draw.w, draw.h);
  ctx.imageSmoothingEnabled = sm;
}

function drawScene(col, r) {
  const { n1, n2 } = media();
  panel(col, r, 'Wavefronts striking the interface (reflected + refracted)');

  const titleH = 22, stripH = 28;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const iy = draw.y + draw.h * 0.52;
  const P = { x: draw.x + draw.w / 2, y: iy };
  const L = Math.min(draw.w, draw.h) * 0.42;
  const th = thetaRad();
  const R = fresnelR(th, n1, n2);
  const tt = R.theta_t;
  const Rsel = selReflect(R);
  const polColor = selPol.value === 's' ? col.s : selPol.value === 'u' ? col.accent : col.p;

  ctx.save();
  clipTo(ctx, draw);

  // the live wave field: incident + reflected above, refracted (or evanescent) below.
  drawWavefronts(draw, P, iy, th, n1, n2);

  // interface line + medium labels.
  ctx.strokeStyle = 'rgba(220,228,240,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(draw.x, iy); ctx.lineTo(draw.x + draw.w, iy); ctx.stroke();
  ctx.fillStyle = col.fg; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText(`n₁ = ${n1.toFixed(2)}`, draw.x + 8, iy - 5);
  ctx.textBaseline = 'top'; ctx.fillText(`n₂ = ${n2.toFixed(2)}`, draw.x + 8, iy + 5);

  // normal (dashed vertical).
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(P.x, draw.y); ctx.lineTo(P.x, draw.y + draw.h); ctx.stroke(); ctx.setLineDash([]);

  // thin direction guides over the field: incident, reflected (faded by R), refracted.
  const Ax = P.x - Math.sin(th) * L, Ay = P.y - Math.cos(th) * L;
  drawGuide(Ax, Ay, P.x, P.y, col.beam, '');                                            // incident, into P
  ctx.fillStyle = col.beam; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('incident', Ax + Math.sin(th) * 4, Ay - 12);
  ctx.globalAlpha = Math.min(1, 0.3 + 0.7 * Rsel);
  drawGuide(P.x, P.y, P.x + Math.sin(th) * L, P.y - Math.cos(th) * L, polColor, 'reflected');
  ctx.globalAlpha = 1;
  if (tt !== null) drawGuide(P.x, P.y, P.x + Math.sin(tt) * L, P.y + Math.cos(tt) * L, col.beam, 'refracted');

  // Brewster right-angle marker (reflected and refracted at 90 deg).
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

  // TIR / Brewster annotations.
  if (tt === null) {
    ctx.fillStyle = col.accent; ctx.font = fontString(canvas, 'caption', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('total internal reflection (evanescent skin below)', P.x, draw.y + draw.h - 24);
  } else if (selPol.value !== 's' && Math.abs(th - tB) < 0.02) {
    ctx.fillStyle = col.accent; ctx.font = fontString(canvas, 'caption', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Brewster angle: p reflection vanishes', P.x, draw.y + 18);
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
  if (running) phase += 4.2 * dt;   // omega t: wavefronts travel at a readable pace
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (MEDIA[params.get('interface')]) selInterface.value = params.get('interface');
  if (['s', 'p', 'u'].includes(params.get('pol'))) selPol.value = params.get('pol');
  if (Number.isFinite(parseFloat(params.get('angle')))) sliderAngle.value = params.get('angle');
  syncVals(); relayout(); render();
}

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
