// Fabry-Perot made physical: a scanned cavity. An input beam hits two
// partial mirrors; the multiply-reflected beams interfere and the
// circulating field builds up. As the round-trip phase is scanned the
// cavity flashes bright at each resonance and a strong beam is
// transmitted; between resonances it is dark and the light reflects.
// Mirror reflectance R sets how sharp (high-finesse) the resonances are.
// A synced Airy strip keeps the quantitative curve. sim.js is unchanged.

import { transmission, coefficientFinesse, finesse, fwhmPhi } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutFin  = document.getElementById('readout-fin');
const readoutTmin = document.getElementById('readout-tmin');
const sliderR     = document.getElementById('slider-R');
const valueR      = document.getElementById('value-R');

const W = canvas.width, H = canvas.height;
let R = parseFloat(sliderR.value);
sliderR.addEventListener('input', () => { R = parseFloat(sliderR.value); valueR.textContent = R.toFixed(3); });

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

let phiScan = 0;          // scanned round-trip phase
const SCENE_H = H * 0.56;

function drawCavity(c, phi) {
  ctx.fillStyle = '#04050a';
  ctx.fillRect(0, 0, W, SCENE_H);

  const T = transmission(phi, R);                 // Airy transmission, sim.js
  const cy = SCENE_H * 0.52;
  const m1 = W * 0.34, m2 = W * 0.66;             // mirror x positions
  const beamW = SCENE_H * 0.05;

  // Intracavity standing wave: bright at resonance, dark off it. The
  // glow tracks the (normalised) transmitted/circulating intensity T.
  const glowA = Math.max(0, Math.min(1, 0.04 + 0.94 * T));
  const cav = ctx.createLinearGradient(m1, 0, m2, 0);
  cav.addColorStop(0, `rgba(255,210,120,${0.10 + 0.5 * glowA})`);
  cav.addColorStop(0.5, `rgba(255,235,170,${0.16 + 0.7 * glowA})`);
  cav.addColorStop(1, `rgba(255,210,120,${0.10 + 0.5 * glowA})`);
  ctx.fillStyle = cav;
  ctx.fillRect(m1, cy - SCENE_H * 0.30, m2 - m1, SCENE_H * 0.60);
  // Standing-wave fringes inside the cavity (more nodes = abstract phi).
  ctx.strokeStyle = `rgba(255,245,200,${0.10 + 0.55 * glowA})`;
  ctx.lineWidth = 1.5;
  const nNodes = 9;
  for (let k = 0; k <= nNodes; k += 1) {
    const x = m1 + (m2 - m1) * k / nNodes;
    const amp = SCENE_H * 0.26 * Math.abs(Math.sin(Math.PI * k / nNodes)) * (0.4 + 0.6 * T);
    ctx.beginPath(); ctx.moveTo(x, cy - amp); ctx.lineTo(x, cy + amp); ctx.stroke();
  }

  // Input beam from the left.
  ctx.fillStyle = 'rgba(120,180,255,0.55)';
  ctx.fillRect(0, cy - beamW / 2, m1, beamW);
  ctx.fillStyle = '#7cb4ff'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('input', 10, cy - beamW);

  // Mirrors (partial reflectors).
  ctx.fillStyle = '#b8c4d8';
  ctx.fillRect(m1 - 4, cy - SCENE_H * 0.32, 5, SCENE_H * 0.64);
  ctx.fillRect(m2 - 1, cy - SCENE_H * 0.32, 5, SCENE_H * 0.64);
  ctx.fillStyle = c.muted; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`R = ${R.toFixed(3)}`, m1 - 4, cy - SCENE_H * 0.34);

  // A few bouncing rays with geometric decay r^(2k) to convey the
  // multiple-beam superposition.
  let bx = m1, dir = 1, amp = 1;
  ctx.lineWidth = 2;
  for (let b = 0; b < 14 && amp > 0.02; b += 1) {
    const nx = dir > 0 ? m2 : m1;
    const yOff = (b % 2 ? 1 : -1) * SCENE_H * 0.10 * (0.4 + 0.6 * T);
    ctx.strokeStyle = `rgba(255,225,150,${Math.min(0.9, amp)})`;
    ctx.beginPath(); ctx.moveTo(bx, cy + yOff * (dir > 0 ? 1 : -1)); ctx.lineTo(nx, cy - yOff * (dir > 0 ? 1 : -1)); ctx.stroke();
    bx = nx; dir = -dir; amp *= R;
  }

  // Reflected beam (back to the left) carries 1 - T.
  ctx.fillStyle = `rgba(120,180,255,${0.15 + 0.5 * (1 - T)})`;
  ctx.fillRect(0, cy + beamW * 0.9, m1, beamW * (0.4 + 0.9 * (1 - T)));
  ctx.fillStyle = '#7cb4ff'; ctx.fillText('reflected', 10, cy + beamW * 2.4);

  // Transmitted beam: width and brightness scale with T(phi).
  const tw = beamW * (0.2 + 1.6 * T);
  ctx.fillStyle = `rgba(255,225,150,${0.2 + 0.8 * T})`;
  ctx.fillRect(m2 + 4, cy - tw / 2, W - m2 - 4, tw);
  ctx.fillStyle = '#ffd166'; ctx.textAlign = 'right';
  ctx.fillText('transmitted', W - 10, cy - tw);

  ctx.textAlign = 'left'; ctx.fillStyle = c.muted; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('scanned Fabry-Perot cavity (bright = on resonance)', 12, 18);
  ctx.fillStyle = c.accent; ctx.textAlign = 'right';
  ctx.fillText(T > 0.85 ? 'ON RESONANCE' : (T < 0.1 ? 'off resonance' : 'near resonance'), W - 12, 18);
}

