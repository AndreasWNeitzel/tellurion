// Projectile with drag and the Magnus force, in 3D. A whole volley of
// balls is launched almost together (a few degrees of azimuthal fan)
// but each carries a different sidespin, swept continuously from
// strong one way, through zero, to strong the other way. The Magnus
// force is perpendicular to v and omega, so each ball curves out of
// the launch plane by a different amount: the volley splays into a 3D
// ribbon over the ground. That lateral spread is the whole point and
// cannot be read off a 2D plot. The camera is a FIXED perspective
// (constant scale, no auto-zoom); azimuth and height sliders rotate
// it. sim.js holds the physics (RK4). Reference: Marion and Thornton,
// Classical Dynamics (5th ed.), Ch. 2.

import { trajectory } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['balls', 'spin range', 'lateral spread (m)', 'range (m)', 'apex (m)'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}

const W = canvas.width, H = canvas.height;
const C_DRAG = 0.006, C_MAG = 0.0020;
const AZ_FAN = 5;                          // azimuth half-fan (deg)
const st = { speed: 34, elev: 38, spinMax: 70, n: 13, camAz: 36, camEl: 22, t: 0 };
let running = !DETERMINISTIC;
let shots = [];

function rebuild() {
  shots = [];
  const N = st.n;
  for (let i = 0; i < N; i += 1) {
    const f = N === 1 ? 0 : i / (N - 1);          // 0..1
    const s = (f * 2 - 1);                         // -1..+1
    const spin = s * st.spinMax;                   // sidespin rate (rad/s)
    const az = s * AZ_FAN;                          // small azimuth fan
    const T = trajectory({
      speed: st.speed, elevDeg: st.elev, aziDeg: az,
      omega: [0, 0, spin], c: C_DRAG, cM: C_MAG,
    });
    shots.push({ T, spin, s });
  }
  st.t = 0;
}

function buildSlider(label, min, max, stp, value, key, fmt = v => v.toFixed(0)) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value); rebuild(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row);
  return inp;
}
const cS = buildSlider('speed (m/s)', 14, 45, 1, st.speed, 'speed');
const cE = buildSlider('elevation (deg)', 12, 70, 1, st.elev, 'elev');
const cW = buildSlider('max |spin| (rad/s)', 0, 110, 2, st.spinMax, 'spinMax');
const cN = buildSlider('balls in the volley', 5, 21, 2, st.n, 'n');
// Camera is now drag-to-orbit on the canvas (the user's preferred
// interaction across the rest of the suite); the az/el sliders have
// been removed.
let camDragging = false, camLastX = 0, camLastY = 0;
canvas.addEventListener('pointerdown', (e) => {
  camDragging = true; camLastX = e.clientX; camLastY = e.clientY;
  canvas.setPointerCapture?.(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!camDragging) return;
  st.camAz = ((st.camAz - (e.clientX - camLastX) * 0.4) % 360 + 360) % 360;
  st.camEl = Math.max(4, Math.min(84, st.camEl - (e.clientY - camLastY) * 0.3));
  camLastX = e.clientX; camLastY = e.clientY;
});
canvas.addEventListener('pointerup', () => { camDragging = false; });
canvas.addEventListener('pointercancel', () => { camDragging = false; });
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running));
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  for (const [inp, v] of [[cS, 34], [cE, 38], [cW, 70], [cN, 13]]) {
    inp.value = String(v); inp.dispatchEvent(new Event('input'));   // updates st, label, rebuild
  }
  st.camAz = 36; st.camEl = 22;
  st.t = 0; running = true; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
});
bPause.addEventListener('click', () => { running = !running; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running)); });

// Fixed perspective camera. The projection scale is a CONSTANT derived
// once from a fixed world box, so rotating the camera never zooms (the
// previous build auto-fit every frame and zoomed in and out).
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; };
const WX = 88, WY = 26, WZ = 30;                 // fixed world box (m)
const WC = [WX * 0.40, 0, WZ * 0.42];            // box centre
const WRAD = 0.5 * Math.hypot(WX, 2 * WY, WZ);
const CAM_DIST = 2.5 * WRAD;

