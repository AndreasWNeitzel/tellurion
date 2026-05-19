import { blochFrequency, quasiMomentum, position } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rT = document.getElementById('readout-t');
const sF = document.getElementById('slider-F'), vF = document.getElementById('value-F');
const sW = document.getElementById('slider-W'), vW = document.getElementById('value-W');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { F: 1, W: 1, t: 0 }; let running = true;
sF.addEventListener('input', () => { st.F = parseFloat(sF.value); vF.textContent = st.F.toFixed(2); render(); });
sW.addEventListener('input', () => { st.W = parseFloat(sW.value); vW.textContent = st.W.toFixed(2); render(); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  const omega_B = blochFrequency(st.F);
  const T_B = 2 * Math.PI / omega_B;
  const panelTop = pad.t, panelMid = H / 2 + 5, panelBot = H - pad.b;
  // Band E(k).
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, panelTop); ctx.lineTo(pad.l, panelMid - 20); ctx.lineTo(W - pad.r, panelMid - 20); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace'; ctx.fillText('E(k) = -W/2 cos(ka)', pad.l + 6, panelTop + 12);
  const xToPx = (k) => pad.l + (k + Math.PI) / (2 * Math.PI) * (W - pad.l - pad.r);
  const cyTop = (panelTop + panelMid - 20) / 2, ampE = (panelMid - panelTop - 20) / 2 - 10;
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = -100; i <= 100; i += 1) {
    const k = i / 100 * Math.PI;
    // Fixed energy scale (W_max/2 = 1.5, EMAX 1.6 with margin). Dividing
    // by st.W cancelled W, so the band height was bandwidth-independent
    // and the W slider did nothing to this panel.
    const E = -st.W / 2 * Math.cos(k);
    const py = cyTop - E / 1.6 * ampE * 2;
    if (i === -100) ctx.moveTo(xToPx(k), py); else ctx.lineTo(xToPx(k), py);
  }
  ctx.stroke();
  const k_now = quasiMomentum(st.t, 0, st.F);
  const E_now = -st.W / 2 * Math.cos(k_now);
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(xToPx(k_now), cyTop - E_now / 1.6 * ampE * 2, 7, 0, 2 * Math.PI); ctx.fill();
  // x(t).
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, panelMid + 20); ctx.lineTo(pad.l, panelBot); ctx.lineTo(W - pad.r, panelBot); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.fillText('x(t)', pad.l + 6, panelMid + 32);
  const tMax = 3 * T_B;
  const xToPx2 = (tt) => pad.l + tt / tMax * (W - pad.l - pad.r);
  const yMid = (panelMid + 20 + panelBot) / 2;
  const ampX = (panelBot - panelMid - 20) / 2 - 10;
  const ampTheory = st.W / (2 * st.F);
  // Fixed position scale (NOT divided by ampTheory, which normalised the
  // oscillation to +-1 and made W and F invisible). The real amplitude
  // W/(2F) now visibly grows with W and shrinks with F; clamped so the
  // small-F divergence reads as a large clipped swing rather than
  // overflowing the panel.
  const XFIX = 2.5;
  const mapX = (x) => { let u = x / XFIX; if (u > 1) u = 1; else if (u < -1) u = -1; return yMid - u * ampX * 0.92; };
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i <= 400; i += 1) {
    const tt = tMax * i / 400;
    const x = position(tt, 0, st.F, st.W);
    const py = mapX(x);
    if (i === 0) ctx.moveTo(xToPx2(tt), py); else ctx.lineTo(xToPx2(tt), py);
  }
  ctx.stroke();
  const x_now = position(st.t % tMax, 0, st.F, st.W);
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(xToPx2(st.t % tMax), mapX(x_now), 7, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`T_B = ${T_B.toFixed(2)}, amp = ${ampTheory.toFixed(2)}, ω_B = ${omega_B.toFixed(2)}`, 12, H - 12);
  rT.textContent = T_B.toFixed(2);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt * 2; render(); requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME) {
    // Sweep three full Bloch periods so the five frames show the
    // quasi-momentum crossing the Brillouin zone and the position
    // completing its real-space oscillation.
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    // 2.7 periods (not an integer, so the first and last frame land at
    // different phases of the periodic oscillation).
    st.t = frac * 2.7 * (2 * Math.PI / blochFrequency(st.F));
  } else {
    st.t = 0;
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
