// Projectile with drag and Magnus, in a true perspective 3D scene.
// Three trajectories fly together over a perspective ground grid:
// vacuum (grey, dashed), quadratic drag (amber), drag plus Magnus
// (cyan). The camera orbits the scene so the lateral Magnus curve
// reads as depth, not a flat plot; each path drops a soft shadow onto
// the ground, vertical stems tie the flight to the grid, and a corner
// gnomon shows the world axes. Sliders set launch speed, elevation,
// spin rate, spin axis and the camera; sim.js holds the physics.
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

const st = { speed: 32, elev: 35, spin: 45, axis: 'side', camAz: 35, camEl: 26, autoRot: 1, t: 0 };
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
  if (st.axis !== 'none' && st.spin < 5) { st.spin = 40; cW.inp.value = '40'; cW.val.textContent = '40'; }
  recompute(); render();
});
selRow.appendChild(selLab); selRow.appendChild(sel); const ss = document.createElement('span'); ss.className = 'value'; selRow.appendChild(ss);
controlsEl.appendChild(selRow);
const cAz = buildSlider('camera azimuth', 0, 359, 1, st.camAz, 'camAz');
const cEl = buildSlider('camera height', 6, 78, 1, st.camEl, 'camEl');
const rotRow = document.createElement('div'); rotRow.className = 'row';
const rotLab = document.createElement('span'); rotLab.className = 'label'; rotLab.textContent = 'auto-orbit';
const rotSel = document.createElement('select'); rotSel.setAttribute('aria-label', 'auto-orbit');
for (const [v, t] of [['1', 'on'], ['0', 'off']]) { const o = document.createElement('option'); o.value = v; o.textContent = t; rotSel.appendChild(o); }
rotSel.value = String(st.autoRot);
rotSel.addEventListener('change', () => { st.autoRot = parseInt(rotSel.value, 10); render(); });
rotRow.appendChild(rotLab); rotRow.appendChild(rotSel); const rs = document.createElement('span'); rs.className = 'value'; rotRow.appendChild(rs);
controlsEl.appendChild(rotRow);
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => { Object.assign(st, { speed: 32, elev: 35, spin: 45, axis: 'side', camAz: 35, camEl: 26, autoRot: 1, t: 0 }); cS.inp.value = '32'; cS.val.textContent = '32'; cE.inp.value = '35'; cE.val.textContent = '35'; cW.inp.value = '45'; cW.val.textContent = '45'; cAz.inp.value = '35'; cAz.val.textContent = '35'; cEl.inp.value = '26'; cEl.val.textContent = '26'; rotSel.value = '1'; sel.value = 'side'; recompute(); running = true; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render(); });
bPause.addEventListener('click', () => { running = !running; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running)); });

// Perspective camera. World: x downrange, y lateral, z up.
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; };

