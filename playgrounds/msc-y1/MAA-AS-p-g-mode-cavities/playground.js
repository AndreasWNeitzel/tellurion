// p- and g-mode cavities made physical: a pulsating stellar cross-section.
// The mode displacement is large only where it can propagate (the g-mode
// cavity in the radiative core, the p-mode cavity in the acoustic
// envelope) and evanescent in between. A mixed mode shows slow large
// core oscillations coupled to fast envelope ripples. The propagation
// diagram is kept as a linked panel. sim.js (N, S_l, cavities) unchanged.

import { N, S_l, cavities } from './sim.js';
import { rdbu } from '../../../shared/js/render/colormaps.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

// User feedback: 'the white flashing while useful to signify
// oscillation, is irritating to the eyes. Consider a different
// colormap.' We keep the RdBu compression-vs-rarefaction
// interpretation (red = positive, blue = negative) but BLEND the
// nominal RdBu colour toward a dark, non-bright neutral so the
// midpoint (where the oscillation crosses zero) is no longer a
// flash of white. The 0..1 fraction f selects (r, g, b) as
// rdbu(f) tinted with the dark surface colour.
function rdbuDark(f) {
  const c = rdbu(f);
  // weight = how strongly to keep the RdBu colour vs the dark base.
  // weight = 1 at the extremes (f = 0 or 1), 0 at the centre (f = 0.5).
  const w = Math.abs(f - 0.5) * 2;
  const base = { r: 32, g: 36, b: 50 };
  return {
    r: Math.round(c.r * w + base.r * (1 - w)),
    g: Math.round(c.g * w + base.g * (1 - w)),
    b: Math.round(c.b * w + base.b * (1 - w)),
  };
}

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? 'NaN');

const canvas = document.getElementById('stage');
const ctx    = canvas.getContext('2d', { alpha: false });
const rC     = document.getElementById('readout-c');
const sW     = document.getElementById('slider-w'), vW = document.getElementById('value-w');
const sL     = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const btnR   = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const W = canvas.width, H = canvas.height;
let st = { omega: 2, l: 1 };
let running = !prefersReducedMotion();
let clock = 0;

sW.addEventListener('input', () => { st.omega = parseFloat(sW.value); vW.textContent = st.omega.toFixed(2); });
sL.addEventListener('input', () => { st.l = parseInt(sL.value, 10); vL.textContent = String(st.l); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

// Radial WKB-style eigenfunction: large amplitude in an active cavity,
// exponentially evanescent in the forbidden zone, with a local radial
// wavenumber that is high in the acoustic (p) region and node-rich toward
// the centre in the buoyancy (g) region. Schematic, but it reproduces the
// trapping that the cavities() classification (sim.js) reports.
const NR = 320;
const xi = new Float64Array(NR + 1);
function buildEigen(omega, l) {
  let phase = 0;
  let A = 0.0;
  const dr = 1 / NR;
  for (let i = 0; i <= NR; i += 1) {
    const r = i / NR;
    const Nv = N(r), Sv = S_l(r, l);
    const pAct = omega > Math.max(Nv, Sv);
    const gAct = omega < Math.min(Nv, Sv);
    let kr;
    if (pAct) {
      kr = 26 * Math.sqrt(Math.max(1e-3, omega * omega - Sv * Sv)) / (omega + 0.5);
      A = Math.min(1, A + 0.18);                       // couple into the cavity
    } else if (gAct) {
      kr = 30 * Math.sqrt(Math.max(1e-3, Nv * Nv - omega * omega)) / (r + 0.06);
      A = Math.min(1, A + 0.18);
    } else {
      // Evanescent: decay the amplitude, freeze the phase.
      const def = Math.sqrt(Math.abs((omega * omega - Sv * Sv) * (Nv * Nv - omega * omega)) + 1e-6);
      kr = 0;
      A *= Math.exp(-Math.min(6, 0.8 + 0.5 * def) * dr * 14);
    }
    phase += kr * dr;
    xi[i] = A * Math.sin(phase);
  }
  // Normalise so the largest excursion is unit.
  let m = 1e-6;
  for (let i = 0; i <= NR; i += 1) m = Math.max(m, Math.abs(xi[i]));
  for (let i = 0; i <= NR; i += 1) xi[i] /= m;
}

function xiAt(rFrac) {
  const x = Math.max(0, Math.min(1, rFrac)) * NR;
  const i = Math.floor(x), f = x - i;
  const j = Math.min(NR, i + 1);
  return xi[i] * (1 - f) + xi[j] * f;
}
function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:   css.getPropertyValue('--bg').trim() || '#060608',
    muted:css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
  };
}

const STAR_H = H * 0.54;
let starImg = null;

