// The HR diagram: real Gaia DR3 stars and a real MESA stellar-evolution track.
// The Kiel plane (Teff vs logg) carries both the observed stars and the model
// track directly, with no transformation. A marker walks the real track by
// stellar age (main sequence -> subgiant -> red giant branch -> helium burning
// -> AGB -> white dwarf), and the diagnostic shows that the observed stellar
// density tracks the model's evolutionary speed: stars pile up where the star
// evolves slowly. Canvas2D only.
//
// Data: Gaia DR3 (Gaia Collaboration 2023, A&A 674, A1); MESA solar track
// (Paxton et al. 2011, ApJS 192, 3). No fabricated values.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { rdbu } from '../../../shared/js/render/colormaps.js';
import { GAIA_CMD } from './data-gaia.js';
import { MESA_TRACK } from './data-track.js';
import { trackAt, teffFromLog, findMainSequenceTurnOff, evolutionarySpeed } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sAge = document.getElementById('slider-age'), vAge = document.getElementById('value-age');
const btnPlay = document.getElementById('btn-playpause'), btnReset = document.getElementById('btn-reset');
const btnView = document.getElementById('btn-view'), vView = document.getElementById('value-view');
const btnColor = document.getElementById('btn-color'), vColor = document.getElementById('value-color');

// precomputed, real (cached once).
const SPEED = evolutionarySpeed();
const TO_AGE = findMainSequenceTurnOff();
// the zero-age main sequence is the most compact early point (the pre-main-sequence
// Hayashi contraction at age 0 is cooler and is not drawn).
let ZAMS_IDX = 0; { let zg = -9; for (let i = 0; i < MESA_TRACK.length; i += 1) { if (MESA_TRACK[i][0] < 1 && MESA_TRACK[i][4] > zg) { zg = MESA_TRACK[i][4]; ZAMS_IDX = i; } } }
const AGE_MAX = MESA_TRACK[MESA_TRACK.length - 1][0];
const AGE_MIN = MESA_TRACK[0][0];

const st = { age: TO_AGE ?? 6, view: 'kiel', color: 'metal' };
let running = !DETERMINISTIC;

// Kiel axes (Teff reversed: hot left; logg reversed: dwarfs at bottom).
const KX = [7400, 3000], KY = [0.1, 5.7];
// CMD axes (BP-RP; M_G reversed: bright at top).
const CX = [0.5, 4.0], CY = [-4.2, 10.2];

let view = { w: 900, h: 1040, dpr: 1 }, REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'hr', weight: 1.55 }, { name: 'diag', weight: 0.78 }]);
}

function syncVals() {
  vAge.textContent = `${st.age.toFixed(2)} Gyr`;
  vView.textContent = st.view === 'kiel' ? 'Kiel (Teff, logg)' : 'CMD (M_G, BP-RP)';
  vColor.textContent = st.color === 'metal' ? 'metallicity [M/H]' : 'population density';
}
sAge.addEventListener('input', () => { st.age = parseFloat(sAge.value); running = false; btnPlay.textContent = 'Play'; syncVals(); render(); });
btnPlay.addEventListener('click', () => { running = !running; btnPlay.textContent = running ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(!running)); });
btnReset.addEventListener('click', () => { st.age = AGE_MIN; running = true; btnPlay.textContent = 'Pause'; sAge.value = String(AGE_MIN); syncVals(); render(); });
btnView.addEventListener('click', () => { st.view = st.view === 'kiel' ? 'cmd' : 'kiel'; syncVals(); render(); });
btnColor.addEventListener('click', () => { st.color = st.color === 'metal' ? 'density' : 'metal'; syncVals(); render(); });

function colors() {
  const css = getComputedStyle(document.body);
  return { bg: css.getPropertyValue('--bg').trim() || '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)', track: '#ff9d3c', marker: '#ffffff', toLine: '#67d98c', star: 'rgba(150,180,230,0.5)', speed: '#5bc0eb', dens: '#ef8b56' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}
function arrowhead(x, y, ang, s, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s * Math.cos(ang - 0.4), y - s * Math.sin(ang - 0.4)); ctx.lineTo(x - s * Math.cos(ang + 0.4), y - s * Math.sin(ang + 0.4)); ctx.closePath(); ctx.fill(); }

