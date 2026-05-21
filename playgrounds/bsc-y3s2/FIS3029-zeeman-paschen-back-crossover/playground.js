import { zeeman2pLevels, BOHR_MAGNETON_eV_T, FS_2P_eV } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rB = document.getElementById('readout-b');
const sB = document.getElementById('slider-B'), vB = document.getElementById('value-B');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { B: 2 }; let running = true;
const Bmax = 20;
sB.addEventListener('input', () => { st.B = parseFloat(sB.value); vB.textContent = st.B.toFixed(2); });
btnR.addEventListener('click', () => { st.B = 2; sB.value = 2; vB.textContent = '2.00'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

// Critical field where the Zeeman term equals the fine-structure
// splitting: g mu_B B ~ FS. Below it the multiplet splits linearly in
// m_J (Zeeman); above it L and S decouple (Paschen-Back).
const Bc = FS_2P_eV / BOHR_MAGNETON_eV_T;
// Energy axis in micro-eV, fixed so the curves never rescale. Range
// chosen to contain the full m_J=+-3/2 Zeeman fan out to B = 20 T
// (|dE| ~ 2 mu_B B ~ 2316 ueV at 20 T).
const eMin = -2600, eMax = 2600;
const colorOf = (mJ) => (mJ > 0
  ? (mJ > 1 ? '#ffd166' : '#f4a259')
  : (mJ < -1 ? '#5bc0eb' : '#7c9cff'));

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  const split = Math.round(W * 0.60);

  // Left panel: exact E(B) crossover with a live B cursor.
  const padL = { l: 58, r: 18, t: 40, b: 66 };
  const x0 = padL.l, x1 = split - padL.r, y0 = padL.t, y1 = H - padL.b;
  const xToPx = (b) => x0 + b / Bmax * (x1 - x0);
  const yToPx = (e) => y1 - (e - eMin) / (eMax - eMin) * (y1 - y0);
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
  // Vertical y-axis title, clear of the tick numbers.
  ctx.save(); ctx.translate(14, (y0 + y1) / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('ΔE (μeV)', 0, 0); ctx.restore();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('B (T)', x1 - 34, y1 + 16);
  for (let g = 0; g <= 4; g += 1) {
    const e = eMin + (eMax - eMin) * g / 4;
    ctx.strokeStyle = '#1b1b1f'; ctx.beginPath(); ctx.moveTo(x0, yToPx(e)); ctx.lineTo(x1, yToPx(e)); ctx.stroke();
    ctx.fillStyle = '#6b7077'; ctx.fillText(e.toFixed(0), 24, yToPx(e) + 3);
  }
  // Six eigen-curves, sampled exactly from the diagonalization. Clipped
  // to the plot rectangle so the high-B fan never bleeds past the axes.
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
  const NB = 160;
  for (let k = 0; k < 6; k += 1) {
    ctx.beginPath();
    for (let i = 0; i <= NB; i += 1) {
      const b = i / NB * Bmax;
      const lvk = zeeman2pLevels(b)[k];
      const px = xToPx(b), py = yToPx(lvk.E * 1e6);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    const mid = zeeman2pLevels(Bmax * 0.5)[k];
    ctx.strokeStyle = colorOf(mid.mJ); ctx.lineWidth = 1.6; ctx.stroke();
  }
  // Critical-field divider + live cursor, also inside the clip.
  ctx.strokeStyle = '#ef476f'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xToPx(Bc), y0); ctx.lineTo(xToPx(Bc), y1); ctx.stroke(); ctx.setLineDash([]);
  const cx = xToPx(st.B);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(cx, y0); ctx.lineTo(cx, y1); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#ef476f'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(`B_c ≈ ${Bc.toFixed(2)} T`, Math.min(xToPx(Bc) + 4, x1 - 90), y0 - 8);
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
  ctx.fillText(`B = ${st.B.toFixed(2)} T`, Math.min(Math.max(cx, x0 + 36), x1 - 36), y1 + 32);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(st.B < Bc ? 'Zeeman regime (split ∝ g_J m_J)' : 'Paschen-Back regime (split ∝ m_L+2m_S)', x0, y1 + 50);

  // Right panel: the six sublevels at the current B as energy sticks
  // plus the emission comb relative to a 2s reference. Both morph
  // continuously while the slider moves.
  const rx0 = split + 20, rx1 = W - 24;
  const lv = zeeman2pLevels(st.B);
  const eVals = lv.map(o => o.E * 1e6);
  const hi = Math.max(...eVals, 50), lo = Math.min(...eVals, -50);
  const padE = (hi - lo) * 0.14 || 50;
  // Sublevel sticks occupy the upper region; the comb sits below with a
  // clear gap so the two never touch.
  const bandTop = y0 + 22, bandBot = y1 - 90;
  const ry = (e) => bandTop + ((hi + padE) - e) / ((hi - lo) + 2 * padE) * (bandBot - bandTop);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('2p sublevels at this B', rx0, y0 - 8);
  for (let i = 0; i < lv.length; i += 1) {
    const yE = ry(eVals[i]);
    ctx.strokeStyle = colorOf(lv[i].mJ); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(rx0 + 6, yE); ctx.lineTo(rx1 - 96, yE); ctx.stroke();
    ctx.fillStyle = colorOf(lv[i].mJ); ctx.font = '11px ui-monospace, monospace';
    const sign = lv[i].mJ > 0 ? '+' : '';
    ctx.fillText(`m_J=${sign}${lv[i].mJ}  ${eVals[i] >= 0 ? '+' : ''}${eVals[i].toFixed(0)}`, rx1 - 92, yE + 3);
  }
  // Emission comb: line positions track the sublevel energy spacing.
  // It collapses to a tight Zeeman triplet at low B and spreads into
  // the Paschen-Back grouping at high B as the slider moves.
  const combY = y1 - 44;
  ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(rx0, combY); ctx.lineTo(rx1, combY); ctx.stroke();
  const smin = Math.min(...eVals), smax = Math.max(...eVals), srange = (smax - smin) || 1;
  for (let i = 0; i < eVals.length; i += 1) {
    const px = rx0 + 10 + (eVals[i] - smin) / srange * (rx1 - rx0 - 20);
    ctx.strokeStyle = colorOf(lv[i].mJ); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, combY - 13); ctx.lineTo(px, combY + 13); ctx.stroke();
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('emission comb (σ/π splitting)', rx0, combY + 30);

  rB.textContent = `${st.B.toFixed(2)} T`;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME) { st.B = CAPTURE_FRAC * Bmax; vB.textContent = st.B.toFixed(2); }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
