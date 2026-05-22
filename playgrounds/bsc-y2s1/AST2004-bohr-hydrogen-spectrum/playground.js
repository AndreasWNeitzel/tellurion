import { fontString } from '../../../shared/js/canvas-type.js';
// Bohr hydrogen spectrum playground.
// Left half: hydrogen energy ladder with transition arrows. Right half:
// wavelength axis (log scale) with emission lines color-coded by series.
// Closed-form, no time integration.

import {
  level, wavelengthNm, seriesLimitNm, buildLines, SERIES, E_R,
} from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutLam  = document.getElementById('readout-lam');
const readoutEn   = document.getElementById('readout-en');

const selectSeries = document.getElementById('select-series');
const sliderNmax   = document.getElementById('slider-nmax');
const sliderLine   = document.getElementById('slider-line');
const valueSeries  = document.getElementById('value-series');
const valueNmax    = document.getElementById('value-nmax');
const valueLine    = document.getElementById('value-line');

let seriesFilter = selectSeries.value;
let nMax = parseInt(sliderNmax.value, 10);
let lineIdx = parseInt(sliderLine.value, 10);

function filteredLines() {
  const all = buildLines(nMax);
  if (seriesFilter === 'all') return all;
  return all.filter(l => l.series === seriesFilter);
}

function updateLineSlider() {
  const lines = filteredLines();
  sliderLine.max = String(Math.max(0, lines.length - 1));
  if (lineIdx >= lines.length) lineIdx = lines.length - 1;
  if (lineIdx < 0) lineIdx = 0;
  sliderLine.value = String(lineIdx);
  if (lines[lineIdx]) {
    valueLine.textContent = `${lines[lineIdx].nHigh}->${lines[lineIdx].nLow}`;
  }
}

selectSeries.addEventListener('change', () => {
  seriesFilter = selectSeries.value;
  valueSeries.textContent = seriesFilter === 'all' ? 'All' : seriesFilter;
  lineIdx = 0;
  updateLineSlider();
});
sliderNmax.addEventListener('input', () => {
  nMax = parseInt(sliderNmax.value, 10);
  valueNmax.textContent = String(nMax);
  updateLineSlider();
});
sliderLine.addEventListener('input', () => {
  lineIdx = parseInt(sliderLine.value, 10);
  const lines = filteredLines();
  if (lines[lineIdx]) {
    valueLine.textContent = `${lines[lineIdx].nHigh}->${lines[lineIdx].nLow}`;
  }
});

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    grid:   '#23252a',
  };
}

function drawLadder(c, x0, y0, w, h) {
  const padL = 60, padT = 28, padB = 24, padR = 14;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y0, w, h);

  // Vertical energy axis, E_n on log-like spacing so high n is visible.
  // Map E_n in [-13.6, 0] eV to vertical pixel coord.
  function yForE(E) {
    const Emin = -E_R - 0.2;
    const Emax = 0.05;
    const frac = (E - Emin) / (Emax - Emin);
    return y0 + padT + plotH * (1 - frac);
  }

  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (const eMark of [-13.6, -10, -5, -2, -1, -0.5, 0]) {
    const y = yForE(eMark);
    ctx.beginPath(); ctx.moveTo(x0 + padL, y); ctx.lineTo(x0 + padL + plotW, y); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`${eMark.toFixed(1)}`, x0 + padL - 38, y + 3);
  }
  ctx.fillStyle = c.muted;
  ctx.fillText('E (eV)', Math.max(ctx.measureText('E (eV)').width / 2 + 4, x0 + 8), y0 + padT - 4);

  // Energy levels n = 1..nMax.
  for (let n = 1; n <= nMax; n += 1) {
    const E = level(n);
    const y = yForE(E);
    ctx.strokeStyle = c.fg;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0 + padL + 6, y); ctx.lineTo(x0 + padL + plotW - 6, y); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`n=${n}`, x0 + padL + plotW - 30, y - 4);
  }

  // Transition arrows for filtered series.
  const lines = filteredLines();
  for (let i = 0; i < lines.length; i += 1) {
    const ln = lines[i];
    const yh = yForE(level(ln.nHigh));
    const yl = yForE(level(ln.nLow));
    const x = x0 + padL + 12 + i * 14;
    if (x > x0 + padL + plotW - 18) continue;
    ctx.strokeStyle = ln.color;
    ctx.globalAlpha = (i === lineIdx) ? 1.0 : 0.35;
    ctx.lineWidth = (i === lineIdx) ? 2.5 : 1.4;
    ctx.beginPath(); ctx.moveTo(x, yh); ctx.lineTo(x, yl); ctx.stroke();
    // arrowhead pointing to lower level
    ctx.beginPath();
    ctx.moveTo(x, yl);
    ctx.lineTo(x - 4, yl - 6);
    ctx.lineTo(x + 4, yl - 6);
    ctx.closePath();
    ctx.fillStyle = ln.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}

