// Mixing-length convection as a stellar cross-section. A radiative core
// plus an outer envelope: when the layer is Schwarzschild-unstable
// (nabla - nabla_ad > 0) it convects, with hot plumes rising and cool
// lanes sinking; the convective speed comes from mixing-length theory
// and the cell size scales with the mixing length alpha = l_m / H_p.
// Below the criterion convection shuts off and the envelope is
// radiative. Reference: Kippenhahn-Weigert-Weiss, Stellar Structure
// and Evolution, Ch. 6-7.

import { schwarzschild, vConv } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const sA = document.getElementById('slider-a'), vA = document.getElementById('value-a');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const st = { dnabla: 0.05, alpha: 1.7, t: 0 }; let running = true;
let last = performance.now();

sN.addEventListener('input', () => { st.dnabla = parseFloat(sN.value); vN.textContent = st.dnabla.toFixed(2); render(); });
sA.addEventListener('input', () => { st.alpha = parseFloat(sA.value); vA.textContent = st.alpha.toFixed(2); render(); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); render(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, W, H);
  const cx = W * 0.42, cy = H * 0.5, R = Math.min(W * 0.42, H * 0.46);
  const Rc = 0.42 * R;                    // radiative core radius
  const conv = st.dnabla > 0;             // Schwarzschild unstable -> convective
  // MLT convective speed (sim.js); scaled to a visible cell circulation.
  const vc = conv ? vConv(1e3, st.dnabla * 1e6, 1e7, st.alpha * 1e8) : 0;
  const vis = conv ? 0.3 + 2.4 * Math.sqrt(st.dnabla) : 0;
  // Cell count falls as the mixing length (alpha) grows: bigger eddies.
  const cells = Math.max(5, Math.round(26 / st.alpha));

  // Star disc clipped.
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.clip();

  // Radiative core (smooth hot gradient).
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, Rc);
  core.addColorStop(0, '#fff1c0'); core.addColorStop(0.6, '#ffb24d'); core.addColorStop(1, '#b85a1e');
  ctx.fillStyle = core; ctx.beginPath(); ctx.arc(cx, cy, Rc, 0, 2 * Math.PI); ctx.fill();

  if (conv) {
    // Convective envelope: per-pixel-ish polar cells. Radial overturn
    // (sign of sin gives rising hot vs sinking cool) advected at vis.
    const step = 4;
    for (let py = cy - R; py <= cy + R; py += step) {
      for (let px = cx - R; px <= cx + R; px += step) {
        const dx = px - cx, dy = py - cy, rr = Math.hypot(dx, dy);
        if (rr < Rc || rr > R) continue;
        const th = Math.atan2(dy, dx);
        const frac = (rr - Rc) / (R - Rc);
        const cell = Math.sin(cells * th + 0.6 * Math.sin(cells * th)) *
          Math.cos(Math.PI * frac - st.t * vis + cells * th * 0.0);
        const up = Math.sin(cells * th * 0.5 + frac * 5.0 - st.t * vis);
        const hot = up > 0;
        const b = 0.35 + 0.55 * Math.abs(cell);
        if (hot) { ctx.fillStyle = `rgba(${(255 * b) | 0},${(170 * b) | 0},${(70 * b) | 0},1)`; }
        else { ctx.fillStyle = `rgba(${(70 * b) | 0},${(120 * b) | 0},${(200 * b) | 0},1)`; }
        ctx.fillRect(px, py, step, step);
      }
    }
    // Rising plume highlights.
    for (let i = 0; i < cells; i += 1) {
      const a = (i / cells) * 2 * Math.PI;
      const rr = Rc + ((st.t * vis * 22 + i * 40) % (R - Rc));
      ctx.fillStyle = 'rgba(255,230,160,0.6)';
      ctx.beginPath(); ctx.arc(cx + rr * Math.cos(a), cy + rr * Math.sin(a), 4 + 6 * (rr - Rc) / (R - Rc), 0, 2 * Math.PI); ctx.fill();
    }
  } else {
    // Radiative envelope: smooth concentric shells, no flow.
    for (let k = 1; k <= 7; k += 1) {
      const rr = Rc + (R - Rc) * k / 8;
      ctx.strokeStyle = `rgba(150,180,230,${0.10 + 0.04 * k})`;
      ctx.lineWidth = (R - Rc) / 9;
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 2 * Math.PI); ctx.stroke();
    }
  }
  // Core boundary + photosphere.
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, Rc, 0, 2 * Math.PI); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,210,140,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, R - 1, 0, 2 * Math.PI); ctx.stroke();
  ctx.restore();

  // Labels.
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  const reg = schwarzschild(0.5 + st.dnabla, 0.5);
  ctx.fillText(conv ? 'convective envelope' : 'radiative envelope', cx + R + 16, cy - 70);
  ctx.fillText('radiative core', cx + R + 16, cy - 50);
  ctx.fillText(`∇ - ∇_ad = ${st.dnabla.toFixed(2)}`, cx + R + 16, cy - 20);
  ctx.fillText(`Schwarzschild: ${reg}`, cx + R + 16, cy);
  ctx.fillText(`α = l_m/H_p = ${st.alpha.toFixed(2)}`, cx + R + 16, cy + 20);
  ctx.fillText(`v_conv ${conv ? '~ ' + vc.toExponential(1) + ' (MLT)' : '= 0 (stable)'}`, cx + R + 16, cy + 40);
  ctx.fillStyle = '#9aa0a6';
  ctx.fillText('drag ∇-∇_ad below 0 to shut off convection (Schwarzschild stable)', 14, H - 14);
  rR.textContent = reg;
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) st.t += dt;
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) st.t = CAPTURE_FRAC * 8;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
