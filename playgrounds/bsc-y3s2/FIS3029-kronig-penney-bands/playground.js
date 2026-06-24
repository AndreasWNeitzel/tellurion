import { fontString } from '../../../shared/js/canvas-type.js';
// Kronig-Penney model. The hero is a real-space electron wave in the periodic
// delta-comb: at an allowed energy a Bloch state propagates through the crystal,
// but at a gap energy the wave is evanescent and the lattice reflects it. The
// f(qa) construction (where cos(qa) + P sin(qa)/qa leaves [-1,1] a gap opens)
// and the resulting E(k) band structure are the linked diagnostics.

import { fKP, dispersionCurves } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams = new URLSearchParams(location.search);
const DETERMINISTIC = urlParams.get('deterministic') === '1';
const CAPTURE_NAME = urlParams.get('capture');
const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const sliderP = document.getElementById('slider-P'), valueP = document.getElementById('value-P');
const sliderEps = document.getElementById('slider-eps'), valueEps = document.getElementById('value-eps');
const sliderEmax = document.getElementById('slider-emax'), valueEmax = document.getElementById('value-emax');
const btnPlay = document.getElementById('btn-playpause');

const state = { P: 4.0, eps: 9.0, eMax: 60, playing: !(DETERMINISTIC || prefersReducedMotion()), t: 0, sweep: false };

const COL = { bg: '#07080d', fg: '#e8ecf6', muted: '#94a0b8', allow: '#5fd39a', gap: '#ef6f8b', wave: '#7fb8ff', pot: 'rgba(200,180,120,0.5)', grid: 'rgba(150,165,200,0.12)' };

// current Bloch state: allowed (real ka) or gap (decay rate kappa)
function blochState(eps, P) {
  const qa = Math.sqrt(Math.max(1e-6, eps));
  const f = fKP(qa, P);
  if (Math.abs(f) <= 1) return { qa, f, allowed: true, ka: Math.acos(f) };
  return { qa, f, allowed: false, kappa: Math.acosh(Math.abs(f)) };  // kappa a
}

// ----------------------------------------------------- hero: real-space wave
function drawWave(c) {
  const x0 = 28, y0 = 64, w = W - 56, h = 372, cy = y0 + h * 0.56;
  ctx.fillStyle = 'rgba(12,16,28,0.65)'; ctx.fillRect(x0 - 6, y0 - 8, w + 12, h + 22);
  const ncell = 8, cw = w / ncell;
  const bs = blochState(state.eps, state.P), qa = bs.qa;

  // periodic potential: barriers (atoms) at cell boundaries
  for (let n = 0; n <= ncell; n += 1) {
    const xb = x0 + n * cw;
    ctx.fillStyle = COL.pot; ctx.fillRect(xb - 3, cy - 70, 6, 110);
    ctx.fillStyle = 'rgba(230,210,150,0.9)'; ctx.beginPath(); ctx.arc(xb, cy + 40, 4, 0, 2 * Math.PI); ctx.fill();
  }
  // baseline
  ctx.strokeStyle = 'rgba(150,165,200,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x0 + w, cy); ctx.stroke();

  // electron wave Re[psi(x,t)]: propagating (band) or decaying (gap)
  const amp = 64, ph = state.t * 2.4;
  const col = bs.allowed ? COL.wave : COL.gap;
  ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let s = 0; s <= 760; s += 1) {
    const u = s / 760, xcell = u * ncell;       // position in cells
    const carrier = Math.cos(qa * xcell - ph);
    const env = bs.allowed ? 1 : Math.exp(-bs.kappa * xcell);   // evanescent decay across cells
    const y = cy - amp * env * carrier;
    const X = x0 + u * w;
    if (s === 0) ctx.moveTo(X, y); else ctx.lineTo(X, y);
  }
  ctx.stroke();
  // decay envelope guide for the gap case
  if (!bs.allowed) {
    ctx.strokeStyle = 'rgba(239,111,139,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    for (const sgn of [1, -1]) { ctx.beginPath(); for (let s = 0; s <= 120; s += 1) { const u = s / 120, xc = u * ncell; const y = cy - sgn * amp * Math.exp(-bs.kappa * xc); s ? ctx.lineTo(x0 + u * w, y) : ctx.moveTo(x0 + u * w, y); } ctx.stroke(); }
    ctx.setLineDash([]);
  }
  ctx.fillStyle = c.fg; ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText('electron in the periodic crystal', x0, y0 + 4);
  ctx.textAlign = 'right'; ctx.fillStyle = bs.allowed ? c.allow : c.gap;
  ctx.fillText(bs.allowed ? 'ALLOWED: Bloch state propagates' : 'GAP: evanescent, lattice reflects it', x0 + w, y0 + 4);
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('gold bars: lattice potential; curve: Re psi(x)', x0, y0 + h + 6);
}

