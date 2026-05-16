// Sturm-Liouville eigenfunctions made physical: the modes of -y'' = lambda y
// on [0, pi] with Dirichlet ends ARE the normal modes of a vibrating string.
// The string is shown oscillating as y(x,t) = sum c_n phi_n(x) cos(omega_n t)
// with omega_n = sqrt(lambda_n); each mode below vibrates at its own rate, so
// the eigenvalue spectrum lambda_n = n^2 becomes visible motion. Click the
// string to re-pluck it (triangular initial condition).

import { eigenfunction, eigenvalue, projectCoefficients, reconstruct, L } from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutN    = document.getElementById('readout-n');
const readoutErr  = document.getElementById('readout-err');
const sliderN     = document.getElementById('slider-N');
const valueN      = document.getElementById('value-N');

const W = canvas.width, H = canvas.height;
let N = parseInt(sliderN.value, 10);

// Initial string profiles. Default: a smoothly loaded string x(pi-x).
// Click re-plucks to a triangular tent peaked at the cursor.
const smoothProfile = (x) => x * (L - x);
let pluckP = null;
function currentProfile(x) {
  if (pluckP === null) return smoothProfile(x);
  const A = L * L / 4;                 // match the smooth-profile peak scale
  return x < pluckP ? A * (x / pluckP) : A * ((L - x) / (L - pluckP));
}

let coeffs = projectCoefficients(currentProfile, N);
function recompute() { coeffs = projectCoefficients(currentProfile, N); }

sliderN.addEventListener('input', () => {
  N = parseInt(sliderN.value, 10);
  valueN.textContent = String(N);
  recompute();
});

canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width;          // 0..1 across canvas
  pluckP = Math.max(0.06 * L, Math.min(0.94 * L, px * L));
  recompute();
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

// Visible angular frequency of mode n. omega_n = sqrt(lambda_n) = n; scaled
// so the fundamental period is a few seconds and higher modes are clearly
// faster.
const TIME_SCALE = 0.9;
function omega(n) { return Math.sqrt(eigenvalue(n)) * TIME_SCALE; }

let clock = 0;

function modeColor(n, nMax) {
  const t = (n - 1) / Math.max(1, nMax - 1);
  const r = 70 + Math.round(180 * t);
  const g = 120 + Math.round(110 * t);
  const b = 235 - Math.round(170 * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function drawString(c, x0, y0, w, h, t) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y0, w, h);
  const padL = 48, padR = 16, padT = 26, padB = 30;
  const plotW = w - padL - padR;
  const midY = y0 + padT + (h - padT - padB) / 2;
  const amp = (h - padT - padB) * 0.42;

  // Display normalisation from the static reconstruction peak.
  let fMax = 1e-6;
  for (let i = 0; i <= 200; i += 1) {
    const x = L * i / 200;
    fMax = Math.max(fMax, Math.abs(reconstruct(coeffs, x, N)));
  }
  const xFor = (x) => x0 + padL + plotW * x / L;
  const yFor = (v) => midY - amp * v / fMax;

  // Equilibrium line and clamped endpoints.
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  ctx.setLineDash([4, 5]);
  ctx.beginPath(); ctx.moveTo(xFor(0), midY); ctx.lineTo(xFor(L), midY); ctx.stroke();
  ctx.setLineDash([]);

  // Faint static envelope (the target the modal sum converges to).
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 240; i += 1) {
    const x = L * i / 240;
    const v = reconstruct(coeffs, x, N);
    if (i === 0) ctx.moveTo(xFor(x), yFor(v)); else ctx.lineTo(xFor(x), yFor(v));
  }
  ctx.stroke();

  // The vibrating string: superposition of modes evolving in time.
  const pts = [];
  for (let i = 0; i <= 320; i += 1) {
    const x = L * i / 320;
    let y = 0;
    for (let n = 1; n <= N; n += 1) y += coeffs[n] * eigenfunction(n, x) * Math.cos(omega(n) * t);
    pts.push([xFor(x), yFor(y)]);
  }
  // Soft glow then crisp core.
  ctx.strokeStyle = 'rgba(255,209,102,0.22)'; ctx.lineWidth = 7;
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
  ctx.strokeStyle = c.accent; ctx.lineWidth = 2.4;
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();

  // Clamped end beads.
  ctx.fillStyle = c.fg;
  for (const xe of [0, L]) { ctx.beginPath(); ctx.arc(xFor(xe), midY, 4.5, 0, 2 * Math.PI); ctx.fill(); }

  ctx.fillStyle = c.muted; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('vibrating string  y(x,t) = sum c_n phi_n(x) cos(omega_n t)', x0 + padL, y0 + 16);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.textAlign = 'right';
  ctx.fillText(pluckP === null ? 'click string to pluck' : 'plucked', x0 + w - padR, y0 + 16);
}

function drawModes(c, x0, y0, w, h, t) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y0, w, h);
  const padL = 48, padR = 16, padT = 20, padB = 14;
  const plotW = w - padL - padR;
  const M = Math.min(6, N);
  const laneH = (h - padT - padB) / M;

  ctx.fillStyle = c.muted; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('normal modes phi_n(x) cos(omega_n t)  (omega_n^2 = lambda_n = n^2)', x0 + padL, y0 + 14);

  for (let n = 1; n <= M; n += 1) {
    const laneMid = y0 + padT + (n - 0.5) * laneH;
    const a = laneH * 0.40;
    ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0 + padL, laneMid); ctx.lineTo(x0 + padL + plotW, laneMid); ctx.stroke();

    ctx.strokeStyle = modeColor(n, M); ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 240; i += 1) {
      const x = L * i / 240;
      const v = eigenfunction(n, x) * Math.cos(omega(n) * t) / Math.sqrt(2 / L);
      const xx = x0 + padL + plotW * x / L;
      const yy = laneMid - a * v;
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    ctx.fillStyle = c.muted; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'right';
    ctx.fillText(`n=${n}`, x0 + padL - 6, laneMid + 4);
  }
}

function render(t) {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, W, H);
  drawString(c, 0, 0, W, H * 0.56, t);
  drawModes(c, 0, H * 0.56, W, H * 0.44, t);
}

function updateReadout() {
  let maxErr = 0;
  for (let i = 0; i < 100; i += 1) {
    const x = L * i / 99;
    const err = Math.abs(currentProfile(x) - reconstruct(coeffs, x, N));
    if (err > maxErr) maxErr = err;
  }
  readoutN.textContent = String(N);
  readoutErr.textContent = maxErr.toExponential(2);
}

let last = 0;
function loop(now) {
  if (!last) last = now;
  clock += Math.min(0.05, (now - last) / 1000);
  last = now;
  render(clock);
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    N = Math.max(1, Math.round(1 + frac * 19));
    sliderN.value = String(N);
    valueN.textContent = String(N);
    recompute();
    // Freeze the wave at a frame-dependent phase so each still differs.
    render(0.5 + 2.3 * frac);
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
    return;
  }
  valueN.textContent = String(N);
  render(0);
  updateReadout();
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