function drawStar(c, omega, l, tphase) {
  ctx.fillStyle = '#04050a';
  ctx.fillRect(0, 0, W, STAR_H);
  const cx = W * 0.5, cy = STAR_H * 0.52;
  const Rpx = Math.min(W * 0.30, STAR_H * 0.46);
  const SZ = 200;
  if (!starImg) starImg = ctx.createImageData(SZ, SZ);
  const d = starImg.data;
  const ct = Math.cos(tphase);
  for (let py = 0; py < SZ; py += 1) {
    const ny = (py / (SZ - 1)) * 2 - 1;
    for (let px = 0; px < SZ; px += 1) {
      const nx = (px / (SZ - 1)) * 2 - 1;
      const rr = Math.hypot(nx, ny);
      const o = (py * SZ + px) * 4;
      if (rr > 1) { d[o] = 8; d[o + 1] = 9; d[o + 2] = 14; d[o + 3] = 255; continue; }
      const th = Math.atan2(ny, nx);
      const val = xiAt(rr) * Math.cos(l * th) * ct;     // pulsation field
      const col = rdbuDark(0.5 + 0.5 * Math.max(-1, Math.min(1, val)));
      // Dim toward the limb for a spherical look.
      const limb = 0.55 + 0.45 * Math.sqrt(Math.max(0, 1 - rr * rr));
      d[o] = col.r * limb; d[o + 1] = col.g * limb; d[o + 2] = col.b * limb; d[o + 3] = 255;
    }
  }
  const off = new OffscreenCanvas(SZ, SZ);
  off.getContext('2d').putImageData(starImg, 0, 0);
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, Rpx, 0, 2 * Math.PI); ctx.clip();
  ctx.drawImage(off, cx - Rpx, cy - Rpx, 2 * Rpx, 2 * Rpx);
  ctx.restore();

  // Turning-point circles (where omega crosses N or S_l).
  const turns = [];
  for (let i = 1; i <= NR; i += 1) {
    const r0 = (i - 1) / NR, r1 = i / NR;
    for (const fn of [N, (r) => S_l(r, l)]) {
      if ((fn(r0) - omega) * (fn(r1) - omega) < 0) turns.push(r1);
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.30)'; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
  for (const tr of turns) { ctx.beginPath(); ctx.arc(cx, cy, tr * Rpx, 0, 2 * Math.PI); ctx.stroke(); }
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(cx, cy, Rpx, 0, 2 * Math.PI); ctx.stroke();

  ctx.fillStyle = c.muted; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(`pulsating star: where the mode lives (l=${l}, omega=${omega.toFixed(2)})`, 12, 18);
  // Mode-energy split between the g- and p-cavities (sim.js classifies
  // the segments; we integrate xi^2 over each).
  const cav = cavities(omega, l);
  const inSeg = (r, segs) => segs.some(([a, b]) => r >= a && r <= b);
  let eg = 0, ep = 0, et = 1e-9;
  for (let i = 0; i <= NR; i += 1) {
    const r = i / NR, e = xi[i] * xi[i];
    et += e;
    if (inSeg(r, cav.gCavities)) eg += e;
    if (inSeg(r, cav.pCavities)) ep += e;
  }
  ctx.fillStyle = '#ef476f'; ctx.fillText(`g-cavity energy ${(100 * eg / et).toFixed(0)}%`, 12, STAR_H - 28);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText(`p-cavity energy ${(100 * ep / et).toFixed(0)}%`, 12, STAR_H - 12);
}

function drawDiagram(c, omega, l) {
  const top = STAR_H;
  ctx.fillStyle = c.bg; ctx.fillRect(0, top, W, H - top);
  const pad = { l: 56, r: 26, t: 14, b: 26 };
  const x0 = pad.l, x1 = W - pad.r, y0 = top + pad.t, y1 = H - pad.b;
  const xToPx = (r) => x0 + r * (x1 - x0);
  const yToPx = (w) => y1 - Math.min(12, w) / 12 * (y1 - y0);

  const cav = cavities(omega, l);
  for (const [r0, r1] of cav.gCavities) {
    ctx.fillStyle = 'rgba(239,71,111,0.16)';
    ctx.fillRect(xToPx(r0), y0, xToPx(r1) - xToPx(r0), y1 - y0);
  }
  for (const [r0, r1] of cav.pCavities) {
    ctx.fillStyle = 'rgba(91,192,235,0.16)';
    ctx.fillRect(xToPx(r0), y0, xToPx(r1) - xToPx(r0), y1 - y0);
  }
  ctx.strokeStyle = c.muted; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();

  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) { const r = i / 200; const px = xToPx(r), py = yToPx(N(r)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) { const r = 0.02 + 0.98 * i / 200; const px = xToPx(r), py = yToPx(S_l(r, l)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke();
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(x0, yToPx(omega)); ctx.lineTo(x1, yToPx(omega)); ctx.stroke(); ctx.setLineDash([]);

  ctx.fillStyle = '#ffd166'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('N (buoyancy)', x0 + 8, y0 + 12);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText(`S_l (Lamb, l=${l})`, x0 + 8, y0 + 26);
  ctx.fillStyle = '#06d6a0'; ctx.fillText(`omega = ${omega.toFixed(2)}`, x0 + 8, y0 + 40);
  const tag = cav.pCavities.length && cav.gCavities.length ? 'p + g (mixed)'
            : cav.pCavities.length ? 'p' : cav.gCavities.length ? 'g' : 'evanescent';
  ctx.fillStyle = c.muted; ctx.textAlign = 'center';
  ctx.fillText(`propagation diagram   cavities active: ${tag}   (r/R*)`, (x0 + x1) / 2, H - 8);
  rC.textContent = tag;
}

function render(tphase) {
  const c = colors();
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
  buildEigen(st.omega, st.l);
  drawStar(c, st.omega, st.l, tphase);
  drawDiagram(c, st.omega, st.l);
}

let last = 0;
function tick(now) {
  if (!last) last = now;
  if (running) clock += Math.min(0.05, (now - last) / 1000);
  last = now;
  render(clock * st.omega * 0.6);
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const presets = [1.0, 2.2, 3.6, 5.5, 8.5];   // g-dominated -> mixed -> p
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.omega = presets[Math.min(presets.length - 1, Math.round(frac * (presets.length - 1)))];
    sW.value = String(st.omega); vW.textContent = st.omega.toFixed(2);
    render(0.9);
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
      }));
    }
    return;
  }
  vW.textContent = st.omega.toFixed(2); vL.textContent = String(st.l);
  render(0);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
