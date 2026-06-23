import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for the Bohr hydrogen spectrum, Canvas2D only. Top
// region: the energy-level ladder E_n = -13.6/n^2 with an electron
// dropping from a chosen level and emitting a photon. Bottom region: the
// emission spectrum, each transition a coloured line at its wavelength
// (true colours in the visible band), grouped into the named series.
//
// Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics,
// 2nd ed., Ch. 5.

import { level, wavelengthNm, seriesLimitNm, buildLines, SERIES, E_R } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selSeries = document.getElementById('select-series');
const sliderNhigh = document.getElementById('slider-nhigh');
const valueSeries = document.getElementById('value-series');
const valueNhigh = document.getElementById('value-nhigh');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const NMAX = 9, HC_EV_NM = 1239.841984, LMIN = 90, LMAX = 2500;
let running = !DETERMINISTIC;
let phase = 0;        // electron-drop animation 0..1 then photon flight
const allLines = buildLines(NMAX + 4);

function nLow() { return SERIES.find((s) => s.name === selSeries.value).nLow; }
function nHigh() { return Math.max(nLow() + 1, parseInt(sliderNhigh.value, 10)); }

function syncVals() {
  valueSeries.textContent = selSeries.value;
  sliderNhigh.min = String(nLow() + 1);
  valueNhigh.textContent = String(nHigh());
}
selSeries.addEventListener('change', () => { syncVals(); phase = 0; render(); });
sliderNhigh.addEventListener('input', () => { syncVals(); phase = 0; render(); });
btnReset.addEventListener('click', () => {
  selSeries.value = 'Balmer'; sliderNhigh.value = '3'; phase = 0;
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
    { name: 'scene', weight: 1.5 },
    { name: 'diagnostic', weight: 1.5 },
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
    level: 'rgba(200,210,225,0.6)', electron: '#ffd166',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
}

// approximate visible-light colour of a wavelength (nm); null outside 380-700.
function waveRGB(nm) {
  if (nm < 380 || nm > 700) return null;
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else { r = 1; }
  let f = 1;
  if (nm < 420) f = 0.3 + 0.7 * (nm - 380) / 40;
  else if (nm > 645) f = 0.3 + 0.7 * (700 - nm) / 55;
  return [Math.round(255 * Math.pow(r * f, 0.8)), Math.round(255 * Math.pow(g * f, 0.8)), Math.round(255 * Math.pow(b * f, 0.8))];
}
function lineColor(L) {
  const rgb = waveRGB(L.lambdaNm);
  return rgb ? `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` : L.color;
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

// y position of level n on the true-energy ladder.
function levelY(n, top, bot) {
  const frac = (level(n) - level(1)) / (0 - level(1));   // 0 at n=1, ->1 at inf
  return bot - frac * (bot - top);
}

function drawScene(col, r) {
  panel(col, r, 'Energy ladder E_n = −13.6 eV / n²; an electron drops');

  const titleH = 22, stripH = 28;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const top = draw.y + 14, bot = draw.y + draw.h - 8;
  const lx = draw.x + 30, rx = draw.x + draw.w - 64;
  const nl = nLow(), nh = nHigh();
  const L = { nLow: nl, nHigh: nh, lambdaNm: wavelengthNm(nl, nh) };
  const lc = lineColor(L);

  // ionization band (E > 0).
  ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(lx, top - 8, rx - lx, 8);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText('ionized (E ≥ 0)', lx, top - 9);

  // levels.
  for (let n = 1; n <= NMAX; n++) {
    const y = levelY(n, top, bot);
    const isLow = n === nl;
    ctx.strokeStyle = isLow ? col.accent : col.level; ctx.lineWidth = isLow ? 2.4 : 1.3;
    ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(rx, y); ctx.stroke();
    ctx.fillStyle = isLow ? col.accent : col.muted; ctx.font = fontString(canvas, 'tick', 'mono', isLow ? 700 : 400); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`n=${n}`, rx + 5, y);
  }

  // annotate the big ground-state gap (n=1 to n=2): the energetic Lyman jump.
  {
    const gx = lx + 14, y1 = levelY(1, top, bot), y2 = levelY(2, top, bot);
    if (y1 - y2 > 60) {
      ctx.strokeStyle = 'rgba(167,139,250,0.4)'; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(gx, y2 + 6); ctx.lineTo(gx, y1 - 6); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.translate(gx + 12, (y1 + y2) / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = 'rgba(167,139,250,0.7)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('the Lyman jump to ground (UV)', 0, 0); ctx.restore();
    }
  }

  // faint arrows for all transitions in this series.
  for (let n = nl + 1; n <= NMAX; n++) {
    const y0 = levelY(n, top, bot), y1 = levelY(nl, top, bot);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
    const ax = lx + (rx - lx) * 0.25 + (n - nl) * 6;
    ctx.beginPath(); ctx.moveTo(ax, y0); ctx.lineTo(ax, y1); ctx.stroke();
  }

  // the active transition arrow nHigh -> nLow.
  const tx = lx + (rx - lx) * 0.5;
  const yH = levelY(nh, top, bot), yL = levelY(nl, top, bot);
  ctx.strokeStyle = lc; ctx.fillStyle = lc; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(tx, yH); ctx.lineTo(tx, yL); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tx, yL); ctx.lineTo(tx - 5, yL - 9); ctx.lineTo(tx + 5, yL - 9); ctx.closePath(); ctx.fill();

  // electron: drops along the arrow, then a photon flies out.
  const drop = Math.min(1, phase / 0.7);
  const eY = yH + (yL - yH) * drop;
  ctx.fillStyle = col.electron; ctx.beginPath(); ctx.arc(tx, eY, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.stroke();
  if (phase > 0.7) {
    const ft = (phase - 0.7) / 0.3;             // photon flight 0..1
    const px0 = tx + 10, py = yL, pw = (rx - px0) * ft;
    ctx.strokeStyle = lc; ctx.lineWidth = 2.4; ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const u = i / 40; const x = px0 + pw * u; const yy = py - 7 * Math.sin(u * 18); if (i) ctx.lineTo(x, yy); else ctx.moveTo(x, yy); }
    ctx.stroke();
  }

  // readout strip.
  const lam = L.lambdaNm, ePhot = level(nh) - level(nl);
  const items = [
    [selSeries.value, col.fg],
    [`${nh}→${nl}`, lc],
    [`λ ${lam.toFixed(0)}nm`, lc],
    [`${ePhot.toFixed(2)} eV`, col.muted],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - stripH / 2 + 1); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Emission spectrum: the lines hydrogen writes');

  const inner = { x: r.x + 16, y: r.y + 40, w: r.w - 32, h: r.h - 40 - 42 };
  const lx = (nm) => inner.x + (Math.log10(nm) - Math.log10(LMIN)) / (Math.log10(LMAX) - Math.log10(LMIN)) * inner.w;

  // visible-band rainbow strip.
  const bandY = inner.y - 10, bandH = 8;
  for (let sx = lx(380); sx < lx(700); sx += 1.5) {
    const nm = Math.pow(10, Math.log10(LMIN) + (sx - inner.x) / inner.w * (Math.log10(LMAX) - Math.log10(LMIN)));
    const rgb = waveRGB(nm); if (!rgb) continue;
    ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`; ctx.fillRect(sx, bandY, 2, bandH);
  }
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('visible', (lx(380) + lx(700)) / 2, bandY - 1);

  // frame + wavelength ticks.
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const nm of [100, 200, 500, 1000, 2000]) { if (nm < LMIN || nm > LMAX) continue; const x = lx(nm); ctx.strokeStyle = col.grid; ctx.beginPath(); ctx.moveTo(x, inner.y); ctx.lineTo(x, inner.y + inner.h); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(`${nm}`, x, inner.y + inner.h + 5); }

  const nl = nLow(), nh = nHigh();
  // all lines (dim), highlight the active series.
  for (const Ln of allLines) {
    if (Ln.lambdaNm < LMIN || Ln.lambdaNm > LMAX) continue;
    const active = Ln.series === selSeries.value;
    const x = lx(Ln.lambdaNm);
    ctx.strokeStyle = lineColor(Ln); ctx.globalAlpha = active ? 0.95 : 0.28; ctx.lineWidth = active ? 2 : 1;
    const h = active ? inner.h : inner.h * 0.5;
    ctx.beginPath(); ctx.moveTo(x, inner.y + inner.h); ctx.lineTo(x, inner.y + inner.h - h); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // the current transition: bright marker.
  const cx = lx(wavelengthNm(nl, nh));
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(cx, inner.y + inner.h); ctx.lineTo(cx, inner.y); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText(`${nh}→${nl}`, cx, inner.y - 1);
  // series limit tick.
  const sl = lx(seriesLimitNm(nl));
  if (sl > inner.x && sl < inner.x + inner.w) { ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(sl, inner.y); ctx.lineTo(sl, inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]); }

  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('wavelength (nm, log scale)', inner.x + inner.w / 2, inner.y + inner.h + 20);
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
  if (running) { phase += 0.45 * dt; if (phase > 1.15) phase = 0; }
  render();
  requestAnimationFrame(tick);
}

function bootSync() { syncVals(); relayout(); phase = 0.85; render(); }

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
  const nl = nLow(), nh = nHigh();
  return {
    fields: [
      { key: 'series', label: 'series', value: selSeries.value, format: 'text' },
      { key: 'trans', label: 'transition', value: `${nh} → ${nl}`, format: 'text' },
      { key: 'lambda', label: 'wavelength (nm)', value: wavelengthNm(nl, nh), format: 'float' },
      { key: 'E', label: 'photon energy (eV)', value: level(nh) - level(nl), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // Energy-wavelength consistency: the photon energy from the level
    // difference equals h c / lambda from the Rydberg wavelength.
    const nl = nLow(), nh = nHigh();
    const ePhot = level(nh) - level(nl);            // emission (positive)
    const fromLambda = HC_EV_NM / wavelengthNm(nl, nh);
    const err = Math.abs(ePhot - fromLambda);
    return [{
      key: 'ehc',
      label: 'E = hc/λ (eV)',
      value: err.toExponential(2),
      status: err < 1e-2 ? 'pass' : (err < 1e-1 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
