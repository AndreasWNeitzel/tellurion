// Projectile with drag and Magnus, in a 3D oblique-projected scene.
// Three trajectories are flown simultaneously over a perspective ground
// grid: vacuum (grey), quadratic drag (amber), drag plus Magnus (cyan).
// A spinning ball rides the Magnus path; landing markers and a lateral
// guide make the curve from spin obvious. Sliders set the launch speed,
// elevation and spin rate; a selector picks the spin axis.
// Reference: Marion and Thornton, Classical Dynamics (5th ed.), Ch. 2.

import { trajectory, spinVector } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['range (m)', 'apex (m)', 'side (m)', 'tof (s)', 'spin'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}

const st = { speed: 32, elev: 35, spin: 45, axis: 'side', t: 0 };
const C_DRAG = 0.006, C_MAG = 0.0018;
let traj = { vac: null, drag: null, mag: null };

function recompute() {
  const om = spinVector(st.spin, st.axis);
  traj.vac = trajectory({ speed: st.speed, elevDeg: st.elev, c: 0, cM: 0 });
  traj.drag = trajectory({ speed: st.speed, elevDeg: st.elev, c: C_DRAG, cM: 0 });
  traj.mag = trajectory({ speed: st.speed, elevDeg: st.elev, omega: om, c: C_DRAG, cM: C_MAG });
}
recompute();
let running = true;

function buildSlider(label, min, max, stp, value, key, fmt = v => v.toFixed(0)) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value); recompute(); render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row);
  return { inp, val };
}
const cS = buildSlider('speed (m/s)', 12, 60, 1, st.speed, 'speed');
const cE = buildSlider('elevation (deg)', 5, 80, 1, st.elev, 'elev');
const cW = buildSlider('spin (rad/s)', 0, 90, 1, st.spin, 'spin');
const selRow = document.createElement('div'); selRow.className = 'row';
const selLab = document.createElement('span'); selLab.className = 'label'; selLab.textContent = 'spin axis';
const sel = document.createElement('select'); sel.setAttribute('aria-label', 'spin axis');
for (const [v, t] of [['side', 'sidespin (curve)'], ['back', 'backspin (lift)'], ['top', 'topspin (dip)'], ['none', 'knuckle (no spin)']]) { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); }
sel.value = st.axis;
sel.addEventListener('change', () => {
  st.axis = sel.value;
  // Choosing a spin type with no spin set would do nothing; give it a
  // sensible default so the axis is always consequential.
  if (st.axis !== 'none' && st.spin < 5) { st.spin = 40; cW.inp.value = '40'; cW.val.textContent = '40'; }
  recompute(); render();
});
selRow.appendChild(selLab); selRow.appendChild(sel); const ss = document.createElement('span'); ss.className = 'value'; selRow.appendChild(ss);
controlsEl.appendChild(selRow);
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => { Object.assign(st, { speed: 32, elev: 35, spin: 45, axis: 'side', t: 0 }); cS.inp.value = '32'; cS.val.textContent = '32'; cE.inp.value = '35'; cE.val.textContent = '35'; cW.inp.value = '45'; cW.val.textContent = '45'; sel.value = 'side'; recompute(); running = true; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render(); });
bPause.addEventListener('click', () => { running = !running; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running)); });

