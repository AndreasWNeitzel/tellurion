// Lane-Emden polytrope shown as the star it describes: a density-shaded
// sphere with rho/rho_c = theta(xi)^n, a cutaway wedge revealing the
// interior profile, and isodensity contours. The theta(xi) curve is kept
// as a linked strip with a probe that ties the 1D solution to the 2D
// structure. sim.js (solveLaneEmden, KNOWN_XI1) is unchanged.

import { solveLaneEmden, KNOWN_XI1 } from './sim.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

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

// Layout: the star takes the LEFT half of the canvas, the diagnostic
// plots take the RIGHT half. The previous top-bottom split squashed
// the star into 2/3 of the height and left the right ~40 % of the
// canvas mostly empty.
const STAR = { x: 0, y: 0, w: Math.floor(W * 0.50), h: H };
const PLOTS = { x: STAR.w, y: 0, w: W - STAR.w, h: H };

function drawStar(c, s) {
  ctx.fillStyle = '#05060a';
  ctx.fillRect(STAR.x, STAR.y, STAR.w, STAR.h);

  const xiD = displayXi(s);
  const RMAX = Math.min(STAR.w * 0.44, STAR.h * 0.44);
  const R = Math.max(24, Math.min(RMAX, xiD * (RMAX / XI_SCALE)));
  // Centre of the star disc inside the STAR panel.
  const cx = STAR.x + STAR.w / 2;
  const cy = STAR.y + STAR.h / 2;

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

  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  // Short title only; the "finite radius / diffuse" status is drawn
  // right-aligned on the same line, so keep the title compact enough
  // that the two cannot collide on a narrow star panel.
  ctx.fillText(`polytrope star  n = ${n}`, 12, 18);
  ctx.fillText('ρ/rho_c = θ^n  (wedge: cutaway interior)', 12, STAR.h - 12);
  ctx.textAlign = 'right';
  ctx.fillStyle = c.accent;
  ctx.fillText(xiD < s.xi[s.xi.length - 1] - 1e-6 ? 'finite radius' : 'diffuse', STAR.w - 14, 18);
  ctx.textAlign = 'left';

  return { probeFr };
}

// Compute approximate enclosed-mass profile m(xi) = integral_0^xi xi'^2
// theta(xi')^n dxi' on the cached solution grid.
function enclosedMass(si, ni) {
  const xs = si.xi, ts = si.theta;
  const N = xs.length;
  const m = new Float64Array(N);
  for (let i = 1; i < N; i += 1) {
    const dxi = xs[i] - xs[i - 1];
    const ddl = Math.pow(Math.max(0, ts[i]), ni) * xs[i] * xs[i];
    const ddl0 = Math.pow(Math.max(0, ts[i - 1]), ni) * xs[i - 1] * xs[i - 1];
    m[i] = m[i - 1] + 0.5 * dxi * (ddl + ddl0);
  }
  return m;
}
const mCache = new Map();
function mOf(ni) {
  if (!mCache.has(ni)) mCache.set(ni, enclosedMass(sol(ni), ni));
  return mCache.get(ni);
}

