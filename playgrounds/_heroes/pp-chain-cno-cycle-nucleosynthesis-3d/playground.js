// pp-chain vs CNO-cycle playground. Side-by-side reaction-network
// diagrams + a temperature-swept pp/CNO contribution chart at the
// bottom. The pp left network and the CNO right network animate at
// rates proportional to their respective epsilon at the current T.

import { epsilonPP, epsilonCNO, ppFraction, cnoFraction, A_PP, A_CNO, T7_CROSSOVER, PRESETS, Q_HELIUM } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rT = document.getElementById('readout-T');
const rPP = document.getElementById('readout-pp');
const rCNO = document.getElementById('readout-cno');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const selPre = document.getElementById('select-preset'), vPre = document.getElementById('value-preset');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  T7: 1.55, speed: 2,
  running: !prefersReducedMotion(),
  phasePP: 0, phaseCNO: 0,
};

function drawNucleus(x, y, r, label, color) {
  // Render as a small filled disk with text inside.
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, '#0a0a0e');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
  ctx.textBaseline = 'alphabetic';
}

function drawArrow(x0, y0, x1, y1, color, glow) {
  ctx.strokeStyle = color;
  ctx.lineWidth = glow ? 2.4 : 1.2;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  // Arrowhead
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len > 0) {
    const ux = dx / len, uy = dy / len;
    const nx = -uy, ny = ux;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - ux * 8 + nx * 4, y1 - uy * 8 + ny * 4);
    ctx.lineTo(x1 - ux * 8 - nx * 4, y1 - uy * 8 - ny * 4);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function drawPPChain(x0, y0) {
  const glowPP = st.phasePP < 1.5;
  ctx.fillStyle = 'rgba(255, 230, 140, 0.9)';
  ctx.font = fontString(canvas, 'body', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('pp chain (Sun-like)', x0, y0 - 12);

  // Top row: two protons
  drawNucleus(x0 + 30, y0 + 30, 18, '¹H', '#ffd166');
  drawNucleus(x0 + 100, y0 + 30, 18, '¹H', '#ffd166');
  drawArrow(x0 + 50, y0 + 50, x0 + 130, y0 + 90, glowPP ? '#ffd166' : 'rgba(255,255,255,0.35)', glowPP);
  drawArrow(x0 + 100, y0 + 50, x0 + 130, y0 + 90, glowPP ? '#ffd166' : 'rgba(255,255,255,0.35)', glowPP);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('e⁺ + ν_e', x0 + 145, y0 + 75);

  // Second row: deuteron + proton -> 3He
  drawNucleus(x0 + 130, y0 + 110, 18, '²D', '#7dd3fc');
  drawNucleus(x0 + 200, y0 + 110, 18, '¹H', '#ffd166');
  drawArrow(x0 + 165, y0 + 130, x0 + 200, y0 + 170, glowPP ? '#7dd3fc' : 'rgba(255,255,255,0.35)', glowPP);
  drawArrow(x0 + 200, y0 + 130, x0 + 200, y0 + 170, glowPP ? '#7dd3fc' : 'rgba(255,255,255,0.35)', glowPP);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('γ', x0 + 210, y0 + 150);

  // Third row: 3He + 3He -> 4He + 2p
  drawNucleus(x0 + 200, y0 + 190, 22, '³He', '#80e0a0');
  drawNucleus(x0 + 60, y0 + 190, 22, '³He', '#80e0a0');
  drawArrow(x0 + 80, y0 + 210, x0 + 130, y0 + 250, glowPP ? '#80e0a0' : 'rgba(255,255,255,0.35)', glowPP);
  drawArrow(x0 + 200, y0 + 210, x0 + 130, y0 + 250, glowPP ? '#80e0a0' : 'rgba(255,255,255,0.35)', glowPP);

  // Output: 4He
  drawNucleus(x0 + 130, y0 + 275, 26, '⁴He', '#ff8080');
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('+ 2¹H + 26.73 MeV', x0 + 165, y0 + 280);
}

function drawCNOCycle(x0, y0) {
  const glowCNO = st.phaseCNO < 1.5;
  ctx.fillStyle = 'rgba(125, 211, 252, 0.9)';
  ctx.font = fontString(canvas, 'body', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('CNO cycle (hot stars)', x0, y0 - 12);

  // Hexagonal arrangement of the catalytic nuclei.
  const cx = x0 + 130, cy = y0 + 145;
  const R = 90;
  const nuclei = [
    { label: '¹²C',  color: '#a09b8e', angle:  -Math.PI / 2 },
    { label: '¹³N',  color: '#80c0a0', angle:  -Math.PI / 6 },
    { label: '¹³C',  color: '#a09b8e', angle:   Math.PI / 6 },
    { label: '¹⁴N',  color: '#80c0a0', angle:   Math.PI / 2 },
    { label: '¹⁵O',  color: '#ff9090', angle:   5 * Math.PI / 6 },
    { label: '¹⁵N',  color: '#80c0a0', angle:  -5 * Math.PI / 6 },
  ];
  // Edges (arrows around the hexagon)
  for (let i = 0; i < 6; i += 1) {
    const a0 = nuclei[i].angle, a1 = nuclei[(i + 1) % 6].angle;
    const x_from = cx + R * Math.cos(a0), y_from = cy + R * Math.sin(a0);
    const x_to = cx + R * Math.cos(a1), y_to = cy + R * Math.sin(a1);
    // Inset toward the centre to avoid covering the nucleus discs.
    const ux = x_to - x_from, uy = y_to - y_from;
    const L = Math.sqrt(ux * ux + uy * uy);
    const xf = x_from + 0.18 * ux, yf = y_from + 0.18 * uy;
    const xt = x_from + 0.82 * ux, yt = y_from + 0.82 * uy;
    drawArrow(xf, yf, xt, yt, glowCNO ? '#7dd3fc' : 'rgba(255,255,255,0.35)', glowCNO);
  }
  // Draw nuclei on top
  for (const n of nuclei) {
    const nx = cx + R * Math.cos(n.angle);
    const ny = cy + R * Math.sin(n.angle);
    drawNucleus(nx, ny, 20, n.label, n.color);
  }
  // Centre note: "4p in, 4He out + 26.73 MeV"
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.fillText('4¹H → ⁴He', cx, cy - 4);
  ctx.fillText('+ 26.73 MeV', cx, cy + 12);
}

function drawContributionBar(x0, y0, w, h) {
  const fpp = ppFraction(st.T7);
  const fcno = 1 - fpp;
  const wPP = w * fpp;
  // Stacked bar
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x0, y0, wPP, h);
  ctx.fillStyle = '#7dd3fc';
  ctx.fillRect(x0 + wPP, y0, w - wPP, h);
  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  // Labels
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText(`pp ${(fpp * 100).toFixed(1)}%`, x0 + 6, y0 + 14);
  ctx.textAlign = 'right';
  ctx.fillText(`CNO ${(fcno * 100).toFixed(1)}%`, x0 + w - 6, y0 + 14);
}

function drawEpsilonCurve(x0, y0, w, h) {
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.20)';
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);

  const pad = { l: 40, r: 12, t: 12, b: 22 };
  const ax = x0 + pad.l, ay = y0 + pad.t;
  const aw = w - pad.l - pad.r, ah = h - pad.t - pad.b;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + ah); ctx.lineTo(ax + aw, ay + ah);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('log ε(T)', x0 + 6, ay - 2);
  ctx.textAlign = 'center';
  ctx.fillText('T / 10⁷ K', ax + aw / 2, y0 + h - 8);

  // Plot log10(epsilon_pp) and log10(epsilon_cno) over T7 in [0.8, 4].
  const T_MIN = 0.8, T_MAX = 4.0;
  const xToPx = (t) => ax + (t - T_MIN) / (T_MAX - T_MIN) * aw;
  let logMin = Infinity, logMax = -Infinity;
  for (let i = 0; i <= 100; i += 1) {
    const t = T_MIN + (i / 100) * (T_MAX - T_MIN);
    const lp = Math.log10(Math.max(1e-30, A_PP * epsilonPP(t)));
    const lc = Math.log10(Math.max(1e-30, A_CNO * epsilonCNO(t)));
    if (lp < logMin) logMin = lp; if (lp > logMax) logMax = lp;
    if (lc < logMin) logMin = lc; if (lc > logMax) logMax = lc;
  }
  const yToPx = (lv) => ay + (1 - (lv - logMin) / (logMax - logMin)) * ah;

  // pp curve
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i <= 100; i += 1) {
    const t = T_MIN + (i / 100) * (T_MAX - T_MIN);
    const lp = Math.log10(Math.max(1e-30, A_PP * epsilonPP(t)));
    const px = xToPx(t), py = yToPx(lp);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // CNO curve
  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i <= 100; i += 1) {
    const t = T_MIN + (i / 100) * (T_MAX - T_MIN);
    const lc = Math.log10(Math.max(1e-30, A_CNO * epsilonCNO(t)));
    const px = xToPx(t), py = yToPx(lc);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Crossover vertical line
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.5)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(xToPx(T7_CROSSOVER), ay); ctx.lineTo(xToPx(T7_CROSSOVER), ay + ah); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 220, 120, 0.85)';
  ctx.textAlign = 'center';
  ctx.fillText(`crossover ${T7_CROSSOVER.toFixed(2)}`, xToPx(T7_CROSSOVER), ay - 2);

  // Current T marker
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath(); ctx.moveTo(xToPx(st.T7), ay); ctx.lineTo(xToPx(st.T7), ay + ah); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillText(`T = ${st.T7.toFixed(2)}`, xToPx(st.T7), ay + ah + 14);
  // x ticks
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (const t of [1, 2, 3, 4]) {
    ctx.fillText(String(t), xToPx(t), ay + ah - 4);
  }
}

