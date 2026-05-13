// playground.js
// Top: T(E) curve with a draggable E_star marker. Bottom: animated
// stationary wavefunction Re(psi(x, t)) at the current E_star.

import { transmission, resonanceEnergy, psiReal } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderV      = document.getElementById('slider-V');
const sliderA      = document.getElementById('slider-a');
const sliderE      = document.getElementById('slider-E');
const valueV       = document.getElementById('value-V');
const valueA       = document.getElementById('value-a');
const valueE       = document.getElementById('value-E');
const btnReset     = document.getElementById('btn-reset');
const btnPlay      = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const PLOT = { x: 80, y: 30, w: 640, h: 280, Emin: 0, Emax: 20, Tmin: 0, Tmax: 1.02 };
const WAVE = { x: 80, y: 360, w: 640, h: 240, xmin: -3, xmax: 6, ymin: -1.6, ymax: 1.6 };

const state = { V0: 5, a: 1, Estar: 3, t: 0, playing: !DETERMINISTIC, rafId: null };

function cssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
const tok = {
  bg:      cssVar('--bg', '#FBFBF9'),
  surface: cssVar('--surface', '#FFFFFF'),
  fg:      cssVar('--fg', '#1A1B1C'),
  fgMuted: cssVar('--fg-muted', '#5C5E61'),
  fgFaint: cssVar('--fg-faint', '#9A9C9F'),
  accent:  cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
  grid:    cssVar('--grid', '#9A9C9F4D'),
};

function pxPlot(E, T) {
  return {
    px: PLOT.x + (E - PLOT.Emin) / (PLOT.Emax - PLOT.Emin) * PLOT.w,
    py: PLOT.y + (1 - (T - PLOT.Tmin) / (PLOT.Tmax - PLOT.Tmin)) * PLOT.h,
  };
}
function pxWave(x, y) {
  return {
    px: WAVE.x + (x - WAVE.xmin) / (WAVE.xmax - WAVE.xmin) * WAVE.w,
    py: WAVE.y + (1 - (y - WAVE.ymin) / (WAVE.ymax - WAVE.ymin)) * WAVE.h,
  };
}

