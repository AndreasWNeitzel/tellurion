// Lane-Emden polytrope shown as the star it describes: a density-shaded
// sphere with rho/rho_c = theta(xi)^n, a cutaway wedge revealing the
// interior profile, and isodensity contours. The theta(xi) curve is kept
// as a linked strip with a probe that ties the 1D solution to the 2D
// structure. sim.js (solveLaneEmden, KNOWN_XI1) is unchanged.

import { solveLaneEmden, KNOWN_XI1 } from './sim.js';
import { viridis } from '../../../shared/js/render/colormaps.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutXi1  = document.getElementById('readout-xi1');
const readoutM    = document.getElementById('readout-m');
const selectN     = document.getElementById('select-n');
const valueN      = document.getElementById('value-n');

const W = canvas.width, H = canvas.height;
let n = parseFloat(selectN.value);

const NS = [0, 1, 1.5, 3, 5];
const COLORS_N = { 0: '#a78bfa', 1: '#5bc0eb', 1.5: '#ffd166', 3: '#f4a261', 5: '#ef476f' };

// Cache the Lane-Emden solution per n; sim.js does the physics.
const solCache = new Map();
function sol(ni) {
  if (!solCache.has(ni)) solCache.set(ni, solveLaneEmden(ni, 1e-3));
  return solCache.get(ni);
}
// theta(xi) by linear interpolation on the cached trajectory; 0 outside.
function thetaOf(s, xi) {
  const xs = s.xi, ts = s.theta;
  if (xi <= 0) return 1;
  if (xi >= xs[xs.length - 1]) return Math.max(0, ts[ts.length - 1]);
  let lo = 0, hi = xs.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] < xi) lo = m; else hi = m; }
  const f = (xi - xs[lo]) / (xs[hi] - xs[lo] || 1);
  return Math.max(0, ts[lo] + f * (ts[hi] - ts[lo]));
}

// Common physical scale so the radius differences between polytropes are
// visible (n = 0 compact, n = 3 large, n = 5 huge and diffuse).
const XI_SCALE = 7.6;
function displayXi(s) {
  // Finite radius if it has one, else where the density falls below a floor.
  if (s.xi1 < s.xi[s.xi.length - 1] - 1e-6) return s.xi1;
  for (let i = 0; i < s.xi.length; i += 1) {
    if (Math.pow(Math.max(0, s.theta[i]), n) < 4e-3) return s.xi[i];
  }
  return s.xi[s.xi.length - 1];
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:    css.getPropertyValue('--bg').trim() || '#060608',
    fg:    css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent:css.getPropertyValue('--accent').trim() || '#ffd166',
    grid:  '#23252a',
  };
}

let clock = 0;

function drawStar(c, s) {
  const top = 0, panelH = H * 0.66;
  ctx.fillStyle = '#05060a';
  ctx.fillRect(0, top, W, panelH);

  const cx = W * 0.40, cy = top + panelH * 0.5;
  const xiD = displayXi(s);
  const RMAX = Math.min(W * 0.34, panelH * 0.42);
  const R = Math.max(24, Math.min(RMAX, xiD * (RMAX / XI_SCALE)));

  // Cutaway sector (interior revealed) on the right side.
  const cutA = -0.42, cutB = 0.42;

  // Filled density disc, shaded as a sphere (light from upper-left).
  const STEPS = 150;
  for (let k = STEPS; k >= 1; k -= 1) {
    const fr = k / STEPS;                       // fractional radius
    const xi = fr * xiD;
    const dens = Math.pow(thetaOf(s, xi), n);   // rho/rho_c in [0,1]
    const col = viridis(Math.max(0, Math.min(1, 0.04 + 0.96 * dens)));
    // Sphere shading: depth at this ring edge.
    const zz = Math.sqrt(Math.max(0, 1 - fr * fr));
    const shade = 0.40 + 0.60 * (0.35 + 0.65 * zz);
    ctx.beginPath();
    ctx.fillStyle = `rgb(${Math.round(col.r * shade)},${Math.round(col.g * shade)},${Math.round(col.b * shade)})`;
    // Full annulus minus the cutaway wedge.
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, fr * R, cutB, cutA + 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
  }

  // Cutaway face: a flat radial slab colored by the same density profile,
  // so the interior structure is read directly.
  for (let k = STEPS; k >= 1; k -= 1) {
    const fr = k / STEPS;
    const dens = Math.pow(thetaOf(s, fr * xiD), n);
    const col = viridis(Math.max(0, Math.min(1, 0.04 + 0.96 * dens)));
    ctx.beginPath();
    ctx.fillStyle = `rgb(${col.r},${col.g},${col.b})`;
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, fr * R, cutA, cutB);
    ctx.closePath();
    ctx.fill();
  }

  // Isodensity contour rings.
  ctx.lineWidth = 1;
  for (const lvl of [0.05, 0.2, 0.4, 0.6, 0.8]) {
    // Find xi where theta^n = lvl.
    let xiL = -1;
    for (let i = 1; i < s.xi.length; i += 1) {
      const d0 = Math.pow(Math.max(0, s.theta[i - 1]), n);
      const d1 = Math.pow(Math.max(0, s.theta[i]), n);
      if ((d0 - lvl) * (d1 - lvl) <= 0 && s.xi[i] <= xiD) { xiL = s.xi[i]; break; }
    }
    if (xiL < 0) continue;
    const rr = (xiL / xiD) * R;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.arc(cx, cy, rr, cutB, cutA + 2 * Math.PI); ctx.stroke();
  }

  // Surface outline and cutaway edges.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(cx, cy, R, cutB, cutA + 2 * Math.PI); ctx.stroke();
  for (const a of [cutA, cutB]) {
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); ctx.stroke();
  }

  // Animated radial probe linking the 3D structure to the 1D profile.
  const probeFr = 0.5 + 0.48 * Math.sin(clock * 0.7);
  const pa = clock * 0.5;
  ctx.strokeStyle = c.accent; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.lineTo(cx + probeFr * R * Math.cos(pa), cy + probeFr * R * Math.sin(pa)); ctx.stroke();
  ctx.fillStyle = c.accent;
  ctx.beginPath(); ctx.arc(cx + probeFr * R * Math.cos(pa), cy + probeFr * R * Math.sin(pa), 3, 0, 2 * Math.PI); ctx.fill();

  ctx.fillStyle = c.muted; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(`polytrope star  n = ${n}  rho/rho_c = theta(xi)^n`, 12, 18);
  ctx.fillText('(wedge: interior density; rings: isodensity)', 12, panelH - 12);
  ctx.textAlign = 'right';
  ctx.fillStyle = c.accent;
  ctx.fillText(xiD < s.xi[s.xi.length - 1] - 1e-6 ? 'finite radius' : 'diffuse (formally infinite)', W - 14, 18);

  return { probeFr };
}

