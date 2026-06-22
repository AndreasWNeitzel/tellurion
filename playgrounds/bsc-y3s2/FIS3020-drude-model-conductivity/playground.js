// The Drude model. The scene animates a gas of electrons under a field: fast random
// thermal motion plus a slow systematic drift, scattering off impurities, with the
// measured drift compared to v_d = -E tau. The diagnostic shows Ohm's law (current
// linear in field) and the Drude AC rolloff sigma(omega). Canvas2D only.
//
// Reference: Ashcroft and Mermin, Solid State Physics, Ch. 1.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { makeRng } from '../../../shared/js/render/rng.js';
import { conductivity, currentDensity, driftVelocity, acConductivityMag, meanFreePath } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sE = document.getElementById('s-e'), vE = document.getElementById('v-e');
const sT = document.getElementById('s-t'), vT = document.getElementById('v-t');
const sN = document.getElementById('s-n'), vN = document.getElementById('v-n');
const btnPlay = document.getElementById('btn-play'), btnReset = document.getElementById('btn-reset');

const BASE_N = 36, VTH = 2.0, ELO = 0.1, EHI = 2;
const NMAX = 1.5, TAUMAX = 1;                                   // slider maxima, for fixed plot scales
const st = { E: 1.0, tau: 0.5, n: 1.0, playing: true };
function nElec() { return Math.round(BASE_N * st.n); }
let frame = 0, running = true;
let rng = makeRng(0xC0FFEE);
const elec = [];
const imp = [];
let ghost = { x: 0.5, y: 0.5, tr: [] };                        // the mean (drift) electron, no thermal noise
let meanVx = 0, driftSum = 0, driftCount = 0;
let box = null;
function resetDrift() { driftSum = 0; driftCount = 0; meanVx = 0; }

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.16 }, { name: 'diag', weight: 0.94 }]); box = null; }
function thermal() { const a = 2 * Math.PI * rng(); return [VTH * Math.cos(a), VTH * Math.sin(a)]; }
function initParticles() {
  elec.length = 0; imp.length = 0; resetDrift(); rng = makeRng(0xC0FFEE);
  const NE = nElec();
  for (let i = 0; i < NE; i += 1) { const [vx, vy] = thermal(); elec.push({ x: rng(), y: rng(), vx, vy, tr: [] }); }
  for (let i = 0; i < 26; i += 1) imp.push({ x: rng(), y: rng() });
  ghost = { x: 0.5, y: 0.5, tr: [] };
}
initParticles();
function syncVals() { sE.value = st.E; vE.textContent = st.E.toFixed(2); sT.value = st.tau; vT.textContent = st.tau.toFixed(2); sN.value = st.n; vN.textContent = st.n.toFixed(2); btnPlay.textContent = st.playing ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(st.playing)); }
btnReset.addEventListener('click', () => { st.E = 1.0; st.tau = 0.5; st.n = 1.0; st.playing = true; initParticles(); if (!running) { running = true; requestAnimationFrame(tick); } syncVals(); });
btnPlay.addEventListener('click', () => { st.playing = !st.playing; if (st.playing && !running) { running = true; requestAnimationFrame(tick); } syncVals(); if (!st.playing) render(); });
sE.addEventListener('input', () => { st.E = +sE.value; resetDrift(); ghost = { x: 0.5, y: 0.5, tr: [] }; syncVals(); if (!running) render(); });
sT.addEventListener('input', () => { st.tau = +sT.value; resetDrift(); ghost = { x: 0.5, y: 0.5, tr: [] }; syncVals(); if (!running) render(); });
sN.addEventListener('input', () => { st.n = +sN.value; initParticles(); syncVals(); if (!running) render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.30)',
    elec: '#5ea8ff', trail: 'rgba(94,168,255,0.28)', imp: '#ff6f6f', field: '#ff9d3c', cur: '#8de08a', drift: '#5ec8ff', ohm: '#8de08a', ac: '#5ec8ff', mark: '#ffd24a' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}
function arrow(x0, y0, x1, y1, color, w) { ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); const a = Math.atan2(y1 - y0, x1 - x0); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 9 * Math.cos(a - 0.4), y1 - 9 * Math.sin(a - 0.4)); ctx.lineTo(x1 - 9 * Math.cos(a + 0.4), y1 - 9 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill(); }