function drawSpectrum(c, x0, y0, w, h) {
  const padL = 48, padT = 28, padB = 38, padR = 12;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y0, w, h);

  // Wavelength axis log-spaced from 50 nm to 50,000 nm so all series fit.
  const lamMin = 50;
  const lamMax = 50000;
  function xForLam(lam) {
    const frac = (Math.log10(lam) - Math.log10(lamMin)) / (Math.log10(lamMax) - Math.log10(lamMin));
    return x0 + padL + plotW * frac;
  }

  // Decade gridlines.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (const lam of [100, 1000, 10000]) {
    const x = xForLam(lam);
    ctx.beginPath(); ctx.moveTo(x, y0 + padT); ctx.lineTo(x, y0 + padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`${lam} nm`, x - 16, y0 + padT + plotH + 14);
  }
  ctx.fillStyle = c.muted;
  ctx.fillText('UV', xForLam(120) - 6, y0 + padT - 6);
  ctx.fillText('visible', xForLam(550) - 12, y0 + padT - 6);
  ctx.fillText('IR', xForLam(5000) - 4, y0 + padT - 6);

  // Visible band shaded.
  ctx.fillStyle = 'rgba(91,192,235,0.05)';
  ctx.fillRect(xForLam(380), y0 + padT, xForLam(750) - xForLam(380), plotH);

  // Draw all lines.
  const lines = filteredLines();
  for (let i = 0; i < lines.length; i += 1) {
    const ln = lines[i];
    if (ln.lambdaNm < lamMin || ln.lambdaNm > lamMax) continue;
    const x = xForLam(ln.lambdaNm);
    ctx.strokeStyle = ln.color;
    ctx.lineWidth = (i === lineIdx) ? 3 : 1.2;
    ctx.globalAlpha = (i === lineIdx) ? 1.0 : 0.7;
    ctx.beginPath(); ctx.moveTo(x, y0 + padT + 6); ctx.lineTo(x, y0 + padT + plotH - 4); ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  // Series limits as dashed lines.
  for (const s of SERIES) {
    if (seriesFilter !== 'all' && s.name !== seriesFilter) continue;
    const lam = seriesLimitNm(s.nLow);
    if (lam < lamMin || lam > lamMax) continue;
    const x = xForLam(lam);
    ctx.strokeStyle = s.color;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y0 + padT + 4); ctx.lineTo(x, y0 + padT + plotH - 4); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Title.
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`emission spectrum (log lambda)`, x0 + padL, y0 + 16);
}

let atomPhase = 0;

function nmToColor(nm) {
  if (nm < 380) return '#9b6cff';                  // UV
  if (nm > 750) return '#7a1a1a';                  // IR
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else { r = 1; }
  return `rgb(${(255 * r) | 0},${(255 * g) | 0},${(255 * b) | 0})`;
}

