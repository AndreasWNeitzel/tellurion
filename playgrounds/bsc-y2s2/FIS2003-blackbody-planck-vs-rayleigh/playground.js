// Blackbody radiation: the Rayleigh-Jeans ultraviolet catastrophe and Planck's
// resolution. The scene plots both spectral-radiance curves at a chosen
// temperature; Rayleigh-Jeans diverges at short wavelength while Planck peaks
// (Wien) and falls. The diagnostic shows the total power growing as T^4
// (Stefan-Boltzmann). Canvas2D only.
//
// Reference: Eisberg and Resnick, Quantum Physics, Ch. 1.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { C, planckLambda, rayleighJeansLambda, planckNu, rayleighJeansNu, wienPeakLambda, wienPeakNu, stefanBoltzmann } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const selAxis = document.getElementById('select-axis');
const btnReset = document.getElementById('btn-reset');
const btnPlay = document.getElementById('btn-play');

const st = { T: 5778, axis: 'lambda', probe: 0.5 };
const LAM_HI = 2.5e-6, NU_HI = 1.5e15;     // plot extents
const VLO = 380e-9, VHI = 750e-9;          // visible wavelength range

// Approximate perceived RGB of a blackbody at temperature T (Tanner Helland fit,
// valid ~1000-40000 K); used only for the colour swatch.
function blackbodyRGB(T) {
  const u = Math.max(1000, Math.min(40000, T)) / 100;
  let r, g, b;
  r = u <= 66 ? 255 : 329.698727 * Math.pow(u - 60, -0.1332047592);
  g = u <= 66 ? 99.4708025861 * Math.log(u) - 161.1195681661 : 288.1221695283 * Math.pow(u - 60, -0.0755148492);
  b = u >= 66 ? 255 : (u <= 19 ? 0 : 138.5177312231 * Math.log(u - 10) - 305.0447927307);
  const cl = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return [cl(r), cl(g), cl(b)];
}

let view = { w: 820, h: 1020, dpr: 1 }, REG = null, SC = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.32 }, { name: 'diag', weight: 0.9 }]);
}
function syncVals() { vT.textContent = `${st.T} K`; selAxis.value = st.axis; }
sT.addEventListener('input', () => { setPlaying(false); st.T = parseInt(sT.value, 10); syncVals(); render(); });
selAxis.addEventListener('change', () => { setPlaying(false); st.axis = selAxis.value; syncVals(); render(); });
btnReset.addEventListener('click', () => { st.T = 5778; st.axis = 'lambda'; st.probe = 0.5; sT.value = '5778'; setPlaying(true); syncVals(); render(); });
// Auto-sweep the temperature so the Planck curve breathes (the peak slides by
// Wien's law and the colour shifts); any control interaction pauses it.
let bbPlaying = !DETERMINISTIC, bbPhase = 0, bbLast = performance.now();
function setPlaying(on) { bbPlaying = on; if (btnPlay) { btnPlay.textContent = on ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(!on)); } }
if (btnPlay) btnPlay.addEventListener('click', () => setPlaying(!bbPlaying));
function bbTick(now) {
  const dt = Math.min((now - bbLast) / 1000, 0.05); bbLast = now;
  if (bbPlaying) {
    bbPhase += dt * 0.4;
    const tri = 0.5 - 0.5 * Math.cos(bbPhase);
    st.T = Math.round((2500 + tri * 6500) / 50) * 50;
    sT.value = String(st.T); syncVals(); render();
  }
  requestAnimationFrame(bbTick);
}

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)', planck: '#ffd166', rj: '#ef5466', peak: '#67d98c', sb: '#5b9bd5' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}
// approximate visible-wavelength colour (nm) for the spectrum strip.
function visGradient(g) {
  g.addColorStop(0, '#6a0dad'); g.addColorStop(0.18, '#2a2af0'); g.addColorStop(0.36, '#19d3e6'); g.addColorStop(0.52, '#2ecc40'); g.addColorStop(0.66, '#ffe000'); g.addColorStop(0.82, '#ff7b00'); g.addColorStop(1, '#e0102a');
}
// Shade the visible band (380-750 nm) in either axis. Violet sits at short
// wavelength, which is the high-frequency end, so the gradient reverses with the axis.
function drawVisibleBand(col, box, xOf, lam) {
  const xV = lam ? xOf(VLO) : xOf(C / VLO);   // violet edge (380 nm)
  const xR = lam ? xOf(VHI) : xOf(C / VHI);   // red edge (750 nm)
  const g = ctx.createLinearGradient(xV, 0, xR, 0); visGradient(g);
  const x0 = Math.min(xV, xR), w = Math.abs(xR - xV);
  ctx.globalAlpha = 0.17; ctx.fillStyle = g; ctx.fillRect(x0, box.y, w, box.h); ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('visible', x0 + w / 2, box.y + box.h - 2);
}