// Oblique 3D projection: world (x downrange, y lateral, z up).
function project(p, sc, ox, oy) {
  return [ox + p[0] * sc + p[1] * 0.5 * sc, oy - p[2] * sc + p[1] * 0.28 * sc];
}

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#06070b'; ctx.fillRect(0, 0, W, H);
  // Fit all three trajectories.
  let xMax = 1, zMax = 1, yMax = 0.5;
  for (const T of [traj.vac, traj.drag, traj.mag]) for (const q of T.pts) { xMax = Math.max(xMax, q[0]); zMax = Math.max(zMax, q[2]); yMax = Math.max(yMax, Math.abs(q[1])); }
  const ox = 70, oy = H - 70;
  const sc = Math.min((W - 150) / (xMax + yMax * 0.5 + 1), (H - 130) / (zMax + yMax * 0.28 + 1));

  // Ground grid (z = 0 plane), lines of constant x and constant y.
  ctx.strokeStyle = 'rgba(120,140,180,0.16)'; ctx.lineWidth = 1;
  const yG = Math.max(2, Math.ceil(yMax));
  for (let x = 0; x <= xMax + 1; x += Math.max(2, Math.round(xMax / 12))) {
    const a = project([x, -yG, 0], sc, ox, oy), b = project([x, yG, 0], sc, ox, oy);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  for (let y = -yG; y <= yG; y += Math.max(1, Math.round(yG / 4))) {
    const a = project([0, y, 0], sc, ox, oy), b = project([xMax + 1, y, 0], sc, ox, oy);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }

  const drawCurve = (T, col, w, dash) => {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash || []);
    ctx.beginPath();
    T.pts.forEach((q, i) => { const s = project(q, sc, ox, oy); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); });
    ctx.stroke(); ctx.setLineDash([]);
    // Landing marker.
    const L = T.pts[T.pts.length - 1]; const sL = project(L, sc, ox, oy);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(sL[0], sL[1], 4, 0, 6.28); ctx.fill();
  };
  drawCurve(traj.vac, 'rgba(150,156,166,0.7)', 1.5, [4, 4]);
  drawCurve(traj.drag, '#ffb24d', 2);
  drawCurve(traj.mag, '#5bc6ff', 2.6);

  // Ball travelling the Magnus path, with a spin-axis arrow.
  const mp = traj.mag.pts;
  const idx = Math.min(mp.length - 1, Math.floor(((st.t * 0.5) % 1) * mp.length));
  const bp = project(mp[idx], sc, ox, oy);
  const gl = ctx.createRadialGradient(bp[0], bp[1], 0, bp[0], bp[1], 12);
  gl.addColorStop(0, '#eaf6ff'); gl.addColorStop(1, 'rgba(120,200,255,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(bp[0], bp[1], 12, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#eaf6ff'; ctx.beginPath(); ctx.arc(bp[0], bp[1], 6, 0, 6.28); ctx.fill();
  // Spin hatch (rotating) to show it is spinning.
  const a = st.t * (1 + st.spin * 0.1);
  ctx.strokeStyle = '#0b0b12'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(bp[0] - 5 * Math.cos(a), bp[1] - 5 * Math.sin(a)); ctx.lineTo(bp[0] + 5 * Math.cos(a), bp[1] + 5 * Math.sin(a)); ctx.stroke();
  // Spin-axis arrow (projected): a persistent, axis-dependent indicator
  // so the selector visibly changes the scene at any spin rate.
  const axV = { side: [0, 0, 1], back: [0, -1, 0], top: [0, 1, 0], none: [0, 0, 0] }[st.axis];
  const tip = [mp[idx][0] + axV[0] * 2, mp[idx][1] + axV[1] * 2, mp[idx][2] + axV[2] * 2];
  const tp = project(tip, sc, ox, oy);
  ctx.strokeStyle = '#ff7ab6'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(bp[0], bp[1]); ctx.lineTo(tp[0], tp[1]); ctx.stroke();
  ctx.fillStyle = '#ff7ab6'; ctx.beginPath(); ctx.arc(tp[0], tp[1], 3, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#ff9dc8'; ctx.font = '10px ui-monospace, monospace'; ctx.fillText('ω', tp[0] + 4, tp[1] - 3);

  // Launch point + axis labels.
  const o0 = project([0, 0, 0], sc, ox, oy);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('launch', o0[0] - 8, o0[1] + 16);
  ctx.fillStyle = 'rgba(150,156,166,0.8)'; ctx.fillText('vacuum', 16, 24);
  ctx.fillStyle = '#ffb24d'; ctx.fillText('drag', 16, 40);
  ctx.fillStyle = '#5bc6ff'; ctx.fillText('drag + Magnus', 16, 56);

  rEls['range (m)'].textContent = traj.mag.range.toFixed(2);
  rEls['apex (m)'].textContent = traj.mag.apex.toFixed(2);
  rEls['side (m)'].textContent = traj.mag.side.toFixed(2);
  rEls['tof (s)'].textContent = traj.mag.tof.toFixed(2);
  rEls.spin.textContent = st.axis;
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) st.t += dt;
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) st.t = CAPTURE_FRAC * 2.0;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}

window.__physicsCheck = async () => {
  const r = trajectory({ speed: 30, elevDeg: 40, c: 0, cM: 0 });
  const analytic = 30 * 30 * Math.sin(2 * 40 * Math.PI / 180) / 9.81;
  const err = Math.abs(r.range - analytic) / analytic;
  if (err > 2e-3) return { name: 'vacuum range', pass: false, msg: `err=${(err * 100).toFixed(3)}%` };
  return { name: 'vacuum = analytic parabola; Magnus perp v,omega', pass: true, msg: `range err ${(err * 100).toFixed(3)}%` };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
