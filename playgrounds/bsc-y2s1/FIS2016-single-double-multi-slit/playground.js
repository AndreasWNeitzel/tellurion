// playground.js
// Single / double / multi-slit diffraction shown as real wave
// propagation. A plane wave hits an opaque barrier with N slits; to
// the right, the coherent Huygens superposition of sub-sources across
// each slit propagates and interferes. The steady-state intensity on a
// screen and the analytic Fraunhofer I(theta) are drawn below; the
// bright fans line up with the screen peaks. sim.js carries the
// invariant-tested physics; this file adds the field visualization.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  intensity, A_DEF, LAMBDA, envelopeZeros, principalMaxima, slitSources,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderN      = document.getElementById('slider-N');
const sliderRatio  = document.getElementById('slider-ratio');
const sliderSpeed  = document.getElementById('slider-speed');
const valueN       = document.getElementById('value-N');
const valueRatio   = document.getElementById('value-ratio');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  N: 4,
  ratio: 5.0,            // d / a
  speed: 2,
  phase: 0,              // omega t
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

// Field panel geometry.
const PADL = 28, PADR = 28;
const F_TOP = 52, F_H = 300;
const F_BOT = F_TOP + F_H;
const XB = PADL + 86;                  // barrier x
const X_SCREEN = W - PADR - 70;        // screen x
const FSTEP = 3;
const M_SUB = 5;                       // Huygens sub-sources per slit

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

// Map physical aperture (a, d) to pixels so N slits fill ~62% of the
// field height; clamp so the pixel wavelength stays legible.
function layout() {
  const a = A_DEF, d = a * state.ratio, N = state.N;
  const extent = Math.max((N - 1) * d + a, a);
  let ppu = 0.62 * F_H / extent;
  ppu = Math.max(4, Math.min(40, ppu));
  const lamPx = Math.max(6, LAMBDA * ppu);
  const yc = (F_TOP + F_BOT) / 2;
  const sources = slitSources(N, a, d, M_SUB).map((y) => yc + y * ppu);
  // Slit openings (centres and half-width) for the barrier drawing.
  const mid = (N - 1) / 2;
  const slits = [];
  for (let s = 0; s < N; s += 1) slits.push({ y: yc + (s - mid) * d * ppu, h: Math.max(3, a * ppu) });
  return { sources, lamPx, k: 2 * Math.PI / lamPx, slits, ppu };
}

// Smooth dark -> cyan -> warm-white ramp for the steady intensity map.
// No rainbow; the pattern is time-averaged so it does not flash.
function rampColor(v) {
  const u = v < 0 ? 0 : (v > 1 ? 1 : v);
  if (u < 0.5) {
    const t = u / 0.5;
    return [10 + 36 * t, 14 + 140 * t, 28 + 168 * t];
  }
  const t = (u - 0.5) / 0.5;
  return [46 + 209 * t, 154 + 78 * t, 196 + 52 * t];
}

// The diffracted intensity |psi|^2 is independent of time, so it is
// computed once per (N, d/a) change and cached. Animating it every
// frame is exactly what made the old field flash.
const fieldCache = { key: '', off: null, fw: 0, fh: 0 };
function buildField(L) {
  const { sources, k } = L;
  const fw = Math.ceil((X_SCREEN - XB) / FSTEP);
  const fh = Math.ceil(F_H / FSTEP);
  const img = ctx.createImageData(fw, fh);
  let peak = 1e-9;
  const I = new Float64Array(fw * fh);
  for (let jy = 0; jy < fh; jy += 1) {
    const py = F_TOP + jy * FSTEP;
    for (let ix = 0; ix < fw; ix += 1) {
      const px = XB + ix * FSTEP;
      let re = 0, im = 0;
      for (let s = 0; s < sources.length; s += 1) {
        const dx = px - XB, dy = py - sources[s];
        const r = Math.sqrt(dx * dx + dy * dy) + 1e-3;
        const ph = k * r, inv = 1 / Math.sqrt(r);
        re += Math.cos(ph) * inv; im += Math.sin(ph) * inv;
      }
      const v = re * re + im * im;
      I[jy * fw + ix] = v;
      if (v > peak) peak = v;
    }
  }
  for (let i = 0; i < fw * fh; i += 1) {
    // sqrt + mild gamma so the faint higher-order fringes stay visible.
    const c = rampColor(Math.pow(I[i] / peak, 0.36));
    const o = i * 4;
    img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
  }
  const offc = new OffscreenCanvas(fw, fh);
  offc.getContext('2d').putImageData(img, 0, 0);
  fieldCache.off = offc; fieldCache.fw = fw; fieldCache.fh = fh;
}

