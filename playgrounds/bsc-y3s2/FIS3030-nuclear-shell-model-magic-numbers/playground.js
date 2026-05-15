// Nuclear shell-model playground. Vertical level diagram with
// occupancy filled bottom-up.

import { LEVELS, MAGIC, fillIndex, isMagic, levelEnergyMeV } from './sim.js';

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

function markFlash() {
  flashUntil = performance.now() + 700;
  flashGold = MAGIC.includes(N);
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
  row.appendChild(minus); row.appendChild(plus);
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

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padL = 60, padR = 130, padT = 30, padB = 30;
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
    ctx.font = '11px ui-monospace, monospace';
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
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`N = ${N} (${isMagic(N) ? 'magic shell closure' : 'open shell'})`, padL, padT - 14);
}

function updateReadout() {
  readoutN.textContent = String(N);
  readoutMagic.textContent = isMagic(N) ? 'yes (magic)' : 'no';
}

function loop() {
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
