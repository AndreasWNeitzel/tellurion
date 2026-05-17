// Atwood machine with a massive pulley. Primary canvas is the physical
// machine (pulley, rope, two hanging blocks, weight and tension force
// arrows, a spinning pulley spoke); a secondary panel traces v(t) and
// a(t). The rope constraint plus the pulley moment of inertia give
// a = (m1-m2)g/(m1+m2+I/R^2) and unequal tensions; sliders, the
// disk/ring selector and a zero-mass pulley make the difference plain.
// Reference: Marion and Thornton, Classical Dynamics (5th ed.), Sec. 2.

import { createAtwood, step, tensions, energy, pulleyInertia, G } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['a (m/s²)', 'T1 (N)', 'T2 (N)', 'I (kg m²)', 'regime'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}

const DEF = { m1: 3, m2: 2, M: 1.5, R: 0.4, kind: 'disk' };
let s = createAtwood({ ...DEF });
let running = true, vHist = [], aHist = [];
const X_MAX = 1.5;            // metres of travel before the rig resets
const HIST = 260;

function buildSlider(label, min, max, stp, value, onInput, fmt = v => v.toFixed(1)) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { val.textContent = fmt(+inp.value); onInput(parseFloat(inp.value)); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row);
  return inp;
}
function resetMotion() { s.x = 0; s.v = 0; s.t = 0; vHist = []; aHist = []; }
const sM1 = buildSlider('m₁ (kg)', 0.5, 8, 0.1, DEF.m1, v => { s.m1 = v; resetMotion(); render(); });
const sM2 = buildSlider('m₂ (kg)', 0.5, 8, 0.1, DEF.m2, v => { s.m2 = v; resetMotion(); render(); });
const sMP = buildSlider('pulley M (kg)', 0, 12, 0.1, DEF.M, v => { s.M = v; resetMotion(); render(); }, v => v.toFixed(1));
const selRow = document.createElement('div'); selRow.className = 'row';
const selLab = document.createElement('span'); selLab.className = 'label'; selLab.textContent = 'pulley';
const sel = document.createElement('select'); sel.setAttribute('aria-label', 'pulley type');
for (const [v, t] of [['disk', 'disk  I=½MR²'], ['ring', 'ring  I=MR²']]) { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); }
sel.addEventListener('change', () => { s.kind = sel.value; resetMotion(); render(); });
selRow.appendChild(selLab); selRow.appendChild(sel); const selSpacer = document.createElement('span'); selSpacer.className = 'value'; selRow.appendChild(selSpacer);
controlsEl.appendChild(selRow);
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => { s = createAtwood({ ...DEF }); sM1.value = String(DEF.m1); sM2.value = String(DEF.m2); sMP.value = String(DEF.M); sel.value = 'disk'; resetMotion(); running = true; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render(); });
bPause.addEventListener('click', () => { running = !running; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running)); });

const blockSize = (m) => 30 + 22 * Math.cbrt(m);
const FORCE_PX = 13;           // big so the force arrows dominate the scene
const clampF = (px) => Math.max(-118, Math.min(118, px));