function drawCurve(c, phi) {
  const top = SCENE_H;
  ctx.fillStyle = c.bg; ctx.fillRect(0, top, W, H - top);
  const padL = 56, padR = 14, padT = 16, padB = 28;
  const x0 = padL, x1 = W - padR, y0 = top + padT, y1 = H - padB;
  const phiMin = -Math.PI, phiMax = 5 * Math.PI;
  const xFor = (p) => x0 + (x1 - x0) * (p - phiMin) / (phiMax - phiMin);
  const yFor = (T) => y1 - (y1 - y0) * T;

  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = y0 + (y1 - y0) * i / 4;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    ctx.fillStyle = c.muted; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'right';
    ctx.fillText((1 - i / 4).toFixed(1), x0 - 6, y + 3);
  }
  for (let m = 0; m <= 2; m += 1) {
    const x = xFor(2 * Math.PI * m);
    ctx.strokeStyle = c.muted; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); ctx.setLineDash([]);
  }

  ctx.strokeStyle = c.accent; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 500; i += 1) {
    const p = phiMin + (phiMax - phiMin) * i / 500;
    const xx = xFor(p), yy = yFor(transmission(p, R));
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  // Scan marker tying the cavity to the curve.
  const pm = ((phi - phiMin) % (phiMax - phiMin) + (phiMax - phiMin)) % (phiMax - phiMin) + phiMin;
  const Tm = transmission(pm, R);
  ctx.strokeStyle = '#7cb4ff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(xFor(pm), y0); ctx.lineTo(xFor(pm), y1); ctx.stroke();
  ctx.fillStyle = '#7cb4ff';
  ctx.beginPath(); ctx.arc(xFor(pm), yFor(Tm), 4, 0, 2 * Math.PI); ctx.fill();

  ctx.fillStyle = c.muted; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('Airy transmission T(phi)', 10, y0 + 6);
  ctx.textAlign = 'center';
  ctx.fillText(`finesse F* = ${finesse(R).toFixed(1)}  (FWHM = ${fwhmPhi(R).toFixed(3)} rad)`, (x0 + x1) / 2, H - 8);
}

function render(phi) {
  const c = colors();
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
  drawCavity(c, phi);
  drawCurve(c, phi);
}

function updateReadout() {
  readoutFin.textContent = finesse(R).toFixed(2);
  readoutTmin.textContent = (1 / (1 + coefficientFinesse(R))).toExponential(2);
}

let last = 0;
function loop(now) {
  if (!last) last = now;
  phiScan += Math.min(0.05, (now - last) / 1000) * 1.6;
  last = now;
  render(phiScan);
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    R = 0.5 + frac * 0.499;
    sliderR.value = String(R);
    valueR.textContent = R.toFixed(3);
    // Frame 0..1 also walks the scan so on/off-resonance states are shown.
    phiScan = 2 * Math.PI + (frac - 0.5) * fwhmPhi(R) * 2.4;
  }
  valueR.textContent = R.toFixed(3);
  render(phiScan);
  updateReadout();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const detail = { capture: CAPTURE_NAME ?? null, R };
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
      window.__simulationReady = true;
      window.__simulationReadyDetail = detail;
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop);
}