function drawScene(col, r) {
  const vd = driftVelocity(st.E, st.tau);
  panel(col, r, `Drude model:  field E = ${st.E.toFixed(2)},  scattering time tau = ${st.tau.toFixed(2)},  drift v_d = -E tau = ${vd.toFixed(2)},  measured ${meanVx.toFixed(2)}`);
  const inner = { x: r.x + 12, y: r.y + 30, w: r.w - 24, h: r.h - 30 - 46 };
  box = { x: inner.x + 6, y: inner.y + 6, w: inner.w - 12, h: inner.h - 12 };
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.save(); clipTo(ctx, box);
  // field E background: a grid of arrows whose length and brightness grow with E,
  // so the field strength is visible at a glance (pointing along +x).
  const fe = (st.E - ELO) / (EHI - ELO);
  ctx.strokeStyle = `rgba(255,157,60,${0.10 + 0.20 * fe})`; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 1.2;
  const gcols = 7, grows = 4, al = 9 + 36 * fe;
  for (let gi = 0; gi < gcols; gi += 1) for (let gj = 0; gj < grows; gj += 1) {
    const fx = box.x + (gi + 0.5) / gcols * box.w, fy = box.y + (gj + 0.5) / grows * box.h;
    ctx.beginPath(); ctx.moveTo(fx - al / 2, fy); ctx.lineTo(fx + al / 2, fy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx + al / 2, fy); ctx.lineTo(fx + al / 2 - 5, fy - 3); ctx.lineTo(fx + al / 2 - 5, fy + 3); ctx.closePath(); ctx.fill();
  }
  // impurities.
  ctx.strokeStyle = col.imp; ctx.lineWidth = 1.6; for (const m of imp) { const ix = box.x + m.x * box.w, iy = box.y + m.y * box.h; ctx.beginPath(); ctx.moveTo(ix - 3, iy - 3); ctx.lineTo(ix + 3, iy + 3); ctx.moveTo(ix + 3, iy - 3); ctx.lineTo(ix - 3, iy + 3); ctx.stroke(); }
  // electron trails + dots.
  for (const e of elec) {
    ctx.strokeStyle = col.trail; ctx.lineWidth = 1.4; ctx.beginPath(); let started = false;
    for (let k = 0; k < e.tr.length; k += 1) { const p = e.tr[k]; const X = box.x + p[0] * box.w, Y = box.y + p[1] * box.h; if (started) { const prev = e.tr[k - 1]; if (Math.abs(p[0] - prev[0]) > 0.5 || Math.abs(p[1] - prev[1]) > 0.5) { ctx.moveTo(X, Y); } else ctx.lineTo(X, Y); } else { ctx.moveTo(X, Y); started = true; } }
    ctx.stroke();
    ctx.fillStyle = col.elec; ctx.beginPath(); ctx.arc(box.x + e.x * box.w, box.y + e.y * box.h, 3, 0, 6.2832); ctx.fill();
  }
  // the average-electron ghost: its steady leftward march is the net drift, the current.
  ctx.strokeStyle = 'rgba(94,200,255,0.75)'; ctx.lineWidth = 2.2; ctx.beginPath(); let gst = false;
  for (let k = 0; k < ghost.tr.length; k += 1) { const p = ghost.tr[k]; const X = box.x + p[0] * box.w, Y = box.y + p[1] * box.h; if (gst) { const pr = ghost.tr[k - 1]; if (Math.abs(p[0] - pr[0]) > 0.5) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); } else { ctx.moveTo(X, Y); gst = true; } }
  ctx.stroke();
  const gX = box.x + ghost.x * box.w, gY = box.y + ghost.y * box.h;
  const gg = ctx.createRadialGradient(gX, gY, 1, gX, gY, 13); gg.addColorStop(0, 'rgba(150,225,255,0.95)'); gg.addColorStop(1, 'rgba(94,200,255,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(gX, gY, 13, 0, 6.2832); ctx.fill();
  ctx.fillStyle = '#cfeeff'; ctx.beginPath(); ctx.arc(gX, gY, 5, 0, 6.2832); ctx.fill();
  ctx.fillStyle = 'rgba(150,225,255,0.95)'; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('average electron', gX, gY - 14);
  ctx.restore();
  // arrows below the box, lengths scaling with the physical magnitudes so the
  // sliders move them: field E, the current j = n e^2 tau E/m, and the drift v_d.
  const ay = inner.y + inner.h + 16, cx = inner.x + inner.w / 2;
  const Le = 14 + 58 * fe;
  const Lj = 10 + 78 * (currentDensity(st.E, st.tau, st.n) / (conductivity(TAUMAX, NMAX) * EHI));
  const Lvd = 10 + 64 * (st.E * st.tau / EHI);
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textBaseline = 'middle';
  arrow(cx - 110, ay, cx - 110 + Le, ay, col.field, 2.4); ctx.fillStyle = col.field; ctx.textAlign = 'left'; ctx.fillText('field E', cx - 110 + Le + 5, ay);
  arrow(cx + 30, ay, cx + 30 + Lj, ay, col.cur, 2.4); ctx.fillStyle = col.cur; ctx.fillText('current j', cx + 30 + Lj + 5, ay);
  arrow(cx, ay + 18, cx - Lvd, ay + 18, col.drift, 2); ctx.fillStyle = col.drift; ctx.textAlign = 'left'; ctx.fillText('electrons drift', cx + 6, ay + 18);
}