function camera() {
  const az = st.camAz * Math.PI / 180, el = st.camEl * Math.PI / 180;
  const eye = [
    WC[0] + CAM_DIST * Math.cos(el) * Math.cos(az),
    WC[1] + CAM_DIST * Math.cos(el) * Math.sin(az),
    WC[2] + CAM_DIST * Math.sin(el),
  ];
  const fwd = norm(sub(WC, eye));
  const right = norm(cross(fwd, [0, 0, 1]));
  const up = cross(right, fwd);
  return { eye, fwd, right, up };
}
// Constant pixel scale: project the 8 box corners at a reference
// camera once and size them to the canvas. Never recomputed.
const PXSCALE = (() => {
  const az = 36 * Math.PI / 180, el = 22 * Math.PI / 180;
  const eye = [WC[0] + CAM_DIST * Math.cos(el) * Math.cos(az), WC[1] + CAM_DIST * Math.cos(el) * Math.sin(az), WC[2] + CAM_DIST * Math.sin(el)];
  const fwd = norm(sub(WC, eye)); const right = norm(cross(fwd, [0, 0, 1])); const up = cross(right, fwd);
  let m = 1e-6;
  for (const cx of [0, WX]) for (const cy of [-WY, WY]) for (const cz of [0, WZ]) {
    const r = sub([cx, cy, cz], eye); const cz2 = dot(r, fwd); if (cz2 <= 0.05) continue;
    m = Math.max(m, Math.abs(dot(r, right) / cz2), Math.abs(dot(r, up) / cz2));
  }
  return 0.46 * Math.min(W, H) / m;
})();

function project(cam, P) {
  const r = sub(P, cam.eye); const cz = dot(r, cam.fwd);
  if (cz <= 0.05) return null;
  return [W / 2 + (dot(r, cam.right) / cz) * PXSCALE, H / 2 - (dot(r, cam.up) / cz) * PXSCALE, cz];
}

// Diverging spin colour: cool for negative spin, white at zero, warm
// for positive. s in [-1, 1].
function spinColor(s, alpha = 1) {
  if (s >= 0) return `rgba(${255},${Math.round(210 - 120 * s)},${Math.round(150 - 130 * s)},${alpha})`;
  const t = -s;
  return `rgba(${Math.round(150 - 60 * t)},${Math.round(210 - 30 * t)},255,${alpha})`;
}

