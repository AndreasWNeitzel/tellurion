import { bohrEnergy, fineStructureDelta } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rF = document.getElementById('readout-f');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const sM = document.getElementById('slider-m'), vM = document.getElementById('value-m');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const st = { nMax: 3, zoomN: 2 }; let running = !(DETERMINISTIC || prefersReducedMotion());
// Reference capture: a static diagram, so the golden frames differ by the
// pedagogically central variable. Step the zoomed principal level n = 1..3.
if (CAPTURE_NAME) { st.zoomN = 1 + Math.round(CAPTURE_FRAC * 2); }

function clampZoom() { st.zoomN = Math.max(1, Math.min(st.nMax, st.zoomN)); }
function jLabel(j) { return `${Math.round(2 * j)}/2`; }
function jValues(n) { const a = []; for (let j = 0.5; j <= n - 0.5 + 1e-9; j += 1) a.push(j); return a; }
function termsForJ(n, j) {                       // the l-terms degenerate at this j (Dirac)
  const out = [];
  for (const l of [j - 0.5, j + 0.5]) if (l >= 0 && l <= n - 1) out.push(`${n}${'SPDFG'[l]}${jLabel(j)}`);
  return out;
}
function maxSplit(n) {                            // spread of FS levels across j (eV); 0 for n=1
  const js = jValues(n); if (js.length < 2) return 0;
  let lo = Infinity, hi = -Infinity;
  for (const j of js) { const d = fineStructureDelta(n, j); lo = Math.min(lo, d); hi = Math.max(hi, d); }
  return hi - lo;
}