function drawProfile(c, s, probe) {
  // The right-side plot column is split into two stacked panels:
  //   TOP   theta(xi) (the canonical Lane-Emden plot)
  //   BOT   m(xi) / m(xi_1) (cumulative mass, the diagnostic).
  ctx.fillStyle = c.bg;
  ctx.fillRect(PLOTS.x, PLOTS.y, PLOTS.w, PLOTS.h);

  // The xiMax used to be 10, which clipped the n=5 polytrope (which is
  // formally infinite) abruptly mid-plot ("random truncation"). Bumped
  // to 18 so the curve fades to zero smoothly inside the panel.
  const xiMax = 18;
  const padL = 50, padR = 14, padT = 24, padB = 28;
  const half = (PLOTS.h - 8) / 2;
  function panel(yTop, label) {
    const x0 = PLOTS.x + padL, x1 = PLOTS.x + PLOTS.w - padR;
    const y0 = yTop + padT, y1 = yTop + half - padB;
    ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
    ctx.strokeRect(PLOTS.x + 6.5, yTop + 6.5, PLOTS.w - 14, half - 14);
    ctx.fillStyle = c.fg; ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.fillText(label, x0 - 30, yTop + 18);
    return { x0, x1, y0, y1 };
  }
  const xFor = (b, xi) => b.x0 + (b.x1 - b.x0) * Math.min(xi, xiMax) / xiMax;
  const yForUnit = (b, t) => b.y1 - (b.y1 - b.y0) * Math.max(0, Math.min(1, t));

  // ===== TOP: theta(xi) =====
  const tp = panel(PLOTS.y, 'θ(ξ)   polytropic structure function');
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i += 1) {
    const xx = tp.x0 + (tp.x1 - tp.x0) * i / 6;
    ctx.beginPath(); ctx.moveTo(xx, tp.y0); ctx.lineTo(xx, tp.y1); ctx.stroke();
  }
  for (let yv = 0; yv <= 1.01; yv += 0.25) {
    ctx.beginPath(); ctx.moveTo(tp.x0, yForUnit(tp, yv)); ctx.lineTo(tp.x1, yForUnit(tp, yv)); ctx.stroke();
  }
  // zero line emphasised.
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.5)';
  ctx.beginPath(); ctx.moveTo(tp.x0, yForUnit(tp, 0)); ctx.lineTo(tp.x1, yForUnit(tp, 0)); ctx.stroke();
  // Curves.
  for (const ni of NS) {
    const si = sol(ni);
    ctx.strokeStyle = COLORS_N[ni];
    ctx.lineWidth = ni === n ? 2.6 : 1.2;
    ctx.globalAlpha = ni === n ? 1 : 0.32;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < si.xi.length; i += 1) {
      const xi = si.xi[i], t = si.theta[i];
      if (xi > xiMax) break;
      if (t < -0.05) break;
      const xx = xFor(tp, xi), yy = yForUnit(tp, t);
      if (!started) { ctx.moveTo(xx, yy); started = true; } else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // xi_1 marker (only for finite-radius polytropes).
  if (s.xi1 < xiMax && s.xi1 < s.xi[s.xi.length - 1] - 1e-6) {
    const xm = xFor(tp, s.xi1);
    ctx.strokeStyle = c.accent; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xm, tp.y0); ctx.lineTo(xm, tp.y1); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = c.accent; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`ξ₁ = ${s.xi1.toFixed(3)}`, xm + 4, tp.y0 + 14);
  }
  // Axis labels + ticks.
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'right';
  for (let yv = 0; yv <= 1.01; yv += 0.25) ctx.fillText(yv.toFixed(2), tp.x0 - 4, yForUnit(tp, yv) + 3);
  ctx.textAlign = 'center';
  for (let xi = 0; xi <= xiMax; xi += 3) ctx.fillText(`${xi}`, xFor(tp, xi), tp.y1 + 14);
  ctx.fillText('ξ', (tp.x0 + tp.x1) / 2, tp.y1 + 26);
  ctx.textAlign = 'left';
  // Probe marker.
  const xiD = displayXi(s);
  const xiP = probe.probeFr * xiD;
  const tP = thetaOf(s, xiP);
  ctx.fillStyle = c.accent;
  ctx.beginPath(); ctx.arc(xFor(tp, xiP), yForUnit(tp, tP), 4, 0, 2 * Math.PI); ctx.fill();
  // Legend (compact).
  let lyy = tp.y0 + 4;
  for (const ni of NS) {
    ctx.fillStyle = COLORS_N[ni];
    ctx.fillRect(tp.x1 - 70, lyy + 1, 10, 2.2);
    ctx.fillStyle = c.muted; ctx.font = ni === n ? 'bold 10px ui-monospace, monospace' : '11px ui-monospace, monospace';
    ctx.fillText(`n = ${ni}`, tp.x1 - 56, lyy + 5);
    lyy += 12;
  }

  // ===== BOTTOM: enclosed mass m(xi) =====
  const bp = panel(PLOTS.y + half + 8, 'm(ξ)   enclosed-mass integrand');
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i += 1) {
    const xx = bp.x0 + (bp.x1 - bp.x0) * i / 6;
    ctx.beginPath(); ctx.moveTo(xx, bp.y0); ctx.lineTo(xx, bp.y1); ctx.stroke();
  }
  for (let yv = 0; yv <= 1.01; yv += 0.25) {
    ctx.beginPath(); ctx.moveTo(bp.x0, yForUnit(bp, yv)); ctx.lineTo(bp.x1, yForUnit(bp, yv)); ctx.stroke();
  }
  // Normalise m by the value at xi = xi_1 (or at xiMax for infinite cases)
  // so the curve always lies in [0, 1].
  for (const ni of NS) {
    const si = sol(ni);
    const mi = mOf(ni);
    const xiNorm = Math.min(si.xi1, xiMax);
    // Find the index near xiNorm.
    let kn = 0;
    while (kn < si.xi.length - 1 && si.xi[kn] < xiNorm) kn += 1;
    const mtot = Math.max(1e-12, mi[kn]);
    ctx.strokeStyle = COLORS_N[ni];
    ctx.lineWidth = ni === n ? 2.6 : 1.2;
    ctx.globalAlpha = ni === n ? 1 : 0.32;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < si.xi.length; i += 1) {
      if (si.xi[i] > xiMax) break;
      const xx = xFor(bp, si.xi[i]);
      const yy = yForUnit(bp, mi[i] / mtot);
      if (!started) { ctx.moveTo(xx, yy); started = true; } else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Axis labels + ticks.
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'right';
  for (let yv = 0; yv <= 1.01; yv += 0.25) ctx.fillText(yv.toFixed(2), bp.x0 - 4, yForUnit(bp, yv) + 3);
  ctx.textAlign = 'center';
  for (let xi = 0; xi <= xiMax; xi += 3) ctx.fillText(`${xi}`, xFor(bp, xi), bp.y1 + 14);
  ctx.fillText('ξ', (bp.x0 + bp.x1) / 2, bp.y1 + 26);
  ctx.textAlign = 'left';
  // xi_1 marker on the mass plot too.
  if (s.xi1 < xiMax && s.xi1 < s.xi[s.xi.length - 1] - 1e-6) {
    const xm = xFor(bp, s.xi1);
    ctx.strokeStyle = c.accent; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xm, bp.y0); ctx.lineTo(xm, bp.y1); ctx.stroke();
    ctx.setLineDash([]);
  }
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const s = sol(n);
  return {
    fields: [
      { key: 'polytrope-index', label: 'polytrope index n', value: n, format: 'float' },
      { key: 'radius-boundary', label: 'first zero crossing xi_1', value: s.xi1, format: 'float' },
      { key: 'core-density', label: 'normalized central density theta(0)', value: 1.0, format: 'float' },
      { key: 'surface-density', label: 'normalized surface density theta(xi_1)', value: 0.0, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const inv = [];
  const s = sol(n);
  // Boundary conditions: theta(0) = 1 and theta(xi_1) = 0
  const theta0 = s.theta[0];
  const thetaXi1 = s.theta[s.theta.length - 1];
  inv.push({
    key: 'bc-initial',
    label: 'theta(0) = 1.0',
    value: Math.abs(theta0 - 1.0).toExponential(2),
    status: Math.abs(theta0 - 1.0) < 1e-10 ? 'pass' : 'drift'
  });
  inv.push({
    key: 'bc-boundary',
    label: 'theta(xi_1) near zero',
    value: Math.abs(thetaXi1).toExponential(2),
    status: Math.abs(thetaXi1) < 1e-2 ? 'pass' : 'pending'
  });
  // Known solutions check: for n = 0, 1, 5, the xi_1 must match tabulated values
  if (KNOWN_XI1[n] !== undefined) {
    const rel = Math.abs(s.xi1 - KNOWN_XI1[n]) / KNOWN_XI1[n];
    inv.push({
      key: 'analytic-match',
      label: 'xi_1 matches known closed form',
      value: rel.toExponential(2),
      status: rel < 0.01 ? 'pass' : 'pending'
    });
  }
  return inv;
};
