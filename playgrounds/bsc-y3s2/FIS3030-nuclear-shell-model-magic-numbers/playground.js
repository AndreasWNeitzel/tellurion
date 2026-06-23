// Nuclear shell-model playground. Vertical level diagram with
// occupancy filled bottom-up.

import { LEVELS, MAGIC, fillIndex, isMagic, levelEnergyMeV } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutN     = document.getElementById('readout-N');
const readoutMagic = document.getElementById('readout-magic');

const sliderN = document.getElementById('slider-N');
const valueN  = document.getElementById('value-N');

let N = parseInt(sliderN.value, 10);
let flashUntil = 0, flashGold = false;
// 1-B: a nucleon hopping into the lowest unfilled level over 0.3 s, plus a
// 1.5 s gold shell-closure glow at magic numbers, plus an Auto-fill driver.
let hopStart = 0, hopActive = false;
let closureUntil = 0;
let autoFill = false, autoLast = 0;

function markFlash() {
  flashUntil = performance.now() + 700;
  flashGold = MAGIC.includes(N);
  hopStart = performance.now();
  hopActive = true;
  if (MAGIC.includes(N)) closureUntil = performance.now() + 1500;
}

sliderN.addEventListener('input', () => { N = parseInt(sliderN.value, 10); valueN.textContent = String(N); markFlash(); });

// Upgrade B (Phase 13): "Add nucleon" / "Remove" buttons for stepwise filling
// with a brief flash on the most-recently-changed level. Gold flash when the
// resulting N is a magic number.
(() => {
  const controls = document.querySelector('.controls, #controls');
  if (!controls) return;
  const row = document.createElement('div'); row.className = 'row';
  const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = 'Remove nucleon';
  const plus  = document.createElement('button'); plus.type  = 'button'; plus.textContent  = 'Add nucleon';
  minus.addEventListener('click', () => {
    if (N > 0) { N -= 1; sliderN.value = String(N); valueN.textContent = String(N); markFlash(); }
  });
  plus.addEventListener('click', () => {
    if (N < parseInt(sliderN.max, 10)) { N += 1; sliderN.value = String(N); valueN.textContent = String(N); markFlash(); }
  });
  const auto = document.createElement('button'); auto.type = 'button'; auto.textContent = 'Auto-fill';
  auto.addEventListener('click', () => {
    autoFill = !autoFill;
    auto.textContent = autoFill ? 'Stop' : 'Auto-fill';
    autoLast = performance.now();
  });
  row.appendChild(minus); row.appendChild(plus); row.appendChild(auto);
  controls.appendChild(row);
})();

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    red:    '#ef476f',
    green:  '#06d6a0',
    grid:   '#23252a',
  };
}

