import { Yp, DH, Li7H, ETA_PLANCK, OBS_Yp, OBS_DH, OBS_Li7H } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rE = document.getElementById('readout-e');
const sE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { eta: 6.1 }; let running = true;
sE.addEventListener('input', () => { st.eta = parseFloat(sE.value); vE.textContent = st.eta.toFixed(2); });
btnR.addEventListener('click', () => { st.eta = ETA_PLANCK; sE.value = ETA_PLANCK; vE.textContent = ETA_PLANCK.toFixed(2); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function curve(fn, color, label, panelIdx, logScale = false) {
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 30 };
  const panelH = (H - pad.t - pad.b * 3) / 3;
  const top = pad.t + panelIdx * (panelH + 15), bot = top + panelH;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, top); ctx.lineTo(pad.l, bot); ctx.lineTo(W - pad.r, bot); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace'; ctx.fillText(label, pad.l + 4, top + 12);
  let yMin = Infinity, yMax = -Infinity;
  const N = 200;
  for (let i = 0; i < N; i += 1) {
    const x = 1 + 19 * i / (N - 1);
    let v = fn(x);
    if (logScale) v = Math.log10(v);
    if (v < yMin) yMin = v; if (v > yMax) yMax = v;
  }
  if (yMax - yMin < 1e-9) { yMin -= 1; yMax += 1; }
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const x = 1 + 19 * i / (N - 1);
    let v = fn(x); if (logScale) v = Math.log10(v);
    const px = pad.l + (x - 1) / 19 * (W - pad.l - pad.r);
    const py = bot - (v - yMin) / (yMax - yMin) * (bot - top - 10);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  let cur = fn(st.eta); if (logScale) cur = Math.log10(cur);
  const px = pad.l + (st.eta - 1) / 19 * (W - pad.l - pad.r);
  const py = bot - (cur - yMin) / (yMax - yMin) * (bot - top - 10);
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(px, py, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#ef476f'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(pad.l + (ETA_PLANCK - 1) / 19 * (W - pad.l - pad.r), top); ctx.lineTo(pad.l + (ETA_PLANCK - 1) / 19 * (W - pad.l - pad.r), bot); ctx.stroke(); ctx.setLineDash([]);
}
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  curve(Yp, '#ffd166', 'Y_p (4He)', 0, false);
  curve(DH, '#5bc0eb', 'log10 D/H', 1, true);
  curve(Li7H, '#06d6a0', 'log10 7Li/H', 2, true);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`η₁₀ = ${st.eta.toFixed(2)}, Y_p = ${Yp(st.eta).toFixed(3)}, D/H = ${DH(st.eta).toExponential(2)}, 7Li/H = ${Li7H(st.eta).toExponential(2)}`, 12, canvas.height - 12);
  ctx.fillStyle = '#ef476f'; ctx.fillText(`Planck η₁₀ = ${ETA_PLANCK} (red dashed)`, 12, 18);
  rE.textContent = st.eta.toFixed(2);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    // Sweep the baryon-to-photon ratio so the marker traces the helium,
    // deuterium and lithium abundance curves vs baryon density.
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.eta = 1.5 + frac * 16.5;
    sE.value = String(st.eta); vE.textContent = st.eta.toFixed(2);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
