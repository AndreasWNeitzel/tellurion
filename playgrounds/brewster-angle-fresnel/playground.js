// playground.js
// Ray diagram + Fresnel reflectance curves.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import { fresnelR, brewsterAngle, criticalAngle, snellRefract } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderTheta  = document.getElementById('slider-theta');
const sliderRatio  = document.getElementById('slider-ratio');
const sliderSpeed  = document.getElementById('slider-speed');
const valueTheta   = document.getElementById('value-theta');
const valueRatio   = document.getElementById('value-ratio');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  theta_deg: 56.31,
  ratio: 1.5,
  speed: 2,
  sweepDir: 1,
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const n1 = 1.0, n2 = state.ratio;
  const theta_i = (state.theta_deg * Math.PI) / 180;
  const { Rs, Rp, theta_t } = fresnelR(theta_i, n1, n2);
  const tB = brewsterAngle(n1, n2);
  const tC = criticalAngle(n1, n2);

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`theta_i = ${state.theta_deg.toFixed(1)} deg   n1 = 1.0, n2 = ${n2.toFixed(2)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`theta_B = ${(tB * 180 / Math.PI).toFixed(2)} deg   R_s = ${Rs.toFixed(3)}   R_p = ${Rp.toFixed(4)}${tC !== null ? `   theta_c = ${(tC * 180 / Math.PI).toFixed(2)} deg` : ''}`, 30, 40);

  // Layout: left ray diagram, right Fresnel curves
  const padL = 30, padR = 30, gap = 30;
  const panelW = (W - padL - padR - gap) / 2;
  const panelY = 60;
  const panelH = H - panelY - 80;

  // Ray diagram (left)
  const rayX = padL;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(rayX, panelY, panelW, panelH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(rayX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
  // Interface (horizontal line at center)
  const ifaceY = panelY + panelH / 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rayX, ifaceY); ctx.lineTo(rayX + panelW, ifaceY);
  ctx.stroke();
  // Region label
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'right';
  ctx.fillText(`n1 = ${n1.toFixed(2)}`, rayX + panelW - 8, ifaceY - 8);
  ctx.fillText(`n2 = ${n2.toFixed(2)}`, rayX + panelW - 8, ifaceY + 18);
  // Normal (vertical dashed)
  const cx = rayX + panelW / 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, panelY + 10); ctx.lineTo(cx, panelY + panelH - 10);
  ctx.stroke();
  ctx.setLineDash([]);
  // Incident ray (from upper-left to origin)
  const Llen = Math.min(panelW, panelH) * 0.4;
  const incEndX = cx - Llen * Math.sin(theta_i);
  const incEndY = ifaceY - Llen * Math.cos(theta_i);
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(incEndX, incEndY); ctx.lineTo(cx, ifaceY);
  ctx.stroke();
  // arrowhead toward origin
  ctx.fillStyle = tok.accentCool;
  ctx.beginPath();
  ctx.arc(cx, ifaceY, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText('incident', incEndX + 4, incEndY - 4);
  // Reflected ray (upper-right)
  const refLen = Llen * (1 - Math.max(Rs, Rp) * 0.5);   // shorter when low R, just for accent
  const refEndX = cx + Llen * Math.sin(theta_i);
  const refEndY = ifaceY - Llen * Math.cos(theta_i);
  // Two reflected rays: s (cool) and p (warm), thickness proportional to R.
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = Math.max(1.0, 4 * Rs);
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(cx, ifaceY); ctx.lineTo(refEndX, refEndY);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = tok.accentWarm;
  ctx.lineWidth = Math.max(1.0, 4 * Rp);
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(cx, ifaceY); ctx.lineTo(refEndX + 6, refEndY + 4);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillText(`R_s = ${Rs.toFixed(2)}`, refEndX + 12, refEndY - 8);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText(`R_p = ${Rp.toFixed(3)}`, refEndX + 12, refEndY + 12);
  // Transmitted ray
  if (theta_t !== null) {
    const tEndX = cx + Llen * Math.sin(theta_t);
    const tEndY = ifaceY + Llen * Math.cos(theta_t);
    ctx.strokeStyle = '#f1d28a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx, ifaceY); ctx.lineTo(tEndX, tEndY);
    ctx.stroke();
    ctx.fillStyle = '#f1d28a';
    ctx.fillText('transmitted', tEndX + 4, tEndY + 12);
  }
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('ray sketch', rayX + 6, panelY + 14);

  // Fresnel curve panel (right)
  const curveX = padL + panelW + gap;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(curveX, panelY, panelW, panelH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(curveX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
  // Axes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.beginPath();
  ctx.moveTo(curveX, panelY + panelH - 4); ctx.lineTo(curveX + panelW, panelY + panelH - 4);
  ctx.moveTo(curveX + 4, panelY); ctx.lineTo(curveX + 4, panelY + panelH);
  ctx.stroke();
  // Plot Rs and Rp
  function plot(fnKey, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    const NPTS = panelW - 8;
    for (let i = 0; i < NPTS; i += 1) {
      const t = (Math.PI / 2) * i / (NPTS - 1);
      const r = fresnelR(t, n1, n2)[fnKey];
      const px = curveX + 4 + i;
      const py = panelY + panelH - 4 - (panelH - 8) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  plot('Rs', tok.accentCool);
  plot('Rp', tok.accentWarm);
  // Brewster vertical marker
  const bPx = curveX + 4 + (panelW - 8) * (tB / (Math.PI / 2));
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(bPx, panelY + 6); ctx.lineTo(bPx, panelY + panelH - 6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  ctx.fillText(`theta_B = ${(tB * 180 / Math.PI).toFixed(1)}`, bPx, panelY + 16);
  // Current angle marker
  const cPx = curveX + 4 + (panelW - 8) * (theta_i / (Math.PI / 2));
  ctx.strokeStyle = '#f1d28a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cPx, panelY + 6); ctx.lineTo(cPx, panelY + panelH - 6);
  ctx.stroke();
  // Axis labels
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  for (const deg of [0, 30, 60, 90]) {
    const px = curveX + 4 + (panelW - 8) * (deg / 90);
    ctx.fillText(`${deg}`, px, panelY + panelH - 8);
  }
  ctx.fillText('theta_i (deg)', curveX + panelW / 2, panelY + panelH + 14);
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = tok.accentCool;
  ctx.fillText('R_s', curveX + 6, panelY + 14);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('R_p', curveX + 30, panelY + 14);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    state.theta_deg += state.sweepDir * 0.6;
    if (state.theta_deg > 88) { state.theta_deg = 88; state.sweepDir = -1; }
    if (state.theta_deg < 5)  { state.theta_deg = 5;  state.sweepDir = 1; }
  }
  valueTheta.textContent = `${state.theta_deg.toFixed(1)} deg`;
  sliderTheta.value = state.theta_deg.toFixed(1);
}

sliderTheta.addEventListener('input', () => { state.theta_deg = parseFloat(sliderTheta.value); valueTheta.textContent = `${state.theta_deg.toFixed(1)} deg`; drawAll(); });
sliderRatio.addEventListener('input', () => { state.ratio = parseFloat(sliderRatio.value); valueRatio.textContent = state.ratio.toFixed(2); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { state.theta_deg = 56.31; state.sweepDir = 1; sliderTheta.value = '56.3'; valueTheta.textContent = '56.3 deg'; drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.theta_deg = 5 + frac * 83;
    sliderTheta.value = state.theta_deg.toFixed(1);
    valueTheta.textContent = `${state.theta_deg.toFixed(1)} deg`;
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
        });
      });
    }
    return;
  }
  drawAll();
}

function tick() {
  if (state.playing) {
    if (state.speed > 0) tickN(state.speed);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