// 3D nucleus render: N nucleons packed into a sphere whose radius
// scales as A^(1/3) (the empirical nuclear-radius law R = r0 A^(1/3)).
// Deterministic packing via a Fibonacci-sphere of shells so the
// cluster looks dense and physical. Depth-sorted shaded spheres,
// slowly rotating. The number of FILLED shells (magic completion)
// tints the outer nucleons gold at a closed shell.
const nucleonCache = { N: -1, pts: null };
function buildNucleons(count) {
  if (nucleonCache.N === count) return nucleonCache.pts;
  const pts = [];
  // Pack `count` points in a unit ball: concentric Fibonacci shells.
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    // Radial layering: cube-root distribution gives uniform density.
    const frac = (i + 0.5) / count;
    const rad = Math.cbrt(frac);
    const y = 1 - 2 * frac;                       // -1..1
    const rRing = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * golden;
    pts.push([rad * rRing * Math.cos(phi), rad * y, rad * rRing * Math.sin(phi)]);
  }
  nucleonCache.N = count; nucleonCache.pts = pts;
  return pts;
}
function drawNucleus(x0, y0, w, h, c) {
  ctx.fillStyle = '#05060c';
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.22)';
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('the nucleus  (A = ' + N + ' nucleons)', x0 + 10, y0 + 16);

  const cx = x0 + w / 2, cy = y0 + h / 2 + 8;
  // Nuclear radius R = r0 A^(1/3); scale so a mid-size nucleus fills the
  // panel (normalised to A=70 rather than 126 so small/magic nuclei are not
  // tiny). Clip to the panel so a large nucleus cannot spill outside it.
  const A = Math.max(1, N);
  const Rworld = Math.cbrt(A);
  const pxScale = Math.min(w, h) * 0.46 / Math.cbrt(70);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  const Rpx = Rworld * pxScale;
  const nucR = Math.max(2.4, pxScale * 0.62);     // single-nucleon radius

  const pts = buildNucleons(A);
  const t = performance.now() * 0.0004;
  const ca = Math.cos(t), sa = Math.sin(t);
  const closed = isMagic(N);
  // Project + depth-sort.
  const items = [];
  for (let i = 0; i < pts.length; i += 1) {
    const [px, py, pz] = pts[i];
    // Rotate about y, slight tilt about x.
    const rx = ca * px + sa * pz;
    const rz = -sa * px + ca * pz;
    const ry = py * 0.93 - rz * 0.18;
    const depth = rz * 0.93 + py * 0.18;
    items.push({
      sx: cx + rx * Rpx, sy: cy - ry * Rpx, depth,
      // Alternate proton (red) / neutron (blue) for a recognisable mix.
      proton: (i % 2 === 0),
      shellOuter: i >= pts.length - 12,
    });
  }
  items.sort((a, b) => a.depth - b.depth);
  for (const it of items) {
    const lit = 0.55 + 0.45 * (it.depth + 1) / 2;
    let base;
    if (closed && it.shellOuter) base = [255, 209, 102];        // gold at shell closure
    else if (it.proton) base = [239, 110, 110];
    else base = [110, 170, 235];
    const g = ctx.createRadialGradient(
      it.sx - nucR * 0.3, it.sy - nucR * 0.3, nucR * 0.1,
      it.sx, it.sy, nucR,
    );
    g.addColorStop(0, `rgb(${Math.round(base[0] * lit + 40)},${Math.round(base[1] * lit + 40)},${Math.round(base[2] * lit + 40)})`);
    g.addColorStop(1, `rgb(${Math.round(base[0] * lit * 0.5)},${Math.round(base[1] * lit * 0.5)},${Math.round(base[2] * lit * 0.5)})`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(it.sx, it.sy, nucR, 0, Math.PI * 2); ctx.fill();
  }
  // Legend + radius readout.
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = '#ef6e6e';
  ctx.beginPath(); ctx.arc(x0 + 14, y0 + h - 30, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(220,230,255,0.85)'; ctx.fillText('proton', x0 + 22, y0 + h - 26);
  ctx.fillStyle = '#6eaaeb';
  ctx.beginPath(); ctx.arc(x0 + 90, y0 + h - 30, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(220,230,255,0.85)'; ctx.fillText('neutron', x0 + 98, y0 + h - 26);
  ctx.fillStyle = 'rgba(200,210,235,0.7)';
  ctx.fillText(`R = r0 A^(1/3) = ${Rworld.toFixed(2)} r0`, x0 + 10, y0 + h - 10);
  if (closed) {
    ctx.fillStyle = '#ffd166';
    ctx.font = fontString(canvas, 'caption', 'mono', 600);
    ctx.fillText('closed shell', x0 + w - 96, y0 + h - 10);
  }
  ctx.restore();
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Left panel: 3D nucleus. Right: the energy-level diagram.
  const NUC_W = Math.floor(canvas.width * 0.40);
  drawNucleus(8, 8, NUC_W - 16, canvas.height - 16, c);

  const padL = NUC_W + 56, padR = 130, padT = 30, padB = 30;
  const plotW = canvas.width - padL - padR;
  const plotH = canvas.height - padT - padB;

  // Vertical axis: bottom = level 0, top = level (LEVELS.length-1).
  function yFor(i) {
    return padT + plotH * (1 - i / (LEVELS.length - 1));
  }

  // Compute filled levels.
  let remaining = N;
  for (let i = 0; i < LEVELS.length; i += 1) {
    const lvl = LEVELS[i];
    const y = yFor(i);
    const isMagicHere = MAGIC.includes(lvl.cumul);

    // Bar.
    const occColor = isMagicHere ? c.accent : c.blue;
    const filledOcc = Math.min(remaining, lvl.occ);
    const emptyOcc = lvl.occ - filledOcc;
    remaining -= filledOcc;

    // Width per nucleon slot.
    const wSlot = 14;
    const startX = padL + 10;
    // Filled portion.
    if (filledOcc > 0) {
      ctx.fillStyle = occColor;
      ctx.fillRect(startX, y - 6, wSlot * filledOcc, 12);
      ctx.strokeStyle = c.fg;
      ctx.lineWidth = 1;
      ctx.strokeRect(startX, y - 6, wSlot * filledOcc, 12);
    }
    // Empty portion.
    if (emptyOcc > 0) {
      ctx.strokeStyle = c.muted;
      ctx.lineWidth = 1;
      ctx.strokeRect(startX + wSlot * filledOcc, y - 6, wSlot * emptyOcc, 12);
    }

    // Label.
    ctx.fillStyle = isMagicHere ? c.accent : c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(lvl.label, padL - 50, y + 4);

    // Cumulative count on right.
    const isMagicLevel = MAGIC.includes(lvl.cumul);
    ctx.fillStyle = isMagicLevel ? c.green : c.muted;
    ctx.font = isMagicLevel ? 'bold 12px ui-monospace, monospace' : '11px ui-monospace, monospace';
    ctx.fillText(`${lvl.cumul}${isMagicLevel ? '  MAGIC' : ''}`, startX + wSlot * lvl.occ + 14, y + 4);
  }

  // Current N horizontal marker.
  const idx = fillIndex(N);
  const yMark = yFor(idx);
  ctx.strokeStyle = c.red;
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(padL - 56, yMark + 8); ctx.lineTo(canvas.width - 8, yMark + 8); ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`N = ${N} (${isMagic(N) ? 'magic shell closure' : 'open shell'})`, padL, padT - 14);

  const now = performance.now();
  // Hopping nucleon: animates from above the diagram down to the marker
  // line over 0.3 s after the last add.
  if (hopActive) {
    const tt = (now - hopStart) / 300;
    if (tt >= 1) { hopActive = false; }
    else {
      const yTarget = yFor(fillIndex(N)) + 8;
      const yStart = padT - 30;
      const y = yStart + (yTarget - yStart) * (tt * tt * (3 - 2 * tt));
      ctx.fillStyle = c.accent || '#ffd166';
      ctx.beginPath(); ctx.arc(canvas.width * 0.5, y, 5, 0, 2 * Math.PI); ctx.fill();
    }
  }
  // Shell-closure gold banner for 1.5 s at magic numbers.
  if (now < closureUntil) {
    ctx.fillStyle = 'rgba(255, 209, 102, 0.14)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffd166';
    ctx.font = fontString(canvas, 'title', 'mono', 600);
    ctx.fillText('SHELL CLOSURE', canvas.width / 2 - 80, padT + 8);
    // Binding-energy local-max up-arrow glyph.
    ctx.fillText('^', canvas.width - 40, padT + 8);
  }
}

function updateReadout() {
  readoutN.textContent = String(N);
  readoutMagic.textContent = isMagic(N) ? 'yes (magic)' : 'no';
}

function loop() {
  // Auto-fill: increment N once per 0.4 s while active.
  if (autoFill) {
    const now = performance.now();
    if (now - autoLast >= 400) {
      autoLast = now;
      if (N < parseInt(sliderN.max, 10)) {
        N += 1; sliderN.value = String(N); valueN.textContent = String(N); markFlash();
      } else { autoFill = false; }
    }
  }
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const targets = [2, 20, 50, 82, 126];
    N = targets[Math.min(targets.length - 1, Math.floor(frac * targets.length))];
    sliderN.value = String(N);
    valueN.textContent = String(N);
  }
  valueN.textContent = String(N);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, N };
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
  return {
    fields: [
      { key: 'nucleon-count', label: 'total nucleon count N', value: N, format: 'float' },
      { key: 'filled-level', label: 'highest filled level index', value: fillIndex(N), format: 'float' },
      { key: 'magic', label: 'is magic number', value: isMagic(N) ? 'yes' : 'no', format: undefined },
      { key: 'shell-closure', label: 'next magic number', value: MAGIC.find((m) => m > N) ?? 'N/A', format: undefined }
    ]
  };
};
window.playground.getInvariants = function () {
  const inv = [];
  // Occupancy filling consistency: cumulative should match N at the filled level
  const idx = fillIndex(N);
  const prevCumul = idx > 0 ? LEVELS[idx - 1].cumul : 0;
  const currCumul = LEVELS[idx].cumul;
  inv.push({
    key: 'occupancy-bounds',
    label: 'filled level bounds N within cumulative occupancy',
    value: `${prevCumul} <= ${N} <= ${currCumul}`,
    status: (N >= prevCumul && N <= currCumul) ? 'pass' : 'drift'
  });
  // Magic number detection: at magic numbers, should have zero unfilled levels in current shell
  const atMagic = isMagic(N);
  const expected = MAGIC.includes(N);
  inv.push({
    key: 'magic-detection',
    label: 'magic number flag vs MAGIC table',
    value: atMagic === expected ? 'match' : 'mismatch',
    status: atMagic === expected ? 'pass' : 'drift'
  });
  return inv;
};