// Bohr atom: nucleus + orbit rings r ~ n^2, electron animating the
// selected nHigh -> nLow transition with an emitted photon.
function drawAtom(c, x0, y0, w, h) {
  ctx.fillStyle = '#08080c'; ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  const cx = x0 + w / 2, cy = y0 + h / 2;
  const lines = filteredLines();
  const ln = lines[Math.min(lineIdx, Math.max(0, lines.length - 1))];
  if (!ln) return;
  const nHi = ln.nHigh, nLo = ln.nLow;
  const Rmax = Math.min(w, h) * 0.42;
  const rOf = (n) => Rmax * (n * n) / (nMax * nMax);

  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`Bohr ${nHi}->${nLo}`, x0 + 8, y0 + 16);

  for (let n = 1; n <= nMax; n += 1) {
    ctx.strokeStyle = (n === nHi || n === nLo) ? 'rgba(255,209,102,0.55)' : 'rgba(255,255,255,0.10)';
    ctx.lineWidth = (n === nHi || n === nLo) ? 1.4 : 1;
    ctx.beginPath(); ctx.arc(cx, cy, rOf(n), 0, 2 * Math.PI); ctx.stroke();
  }
  // Nucleus.
  const ng = ctx.createRadialGradient(cx, cy, 0, cx, cy, 9);
  ng.addColorStop(0, '#ffd9a0'); ng.addColorStop(1, 'rgba(255,150,80,0)');
  ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(cx, cy, 9, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ff9b51'; ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, 2 * Math.PI); ctx.fill();

  // Phase 0..1: electron sits at nHi (0..0.4), jumps inward (0.4..0.6),
  // sits at nLo (0.6..1.0). Photon emitted during/after the jump.
  const ph = atomPhase % 1;
  let rEl;
  if (ph < 0.4) rEl = rOf(nHi);
  else if (ph < 0.6) { const f = (ph - 0.4) / 0.2; rEl = rOf(nHi) + (rOf(nLo) - rOf(nHi)) * f; }
  else rEl = rOf(nLo);
  const ang = atomPhase * 3.2;
  const ex = cx + rEl * Math.cos(ang), ey = cy + rEl * Math.sin(ang);
  ctx.fillStyle = '#5bc0eb';
  ctx.beginPath(); ctx.arc(ex, ey, 5, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke();

  // Emitted photon: a wavy ray flying outward radially. The emission
  // direction is LATCHED at the moment of emission (ph = 0.45) so the
  // photon travels in a fixed straight line. Recomputing `aa` each frame
  // from the rotating electron's current angle made the photon appear
  // to spin with angular momentum it does not carry.
  if (ph >= 0.45) {
    const pf = Math.min(1, (ph - 0.45) / 0.5);
    const pr = rOf(nHi) + pf * (Rmax + 30);
    const pcol = nmToColor(ln.lambdaNm);
    // Per-cycle emission angle: evaluate ang at the moment ph = 0.45.
    // ang(t) = atomPhase * 3.2; at ph = 0.45 within this cycle,
    // atomPhase = floor(atomPhase) + 0.45.
    const cycleAtEmission = Math.floor(atomPhase) + 0.45;
    const aaFixed = cycleAtEmission * 3.2 + 0.5;
    ctx.strokeStyle = pcol; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let s = 0; s <= 40; s += 1) {
      const rr = pr - 36 + s * 0.9;
      // Perpendicular wobble (the EM transverse oscillation), not a
      // rotational drift of the propagation direction.
      const perpX = -Math.sin(aaFixed), perpY = Math.cos(aaFixed);
      const wob = Math.sin(s * 0.9) * 4;
      const px = cx + rr * Math.cos(aaFixed) + wob * perpX;
      const py = cy + rr * Math.sin(aaFixed) + wob * perpY;
      if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('orbit radius proportional to n^2; photon E = E_hi - E_lo', cx, y0 + h - 10);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  drawLadder(c, 0, 0, W * 0.34, H);
  drawAtom(c, W * 0.34, 0, W * 0.33, H);
  drawSpectrum(c, W * 0.67, 0, W * 0.33, H);
}

function updateReadout() {
  const lines = filteredLines();
  if (lines.length === 0) {
    readoutLam.textContent = '--';
    readoutEn.textContent = '--';
    return;
  }
  const ln = lines[Math.min(lineIdx, lines.length - 1)];
  readoutLam.textContent = ln.lambdaNm.toFixed(2);
  readoutEn.textContent = level(ln.nHigh).toFixed(3);
}

function loop() {
  atomPhase += 0.006;
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Cycle through SERIES in capture mode.
    const seriesNames = ['Lyman', 'Balmer', 'Paschen', 'Brackett', 'Pfund'];
    const idx = Math.min(seriesNames.length - 1, Math.floor(frac * seriesNames.length));
    selectSeries.value = seriesNames[idx];
    seriesFilter = seriesNames[idx];
    valueSeries.textContent = seriesNames[idx];
    lineIdx = 0;
    updateLineSlider();
  }
  valueSeries.textContent = seriesFilter === 'all' ? 'All' : seriesFilter;
  valueNmax.textContent = String(nMax);
  updateLineSlider();
  if (CAPTURE_NAME) atomPhase = 0.55 + 0.4 * (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(loop);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(loop);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const lines = filteredLines();
  const line = lines[lineIdx];
  if (!line) {
    return { fields: [
      { key: 'series', label: 'Series', value: seriesFilter, format: undefined },
      { key: 'nmax', label: 'n max', value: nMax, format: undefined }
    ] };
  }
  return {
    fields: [
      { key: 'series', label: 'Series', value: line.series, format: undefined },
      { key: 'transition', label: 'Transition', value: line.nHigh + ' -> ' + line.nLow, format: undefined },
      { key: 'wavelength', label: 'Wavelength (nm)', value: line.lambdaNm, format: 'float' },
      { key: 'energy', label: 'Photon energy (eV)', value: -E_R / (line.nLow * line.nLow) + E_R / (line.nHigh * line.nHigh), format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const lines = filteredLines();
  const line = lines[lineIdx];
  if (!line) return [{ key: 'rydberg', label: 'Rydberg formula', value: 'no line', status: 'pending' }];
  const lambda = line.lambdaNm;
  const deltaE = -E_R / (line.nLow * line.nLow) + E_R / (line.nHigh * line.nHigh);
  const hc = 1239.84193;
  const lambdaCheck = hc / Math.abs(deltaE);
  const err = Math.abs(lambda - lambdaCheck) / lambda;
  const status = err < 1e-3 ? 'pass' : 'drift';
  return [
    { key: 'rydberg', label: 'Rydberg formula check', value: (err * 100).toExponential(2) + '%', status }
  ];
};
