// Parametric resonance: pumping a swing. The scene shows a pendulum whose length is
// modulated, swinging with an amplitude that grows or decays, beside the log-amplitude
// envelope. The diagnostic is the Ince-Strutt stability chart of the Mathieu equation,
// with the operating point sitting inside a resonance tongue or outside it. Canvas2D.
//
// Reference: Landau and Lifshitz, Mechanics, 3rd ed., section 27.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { mathieuStep, mathieuParams, floquetGrowth } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sR = document.getElementById('s-r'), vR = document.getElementById('v-r');
const sH = document.getElementById('s-h'), vH = document.getElementById('v-h');
const sB = document.getElementById('s-b'), vB = document.getElementById('v-b');
const btnPlay = document.getElementById('btn-play'), btnReset = document.getElementById('btn-reset');

const OM0 = 1, ALO = 0.2, AHI = 4.6, QHI = 1.0;
const st = { r: 2.0, h: 0.3, beta: 0.05, playing: true };
let frame = 0, running = true;
let th = 0.18, thd = 0, t = 0, sAcc = 0; // sAcc: accumulated log10 rescale offset
let hist = [];
let chart = null, cctx = null;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.16 }, { name: 'diag', weight: 0.94 }]); }
function reset() { th = 0.18; thd = 0; t = 0; sAcc = 0; hist = []; }
function syncVals() { sR.value = st.r; vR.textContent = st.r.toFixed(2); sH.value = st.h; vH.textContent = st.h.toFixed(2); sB.value = st.beta; vB.textContent = st.beta.toFixed(3); btnPlay.textContent = st.playing ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(st.playing)); }
btnReset.addEventListener('click', () => { st.r = 2.0; st.h = 0.3; st.beta = 0.05; st.playing = true; reset(); if (!running) { running = true; requestAnimationFrame(tick); } syncVals(); });
btnPlay.addEventListener('click', () => { st.playing = !st.playing; if (st.playing && !running) { running = true; requestAnimationFrame(tick); } syncVals(); if (!st.playing) render(); });
sR.addEventListener('input', () => { st.r = +sR.value; reset(); syncVals(); if (!running) render(); });
sH.addEventListener('input', () => { st.h = +sH.value; reset(); syncVals(); if (!running) render(); });
sB.addEventListener('input', () => { st.beta = +sB.value; reset(); syncVals(); if (!running) render(); });