function drawScene(col, r) {
  const lam = st.axis === 'lambda';
  panel(col, r, lam ? 'Spectral radiance vs wavelength: Rayleigh-Jeans diverges, Planck peaks and falls' : 'Spectral radiance vs frequency: Rayleigh-Jeans diverges at high frequency');
  const pad = { l: 16, r: 16, t: 26, b: 40 };
  const box = { x: r.x + pad.l, y: r.y + pad.t, w: r.w - pad.l - pad.r, h: r.h - pad.t - pad.b };
  const Pf = lam ? planckLambda : planckNu, RJf = lam ? rayleighJeansLambda : rayleighJeansNu;
  const peak = lam ? wienPeakLambda(st.T) : wienPeakNu(st.T);
  const xHi = lam ? LAM_HI : NU_HI;
  const ymax = Pf(peak, st.T) * 1.35;
  const xOf = (x) => box.x + x / xHi * box.w;
  const yOf = (y) => box.y + box.h - Math.min(1.15, y / ymax) * box.h;
  ctx.save(); clipTo(ctx, box);
  // visible-light band in either axis (380-750 nm).
  drawVisibleBand(col, box, xOf, lam);
  // Planck curve, filled (the area is the total power).
  ctx.fillStyle = 'rgba(255,209,102,0.16)'; ctx.beginPath(); ctx.moveTo(xOf(0), yOf(0));
  for (let i = 1; i <= 400; i += 1) { const x = xHi * i / 400; ctx.lineTo(xOf(x), yOf(Pf(x, st.T))); }
  ctx.lineTo(xOf(xHi), yOf(0)); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = col.planck; ctx.lineWidth = 2.6; ctx.beginPath();
  for (let i = 1; i <= 400; i += 1) { const x = xHi * i / 400; const X = xOf(x), Y = yOf(Pf(x, st.T)); i === 1 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
  ctx.stroke();
  // Rayleigh-Jeans curve (diverges, shoots off the top).
  ctx.strokeStyle = col.rj; ctx.lineWidth = 2.2; ctx.setLineDash([6, 4]); ctx.beginPath();
  for (let i = 1; i <= 400; i += 1) { const x = xHi * i / 400; const X = xOf(x), Y = yOf(RJf(x, st.T)); i === 1 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
  ctx.stroke(); ctx.setLineDash([]);
  // Wien peak marker.
  ctx.strokeStyle = col.peak; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(peak), yOf(Pf(peak, st.T))); ctx.lineTo(xOf(peak), box.y + box.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.peak; ctx.beginPath(); ctx.arc(xOf(peak), yOf(Pf(peak, st.T)), 4, 0, 6.28); ctx.fill();
  // draggable probe: a vertical line reading both curves at one x.
  const xp = Math.max(xHi * 0.004, st.probe * xHi), Xp = xOf(xp);
  const pPlanck = Pf(xp, st.T), pRJ = RJf(xp, st.T);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(Xp, box.y); ctx.lineTo(Xp, box.y + box.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.planck; ctx.beginPath(); ctx.arc(Xp, yOf(pPlanck), 4.5, 0, 6.28); ctx.fill();
  ctx.fillStyle = col.rj; ctx.beginPath(); ctx.arc(Xp, yOf(pRJ), 4.5, 0, 6.28); ctx.fill();
  ctx.restore();
  // axis labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  if (lam) { for (const nm of [0, 500, 1000, 1500, 2000, 2500]) ctx.fillText(`${nm}`, xOf(nm * 1e-9), box.y + box.h + 4); ctx.fillText('wavelength (nm)', box.x + box.w / 2, box.y + box.h + 20); }
  else { for (const f of [0, 5, 10, 15]) ctx.fillText(`${f}`, xOf(f * 1e14), box.y + box.h + 4); ctx.fillText('frequency (10^14 Hz)', box.x + box.w / 2, box.y + box.h + 20); }
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.planck; ctx.fillText('Planck (quantum)', box.x + 6, box.y + 4);
  ctx.fillStyle = col.rj; ctx.fillText('Rayleigh-Jeans (classical)', box.x + 6, box.y + 18);
  ctx.fillStyle = col.peak; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText(lam ? `${(peak * 1e9).toFixed(0)} nm` : `${(peak / 1e14).toFixed(2)}e14 Hz`, xOf(peak), box.y + box.h - 4);
  // blackbody colour swatch (the perceived colour of a blackbody at T).
  const [rr, gg, bb] = blackbodyRGB(st.T);
  const swW = 50, swH = 16, swX = box.x + box.w - swW - 6, swY = box.y + 4;
  ctx.fillStyle = `rgb(${rr},${gg},${bb})`; ctx.fillRect(swX, swY, swW, swH);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(swX + 0.5, swY + 0.5, swW - 1, swH - 1);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('colour at T', swX - 4, swY + 3);
  // probe readout: the ratio is the ultraviolet-catastrophe factor.
  const ratio = pPlanck > 0 ? pRJ / pPlanck : Infinity;
  ctx.fillStyle = '#e8e8e8'; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(`probe ${lam ? (xp * 1e9).toFixed(0) + ' nm' : (xp / 1e14).toFixed(2) + 'e14 Hz'}:  RJ/Planck = ${ratio < 100 ? ratio.toFixed(2) : ratio.toExponential(1)}`, box.x + 6, box.y + 32);
  SC = { box, xHi };
}

function drawDiag(col, r) {
  panel(col, r, 'Total radiated power vs temperature (log-log): Stefan-Boltzmann, slope 4');
  const inner = { x: r.x + 54, y: r.y + 26, w: r.w - 54 - 16, h: r.h - 26 - 32 };
  const Tlo = 1000, Thi = 12000;
  const xLo = Math.log10(Tlo), xHi = Math.log10(Thi);
  const ys = []; for (let i = 0; i <= 60; i += 1) { const T = 10 ** (xLo + (xHi - xLo) * i / 60); ys.push({ T, P: stefanBoltzmann(T) }); }
  const yLoP = Math.log10(stefanBoltzmann(Tlo)), yHiP = Math.log10(stefanBoltzmann(Thi));
  const xOf = (T) => inner.x + (Math.log10(T) - xLo) / (xHi - xLo) * inner.w;
  const yOf = (P) => inner.y + inner.h - (Math.log10(P) - yLoP) / (yHiP - yLoP) * inner.h;
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let e = Math.ceil(yLoP); e <= yHiP; e += 2) { const Y = yOf(10 ** e); ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(`1e${e}`, inner.x - 5, Y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.strokeStyle = col.sb; ctx.lineWidth = 2.6; ctx.beginPath(); ys.forEach((p, i) => { const X = xOf(p.T), Y = yOf(p.P); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
  // current T marker.
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.T), inner.y); ctx.lineTo(xOf(st.T), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.sb; ctx.beginPath(); ctx.arc(xOf(st.T), yOf(stefanBoltzmann(st.T)), 4, 0, 6.28); ctx.fill();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const T of [1000, 3000, 6000, 12000]) ctx.fillText(`${T}`, xOf(T), inner.y + inner.h + 4);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText('temperature T (K)', inner.x + inner.w / 2, inner.y + inner.h + 16);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = col.sb; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.fillText('M = sigma T^4 (W/m^2)', inner.x + 6, inner.y + 4);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

// drag the probe across the spectrum panel.
let dragging = false;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
function setProbe(px) { if (!SC) return; st.probe = Math.max(0, Math.min(1, (px - SC.box.x) / SC.box.w)); render(); }
canvas.addEventListener('pointerdown', (e) => { const [px, py] = ptr(e); if (!REG || !SC || py < SC.box.y || py > SC.box.y + SC.box.h) return; dragging = true; setProbe(px); });
canvas.addEventListener('pointermove', (e) => { if (!dragging) return; const [px] = ptr(e); setProbe(px); });
window.addEventListener('pointerup', () => { dragging = false; });

function boot() {
  if (Number.isFinite(parseInt(params.get('T'), 10))) st.T = parseInt(params.get('T'), 10);
  if (params.get('axis') === 'nu') st.axis = 'nu';
  if (Number.isFinite(parseFloat(params.get('probe')))) st.probe = Math.max(0, Math.min(1, parseFloat(params.get('probe'))));
  syncVals(); relayout(); render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
if (!DETERMINISTIC && !CAPTURE_NAME) requestAnimationFrame(bbTick);
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const peak = st.axis === 'lambda' ? wienPeakLambda(st.T) : wienPeakNu(st.T);
  return { fields: [
    { key: 'T', label: 'temperature (K)', value: st.T, format: 'int' },
    { key: 'peak', label: st.axis === 'lambda' ? 'peak wavelength (nm)' : 'peak frequency (1e14 Hz)', value: st.axis === 'lambda' ? peak * 1e9 : peak / 1e14, format: 'float' },
    { key: 'wienprod', label: 'lambda_max T (mm K)', value: wienPeakLambda(st.T) * st.T * 1e3, format: 'float' },
    { key: 'power', label: 'total power sigma T^4 (W/m^2)', value: stefanBoltzmann(st.T), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const wien = wienPeakLambda(st.T) * st.T;
  const ratio = stefanBoltzmann(2 * st.T) / stefanBoltzmann(st.T);
  return [
    { key: 'wien', label: 'lambda_max T = 2.898e-3 m K', value: wien.toExponential(3), status: Math.abs(wien - 2.897771955e-3) < 1e-6 ? 'pass' : 'drift' },
    { key: 'sb', label: 'doubling T multiplies power by 16', value: ratio.toFixed(2), status: Math.abs(ratio - 16) < 1e-3 ? 'pass' : 'drift' },
  ];
};