function pausePlay() { running = false; btnP.textContent = 'Play'; btnP.setAttribute('aria-pressed', 'true'); }
sN.addEventListener('input', () => { pausePlay(); st.nMax = parseInt(sN.value); vN.textContent = st.nMax; clampZoom(); sM.value = String(st.zoomN); vM.textContent = st.zoomN; render(); });
sM.addEventListener('input', () => { pausePlay(); st.zoomN = parseInt(sM.value); clampZoom(); vM.textContent = st.zoomN; render(); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  clampZoom();
  ctx.font = fontString(canvas, 'caption', 'mono');
  const n = st.zoomN;

  // Panel coordinates.
  const AX0 = 56, AX1 = 300, AY0 = 64, AY1 = H - 28;
  const BX0 = 350, BX1 = 792, BY0 = 64, BY1 = 588;
  const CX0 = 350, CX1 = 792, CY0 = 654, CY1 = H - 28;

  // ---------- Panel A: gross Bohr ladder (evenly spaced so no void) ----------
  ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.textAlign = 'left';
  ctx.fillText('gross structure (Bohr levels)', AX0, AY0 - 16);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(AX0, AY0); ctx.lineTo(AX0, AY1); ctx.stroke();
  const rungY = (k) => AY1 - (AY1 - AY0 - 30) * (k - 1) / Math.max(1, st.nMax - 1) - 16;
  for (let k = 1; k <= st.nMax; k += 1) {
    const y = rungY(k), sel = k === n;
    ctx.strokeStyle = sel ? '#ffd166' : '#5bc0eb'; ctx.lineWidth = sel ? 2.6 : 1.6;
    ctx.beginPath(); ctx.moveTo(AX0 + 14, y); ctx.lineTo(AX1 - 18, y); ctx.stroke();
    ctx.fillStyle = sel ? '#ffd166' : '#7fd0f0'; ctx.textAlign = 'left';
    ctx.fillText(`n=${k}`, AX0 + 16, y - 7);
    ctx.textAlign = 'right';
    ctx.fillText(`${bohrEnergy(k).toFixed(2)} eV`, AX1 - 18, y - 7);
    if (sel) {
      ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.strokeRect(AX0 + 8, y - 13, AX1 - AX0 - 22, 20);
      ctx.beginPath(); ctx.moveTo(AX1 - 12, y - 3); ctx.lineTo(BX0, BY0 + 12);
      ctx.moveTo(AX1 - 12, y - 3); ctx.lineTo(BX0, BY1 - 12); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // ---------- Panel B: fine-structure zoom of the selected n ----------
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.5; ctx.strokeRect(BX0, BY0, BX1 - BX0, BY1 - BY0);
  ctx.fillStyle = 'rgba(255,255,255,0.78)'; ctx.textAlign = 'left';
  ctx.fillText(`fine structure of n = ${n}: spin-orbit splits by j`, BX0 + 6, BY0 - 16);
  const js = jValues(n);
  let dLo = Infinity, dHi = -Infinity;
  for (const j of js) { const d = fineStructureDelta(n, j); dLo = Math.min(dLo, d); dHi = Math.max(dHi, d); }
  if (!(dHi > dLo)) { dHi = dLo + 1e-9; }
  const padE = Math.max((dHi - dLo) * 0.4, 3e-6);
  const yLo = dLo - padE, yHi = dHi + padE;
  const eToYB = (e) => BY1 - 34 - (BY1 - BY0 - 64) * (e - yLo) / (yHi - yLo);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(BX0 + 70, BY0 + 18); ctx.lineTo(BX0 + 70, BY1 - 20); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.textAlign = 'right';
  for (let t = 0; t <= 4; t += 1) { const e = yLo + (yHi - yLo) * t / 4; ctx.fillText(`${(e * 1e6).toFixed(0)}`, BX0 + 66, eToYB(e) + 3); }
  ctx.save(); ctx.translate(BX0 + 22, (BY0 + BY1) / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('shift from Bohr level (micro-eV)', 0, 0); ctx.restore();
  for (const j of js) {
    const d = fineStructureDelta(n, j), y = eToYB(d);
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(BX0 + 82, y); ctx.lineTo(BX1 - 168, y); ctx.stroke();
    ctx.fillStyle = '#ffd166'; ctx.textAlign = 'left';
    ctx.fillText(termsForJ(n, j).join(', '), BX1 - 162, y + 4);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.textAlign = 'left';
    ctx.fillText(`j=${jLabel(j)}`, BX0 + 84, y - 6);
  }
  if (js.length >= 2) {
    const dT = fineStructureDelta(n, js[js.length - 1]), dB = fineStructureDelta(n, js[0]);
    const yT = eToYB(dT), yB = eToYB(dB), xb = BX1 - 168;
    ctx.strokeStyle = 'rgba(120,210,255,0.7)'; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(xb, yT); ctx.lineTo(xb, yB); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#5bc0eb'; ctx.textAlign = 'right';
    ctx.fillText(`split ${((dT - dB) * 1e6).toFixed(1)} micro-eV`, xb - 5, (yT + yB) / 2 + 3);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.textAlign = 'center';
    ctx.fillText('n = 1: only j = 1/2, the ground state has no FS splitting', (BX0 + BX1) / 2, eToYB(dLo) - 28);
  }

  // ---------- Panel C: diagnostic, splitting vs n (falls as 1/n^3) ----------
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.5; ctx.strokeRect(CX0, CY0, CX1 - CX0, CY1 - CY0);
  ctx.fillStyle = 'rgba(255,255,255,0.78)'; ctx.textAlign = 'left';
  ctx.fillText('diagnostic: fine-structure splitting vs n  (falls as ~ 1/n^3)', CX0 + 6, CY0 - 16);
  const NN = Math.max(st.nMax, 5);
  const pts = [];
  for (let k = 2; k <= NN; k += 1) { const s = maxSplit(k); if (s > 0) pts.push({ n: k, s: s * 1e6 }); }
  const sHi = Math.max(...pts.map(p => p.s)), sLo = Math.min(...pts.map(p => p.s));
  const lyHi = Math.log10(sHi * 1.6), lyLo = Math.log10(sLo * 0.6);
  const cX = (k) => CX0 + 54 + (CX1 - CX0 - 78) * (k - 1) / (NN - 1);
  const cY = (s) => CY1 - 30 - (CY1 - CY0 - 58) * (Math.log10(s) - lyLo) / (lyHi - lyLo);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(CX0 + 48, CY0 + 18); ctx.lineTo(CX0 + 48, CY1 - 24); ctx.lineTo(CX1 - 16, CY1 - 24); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.textAlign = 'right';
  for (let p = Math.floor(lyLo); p <= Math.ceil(lyHi); p += 1) { const yy = cY(Math.pow(10, p)); if (yy > CY0 + 12 && yy < CY1 - 22) ctx.fillText(`10^${p}`, CX0 + 44, yy + 3); }
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let k = 2; k <= NN; k += 1) ctx.fillText(String(k), cX(k), CY1 - 8);
  ctx.fillText('micro-eV vs n', (CX0 + CX1) / 2, CY0 + 14);
  ctx.strokeStyle = 'rgba(120,180,230,0.5)'; ctx.lineWidth = 1.4; ctx.beginPath();
  pts.forEach((p, i) => { const x = cX(p.n), y = cY(p.s); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.stroke();
  for (const p of pts) {
    const x = cX(p.n), y = cY(p.s), sel = p.n === n;
    ctx.fillStyle = sel ? '#ffd166' : '#5bc0eb';
    ctx.beginPath(); ctx.arc(x, y, sel ? 5 : 3.2, 0, 2 * Math.PI); ctx.fill();
    if (sel) { ctx.textAlign = 'center'; ctx.fillStyle = '#ffd166'; ctx.fillText(`${p.s.toFixed(1)}`, x, y - 9); }
  }

  rF.textContent = `${(maxSplit(n) * 1e6).toFixed(1)} micro-eV`;
}

// Walk the zoomed level slowly through n = 1..nMax so the card is never static;
// touching a slider pauses it.
let _acc = 0, _last = performance.now();
function tick(now) {
  if (running) {
    _acc += Math.min(0.05, (now - _last) / 1000 || 0);
    if (_acc > 2.8) { _acc = 0; st.zoomN = st.zoomN >= st.nMax ? 1 : st.zoomN + 1; sM.value = String(st.zoomN); vM.textContent = st.zoomN; }
  }
  _last = now;
  render(); requestAnimationFrame(tick);
}
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const n = st.zoomN;
  return { fields: [
    { key: 'zoom-n', label: 'zoomed principal level n', value: n, format: 'float' },
    { key: 'levels-shown', label: 'gross levels shown', value: st.nMax, format: 'float' },
    { key: 'fs-split', label: 'FS splitting at n (micro-eV)', value: maxSplit(n) * 1e6, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  // The j = 1/2 sublevel must lie below j = 3/2 (spin-orbit lowers low-j), and
  // n = 2 must reproduce the textbook 45 micro-eV 2P fine-structure splitting.
  const split2 = maxSplit(2) * 1e6;
  return [
    { key: 'fs-2p-splitting', label: '2P fine-structure splitting ~ 45 micro-eV', value: `${split2.toFixed(1)} micro-eV`, status: Math.abs(split2 - 45.2) < 2 ? 'pass' : 'drift' },
    { key: 'fs-ordering', label: 'spin-orbit lowers the lower-j level', value: fineStructureDelta(2, 0.5) < fineStructureDelta(2, 1.5) ? 'pass' : 'drift', status: fineStructureDelta(2, 0.5) < fineStructureDelta(2, 1.5) ? 'pass' : 'drift' },
  ];
};