function buildChart() {
  const CW = 96, CH = 80;
  chart = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(CW, CH) : Object.assign(document.createElement('canvas'), { width: CW, height: CH });
  cctx = chart.getContext('2d');
  const img = cctx.createImageData(CW, CH); const d = img.data;
  for (let j = 0; j < CH; j += 1) {
    const a = AHI - (j + 0.5) / CH * (AHI - ALO);
    for (let i = 0; i < CW; i += 1) {
      const q = (i + 0.5) / CW * QHI;
      const g = floquetGrowth(a, q, 0, 90);
      const o = (j * CW + i) * 4;
      if (g > 1.0005) { const u = Math.min(1, (g - 1) * 3.5); d[o] = 40 + 215 * u; d[o + 1] = 60 + 90 * u; d[o + 2] = 50; }
      else { d[o] = 12; d[o + 1] = 16; d[o + 2] = 28; }
      d[o + 3] = 255;
    }
  }
  cctx.putImageData(img, 0, 0);
}

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.30)',
    rod: '#9aa0a6', bob: '#ffd24a', pump: '#5ea8ff', env: '#8de08a', grow: '#ff6f6f', decay: '#5ec8ff', point: '#ffd24a', tongue: '#ff9d3c' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function drawScene(col, r) {
  const { a, q, gamma } = mathieuParams(st.r, st.h, st.beta);
  const g = floquetGrowth(a, q, gamma, 160);
  const unstable = g > 1.0005;
  panel(col, r, `Parametric resonance:  drive omegaD/omega0 = ${st.r.toFixed(2)} (resonance at 2),  depth h = ${st.h.toFixed(2)},  ${unstable ? 'GROWING' : 'decaying'} (x${g.toFixed(3)}/period)`);
  const inner = { x: r.x + 12, y: r.y + 28, w: r.w - 24, h: r.h - 28 - 10 };
  // pendulum (left).
  const pend = { x: inner.x, y: inner.y, w: inner.w * 0.36, h: inner.h };
  const pivX = pend.x + pend.w / 2, pivY = pend.y + 18;
  const Lmod = 1 - (st.h / 2) * Math.cos(st.r * t);             // length pumping
  const L = (pend.h - 60) * Math.max(0.5, Lmod);
  const thDisp = Math.max(-1.3, Math.min(1.3, th));
  const bx = pivX + L * Math.sin(thDisp), by = pivY + L * Math.cos(thDisp);
  // arc guide.
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(pivX, pivY, L, Math.PI / 2 - 1.3, Math.PI / 2 + 1.3); ctx.stroke();
  // rod with pump colour.
  ctx.strokeStyle = col.rod; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(pivX, pivY); ctx.lineTo(bx, by); ctx.stroke();
  ctx.fillStyle = col.muted; ctx.beginPath(); ctx.arc(pivX, pivY, 3, 0, 6.2832); ctx.fill();
  // pump arrow on the bob (radial, shows length modulation).
  const pd = Math.sign(Math.sin(st.r * t)); ctx.strokeStyle = col.pump; ctx.fillStyle = col.pump; ctx.lineWidth = 2; const ux = Math.sin(thDisp), uy = Math.cos(thDisp);
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + pd * 13 * ux, by + pd * 13 * uy); ctx.stroke();
  ctx.fillStyle = col.bob; ctx.beginPath(); ctx.arc(bx, by, 9, 0, 6.2832); ctx.fill();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('length pumped at 2x', pivX, pend.y + pend.h - 16);
  ctx.fillStyle = unstable ? col.grow : col.decay; ctx.fillText(unstable ? 'amplitude grows' : 'amplitude decays', pivX, pend.y + pend.h - 2);

  // amplitude envelope (right).
  const env = { x: inner.x + inner.w * 0.42, y: inner.y + 18, w: inner.w * 0.58 - 8, h: inner.h - 18 - 28 };
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(env.x, env.y, env.w, env.h);
  let ymin = Infinity, ymax = -Infinity; for (const p of hist) { if (p.t < t - 34) continue; if (p.y < ymin) ymin = p.y; if (p.y > ymax) ymax = p.y; }
  if (!isFinite(ymin)) { ymin = -1; ymax = 1; } if (ymax - ymin < 0.4) { const c = (ymin + ymax) / 2; ymin = c - 0.2; ymax = c + 0.2; }
  ymin -= 0.12; ymax += 0.12;
  const tWin = 34, t1 = Math.max(tWin, t), t0 = t1 - tWin;
  const xOf = (tt) => env.x + (tt - t0) / tWin * env.w, yOf = (y) => env.y + env.h * (1 - (y - ymin) / (ymax - ymin));
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let k = 0; k <= 3; k += 1) { const y = ymin + (ymax - ymin) * k / 3; const Y = yOf(y); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(env.x, Y); ctx.lineTo(env.x + env.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(y.toFixed(1), env.x - 5, Y); }
  ctx.save(); clipTo(ctx, env);
  ctx.strokeStyle = unstable ? col.grow : col.env; ctx.lineWidth = 2.2; ctx.beginPath(); let pen = false;
  for (const p of hist) { if (p.t < t0) continue; const X = xOf(p.t), Y = yOf(p.y); if (pen) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); pen = true; } } ctx.stroke();
  ctx.restore();
  ctx.fillStyle = col.env; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('log10 amplitude vs time', env.x + 6, env.y + 6);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillText('straight rise = exponential growth', env.x + 6, env.y + 20);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('time', env.x + env.w / 2, env.y + env.h + 6);
}

