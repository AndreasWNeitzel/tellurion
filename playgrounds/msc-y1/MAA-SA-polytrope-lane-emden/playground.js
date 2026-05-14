// Lane-Emden polytrope playground. theta(xi) curves for selected n.

import { solveLaneEmden, KNOWN_XI1 } from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutXi1  = document.getElementById('readout-xi1');
const readoutM    = document.getElementById('readout-m');

const selectN = document.getElementById('select-n');
const valueN  = document.getElementById('value-n');

let n = parseFloat(selectN.value);
selectN.addEventListener('change', () => { n = parseFloat(selectN.value); valueN.textContent = String(n); });

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
    orange: '#f4a261',
    grid:   '#23252a',
  };
}

const COLORS_N = {
  0:   '#a78bfa',
  1:   '#5bc0eb',
  1.5: '#ffd166',
  3:   '#f4a261',
  5:   '#ef476f',
};

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padL = 56, padR = 12, padT = 26, padB = 40;
  const plotW = canvas.width - padL - padR;
  const plotH = canvas.height - padT - padB;

  const xiMax = 10;
  function xFor(xi) { return padL + plotW * xi / xiMax; }
  function yFor(t) { return padT + plotH * (1 - t); }

  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const x = padL + plotW * i / 5;
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`${i * 2}`, x - 4, padT + plotH + 14);
  }
  for (let i = 0; i <= 5; i += 1) {
    const y = padT + plotH * i / 5;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.fillText(`${(1 - i / 5).toFixed(1)}`, padL - 22, y + 3);
  }
  // Zero line.
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(padL, yFor(0)); ctx.lineTo(padL + plotW, yFor(0)); ctx.stroke();

  // All curves.
  const NS = [0, 1, 1.5, 3, 5];
  for (const ni of NS) {
    const r = solveLaneEmden(ni, 1e-3);
    ctx.strokeStyle = COLORS_N[ni];
    ctx.lineWidth = ni === n ? 3 : 1.5;
    ctx.globalAlpha = ni === n ? 1.0 : 0.4;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < r.xi.length; i += 1) {
      const xi = r.xi[i], t = r.theta[i];
      if (xi > xiMax) break;
      if (t < 0) break;
      const xx = xFor(xi);
      const yy = yFor(t);
      if (!started) { ctx.moveTo(xx, yy); started = true; } else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  // xi_1 marker.
  const r = solveLaneEmden(n, 1e-3);
  if (r.xi1 < xiMax) {
    const xm = xFor(r.xi1);
    ctx.strokeStyle = c.accent;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xm, padT); ctx.lineTo(xm, padT + plotH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = c.accent;
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`xi_1 = ${r.xi1.toFixed(3)}`, xm + 4, padT + 14);
  }

  // Legend.
  let ly = padT + 14;
  for (const ni of NS) {
    ctx.fillStyle = COLORS_N[ni];
    ctx.fillRect(padL + plotW - 100, ly - 10, 12, 3);
    ctx.fillStyle = ni === n ? COLORS_N[ni] : c.muted;
    const xi1Known = KNOWN_XI1[ni] !== undefined ? KNOWN_XI1[ni].toFixed(3) : 'inf';
    ctx.fillText(`n = ${ni}  (xi_1 = ${xi1Known})`, padL + plotW - 80, ly);
    ly += 14;
  }

  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('xi', padL + plotW - 12, padT + plotH + 28);
  ctx.save(); ctx.translate(16, padT + plotH / 2 + 24); ctx.rotate(-Math.PI / 2);
  ctx.fillText('theta(xi)', 0, 0); ctx.restore();
}

function updateReadout() {
  const r = solveLaneEmden(n, 1e-3);
  readoutXi1.textContent = r.xi1.toFixed(4);
  // Mass proxy: M/M_xi1 ~ xi_1^2 |dtheta/dxi at xi_1|. Approximate via the
  // last two trajectory points.
  const N = r.xi.length;
  if (N >= 2) {
    const dxi = r.xi[N - 1] - r.xi[N - 2];
    const dtheta = r.theta[N - 1] - r.theta[N - 2];
    const slope = dtheta / dxi;
    readoutM.textContent = (r.xi1 * r.xi1 * Math.abs(slope)).toFixed(3);
  }
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const ns = [0, 1, 1.5, 3, 5];
    n = ns[Math.min(ns.length - 1, Math.floor(frac * ns.length))];
    selectN.value = String(n);
  }
  valueN.textContent = String(n);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, n };
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