function drawTPanel() {
  ctx.fillStyle = tok.surface; ctx.fillRect(PLOT.x, PLOT.y, PLOT.w, PLOT.h);
  ctx.strokeStyle = tok.fgFaint; ctx.lineWidth = 0.6;
  ctx.strokeRect(PLOT.x + 0.5, PLOT.y + 0.5, PLOT.w - 1, PLOT.h - 1);

  // gridlines
  ctx.fillStyle = tok.fgFaint;
  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (let E = 0; E <= PLOT.Emax; E += 5) {
    const { px: x } = pxPlot(E, 0);
    ctx.fillText(String(E), x, PLOT.y + PLOT.h + 14);
    ctx.strokeStyle = tok.grid; ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(x, PLOT.y); ctx.lineTo(x, PLOT.y + PLOT.h); ctx.stroke();
  }
  ctx.textAlign = 'right';
  for (const T of [0, 0.5, 1]) {
    const { py: y } = pxPlot(0, T);
    ctx.fillText(T.toFixed(1), PLOT.x - 6, y + 3);
    ctx.strokeStyle = tok.grid; ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(PLOT.x, y); ctx.lineTo(PLOT.x + PLOT.w, y); ctx.stroke();
  }
  ctx.fillStyle = tok.fgMuted;
  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('E (energy units)', PLOT.x + PLOT.w / 2, PLOT.y + PLOT.h + 30);
  ctx.save(); ctx.translate(PLOT.x - 36, PLOT.y + PLOT.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('T(E)', 0, 0); ctx.restore();

  // classical step
  ctx.strokeStyle = tok.fgFaint;
  ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath();
  const p0 = pxPlot(0, 0), p1 = pxPlot(state.V0, 0), p2 = pxPlot(state.V0, 1), p3 = pxPlot(PLOT.Emax, 1);
  ctx.moveTo(p0.px, p0.py); ctx.lineTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.lineTo(p3.px, p3.py);
  ctx.stroke(); ctx.setLineDash([]);

  // T(E) curve
  ctx.strokeStyle = tok.accent;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i <= 400; i += 1) {
    const E = PLOT.Emin + (i / 400) * (PLOT.Emax - PLOT.Emin);
    const T = transmission(E, state.V0, state.a);
    const { px, py } = pxPlot(E, T);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // V_0 line
  ctx.strokeStyle = tok.accentWarm;
  ctx.lineWidth = 0.8; ctx.setLineDash([2, 3]);
  const pV = pxPlot(state.V0, 0);
  ctx.beginPath(); ctx.moveTo(pV.px, PLOT.y); ctx.lineTo(pV.px, PLOT.y + PLOT.h); ctx.stroke();
  ctx.setLineDash([]);

  // resonance ticks
  for (let n = 1; n <= 6; n += 1) {
    const E = resonanceEnergy(n, state.V0, state.a);
    if (E > PLOT.Emax) break;
    const p = pxPlot(E, 1);
    ctx.strokeStyle = tok.accentWarm; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(p.px, p.py - 4); ctx.lineTo(p.px, p.py + 4); ctx.stroke();
  }

  // E_star marker
  const Tstar = transmission(state.Estar, state.V0, state.a);
  const pStar = pxPlot(state.Estar, Tstar);
  ctx.strokeStyle = tok.accentWarm;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(pStar.px, PLOT.y); ctx.lineTo(pStar.px, PLOT.y + PLOT.h);
  ctx.stroke();
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath(); ctx.arc(pStar.px, pStar.py, 5, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = tok.fg; ctx.lineWidth = 0.8; ctx.stroke();

  // legend / readout overlay top-right
  const rows = [
    ['V_0', state.V0.toFixed(2)],
    ['a',   state.a.toFixed(3)],
    ['E*',  state.Estar.toFixed(2)],
    ['T(E*)', Tstar.toFixed(4)],
  ];
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  const xL = W - 180, xR = W - 20;
  let y = PLOT.y + 14;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';  ctx.fillStyle = tok.fgMuted; ctx.fillText(k, xL, y);
    ctx.textAlign = 'right'; ctx.fillStyle = tok.fg;       ctx.fillText(v, xR, y);
    y += 14;
  }
}

function drawWavePanel() {
  ctx.fillStyle = tok.surface; ctx.fillRect(WAVE.x, WAVE.y, WAVE.w, WAVE.h);
  ctx.strokeStyle = tok.fgFaint; ctx.lineWidth = 0.6;
  ctx.strokeRect(WAVE.x + 0.5, WAVE.y + 0.5, WAVE.w - 1, WAVE.h - 1);

  // x = 0 and x = a markers
  const xZero = pxWave(0, 0).px;
  const xBar  = pxWave(state.a, 0).px;
  ctx.fillStyle = 'rgba(193, 59, 39, 0.10)';     // barrier region shaded
  ctx.fillRect(xZero, WAVE.y, xBar - xZero, WAVE.h);
  ctx.strokeStyle = tok.accentWarm;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xZero, WAVE.y); ctx.lineTo(xZero, WAVE.y + WAVE.h);
  ctx.moveTo(xBar,  WAVE.y); ctx.lineTo(xBar,  WAVE.y + WAVE.h);
  ctx.stroke();
  // V_0 marker height: scale barrier height to a fraction of plot height.
  const Vfrac = Math.min(state.V0 / 12, 0.8);
  const VtopY = pxWave(0, WAVE.ymax * Vfrac).py;
  ctx.strokeStyle = 'rgba(193, 59, 39, 0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(xZero, VtopY); ctx.lineTo(xBar, VtopY);
  ctx.stroke();

  // y = 0 axis
  ctx.strokeStyle = tok.fgFaint;
  ctx.lineWidth = 0.5;
  const yZero = pxWave(0, 0).py;
  ctx.beginPath();
  ctx.moveTo(WAVE.x, yZero); ctx.lineTo(WAVE.x + WAVE.w, yZero);
  ctx.stroke();

  // Re(psi) at current time t
  ctx.strokeStyle = tok.accent;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const N = 800;
  for (let i = 0; i <= N; i += 1) {
    const x = WAVE.xmin + (i / N) * (WAVE.xmax - WAVE.xmin);
    const y = psiReal(x, state.t, state.Estar, state.V0, state.a);
    const p = pxWave(x, y);
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();

  // panel title
  ctx.fillStyle = tok.fgMuted;
  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  const regime = state.Estar < state.V0 ? 'tunneling regime (E* below V_0)'
                                        : 'over-barrier regime (E* above V_0)';
  ctx.fillText(`Re(psi) at E* = ${state.Estar.toFixed(2)}  -  ${regime}`, WAVE.x + 8, WAVE.y - 8);

  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.fillStyle = tok.fgFaint;
  ctx.textAlign = 'center';
  ctx.fillText('x (length units)', WAVE.x + WAVE.w / 2, WAVE.y + WAVE.h + 18);
  ctx.textAlign = 'left';
  ctx.fillText('barrier from x=0 to x=a', xZero + 6, WAVE.y + 14);
}

function drawAll() {
  ctx.fillStyle = tok.bg; ctx.fillRect(0, 0, W, H);
  drawTPanel();
  drawWavePanel();
}

function applyControls() {
  state.V0    = parseFloat(sliderV.value);
  state.a     = parseFloat(sliderA.value);
  state.Estar = parseFloat(sliderE.value);
  valueV.textContent = state.V0.toFixed(2);
  valueA.textContent = state.a.toFixed(3);
  valueE.textContent = state.Estar.toFixed(2);
  drawAll();
}
sliderV.addEventListener('input', applyControls);
sliderA.addEventListener('input', applyControls);
sliderE.addEventListener('input', applyControls);
btnReset.addEventListener('click', () => {
  sliderV.value = '5'; sliderA.value = '1'; sliderE.value = '3';
  state.t = 0;
  applyControls();
});
btnPlay.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlay.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Sweep E_star across the range so the captured frames span tunneling
    // and over-barrier regimes.
    state.V0 = 5;
    state.a = 1;
    state.Estar = 0.5 + frac * 12;
    state.t = 0;
    sliderV.value = '5'; sliderA.value = '1';
    sliderE.value = state.Estar.toString();
    valueV.textContent = '5.00'; valueA.textContent = '1.000';
    valueE.textContent = state.Estar.toFixed(2);
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME };
        });
      });
    }
    return;
  }
  applyControls();
}

function tick() {
  if (state.playing) {
    state.t += 0.04;
    drawAll();
  }
  state.rafId = requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