function drawProfile(c, s, probe) {
  const top = H * 0.66;
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, top, W, H - top);
  const padL = 52, padR = 16, padT = 12, padB = 26;
  const x0 = padL, x1 = W - padR, y0 = top + padT, y1 = H - padB;
  const xiMax = 10;
  const xFor = (xi) => x0 + (x1 - x0) * Math.min(xi, xiMax) / xiMax;
  const yFor = (t) => y1 - (y1 - y0) * Math.max(0, Math.min(1, t));

  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const xx = x0 + (x1 - x0) * i / 5;
    ctx.beginPath(); ctx.moveTo(xx, y0); ctx.lineTo(xx, y1); ctx.stroke();
  }
  ctx.strokeStyle = c.muted;
  ctx.beginPath(); ctx.moveTo(x0, yFor(0)); ctx.lineTo(x1, yFor(0)); ctx.stroke();

  for (const ni of NS) {
    const si = sol(ni);
    ctx.strokeStyle = COLORS_N[ni];
    ctx.lineWidth = ni === n ? 2.6 : 1.2;
    ctx.globalAlpha = ni === n ? 1 : 0.32;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < si.xi.length; i += 1) {
      const xi = si.xi[i], t = si.theta[i];
      if (xi > xiMax || t < 0) break;
      const xx = xFor(xi), yy = yFor(t);
      if (!started) { ctx.moveTo(xx, yy); started = true; } else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  if (s.xi1 < xiMax) {
    const xm = xFor(s.xi1);
    ctx.strokeStyle = c.accent; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xm, y0); ctx.lineTo(xm, y1); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = c.accent; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillText(`xi_1 = ${s.xi1.toFixed(3)}`, xm + 4, y0 + 12);
  }

  // Probe marker on the theta(xi) curve at the same fractional radius.
  const xiD = displayXi(s);
  const xiP = probe.probeFr * xiD;
  const tP = thetaOf(s, xiP);
  ctx.fillStyle = c.accent;
  ctx.beginPath(); ctx.arc(xFor(xiP), yFor(tP), 4, 0, 2 * Math.PI); ctx.fill();

  ctx.fillStyle = c.muted; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('theta(xi)', 10, y0 + 8);
  ctx.textAlign = 'center';
  ctx.fillText('xi', (x0 + x1) / 2, H - 8);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, W, H);
  const s = sol(n);
  const probe = drawStar(c, s);
  drawProfile(c, s, probe);
}

function updateReadout() {
  const r = sol(n);
  readoutXi1.textContent = r.xi1.toFixed(4);
  const N = r.xi.length;
  if (N >= 2) {
    const dxi = r.xi[N - 1] - r.xi[N - 2];
    const dtheta = r.theta[N - 1] - r.theta[N - 2];
    readoutM.textContent = (r.xi1 * r.xi1 * Math.abs(dtheta / dxi)).toFixed(3);
  }
}

selectN.addEventListener('change', () => {
  n = parseFloat(selectN.value);
  valueN.textContent = String(n);
  updateReadout();
});

let last = 0;
function loop(now) {
  if (!last) last = now;
  clock += Math.min(0.05, (now - last) / 1000);
  last = now;
  render();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    n = NS[Math.min(NS.length - 1, Math.floor(frac * NS.length + 1e-9))];
    selectN.value = String(n);
    clock = 0.6 + 2.0 * frac;            // frame-dependent probe phase
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