function drawField(L) {
  const key = `${state.N}|${state.ratio.toFixed(2)}`;
  if (key !== fieldCache.key) { buildField(L); fieldCache.key = key; }
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(fieldCache.off, XB, F_TOP, X_SCREEN - XB, F_H);

  // Faint Huygens wavelets travelling outward (+x) from each slit. These
  // are the physical wavefronts whose interference builds the cached
  // pattern; low alpha so the steady map stays dominant (not flashy).
  ctx.save();
  ctx.beginPath(); ctx.rect(XB, F_TOP, X_SCREEN - XB, F_H); ctx.clip();
  const lamPx = L.lamPx, off = (state.phase / (2 * Math.PI)) * lamPx;
  const maxR = X_SCREEN - XB + 40;
  for (const sl of L.slits) {
    for (let m = 0; m < 60; m += 1) {
      const rr = (m * lamPx + off) % maxR;
      if (rr < 6 || rr > maxR) continue;
      const al = 0.22 * (1 - rr / maxR);
      if (al <= 0.01) continue;
      ctx.strokeStyle = `rgba(150,205,235,${al.toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(XB, sl.y, rr, -1.15, 1.15); ctx.stroke();
    }
  }
  ctx.restore();
}

function drawIncident(L) {
  // Plane wavefronts travelling rightward (+x), toward the barrier.
  ctx.save();
  ctx.beginPath(); ctx.rect(PADL, F_TOP, XB - PADL, F_H); ctx.clip();
  const span = XB - PADL, off = (state.phase / (2 * Math.PI)) * L.lamPx;
  for (let m = 0; m < Math.ceil(span / L.lamPx) + 2; m += 1) {
    const xf = PADL + ((m * L.lamPx + off) % span);
    ctx.strokeStyle = 'rgba(150,205,235,0.45)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xf, F_TOP); ctx.lineTo(xf, F_BOT); ctx.stroke();
  }
  ctx.restore();
  // Direction-of-travel arrow so the incident propagation reads clearly.
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('plane wave', (PADL + XB) / 2, F_BOT + 14);
  ctx.strokeStyle = 'rgba(150,205,235,0.7)'; ctx.lineWidth = 1.4;
  const ay = F_BOT + 24, ax0 = PADL + 10, ax1 = XB - 10;
  ctx.beginPath(); ctx.moveTo(ax0, ay); ctx.lineTo(ax1, ay);
  ctx.moveTo(ax1, ay); ctx.lineTo(ax1 - 6, ay - 3);
  ctx.moveTo(ax1, ay); ctx.lineTo(ax1 - 6, ay + 3); ctx.stroke();
}

function drawBarrierAndScreen(L) {
  // Opaque barrier with gaps at the slits.
  ctx.fillStyle = '#3a3d44';
  let y = F_TOP;
  const gaps = L.slits.slice().sort((p, q) => p.y - q.y);
  for (const g of gaps) {
    const top = g.y - g.h / 2;
    if (top > y) ctx.fillRect(XB - 5, y, 10, top - y);
    y = g.y + g.h / 2;
  }
  if (y < F_BOT) ctx.fillRect(XB - 5, y, 10, F_BOT - y);

  // Screen: steady-state intensity |sum exp(i k r)|^2 vs height.
  const k = L.k, srcs = L.sources, n = srcs.length;
  let peak = 1e-9;
  const col = new Float64Array(Math.ceil(F_H / 2));
  for (let i = 0; i < col.length; i += 1) {
    const py = F_TOP + i * 2;
    let re = 0, im = 0;
    for (let s = 0; s < n; s += 1) {
      const dx = X_SCREEN - XB, dy = py - srcs[s];
      const r = Math.sqrt(dx * dx + dy * dy);
      re += Math.cos(k * r); im += Math.sin(k * r);
    }
    const I = (re * re + im * im) / (n * n);
    col[i] = I; if (I > peak) peak = I;
  }
  for (let i = 0; i < col.length; i += 1) {
    const v = Math.min(1, Math.sqrt(col[i] / peak));
    ctx.fillStyle = `rgb(${(v * 255) | 0},${(v * 255) | 0},${(v * 235) | 0})`;
    ctx.fillRect(X_SCREEN, F_TOP + i * 2, 18, 2);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
  ctx.strokeRect(X_SCREEN, F_TOP, 18, F_H);
  // Intensity profile curve to the right of the screen strip.
  ctx.strokeStyle = tok.accentCool; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i < col.length; i += 1) {
    const v = col[i] / peak;
    const x = X_SCREEN + 22 + v * (W - PADR - (X_SCREEN + 22));
    const yy = F_TOP + i * 2;
    if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('screen', X_SCREEN + 9, F_BOT + 14);
}

function drawAnalytic(a, d) {
  const top = F_BOT + 30, h = H - top - 26;
  const x0 = PADL, w = W - PADL - PADR;
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(x0, top, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(x0 + 0.5, top + 0.5, w - 1, h - 1);
  const I0 = intensity(0, state.N, a, d);
  const TM = Math.asin(0.4);
  const NP = w - 8;
  ctx.strokeStyle = 'rgba(214,138,105,0.6)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < NP; i += 1) {
    const th = -TM + 2 * TM * i / (NP - 1);
    const b = Math.PI * a * Math.sin(th) / LAMBDA;
    const env = Math.abs(b) < 1e-12 ? 1 : (Math.sin(b) / b) ** 2;
    const px = x0 + 4 + i, py = top + h - 4 - (h - 8) * env;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.strokeStyle = tok.accentCool; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < NP; i += 1) {
    const th = -TM + 2 * TM * i / (NP - 1);
    const I = intensity(th, state.N, a, d) / I0;
    const px = x0 + 4 + i, py = top + h - 4 - (h - 8) * I;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(214,138,105,0.8)'; ctx.fillText('single-slit envelope', x0 + 6, top + 13);
  ctx.fillStyle = tok.accentCool; ctx.fillText('N-slit Fraunhofer I(theta)', x0 + 168, top + 13);
}

function drawAll() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const a = A_DEF, d = a * state.ratio;
  const L = layout();

  drawField(L);
  drawIncident(L);
  drawBarrierAndScreen(L);
  drawAnalytic(a, d);

  const np = principalMaxima(d, LAMBDA, 8).length;
  const z = envelopeZeros(a, LAMBDA, 1).filter((t) => t > 0);
  const firstZeroDeg = z.length ? (z[0] * 180 / Math.PI).toFixed(1) : 'none';
  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.textAlign = 'left';
  ctx.fillText(
    `N = ${state.N}   d/a = ${state.ratio.toFixed(1)}   lambda = ${LAMBDA} um   principal maxima = ${np}   1st envelope zero = ${firstZeroDeg} deg`,
    PADL, 22);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('Huygens sub-sources interfere past the slits; the fans meet the screen at the Fraunhofer maxima below.', PADL, 40);
}

sliderN.addEventListener('input', () => { state.N = parseInt(sliderN.value, 10); valueN.textContent = String(state.N); if (!state.playing) drawAll(); });
sliderRatio.addEventListener('input', () => { state.ratio = parseFloat(sliderRatio.value); valueRatio.textContent = state.ratio.toFixed(1); if (!state.playing) drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { state.N = 4; state.ratio = 5.0; state.phase = 0; sliderN.value = '4'; valueN.textContent = '4'; sliderRatio.value = '5'; valueRatio.textContent = '5.0'; drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  valueN.textContent = String(state.N);
  valueRatio.textContent = state.ratio.toFixed(1);
  valueSpeed.textContent = String(state.speed);
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.N = Math.max(1, Math.round(1 + f * 5));     // 1 -> 6 slits
    state.phase = f * 2 * Math.PI;
    sliderN.value = String(state.N); valueN.textContent = String(state.N);
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
      }));
    }
    return;
  }
  drawAll();
}

function tick() {
  if (state.playing) {
    state.phase += 0.12 * Math.max(1, state.speed);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
