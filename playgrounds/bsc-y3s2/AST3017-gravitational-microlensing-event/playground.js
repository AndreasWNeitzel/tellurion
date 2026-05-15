// Single point-mass gravitational microlensing. Source and lens move in
// projection; magnification A(u) and image positions theta_pm visualized.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant');
const readoutFrame = document.getElementById('readout-frame');
const controlsEl   = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const rng = makeRng(DEFAULT_SEED);

const state = { uMin: 0.3, tE: 60, t: -120 };

// Background star field (fixed seed) for visual context.
const bgStars = (() => {
  const out = [];
  for (let i = 0; i < 240; i += 1) {
    out.push({ x: rng() * W, y: rng() * H * 0.5, b: rng() * 0.7 + 0.2 });
  }
  return out;
})();

function magnification(u) {
  return (u * u + 2) / (Math.max(u, 1e-6) * Math.sqrt(u * u + 4));
}

function imagePositions(u) {
  const d = Math.sqrt(u * u + 4);
  return [0.5 * (u + d), 0.5 * (u - d)]; // in units of theta_E
}

function lightCurve(uMin, tE, tArr) {
  const A = new Array(tArr.length);
  for (let i = 0; i < tArr.length; i += 1) {
    const t = tArr[i];
    const u = Math.sqrt(uMin * uMin + (t / tE) ** 2);
    A[i] = magnification(u);
  }
  return A;
}

const tSeries = (() => { const a = []; for (let i = -120; i <= 120; i += 2) a.push(i); return a; })();
const Acurve  = lightCurve(state.uMin, state.tE, tSeries);

let raf;
function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);

  // Top half: sky panel.
  const topH = H * 0.55;
  for (const s of bgStars) {
    ctx.fillStyle = `rgba(220,220,240,${s.b})`;
    ctx.beginPath(); ctx.arc(s.x, s.y * (topH / H * 2), 1.4, 0, 2 * Math.PI); ctx.fill();
  }
  const cx = W / 2, cy = topH / 2;
  // Lens position progresses with t.
  const lensX = cx + (state.t / 120) * (W * 0.25);
  const lensY = cy + state.uMin * 80;
  // Source position fixed.
  ctx.fillStyle = '#ffd57f';
  ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 2 * Math.PI); ctx.fill();
  // Lens (point mass).
  ctx.fillStyle = '#cf7f3a';
  ctx.beginPath(); ctx.arc(lensX, lensY, 3, 0, 2 * Math.PI); ctx.fill();
  // Einstein ring around lens.
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.arc(lensX, lensY, 60, 0, 2 * Math.PI); ctx.stroke();
  // Two distorted images at theta_pm projected onto the lens-source line.
  const u = Math.sqrt(state.uMin * state.uMin + (state.t / state.tE) ** 2);
  const [tp, tm] = imagePositions(u);
  const dirX = (cx - lensX), dirY = (cy - lensY);
  const dirM = Math.hypot(dirX, dirY) + 1e-6;
  const ux = dirX / dirM, uy = dirY / dirM;
  const scaleImg = 60 / Math.max(state.uMin, 0.05);
  function drawImage(thetaUnits, alpha) {
    const x = lensX + ux * thetaUnits * scaleImg;
    const y = lensY + uy * thetaUnits * scaleImg;
    ctx.fillStyle = `rgba(255, 213, 127, ${alpha})`;
    ctx.beginPath(); ctx.ellipse(x, y, 8, 4, Math.atan2(uy, ux), 0, 2 * Math.PI); ctx.fill();
  }
  drawImage(tp, 0.7);
  drawImage(tm, 0.5);

  // Bottom half: light curve.
  const botY0 = topH + 16, botH = H - botY0 - 40;
  ctx.fillStyle = 'rgba(220,220,240,0.06)';
  ctx.fillRect(0, botY0, W, botH);
  let mx = 0;
  for (const a of Acurve) if (a > mx) mx = a;
  ctx.strokeStyle = '#7c9cff'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < tSeries.length; i += 1) {
    const x = (i / (tSeries.length - 1)) * W;
    const y = botY0 + botH - (Acurve[i] / mx) * botH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Current-time marker.
  ctx.fillStyle = '#ffd57f';
  const idx = Math.round((state.t + 120) / 2);
  const mx2 = (idx / (tSeries.length - 1)) * W;
  ctx.beginPath(); ctx.arc(mx2, botY0 + botH - (Acurve[idx] / mx) * botH, 5, 0, 2 * Math.PI); ctx.fill();

  ctx.fillStyle = '#dcdde2'; ctx.font = '12px sans-serif';
  ctx.fillText('Paczynski A(t)', 8, botY0 + 16);

  readoutInv.textContent = `u=${u.toFixed(3)}  A=${magnification(u).toFixed(3)}`;
  readoutFrame.textContent = String(state.t);
}

function tick() {
  state.t += 1.5;
  if (state.t > 120) state.t = -120;
  render();
  if (!CAPTURE_NAME) raf = requestAnimationFrame(tick);
}

function buildControls() {
  controlsEl.innerHTML = '';
  function slider(id, label, min, max, step, value, onInput, fmt = v => v.toFixed(2)) {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
    const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
    inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(value);
    inp.setAttribute('aria-label', label);
    const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
    inp.addEventListener('input', () => {
      const v = parseFloat(inp.value); val.textContent = fmt(v); onInput(v);
      // Recompute curve.
      const a = lightCurve(state.uMin, state.tE, tSeries);
      for (let i = 0; i < a.length; i += 1) Acurve[i] = a[i];
    });
    row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
    controlsEl.appendChild(row);
  }
  slider('u-min', 'u_min', 0.01, 1.0, 0.01, state.uMin, v => state.uMin = v);
  slider('t-E',   't_E (d)',  10, 200, 1, state.tE, v => state.tE = v, v => v.toFixed(0));
}

buildControls();
render();
if (DETERMINISTIC) {
  for (let i = 0; i < 60; i += 1) { state.t += 2; render(); }
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  raf = requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  // At u=0.3: A = (0.09 + 2)/(0.3 * sqrt(0.09 + 4)) = 2.09/0.604 = 3.461
  const A = magnification(0.3);
  if (Math.abs(A - 3.461) > 0.005) return { name: 'Paczynski formula', pass: false, msg: `A(0.3) = ${A.toFixed(4)} expected 3.461` };
  return { name: 'Paczynski A(u)', pass: true, msg: `A(0.3) = ${A.toFixed(4)}` };
};