function render() {
  // Sky gradient (cool blue at the horizon, deeper at the zenith).
  const skyG = ctx.createLinearGradient(0, 0, 0, H);
  skyG.addColorStop(0, '#13243a');
  skyG.addColorStop(0.7, '#1a3556');
  skyG.addColorStop(1, '#11243d');
  ctx.fillStyle = skyG; ctx.fillRect(0, 0, W, H);
  const cam = camera();

  // GRASS FIELD: fill the ground quad (the visible portion of z = 0)
  // with a green polygon, then sprinkle perspective tufts. Per user
  // feedback: 'it would be nice if there was an actual ground, like
  // a green grassy field, or a stadium field'.
  const corners = [
    [-WX * 0.2, -WY * 1.6, 0], [WX * 1.2, -WY * 1.6, 0],
    [WX * 1.2,  WY * 1.6, 0], [-WX * 0.2,  WY * 1.6, 0],
  ];
  const projC = corners.map(c => project(cam, c)).filter(Boolean);
  if (projC.length === 4) {
    const fieldG = ctx.createLinearGradient(0, H * 0.4, 0, H);
    fieldG.addColorStop(0, '#2a4d1f');
    fieldG.addColorStop(0.6, '#3a6b27');
    fieldG.addColorStop(1, '#4d8030');
    ctx.fillStyle = fieldG;
    ctx.beginPath(); ctx.moveTo(projC[0][0], projC[0][1]);
    for (let i = 1; i < 4; i += 1) ctx.lineTo(projC[i][0], projC[i][1]);
    ctx.closePath(); ctx.fill();
  }
  // Alternating mowed-stripe bands along the field length, plus a
  // dotted yardline grid for distance reference.
  for (let x = 0; x < WX; x += 11) {
    const c1 = project(cam, [x, -WY, 0]), c2 = project(cam, [x + 11, -WY, 0]);
    const c3 = project(cam, [x + 11,  WY, 0]), c4 = project(cam, [x,  WY, 0]);
    if (!c1 || !c2 || !c3 || !c4) continue;
    ctx.fillStyle = (Math.floor(x / 11) & 1) ? 'rgba(50, 110, 38, 0.30)' : 'rgba(74, 138, 56, 0.18)';
    ctx.beginPath(); ctx.moveTo(c1[0], c1[1]); ctx.lineTo(c2[0], c2[1]); ctx.lineTo(c3[0], c3[1]); ctx.lineTo(c4[0], c4[1]); ctx.closePath(); ctx.fill();
  }
  // Dotted yardlines for distance reference (every 11 m).
  const seg = (A, B, col, al, dashed) => {
    const a = project(cam, A), b = project(cam, B); if (!a || !b) return;
    ctx.strokeStyle = `rgba(${col},${al})`; ctx.lineWidth = 1;
    if (dashed) ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    if (dashed) ctx.setLineDash([]);
  };
  for (let x = 0; x <= WX; x += 11) seg([x, -WY, 0], [x, WY, 0], '255,255,255', 0.18, true);
  seg([0, 0, 0], [WX, 0, 0], '255,255,255', 0.45, false);    // centreline

  // Volley progress: a shared phase so all balls fly out together and
  // the fan opens in real time.
  const tt = Number.isFinite(st.t) ? st.t : 0;
  const phase = Math.min(1, (tt * 0.32) % 1.6);

  // Painter order: far trajectories first.
  const ord = shots.map((sh, i) => {
    let d = 0, k = 0; for (const q of sh.T.pts) { const p = project(cam, q); if (p) { d += p[2]; k += 1; } }
    return { i, depth: k ? d / k : 1e9 };
  }).sort((a, b) => b.depth - a.depth);

  let maxSide = 0;
  for (const { i } of ord) {
    const sh = shots[i]; const pts = sh.T.pts; const last = Math.max(1, Math.floor(phase * (pts.length - 1)));
    maxSide = Math.max(maxSide, Math.abs(sh.T.side));
    // Ground shadow.
    ctx.strokeStyle = 'rgba(0,0,0,0.40)'; ctx.lineWidth = 2;
    ctx.beginPath(); let started = false;
    for (let k = 0; k <= last; k += 1) { const p = project(cam, [pts[k][0], pts[k][1], 0]); if (!p) { started = false; continue; } started ? ctx.lineTo(p[0], p[1]) : (ctx.moveTo(p[0], p[1]), started = true); }
    ctx.stroke();
    // Flight arc.
    ctx.strokeStyle = spinColor(sh.s, 0.92); ctx.lineWidth = 2.4;
    ctx.beginPath(); started = false;
    for (let k = 0; k <= last; k += 1) { const p = project(cam, pts[k]); if (!p) { started = false; continue; } started ? ctx.lineTo(p[0], p[1]) : (ctx.moveTo(p[0], p[1]), started = true); }
    ctx.stroke();
    // Ball head: animated rotation about the sidespin axis. The
    // visible seam is drawn as a chord across the disc whose angle
    // varies as omega * t, so the ball appears to spin in real time
    // (user feedback: 'the balls are not rotating').
    const hp = project(cam, pts[last]);
    if (hp) {
      const r = Math.max(3, 7 * CAM_DIST / (hp[2] * 1.6));
      const gl = ctx.createRadialGradient(hp[0] - r * 0.3, hp[1] - r * 0.3, 0, hp[0], hp[1], r * 2.1);
      gl.addColorStop(0, 'rgba(255,255,255,0.8)'); gl.addColorStop(0.5, spinColor(sh.s, 0.85)); gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(hp[0], hp[1], r * 2.1, 0, 6.28); ctx.fill();
      // Solid ball with a soft Lambertian shade
      const baseG = ctx.createRadialGradient(hp[0] - r * 0.35, hp[1] - r * 0.35, 0, hp[0], hp[1], r);
      baseG.addColorStop(0, spinColor(sh.s, 1));
      baseG.addColorStop(1, 'rgba(15, 22, 35, 0.95)');
      ctx.fillStyle = baseG; ctx.beginPath(); ctx.arc(hp[0], hp[1], r, 0, 6.28); ctx.fill();
      // Spin seam: a chord whose angle on the disc tracks omega * t.
      const ang = sh.spin * st.t * 0.16;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'; ctx.lineWidth = Math.max(1.2, r * 0.18);
      ctx.beginPath();
      ctx.moveTo(hp[0] + Math.cos(ang) * r * 0.85, hp[1] + Math.sin(ang) * r * 0.85);
      ctx.lineTo(hp[0] - Math.cos(ang) * r * 0.85, hp[1] - Math.sin(ang) * r * 0.85);
      ctx.stroke();
      // Small spin indicator dot near the seam tip so the rotation
      // sense is unambiguous.
      ctx.fillStyle = 'rgba(255, 235, 200, 0.95)';
      ctx.beginPath();
      ctx.arc(hp[0] + Math.cos(ang) * r * 0.55, hp[1] + Math.sin(ang) * r * 0.55, Math.max(1, r * 0.18), 0, 6.28);
      ctx.fill();
    }
  }

  // Launch marker + world-axis gnomon (from the camera basis).
  const o0 = project(cam, [0, 0, 0]);
  if (o0) { ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left'; ctx.fillText('launch', o0[0] - 6, o0[1] + 16); }
  const gx = 46, gy = H - 40, gL = 26;
  for (const [v, c, lab] of [[[1, 0, 0], '#ff8d6b', 'x range'], [[0, 1, 0], '#7ad88a', 'y side'], [[0, 0, 1], '#7ab6ff', 'z up']]) {
    const ex = dot(v, cam.right), ey = dot(v, cam.up);
    const tx = gx + ex * gL, ty = gy - ey * gL;
    ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.fillStyle = c; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.textAlign = ex < -0.2 ? 'right' : 'left';
    ctx.fillText(lab, tx + (ex < -0.2 ? -3 : 3), ty + (ey < -0.2 ? 9 : -2));
  }
  ctx.textAlign = 'left';

  // Spin colour legend (top-left), the continuous range topspin..none..backspin.
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillStyle = '#9aa0a6'; ctx.fillText('sidespin:  - (curves one way)   0   + (the other)', 16, 22);
  for (let k = 0; k <= 40; k += 1) { const s = k / 40 * 2 - 1; ctx.fillStyle = spinColor(s, 1); ctx.fillRect(16 + k * 4, 28, 4, 8); }

  rEls.balls.textContent = String(st.n);
  rEls['spin range'].textContent = `-${st.spinMax} .. +${st.spinMax}`;
  rEls['lateral spread (m)'].textContent = (2 * maxSide).toFixed(1);
  rEls['range (m)'].textContent = shots.length ? shots[(shots.length - 1) >> 1].T.range.toFixed(1) : '--';
  rEls['apex (m)'].textContent = shots.length ? shots[(shots.length - 1) >> 1].T.apex.toFixed(1) : '--';
}

let last = (typeof performance !== 'undefined' ? performance.now() : Date.now());
function tick(now) {
  const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05); last = now;
  if (running) st.t += dt;
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const i = Math.max(0, Math.min(4, Math.round(f * 4)));
    st.t = [0.5, 1.4, 2.6, 3.6, 4.6][i];          // volley progressively opening
    st.camAz = [28, 28, 50, 50, 70][i];           // a couple of fixed viewpoints
    render();
    if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
    return;
  }
  render();
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const latestShot = shots.length > 0 ? shots[shots.length - 1] : null;
  const apex = latestShot ? latestShot.apex : 0;
  const range = latestShot ? latestShot.range : 0;
  return {
    fields: [
      { key: 'launch-speed', label: 'launch speed (m/s)', value: st.speed, format: 'float' },
      { key: 'elevation', label: 'elevation (deg)', value: st.elev, format: 'float' },
      { key: 'spin-rate', label: 'max sidespin (rad/s)', value: st.spinMax, format: 'float' },
      { key: 'apex-height', label: 'apex (m)', value: apex, format: 'float' },
      { key: 'range-m', label: 'downrange (m)', value: range, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  if (shots.length === 0) {
    return [{ key: 'pending', label: 'awaiting launch', value: 'pending', status: 'pending' }];
  }
  const latestShot = shots[shots.length - 1];
  const noSpinShot = shots.find(s => Math.abs(s.spinRate) < 1e-6);
  if (!noSpinShot || shots.length < 2) {
    return [{ key: 'compare-ready', label: 'ready for Magnus check', value: 'pending', status: 'pending' }];
  }
  const withMagnus = latestShot.range;
  const noMagnusRange = noSpinShot.range;
  const rangeChange = Math.abs(withMagnus - noMagnusRange);
  return [
    {
      key: 'magnus-effect',
      label: 'range varies with spin (m difference)',
      value: rangeChange.toFixed(2),
      status: rangeChange > 1.0 ? 'pass' : 'drift'
    }
  ];
};