function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  drawPPChain(40, 70);
  drawCNOCycle(490, 70);

  // Bottom area
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText(`core T = ${st.T7.toFixed(2)} × 10⁷ K    Q = ${Q_HELIUM} MeV per 4 ¹H → ⁴He`, 40, 22);

  // Bar
  drawContributionBar(40, 410, 380, 24);
  // Curve panel
  drawEpsilonCurve(460, 400, 410, 160);

  // Bottom note
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.fillText('Sun-like cores: pp dominant; above ~ 1.8 × 10⁷ K, CNO takes over (∝ T¹⁷ vs T⁴)', W / 2, H - 14);

  rT.textContent = `${st.T7.toFixed(2)} × 10⁷ K`;
  rPP.textContent = `${(ppFraction(st.T7) * 100).toFixed(1)}%`;
  rCNO.textContent = `${(cnoFraction(st.T7) * 100).toFixed(1)}%`;
}

function tick() {
  if (st.running) {
    // Each loop's phase advances at a rate proportional to its
    // current epsilon contribution (visual cue).
    const fpp = ppFraction(st.T7);
    st.phasePP += 0.06 * fpp * Math.max(1, st.speed);
    st.phaseCNO += 0.06 * (1 - fpp) * Math.max(1, st.speed);
    if (st.phasePP > 3) st.phasePP = 0;
    if (st.phaseCNO > 3) st.phaseCNO = 0;
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vT.textContent = st.T7.toFixed(2);
  vSpeed.textContent = String(st.speed);
  // Match preset label to T
  const map = { 0.8: 'M dwarf', 1.55: 'Sun', 1.9: 'F star', 2.5: 'A star', 3.5: 'O star' };
  vPre.textContent = map[parseFloat(selPre.value)] ?? 'custom';
}

sT.addEventListener('input', () => { st.T7 = parseFloat(sT.value); syncLabels(); });
selPre.addEventListener('change', () => { st.T7 = parseFloat(selPre.value); sT.value = String(st.T7); syncLabels(); });
sSpeed.addEventListener('input', () => { st.speed = parseInt(sSpeed.value, 10); syncLabels(); });
btnReset.addEventListener('click', () => {
  st.T7 = 1.55; st.speed = 2; st.phasePP = 0; st.phaseCNO = 0;
  sT.value = '1.55'; selPre.value = '1.55'; sSpeed.value = '2';
  syncLabels();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { T7: st.T7 }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.T7) { st.T7 = parseFloat(s.T7); sT.value = String(st.T7); }
}

function bootSync() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  syncLabels();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.T7 = 0.8 + f * 2.7;     // sweep M-dwarf to O-star
    sT.value = String(st.T7);
    syncLabels();
  }
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