// --------------------------------------------------- f(qa) construction
function drawF(c) {
  const x0 = 56, y0 = 500, w = 350, h = 420;
  ctx.fillStyle = 'rgba(12,16,28,0.6)'; ctx.fillRect(x0 - 40, y0 - 26, w + 56, h + 60);
  ctx.fillStyle = c.fg; ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText('band condition  f = cos qa + P sin(qa)/qa', x0 - 36, y0 - 8);
  const fLo = -3.2, fHi = 3.2;
  const xOf = (e) => x0 + e / state.eMax * w;
  const yOf = (f) => y0 + h - (Math.max(fLo, Math.min(fHi, f)) - fLo) / (fHi - fLo) * h;
  // shade allowed (|f|<=1) green, gap red, by sampling
  let prevA = null, segStart = 0;
  const NB = 600;
  for (let i = 0; i <= NB; i += 1) {
    const e = state.eMax * i / NB, f = fKP(Math.sqrt(Math.max(1e-6, e)), state.P);
    const a = Math.abs(f) <= 1;
    if (prevA === null) { prevA = a; segStart = e; }
    else if (a !== prevA || i === NB) {
      ctx.fillStyle = prevA ? 'rgba(95,211,154,0.16)' : 'rgba(239,111,139,0.14)';
      ctx.fillRect(xOf(segStart), y0, xOf(e) - xOf(segStart), h);
      prevA = a; segStart = e;
    }
  }
  // +/- 1 bound lines
  ctx.strokeStyle = 'rgba(200,210,235,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
  for (const fv of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x0, yOf(fv)); ctx.lineTo(x0 + w, yOf(fv)); ctx.stroke(); }
  ctx.setLineDash([]);
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right';
  ctx.fillText('+1', x0 - 4, yOf(1) + 3); ctx.fillText('-1', x0 - 4, yOf(-1) + 3);
  // f curve
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= NB; i += 1) { const e = state.eMax * i / NB; const f = fKP(Math.sqrt(Math.max(1e-6, e)), state.P); const X = xOf(e), Y = yOf(f); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
  ctx.stroke();
  // current eps marker
  const bs = blochState(state.eps, state.P);
  const X = xOf(state.eps);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.moveTo(X, y0); ctx.lineTo(X, y0 + h); ctx.stroke();
  ctx.fillStyle = bs.allowed ? c.allow : c.gap; ctx.beginPath(); ctx.arc(X, yOf(bs.f), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = c.muted; ctx.textAlign = 'center'; ctx.fillText('energy  epsilon', x0 + w / 2, y0 + h + 18);
  ctx.textAlign = 'left'; ctx.fillStyle = c.allow; ctx.fillText('|f| < 1 = band', x0 + 4, y0 + 12);
  ctx.fillStyle = c.gap; ctx.fillText('|f| > 1 = gap', x0 + 4, y0 + 26);
}

// ---------------------------------------------------- E(k) band structure
function drawBands(c) {
  const x0 = 470, y0 = 500, w = W - 510, h = 420;
  ctx.fillStyle = 'rgba(12,16,28,0.6)'; ctx.fillRect(x0 - 8, y0 - 26, w + 30, h + 60);
  ctx.fillStyle = c.fg; ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText('band structure  E(k)', x0, y0 - 8);
  const xOf = (ka) => x0 + ka / Math.PI * w;
  const yOf = (e) => y0 + h - e / state.eMax * h;
  // axes
  ctx.strokeStyle = 'rgba(150,165,200,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('0', x0, y0 + h + 14); ctx.fillText('ka', x0 + w / 2, y0 + h + 28); ctx.fillText('pi', x0 + w, y0 + h + 14);
  // clip to the panel so bands above eMax (the model gives them up to ~200)
  // do not spill into the panels above.
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  // bands (filled allowed energy stripes across k) + dispersion curves
  const curves = dispersionCurves(state.P, 8, 120);
  for (const pts of curves) {
    if (pts.length < 2) continue;
    let eLo = Infinity, eHi = -Infinity; for (const [, e] of pts) { if (e < eLo) eLo = e; if (e > eHi) eHi = e; }
    if (eLo > state.eMax) continue;
    ctx.fillStyle = 'rgba(95,211,154,0.13)'; ctx.fillRect(x0, yOf(eHi), w, yOf(eLo) - yOf(eHi));
    ctx.strokeStyle = '#5fb8ff'; ctx.lineWidth = 2.4; ctx.beginPath();
    pts.forEach(([ka, e], i) => { const X = xOf(ka), Y = yOf(e); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    ctx.stroke();
  }
  // current energy line + state marker
  const bs = blochState(state.eps, state.P);
  const yE = yOf(state.eps);
  ctx.strokeStyle = bs.allowed ? 'rgba(95,211,154,0.7)' : 'rgba(239,111,139,0.7)'; ctx.setLineDash([5, 3]);
  ctx.beginPath(); ctx.moveTo(x0, yE); ctx.lineTo(x0 + w, yE); ctx.stroke(); ctx.setLineDash([]);
  if (bs.allowed) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(xOf(bs.ka), yE, 5, 0, 2 * Math.PI); ctx.fill(); }
  ctx.restore();
  ctx.save(); ctx.translate(x0 - 6, y0 + h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillStyle = c.muted; ctx.fillText('energy', 0, 0); ctx.restore();
}

function render() {
  ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COL.fg; ctx.font = fontString(canvas, 'body', 'sans', 600); ctx.textAlign = 'left';
  ctx.fillText('Kronig-Penney bands: where gaps come from', 22, 30);
  const bs = blochState(state.eps, state.P);
  ctx.fillStyle = COL.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`P = ${state.P.toFixed(1)}    epsilon = ${state.eps.toFixed(1)}    f = ${bs.f.toFixed(2)}    ${bs.allowed ? `ka = ${bs.ka.toFixed(2)} (propagating)` : `kappa a = ${bs.kappa.toFixed(2)} (evanescent)`}`, 22, 50);
  drawWave(COL); drawF(COL); drawBands(COL);
}

function syncLabels() { valueP.textContent = state.P.toFixed(1); valueEps.textContent = state.eps.toFixed(1); valueEmax.textContent = String(state.eMax); }

let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  if (state.playing) {
    state.t += dt;
    if (state.sweep) { state.eps += dt * 4.5; if (state.eps > state.eMax - 1) state.eps = 0.5; sliderEps.value = String(state.eps); valueEps.textContent = state.eps.toFixed(1); }
    render();
  }
  requestAnimationFrame(tick);
}

sliderP.addEventListener('input', () => { state.P = parseFloat(sliderP.value); state.sweep = false; syncLabels(); render(); });
sliderEps.addEventListener('input', () => { state.eps = parseFloat(sliderEps.value); state.sweep = false; syncLabels(); render(); });
sliderEmax.addEventListener('input', () => { state.eMax = parseFloat(sliderEmax.value); syncLabels(); render(); });
if (btnPlay) btnPlay.addEventListener('click', () => { state.playing = !state.playing; btnPlay.textContent = state.playing ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(!state.playing)); });

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // f<0.5 -> a band energy (propagating), f>=0.5 -> a gap energy (evanescent)
    state.eps = f < 0.5 ? 9 : 16.5;
    sliderEps.value = String(state.eps);
  }
  syncLabels(); render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
  } else if (state.playing) { requestAnimationFrame(tick); }
}
bootSync();

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const bs = blochState(state.eps, state.P);
  return { fields: [
    { key: 'P', label: 'potential strength P', value: state.P, format: 'float' },
    { key: 'eps', label: 'energy epsilon', value: parseFloat(state.eps.toFixed(2)), format: 'float' },
    { key: 'allowed', label: 'in a band', value: bs.allowed ? 1 : 0, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  // f at qa = 0 must equal 1 + P (the analytic limit), confirming fKP.
  const f0 = fKP(1e-7, state.P);
  const ok = Math.abs(f0 - (1 + state.P)) < 1e-3;
  return [{ key: 'fkp-limit', label: 'f(qa->0) = 1 + P', value: ok ? 'pass' : 'drift', status: ok ? 'pass' : 'drift' }];
};