function drawHR(col, r) {
  const kiel = st.view === 'kiel';
  panel(col, r, kiel ? 'Kiel diagram: real Gaia DR3 stars and the real MESA solar evolution track'
    : 'Observational HR diagram (colour-magnitude): real Gaia DR3 stars');
  const pad = { l: 52, r: 16, t: 26, b: 38 };
  const box = { x: r.x + pad.l, y: r.y + pad.t, w: r.w - pad.l - pad.r, h: r.h - pad.t - pad.b };
  const AX = kiel ? KX : CX, AY = kiel ? KY : CY;
  const xOf = (v) => box.x + (v - AX[0]) / (AX[1] - AX[0]) * box.w;
  const yOf = (v) => box.y + (v - AY[0]) / (AY[1] - AY[0]) * box.h;

  // grid + ticks.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textBaseline = 'top'; ctx.textAlign = 'center';
  const xticks = kiel ? [7000, 6000, 5000, 4000, 3000] : [1, 2, 3];
  for (const t of xticks) { const X = xOf(t); ctx.beginPath(); ctx.moveTo(X, box.y); ctx.lineTo(X, box.y + box.h); ctx.stroke(); ctx.fillText(kiel ? `${t}` : t.toFixed(1), X, box.y + box.h + 5); }
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  const yticks = kiel ? [1, 2, 3, 4, 5] : [-2, 0, 2, 4, 6, 8];
  for (const t of yticks) { const Y = yOf(t); ctx.beginPath(); ctx.moveTo(box.x, Y); ctx.lineTo(box.x + box.w, Y); ctx.stroke(); ctx.fillText(kiel ? t.toFixed(1) : `${t}`, box.x - 6, Y); }
  // axis labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(kiel ? 'effective temperature Teff (K)  ->  cooler' : 'colour BP - RP  ->  redder', box.x + box.w / 2, box.y + box.h + 19);
  ctx.save(); ctx.translate(box.x - 38, box.y + box.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(kiel ? 'surface gravity log g  ->  giants up' : 'absolute magnitude M_G  ->  brighter up', 0, 0); ctx.restore();

  ctx.save(); clipTo(ctx, box);
  // stars.
  const mhScale = (mh) => Math.max(0, Math.min(1, (mh + 0.9) / 1.2)); // -0.9..+0.3 -> 0..1
  for (let i = 0; i < GAIA_CMD.length; i += 1) {
    const s = GAIA_CMD[i];
    const X = kiel ? xOf(s[2]) : xOf(s[0]);
    const Y = kiel ? yOf(s[3]) : yOf(s[1]);
    if (X < box.x || X > box.x + box.w || Y < box.y || Y > box.y + box.h) continue;
    if (st.color === 'metal' && s[4] != null) { const c = rdbu(1 - mhScale(s[4])); ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},0.62)`; }
    else ctx.fillStyle = col.star;
    ctx.beginPath(); ctx.arc(X, Y, 1.9, 0, 6.28); ctx.fill();
  }
  // MESA track (Kiel only). Break the polyline where the track leaves the
  // observable box (the post-AGB excursion reaches ~80000 K and the white dwarf
  // logg ~ 8, both far off this scale).
  // The track is shown where the star is a cool dwarf/giant on this scale; the
  // post-AGB blueward loop (Teff > 6700 K) and the white dwarf are off-scale.
  const inBox = (teff, logg) => teff >= KX[1] && teff <= 6700 && logg >= KY[0] && logg <= KY[1];
  if (kiel) {
    ctx.strokeStyle = col.track; ctx.lineWidth = 2.6; ctx.beginPath();
    let pen = false;
    for (let i = ZAMS_IDX; i < MESA_TRACK.length; i += 1) {        // start at the ZAMS, skip the pre-MS
      const teff = teffFromLog(MESA_TRACK[i][2]), logg = MESA_TRACK[i][4];
      if (!inBox(teff, logg)) { pen = false; continue; }
      const X = xOf(teff), Y = yOf(logg);
      pen ? ctx.lineTo(X, Y) : (ctx.moveTo(X, Y), pen = true);
    }
    ctx.stroke();
    // ZAMS label at the true zero-age main sequence (most compact early point).
    const z = MESA_TRACK[ZAMS_IDX];
    ctx.fillStyle = col.track; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('ZAMS', xOf(teffFromLog(z[2])) + 7, yOf(z[4]) + 4);
    // main-sequence turn-off marker.
    if (TO_AGE) { const to = trackAt(TO_AGE); const X = xOf(teffFromLog(to.logTeff)), Y = yOf(to.logg); ctx.strokeStyle = col.toLine; ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(X, Y, 7, 0, 6.28); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = col.toLine; ctx.textAlign = 'left'; ctx.fillText('turn-off', X + 9, Y); }
    // age marker (when the star is on-scale; off-scale = white-dwarf cooling).
    const m = trackAt(st.age);
    if (m) {
      const teff = teffFromLog(m.logTeff);
      ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      if (inBox(teff, m.logg)) {
        const X = xOf(teff), Y = yOf(m.logg);
        ctx.fillStyle = col.marker; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, Y, 6.5, 0, 6.28); ctx.fill(); ctx.stroke();
        ctx.fillStyle = col.marker; ctx.fillText(`${st.age.toFixed(2)} Gyr`, X + 9, Y - 4);
      } else {
        ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(`${st.age.toFixed(2)} Gyr: white-dwarf cooling (off scale: hot and faint)`, box.x + 8, box.y + box.h - 16);
      }
    }
  } else {
    ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('(model track shown on the Kiel view; no synthetic Gaia photometry)', box.x + box.w / 2, box.y + 8);
  }
  ctx.restore();
}

function drawDiag(col, r) {
  panel(col, r, 'Where a star lingers: model evolutionary speed vs age (slow on the main sequence, fast through the giant phases)');
  const pad = { l: 50, r: 16, t: 24, b: 30 };
  const box = { x: r.x + pad.l, y: r.y + pad.t, w: r.w - pad.l - pad.r, h: r.h - pad.t - pad.b };
  const xOf = (a) => box.x + (a - AGE_MIN) / (AGE_MAX - AGE_MIN) * box.w;
  // speed on log scale (path length in the Kiel plane per Gyr).
  const sp = SPEED.map((p) => p.speed).filter((v) => v > 0);
  const sLo = Math.floor(Math.log10(Math.max(1e-3, Math.min(...sp)))), sHi = Math.ceil(Math.log10(Math.max(...sp)));
  const ySpeed = (v) => { const lv = Math.log10(Math.max(Math.pow(10, sLo), v)); return box.y + box.h - (lv - sLo) / (sHi - sLo) * box.h; };

  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(box.x, box.y, box.w, box.h);
  // y gridlines (decades).
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let e = sLo; e <= sHi; e += 1) { const Y = ySpeed(Math.pow(10, e)); ctx.strokeStyle = col.grid; ctx.beginPath(); ctx.moveTo(box.x, Y); ctx.lineTo(box.x + box.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(`10^${e}`, box.x - 5, Y); }
  // x ticks (age).
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const a of [0, 3, 6, 9, 12]) { const X = xOf(a); ctx.fillStyle = col.muted; ctx.fillText(`${a}`, X, box.y + box.h + 4); }
  // speed line.
  ctx.strokeStyle = col.speed; ctx.lineWidth = 2.2; ctx.beginPath(); let started = false;
  for (const p of SPEED) { if (p.speed <= 0) continue; const X = xOf(p.age), Y = ySpeed(p.speed); started ? ctx.lineTo(X, Y) : (ctx.moveTo(X, Y), started = true); }
  ctx.stroke();
  // turn-off line + current-age marker.
  if (TO_AGE) { ctx.strokeStyle = col.toLine; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(TO_AGE), box.y); ctx.lineTo(xOf(TO_AGE), box.y + box.h); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = col.toLine; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('turn-off', xOf(TO_AGE), box.y + 3); }
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.age), box.y); ctx.lineTo(xOf(st.age), box.y + box.h); ctx.stroke(); ctx.setLineDash([]);
  // axis names.
  ctx.fillStyle = col.speed; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('speed = path / Gyr (log)', box.x + 6, box.y + 4);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('stellar age (Gyr)', box.x + box.w / 2, box.y + box.h + 16);
}

function advance() {
  if (!running) return;
  st.age += AGE_MAX / 600;          // full evolution in ~10 s
  if (st.age > AGE_MAX) st.age = AGE_MIN;
  sAge.value = String(st.age); vAge.textContent = `${st.age.toFixed(2)} Gyr`;
}
function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawHR(col, REG.hr); drawDiag(col, REG.diag);
}
function tick() { advance(); render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

function boot() {
  if (params.get('age')) st.age = Math.max(AGE_MIN, Math.min(AGE_MAX, parseFloat(params.get('age'))));
  if (params.get('view') === 'cmd') st.view = 'cmd';
  if (params.get('color') === 'density') st.color = 'density';
  sAge.min = String(AGE_MIN); sAge.max = String(AGE_MAX); sAge.step = '0.01'; sAge.value = String(st.age);
  syncVals(); relayout();
  if (CAPTURE_NAME) { running = false; st.age = 10.6; sAge.value = '10.6'; syncVals(); }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); else { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const m = trackAt(st.age) || {};
  return { fields: [
    { key: 'age', label: 'stellar age (Gyr)', value: st.age, format: 'float' },
    { key: 'teff', label: 'model Teff (K)', value: m.logTeff ? teffFromLog(m.logTeff) : 0, format: 'float' },
    { key: 'logg', label: 'model log g', value: m.logg ?? 0, format: 'float' },
    { key: 'logL', label: 'model log L/Lsun', value: m.logL ?? 0, format: 'float' },
    { key: 'phase', label: 'core H burning', value: (m.centerH1 ?? 0) > 1e-3 ? 'yes (MS)' : 'no (evolved)', format: 'text' },
    { key: 'nstar', label: 'Gaia stars', value: GAIA_CMD.length, format: 'int' },
  ] };
};
window.playground.getInvariants = function () {
  const to = TO_AGE ?? 0;
  const toState = trackAt(to);
  const teffTO = toState ? teffFromLog(toState.logTeff) : 0;
  // The main sequence is the longest-lived phase: the median post-turn-off
  // evolutionary speed is far higher than the median speed before it.
  const before = SPEED.filter((p) => p.age < to && p.speed > 0).map((p) => p.speed).sort((a, b) => a - b);
  const after = SPEED.filter((p) => p.age >= to && p.speed > 0).map((p) => p.speed).sort((a, b) => a - b);
  const med = (a) => a.length ? a[Math.floor(a.length / 2)] : 0;
  const speedup = med(before) > 0 ? med(after) / med(before) : 0;
  const msFrac = to / AGE_MAX;
  return [
    { key: 'turnoff', label: 'MS turn-off age (Gyr)', value: to.toFixed(2), status: to > 8.5 && to < 9.8 ? 'pass' : 'drift' },
    { key: 'turnoffT', label: 'turn-off Teff (K)', value: teffTO.toFixed(0), status: teffTO > 5000 && teffTO < 6200 ? 'pass' : 'drift' },
    { key: 'msfrac', label: 'MS share of lifetime', value: `${(msFrac * 100).toFixed(0)} %`, status: msFrac > 0.55 ? 'pass' : 'drift' },
    { key: 'speedup', label: 'post-MS speed-up (x)', value: speedup.toFixed(0), status: speedup > 5 ? 'pass' : 'drift' },
  ];
};