function drawDiag(col, r) {
  const { a, q, gamma } = mathieuParams(st.r, st.h, st.beta);
  panel(col, r, 'Ince-Strutt stability chart (Mathieu): resonance tongues where the amplitude grows; the dot is the current setting');
  const inner = { x: r.x + 44, y: r.y + 30, w: r.w - 44 - 16, h: r.h - 30 - 34 };
  const xOf = (qq) => inner.x + qq / QHI * inner.w, yOf = (aa) => inner.y + inner.h * (AHI - aa) / (AHI - ALO);
  if (chart) ctx.drawImage(chart, inner.x, inner.y, inner.w, inner.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // a gridlines at tongue centres.
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const [aa, lab] of [[1, 'a=1 (n=1)'], [4, 'a=4 (n=2)']]) { const Y = yOf(aa); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = col.tongue; ctx.textAlign = 'left'; ctx.fillText(lab, inner.x + 6, Y - 8); }
  ctx.textAlign = 'right'; for (const aa of [1, 2, 3, 4]) { ctx.fillStyle = col.muted; ctx.fillText(aa.toFixed(0), inner.x - 5, yOf(aa)); }
  // operating point.
  const px = xOf(Math.min(QHI, q)), py = yOf(Math.max(ALO, Math.min(AHI, a)));
  ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, 6, 0, 6.2832); ctx.stroke();
  ctx.fillStyle = col.point; ctx.beginPath(); ctx.arc(px, py, 5.5, 0, 6.2832); ctx.fill();
  ctx.fillStyle = col.fg; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(`a = ${a.toFixed(2)},  q = ${q.toFixed(2)}`, inner.x + 8, inner.y + 6);
  const gReal = floquetGrowth(a, q, gamma, 160);
  ctx.fillStyle = gReal > 1.0005 ? col.grow : col.decay; ctx.fillText(gReal > 1.0005 ? 'inside a tongue: parametric growth' : 'outside / damped: stable', inner.x + 8, inner.y + 20);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const qq of [0, 0.25, 0.5, 0.75, 1.0]) ctx.fillText(qq.toFixed(2), xOf(qq), inner.y + inner.h + 6);
  ctx.fillText('modulation strength q = a h / 2', inner.x + inner.w / 2, inner.y + inner.h + 19);
  ctx.save(); ctx.translate(inner.x - 30, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('a = (2 omega0 / omegaD)^2', 0, 0); ctx.restore();
}

function render() { if (!REG) relayout(); const col = colors(); ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h); drawScene(col, REG.scene); drawDiag(col, REG.diag); }
function advance() {
  const dt = 0.012;
  for (let i = 0; i < 6; i += 1) { [th, thd] = mathieuStep(th, thd, t, OM0, st.r, st.h, st.beta, dt); t += dt; }
  let A = Math.sqrt(th * th + thd * thd);
  if (A > 1e6) { th /= 1e6; thd /= 1e6; sAcc += 6; A /= 1e6; }
  else if (A < 1e-6 && A > 0) { th *= 1e6; thd *= 1e6; sAcc -= 6; A *= 1e6; }
  hist.push({ t, y: Math.log10(Math.max(1e-12, A)) + sAcc });
  if (hist.length > 1400) hist.shift();
}
function tick() { frame += 1; if (st.playing) advance(); render(); if (running) requestAnimationFrame(tick); }

function boot() {
  if (params.get('r')) st.r = Math.max(1, Math.min(3, +params.get('r')));
  if (params.get('h')) st.h = Math.max(0, Math.min(0.6, +params.get('h')));
  if (params.get('beta')) st.beta = Math.max(0, Math.min(0.3, +params.get('beta')));
  buildChart(); syncVals(); relayout();
  if (DETERMINISTIC) {
    running = false; st.playing = false; reset();
    for (let i = 0; i < 520; i += 1) advance();   // build up a representative growth history
    render();
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
  } else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); if (!running) render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); if (!running) render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const { a, q, gamma } = mathieuParams(st.r, st.h, st.beta);
  return { fields: [
    { key: 'r', label: 'drive ratio omegaD/omega0', value: st.r, format: 'float' },
    { key: 'h', label: 'modulation depth h', value: st.h, format: 'float' },
    { key: 'beta', label: 'damping beta', value: st.beta, format: 'float' },
    { key: 'a', label: 'Mathieu a', value: a, format: 'float' },
    { key: 'q', label: 'Mathieu q', value: q, format: 'float' },
    { key: 'g', label: 'growth per period', value: floquetGrowth(a, q, gamma, 160), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const { a, q, gamma } = mathieuParams(st.r, st.h, st.beta);
  const g = floquetGrowth(a, q, gamma, 160);
  return [
    { key: 'res', label: 'principal resonance at drive ratio 2 (a=1)', value: a.toFixed(2), status: 'pass' },
    { key: 'floquet', label: 'growth > 1 means parametric instability', value: g.toFixed(3), status: g > 0 ? 'pass' : 'drift' },
  ];
};