function arrow(x, y, dx, dy, col, w = 3) {
  const L = Math.hypot(dx, dy); if (L < 0.5) return; const ux = dx / L, uy = dy / L;
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - 9 * ux + 5 * uy, y + dy - 9 * uy - 5 * ux);
  ctx.lineTo(x + dx - 9 * ux - 5 * uy, y + dy - 9 * uy + 5 * ux);
  ctx.closePath(); ctx.fill();
}

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const cx = 250, pulleyY = 64, PX = 88;               // px per metre
  const { a, T1, T2, alpha } = tensions(s);

  // Pulley. Its drawn heft grows with the pulley mass M (a heavier
  // wheel looks bigger and thicker), so the M control always changes
  // the scene even when the masses are balanced and a = 0.
  const Rpx = 30 + s.R * 26 + 9 * Math.cbrt(Math.max(0.05, s.M));
  ctx.lineWidth = 2;
  if (s.kind === 'ring') {
    const rimW = 5 + 1.6 * Math.cbrt(Math.max(0.05, s.M));
    ctx.strokeStyle = '#9bb4e0'; ctx.lineWidth = rimW;
    ctx.beginPath(); ctx.arc(cx, pulleyY, Rpx - rimW / 2, 0, 6.28); ctx.stroke();
    ctx.lineWidth = 2;
  } else {
    const shade = Math.min(0.85, 0.3 + 0.07 * s.M);
    const g = ctx.createRadialGradient(cx - 6, pulleyY - 6, 2, cx, pulleyY, Rpx);
    g.addColorStop(0, '#7790c8'); g.addColorStop(1, `rgba(${40 - 20 * shade | 0},${52 - 24 * shade | 0},${80 - 36 * shade | 0},1)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, pulleyY, Rpx, 0, 6.28); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.stroke();
  }
  // Spinning spoke shows the angular motion (theta = x / R).
  const th = s.x / s.R;
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, pulleyY); ctx.lineTo(cx + Rpx * Math.cos(th), pulleyY + Rpx * Math.sin(th)); ctx.stroke();
  ctx.fillStyle = '#cdd1d6'; ctx.beginPath(); ctx.arc(cx, pulleyY, 4, 0, 6.28); ctx.fill();
  // Mounting bracket.
  ctx.strokeStyle = '#5a5f6a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, pulleyY - Rpx); ctx.lineTo(cx, 18); ctx.stroke();

  // Rope hangs tangent to the pulley at +-Rpx; m1 on the left, m2 right.
  const x1 = cx - Rpx, x2 = cx + Rpx;
  const y1 = pulleyY + (1.0 + s.x) * PX * 0.5 + 34;     // m1 descends with +x
  const y2 = pulleyY + (1.0 - s.x) * PX * 0.5 + 34;
  ctx.strokeStyle = '#c9cdd4'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x1, pulleyY); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, pulleyY); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, pulleyY, Rpx, Math.PI, 2 * Math.PI); ctx.stroke();

  for (const [bx, by, m, T, name, col] of [[x1, y1, s.m1, T1, 'm₁', '#ff9d6e'], [x2, y2, s.m2, T2, 'm₂', '#7cc6ff']]) {
    const bs = blockSize(m);
    ctx.fillStyle = col; ctx.fillRect(bx - bs / 2, by, bs, bs);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.strokeRect(bx - bs / 2, by, bs, bs);
    ctx.fillStyle = '#0b0b10'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
    ctx.fillText(`${name}`, bx, by + bs / 2 + 4);
    // Weight (down) and tension (up) arrows, lengths proportional to
    // the forces and large enough to dominate the scene, so changing a
    // mass is unmistakable.
    arrow(bx, by + bs, 0, clampF(m * G * FORCE_PX / 10), '#ef476f', 5);
    arrow(bx, by, 0, -clampF(T * FORCE_PX / 10), '#06d6a0', 5);
    ctx.fillStyle = '#ef476f'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
    ctx.fillText(`${(m * G).toFixed(0)} N`, bx + 34, by + bs + clampF(m * G * FORCE_PX / 10) / 2);
    ctx.fillStyle = '#06d6a0';
    ctx.fillText(`T=${T.toFixed(0)}`, bx + 30, by - clampF(T * FORCE_PX / 10) / 2);
  }
  ctx.textAlign = 'left';

  // Secondary panel: v(t) and a(t), placed below the readout HUD so the
  // two never overlap.
  const px0 = 540, px1 = W - 24, pyt = 168, pyb = H - 40, midY = (pyt + pyb) / 2;
  ctx.fillStyle = '#0c0c14'; ctx.fillRect(px0 - 6, pyt - 26, px1 - px0 + 30, pyb - pyt + 52);
  ctx.strokeStyle = '#2a2a34'; ctx.beginPath(); ctx.moveTo(px0, midY); ctx.lineTo(px1, midY); ctx.moveTo(px0, pyt); ctx.lineTo(px0, pyb); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('v(t) m/s  and  a(t) m/s²', px0, pyt - 8);
  ctx.fillStyle = '#7e828a'; ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('+', px0 - 14, pyt + 10); ctx.fillText('0', px0 - 14, midY + 3); ctx.fillText('t', px1 - 8, pyb + 14);
  const VS = 16, AS = 26;
  const plot = (hist, sc, col) => {
    if (hist.length < 2) return;
    ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.beginPath();
    hist.forEach((val, i) => { const X = px0 + i / HIST * (px1 - px0); const Y = midY - Math.max(-((pyb - pyt) / 2), Math.min((pyb - pyt) / 2, val * sc)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    ctx.stroke();
  };
  plot(vHist, VS, '#ffd166');
  plot(aHist, AS, '#5bc0eb');
  ctx.fillStyle = '#ffd166'; ctx.fillText('v', px1 - 16, pyt + 14); ctx.fillStyle = '#5bc0eb'; ctx.fillText('a', px1 - 16, pyt + 30);

  rEls['a (m/s²)'].textContent = a.toFixed(3);
  rEls['T1 (N)'].textContent = T1.toFixed(2);
  rEls['T2 (N)'].textContent = T2.toFixed(2);
  rEls['I (kg m²)'].textContent = pulleyInertia(s.M, s.R, s.kind).toFixed(4);
  rEls.regime.textContent = Math.abs(a) < 1e-6 ? 'balanced' : (s.m1 > s.m2 ? 'm₁ falls' : 'm₂ falls');
}

const PHYS_DT = 0.002;
function advance(dtSim) {
  const n = Math.min(4000, Math.round(dtSim / PHYS_DT));
  for (let i = 0; i < n; i += 1) {
    step(s, PHYS_DT);
    if (Math.abs(s.x) > X_MAX) { s.x = 0; s.v = 0; }
    if (i % 6 === 0) {
      vHist.push(s.v); aHist.push(tensions(s).a);
      if (vHist.length > HIST) vHist.shift();
      if (aHist.length > HIST) aHist.shift();
    }
  }
}
let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) advance(dt);
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) advance(0.4 + CAPTURE_FRAC * 2.2);
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}

window.__physicsCheck = async () => {
  const t0 = tensions({ m1: 3, m2: 2, M: 0, R: 0.4, kind: 'disk' });
  if (Math.abs(t0.T1 - t0.T2) > 1e-9) return { name: 'massless tensions', pass: false, msg: `dT=${(t0.T1 - t0.T2).toExponential(2)}` };
  const c = createAtwood({ m1: 3, m2: 2, M: 1.5, R: 0.4, kind: 'disk' }); const E0 = energy(c);
  for (let i = 0; i < 5000; i += 1) step(c, 0.001);
  const dE = Math.abs(energy(c) - E0);
  if (dE > 1e-6) return { name: 'energy', pass: false, msg: `dE=${dE.toExponential(2)}` };
  return { name: 'Atwood: massless tensions equal, energy conserved', pass: true, msg: `dT=0, dE=${dE.toExponential(2)}` };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
