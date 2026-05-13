// playground.js
// Plot T(E) for the rectangular barrier. Quantum curve in accent; classical
// step function in fg-faint dashed for comparison.

import { transmission, resonanceEnergy } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderV      = document.getElementById('slider-V');
const sliderA      = document.getElementById('slider-a');
const valueV       = document.getElementById('value-V');
const valueA       = document.getElementById('value-a');
const btnReset     = document.getElementById('btn-reset');

const W = canvas.width, H = canvas.height;
const PLOT = { x: 80, y: 40, w: 640, h: 380, Emin: 0, Emax: 20, Tmin: 0, Tmax: 1.02 };

const state = { V0: 5, a: 1 };

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

function drawAxes() {
  ctx.fillStyle = tok.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = tok.surface;
  ctx.fillRect(PLOT.x, PLOT.y, PLOT.w, PLOT.h);
  ctx.strokeStyle = tok.fgFaint;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(PLOT.x + 0.5, PLOT.y + 0.5, PLOT.w - 1, PLOT.h - 1);

  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.fillStyle = tok.fgFaint;
  ctx.textAlign = 'center';
  for (let E = 0; E <= PLOT.Emax; E += 5) {
    const { px: x } = pxPlot(E, 0);
    ctx.fillText(String(E), x, PLOT.y + PLOT.h + 14);
    ctx.strokeStyle = tok.grid;
    ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(x, PLOT.y); ctx.lineTo(x, PLOT.y + PLOT.h); ctx.stroke();
  }
  ctx.textAlign = 'right';
  for (const T of [0, 0.25, 0.5, 0.75, 1]) {
    const { py: y } = pxPlot(0, T);
    ctx.fillText(T.toFixed(2), PLOT.x - 6, y + 3);
    ctx.strokeStyle = tok.grid;
    ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(PLOT.x, y); ctx.lineTo(PLOT.x + PLOT.w, y); ctx.stroke();
  }
  ctx.fillStyle = tok.fgMuted;
  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('E (energy units, hbar = m = 1)', PLOT.x + PLOT.w / 2, PLOT.y + PLOT.h + 32);
  ctx.save();
  ctx.translate(PLOT.x - 38, PLOT.y + PLOT.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('T(E)', 0, 0);
  ctx.restore();
}

function drawAll() {
  drawAxes();

  // classical step T = 0 for E < V0, T = 1 for E >= V0
  ctx.strokeStyle = tok.fgFaint;
  ctx.lineWidth = 1.0;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  const p0 = pxPlot(0, 0);
  const p1 = pxPlot(state.V0, 0);
  const p2 = pxPlot(state.V0, 1);
  const p3 = pxPlot(PLOT.Emax, 1);
  ctx.moveTo(p0.px, p0.py);
  ctx.lineTo(p1.px, p1.py);
  ctx.lineTo(p2.px, p2.py);
  ctx.lineTo(p3.px, p3.py);
  ctx.stroke();
  ctx.setLineDash([]);

  // quantum T(E)
  ctx.strokeStyle = tok.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const NE = 400;
  for (let i = 0; i <= NE; i += 1) {
    const E = PLOT.Emin + (i / NE) * (PLOT.Emax - PLOT.Emin);
    const T = transmission(E, state.V0, state.a);
    const { px, py } = pxPlot(E, T);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // V0 vertical accent line
  ctx.strokeStyle = tok.accentWarm;
  ctx.lineWidth = 0.8;
  ctx.setLineDash([2, 3]);
  const pV = pxPlot(state.V0, 0);
  ctx.beginPath();
  ctx.moveTo(pV.px, PLOT.y); ctx.lineTo(pV.px, PLOT.y + PLOT.h);
  ctx.stroke();
  ctx.setLineDash([]);

  // resonance ticks: E = V0 + n^2 pi^2 / (2 a^2), n = 1, 2, 3
  for (let n = 1; n <= 6; n += 1) {
    const E = resonanceEnergy(n, state.V0, state.a);
    if (E > PLOT.Emax) break;
    const p = pxPlot(E, 1);
    ctx.strokeStyle = tok.accentWarm;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.px, p.py - 4); ctx.lineTo(p.px, p.py + 4);
    ctx.stroke();
  }

  // legend
  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = tok.accent;
  ctx.fillRect(PLOT.x + 12, PLOT.y + 16, 14, 3);
  ctx.fillStyle = tok.fg;
  ctx.fillText('quantum T(E)', PLOT.x + 32, PLOT.y + 21);
  ctx.fillStyle = tok.fgFaint;
  ctx.fillRect(PLOT.x + 12, PLOT.y + 36, 14, 1);
  ctx.fillStyle = tok.fg;
  ctx.fillText('classical step', PLOT.x + 32, PLOT.y + 41);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillRect(PLOT.x + 12, PLOT.y + 56, 14, 1);
  ctx.fillStyle = tok.fg;
  ctx.fillText('V_0 and E_resonance', PLOT.x + 32, PLOT.y + 61);

  // readout overlay (top-right)
  const TatV = transmission(state.V0, state.V0, state.a);
  const TatHalf = transmission(state.V0 * 0.5, state.V0, state.a);
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = tok.fg;
  const rows = [
    ['V_0', state.V0.toFixed(2)],
    ['a',   state.a.toFixed(3)],
    ['T(E=V_0)', TatV.toFixed(4)],
    ['T(E=V_0/2)', TatHalf.toFixed(4)],
  ];
  const xL = W - 170, xR = W - 20;
  let y = 20;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';  ctx.fillText(k, xL, y);
    ctx.textAlign = 'right'; ctx.fillText(v, xR, y);
    y += 14;
  }
}

function applyControls() {
  state.V0 = parseFloat(sliderV.value);
  state.a  = parseFloat(sliderA.value);
  valueV.textContent = state.V0.toFixed(2);
  valueA.textContent = state.a.toFixed(3);
  drawAll();
}
sliderV.addEventListener('input', applyControls);
sliderA.addEventListener('input', applyControls);
btnReset.addEventListener('click', () => { sliderV.value = '5'; sliderA.value = '1'; applyControls(); });

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.V0 = 2 + frac * 16;       // 2 to 18
    state.a  = 0.3 + frac * 1.5;    // 0.3 to 1.8
    sliderV.value = state.V0.toString(); sliderA.value = state.a.toString();
    valueV.textContent = state.V0.toFixed(2);
    valueA.textContent = state.a.toFixed(3);
  } else {
    state.V0 = parseFloat(sliderV.value);
    state.a  = parseFloat(sliderA.value);
  }
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSync, { once: true });
} else {
  bootSync();
}