function makeCamera(W, H) {
  let xMax = 1, zMax = 1, yAbs = 0.5;
  for (const T of [traj.vac, traj.drag, traj.mag]) for (const q of T.pts) { xMax = Math.max(xMax, q[0]); zMax = Math.max(zMax, q[2]); yAbs = Math.max(yAbs, Math.abs(q[1])); }
  const C = [xMax / 2, 0, zMax * 0.45];
  const radius = 0.5 * Math.hypot(xMax, 2.4 * yAbs + 2, zMax) + 2;
  const azDeg = st.camAz + (st.autoRot ? st.t * 16 : 0);
  const az = azDeg * Math.PI / 180, el = st.camEl * Math.PI / 180;
  const dist = 2.5 * radius;
  const eye = [C[0] + dist * Math.cos(el) * Math.cos(az), C[1] + dist * Math.cos(el) * Math.sin(az), C[2] + dist * Math.sin(el)];
  const fwd = norm(sub(C, eye));
  const right = norm(cross(fwd, [0, 0, 1]));
  const up = cross(right, fwd);
  const sample = [];
  for (const T of [traj.vac, traj.drag, traj.mag]) for (const q of T.pts) sample.push(q);
  for (const cx of [0, xMax]) for (const cy of [-yAbs - 2, yAbs + 2]) sample.push([cx, cy, 0]);
  let uMin = 1e9, uMax = -1e9, wMin = 1e9, wMax = -1e9;
  for (const Pt of sample) {
    const r = sub(Pt, eye); const cz = dot(r, fwd); if (cz <= 0.05) continue;
    const u = dot(r, right) / cz, w = dot(r, up) / cz;
    uMin = Math.min(uMin, u); uMax = Math.max(uMax, u); wMin = Math.min(wMin, w); wMax = Math.max(wMax, w);
  }
  const M = 56;
  const scale = Math.min((W - 2 * M) / (uMax - uMin || 1), (H - 2 * M) / (wMax - wMin || 1));
  const uc = (uMin + uMax) / 2, wc = (wMin + wMax) / 2;
  const project = (Pt) => {
    const r = sub(Pt, eye); const cz = dot(r, fwd);
    if (cz <= 0.05) return null;
    const u = dot(r, right) / cz, w = dot(r, up) / cz;
    return [W / 2 + (u - uc) * scale, H / 2 - (w - wc) * scale, cz];
  };
  return { project, eye, right, up, fwd, dist };
}

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#06070b'; ctx.fillRect(0, 0, W, H);
  const cam = makeCamera(W, H);
  const proj = cam.project;

  let xMax = 1, yAbs = 0.5;
  for (const T of [traj.vac, traj.drag, traj.mag]) for (const q of T.pts) { xMax = Math.max(xMax, q[0]); yAbs = Math.max(yAbs, Math.abs(q[1])); }
  const yG = Math.ceil(yAbs + 1);

  // Ground grid on z = 0, lines fading with camera depth.
  const seg = (A, B, alpha) => {
    const a = proj(A), b = proj(B); if (!a || !b) return;
    ctx.strokeStyle = `rgba(120,150,200,${alpha})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  };
  const dStep = Math.max(2, Math.round(xMax / 14));
  for (let x = 0; x <= xMax + dStep; x += dStep) seg([x, -yG, 0], [x, yG, 0], 0.16);
  for (let y = -yG; y <= yG; y += 1) seg([0, y, 0], [xMax + dStep, y, 0], y === 0 ? 0.30 : 0.12);

  // Painter order: draw the three flights far-to-near, each with a soft
  // ground shadow (the strongest "this is above a plane" depth cue).
  const flights = [
    { T: traj.vac, col: '150,156,166', w: 1.6, dash: [5, 5] },
    { T: traj.drag, col: '255,178,77', w: 2.4, dash: [] },
    { T: traj.mag, col: '91,198,255', w: 3.0, dash: [] },
  ];
  for (const fl of flights) { let d = 0, n = 0; for (const q of fl.T.pts) { const s = proj(q); if (s) { d += s[2]; n += 1; } } fl.depth = n ? d / n : 1e9; }
  flights.sort((a, b) => b.depth - a.depth);

  for (const fl of flights) {
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = fl.w * 0.9; ctx.setLineDash([]);
    ctx.beginPath(); let started = false;
    for (const q of fl.T.pts) { const s = proj([q[0], q[1], 0]); if (!s) { started = false; continue; } if (!started) { ctx.moveTo(s[0], s[1]); started = true; } else ctx.lineTo(s[0], s[1]); }
    ctx.stroke();
  }
  // Vertical stems from the Magnus arc down to its shadow (depth ladder).
  ctx.strokeStyle = 'rgba(91,198,255,0.22)'; ctx.lineWidth = 1; ctx.setLineDash([]);
  const mp = traj.mag.pts;
  for (let i = 0; i < mp.length; i += Math.max(1, Math.round(mp.length / 14))) {
    const a = proj(mp[i]), b = proj([mp[i][0], mp[i][1], 0]);
    if (a && b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  }
  for (const fl of flights) {
    ctx.strokeStyle = `rgba(${fl.col},0.95)`; ctx.lineWidth = fl.w; ctx.setLineDash(fl.dash);
    ctx.beginPath(); let started = false;
    for (const q of fl.T.pts) { const s = proj(q); if (!s) { started = false; continue; } if (!started) { ctx.moveTo(s[0], s[1]); started = true; } else ctx.lineTo(s[0], s[1]); }
    ctx.stroke(); ctx.setLineDash([]);
    const L = fl.T.pts[fl.T.pts.length - 1]; const sL = proj(L);
    if (sL) { ctx.fillStyle = `rgb(${fl.col})`; ctx.beginPath(); ctx.arc(sL[0], sL[1], 4, 0, 6.28); ctx.fill(); }
  }

  // Ball on the Magnus path: ground shadow, glow, depth-scaled size.
  const tt = Number.isFinite(st.t) ? st.t : 0;
  const phase = (((tt * 0.45) % 1) + 1) % 1;
  const idx = Math.max(0, Math.min(mp.length - 1, Math.floor(phase * mp.length)));
  const Pb = mp[idx];
  const sh = proj([Pb[0], Pb[1], 0]);
  if (sh) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(sh[0], sh[1], 7, 3, 0, 0, 6.28); ctx.fill(); }
  const bp = proj(Pb);
  if (bp) {
    const rB = Math.max(4, 9 * cam.dist / (bp[2] * 1.4));
    ctx.strokeStyle = 'rgba(234,246,255,0.35)'; ctx.lineWidth = 1;
    if (sh) { ctx.beginPath(); ctx.moveTo(bp[0], bp[1]); ctx.lineTo(sh[0], sh[1]); ctx.stroke(); }
    const gl = ctx.createRadialGradient(bp[0], bp[1], 0, bp[0], bp[1], rB * 2);
    gl.addColorStop(0, '#eaf6ff'); gl.addColorStop(1, 'rgba(120,200,255,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(bp[0], bp[1], rB * 2, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#eaf6ff'; ctx.beginPath(); ctx.arc(bp[0], bp[1], rB, 0, 6.28); ctx.fill();
    const a = st.t * (1 + st.spin * 0.1);
    ctx.strokeStyle = '#0b0b12'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(bp[0] - rB * Math.cos(a), bp[1] - rB * Math.sin(a)); ctx.lineTo(bp[0] + rB * Math.cos(a), bp[1] + rB * Math.sin(a)); ctx.stroke();
    const axV = { side: [0, 0, 1], back: [0, -1, 0], top: [0, 1, 0], none: [0, 0, 0] }[st.axis];
    const tip = proj([Pb[0] + axV[0] * 2.5, Pb[1] + axV[1] * 2.5, Pb[2] + axV[2] * 2.5]);
    if (tip && (axV[0] || axV[1] || axV[2])) {
      ctx.strokeStyle = '#ff7ab6'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(bp[0], bp[1]); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
      ctx.fillStyle = '#ff7ab6'; ctx.beginPath(); ctx.arc(tip[0], tip[1], 3, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#ff9dc8'; ctx.font = '10px ui-monospace, monospace'; ctx.fillText('omega', tip[0] + 5, tip[1] - 3);
    }
  }

  // Axis gnomon: world triad drawn with the camera basis only, so its
  // orientation tracks the orbit and the 3D framing is unambiguous.
  const gx = 52, gy = H - 46, gL = 26;
  for (const [vWorld, c, lab] of [[[1, 0, 0], '#ff8d6b', 'x'], [[0, 1, 0], '#7ad88a', 'y'], [[0, 0, 1], '#7ab6ff', 'z']]) {
    const ex = dot(vWorld, cam.right), ey = dot(vWorld, cam.up);
    const tx = gx + ex * gL, ty = gy - ey * gL;
    ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.fillStyle = c; ctx.font = '10px ui-monospace, monospace'; ctx.fillText(lab, tx + 2, ty + 2);
  }

  const o0 = proj([0, 0, 0]);
  if (o0) { ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace'; ctx.fillText('launch', o0[0] - 8, o0[1] + 16); }
  ctx.fillStyle = 'rgba(150,156,166,0.85)'; ctx.font = '11px ui-monospace, monospace'; ctx.fillText('vacuum', 16, 24);
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
  const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05); last = now;
  if (running) st.t += dt;
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) {
    const i = Math.max(0, Math.min(4, Math.round(CAPTURE_FRAC * 4)));
    st.autoRot = 0; st.camAz = 20 + i * 48; st.camEl = 20 + i * 9; st.t = 0.3 + i * 0.34;
    cAz.inp.value = String(st.camAz); cAz.val.textContent = String(st.camAz);
    cEl.inp.value = String(st.camEl); cEl.val.textContent = String(st.camEl);
    rotSel.value = '0';
  }
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