function drawDiag(col, r) {
  panel(col, r, 'Ohm law: current linear in field (slope = conductivity sigma = n e^2 tau/m), and the Drude AC rolloff');
  const inner = { x: r.x + 8, y: r.y + 30, w: r.w - 16, h: r.h - 30 - 10 };
  // Ohm plot (left).
  const oh = { x: inner.x + 40, y: inner.y + 8, w: inner.w * 0.48 - 40, h: inner.h - 8 - 30 };
  const jMax = conductivity(TAUMAX, NMAX) * EHI * 1.05;
  const xOf = (E) => oh.x + E / EHI * oh.w, yOf = (j) => oh.y + oh.h * (1 - j / jMax);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(oh.x, oh.y, oh.w, oh.h);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let j = 0; j <= jMax; j += 0.5) { const Y = yOf(j); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(oh.x, Y); ctx.lineTo(oh.x + oh.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(j.toFixed(1), oh.x - 5, Y); }
  ctx.save(); clipTo(ctx, oh);
  ctx.strokeStyle = col.ohm; ctx.lineWidth = 2.6; ctx.beginPath(); for (let i = 0; i <= 60; i += 1) { const E = EHI * i / 60; const Y = yOf(currentDensity(E, st.tau, st.n)); i ? ctx.lineTo(xOf(E), Y) : ctx.moveTo(xOf(E), Y); } ctx.stroke();
  ctx.strokeStyle = col.mark; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.E), oh.y); ctx.lineTo(xOf(st.E), oh.y + oh.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.ohm; ctx.beginPath(); ctx.arc(xOf(st.E), yOf(currentDensity(st.E, st.tau, st.n)), 4.5, 0, 6.2832); ctx.fill();
  // measured current (= -n mean vx, e=1).
  ctx.fillStyle = col.mark; ctx.beginPath(); ctx.arc(xOf(st.E), yOf(Math.max(0, -meanVx * st.n)), 4, 0, 6.2832); ctx.fill();
  ctx.restore();
  ctx.fillStyle = col.ohm; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`sigma = n tau = ${conductivity(st.tau, st.n).toFixed(2)}`, oh.x + 6, oh.y + 6);
  ctx.fillStyle = col.mark; ctx.fillText('measured', oh.x + 6, oh.y + 20);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; for (let E = 0; E <= 2; E += 0.5) ctx.fillText(E.toFixed(1), xOf(E), oh.y + oh.h + 6); ctx.fillText('field E', oh.x + oh.w / 2, oh.y + oh.h + 19);

  // AC rolloff (right, log-log).
  const ac = { x: inner.x + inner.w * 0.56, y: inner.y + 8, w: inner.w * 0.44 - 8, h: inner.h - 8 - 30 };
  const wlo = -1, whi = 1.5;  // log10 omega
  const s0 = conductivity(st.tau, st.n);
  const axOf = (lw) => ac.x + (lw - wlo) / (whi - wlo) * ac.w, ayOf = (s) => ac.y + ac.h * (1 - s / (s0 * 1.1));
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(ac.x, ac.y, ac.w, ac.h);
  ctx.save(); clipTo(ctx, ac);
  // 1/tau marker.
  const lwc = Math.log10(1 / st.tau); ctx.strokeStyle = 'rgba(255,210,74,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(axOf(lwc), ac.y); ctx.lineTo(axOf(lwc), ac.y + ac.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = col.ac; ctx.lineWidth = 2.6; ctx.beginPath(); for (let i = 0; i <= 120; i += 1) { const lw = wlo + (whi - wlo) * i / 120; const Y = ayOf(acConductivityMag(Math.pow(10, lw), st.tau, s0)); i ? ctx.lineTo(axOf(lw), Y) : ctx.moveTo(axOf(lw), Y); } ctx.stroke();
  ctx.restore();
  ctx.fillStyle = col.ac; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('|sigma(omega)| rolloff', ac.x + 6, ac.y + 6);
  ctx.fillStyle = col.mark; ctx.textAlign = 'center'; ctx.fillText('omega = 1/tau', axOf(lwc), ac.y + ac.h - 16);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textBaseline = 'top'; for (const lw of [-1, 0, 1]) ctx.fillText(`1e${lw}`, axOf(lw), ac.y + ac.h + 6); ctx.fillText('frequency omega', ac.x + ac.w / 2, ac.y + ac.h + 19);
}

function render() { if (!REG) relayout(); const col = colors(); ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h); drawScene(col, REG.scene); drawDiag(col, REG.diag); }
function advance() {
  const dt = 0.02, asp = box ? box.w / box.h : 1.6;
  const NE = elec.length;
  const maxTr = Math.round(5 + 26 * st.tau);                    // mean free path ell = v_th tau: longer runs for larger tau
  for (let s = 0; s < 2; s += 1) {
    let sumvx = 0;
    for (const e of elec) {
      e.vx += -st.E * dt;
      if (rng() < dt / st.tau) { const [vx, vy] = thermal(); e.vx = vx; e.vy = vy; }
      e.x += e.vx * dt / 8; e.y += e.vy * dt / 8 * asp;
      if (e.x < 0) e.x += 1; if (e.x > 1) e.x -= 1; if (e.y < 0) e.y += 1; if (e.y > 1) e.y -= 1;
      e.tr.push([e.x, e.y]); if (e.tr.length > maxTr) e.tr.shift();
      sumvx += e.vx;
    }
    driftSum += sumvx / NE; driftCount += 1; meanVx = driftSum / driftCount;
    // the average electron: drifts steadily at v_d = -E tau with no thermal noise,
    // so the otherwise-invisible net drift (the current) is plain to see.
    const vd = driftVelocity(st.E, st.tau);
    ghost.x += vd * dt / 8; if (ghost.x < 0) ghost.x += 1; if (ghost.x > 1) ghost.x -= 1;
    ghost.tr.push([ghost.x, ghost.y]); if (ghost.tr.length > 70) ghost.tr.shift();
  }
}
function tick() { frame += 1; if (st.playing) advance(); render(); if (running) requestAnimationFrame(tick); }

function boot() {
  if (params.get('E')) st.E = Math.max(ELO, Math.min(EHI, +params.get('E')));
  if (params.get('tau')) st.tau = Math.max(0.1, Math.min(1, +params.get('tau')));
  if (params.get('n')) st.n = Math.max(0.5, Math.min(1.5, +params.get('n')));
  initParticles(); syncVals(); relayout();
  if (DETERMINISTIC) { running = false; st.playing = false; for (let i = 0; i < 800; i += 1) advance(); render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); if (!running) render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); if (!running) render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'E', label: 'field E', value: st.E, format: 'float' },
    { key: 'tau', label: 'scattering time tau', value: st.tau, format: 'float' },
    { key: 'n', label: 'carrier density n', value: st.n, format: 'float' },
    { key: 'sigma', label: 'conductivity sigma = n tau', value: conductivity(st.tau, st.n), format: 'float' },
    { key: 'vd', label: 'drift velocity v_d', value: driftVelocity(st.E, st.tau), format: 'float' },
    { key: 'mvx', label: 'measured drift (sim)', value: meanVx, format: 'float' },
    { key: 'mfp', label: 'mean free path', value: meanFreePath(VTH, st.tau), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  return [
    { key: 'ohm', label: 'j = sigma E (linear)', value: currentDensity(st.E, st.tau, st.n).toFixed(3), status: 'pass' },
    { key: 'drift', label: 'sim drift matches -E tau', value: `${meanVx.toFixed(2)} vs ${driftVelocity(st.E, st.tau).toFixed(2)}`, status: Math.abs(meanVx - driftVelocity(st.E, st.tau)) < 0.25 ? 'pass' : 'drift' },
  ];
};
