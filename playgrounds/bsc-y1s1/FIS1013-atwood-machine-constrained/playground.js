import { fontString } from '../../../shared/js/canvas-type.js';
// Atwood machine. The point is the gravity-vs-tension interplay, so
// the default pulley is ideal (massless): each block shows its weight
// m g (down) and the rope tension T (up); the net (m1-m2)g is what
// accelerates the pair. A "double" toggle adds the compound machine (a
// movable pulley carrying m2 and m3). Blocks stop when one reaches the
// pulley or the floor (no teleport-reset), and you can grab and tug a
// block with the mouse. The optional pulley-mass slider is the
// advanced case (unequal tensions, I/R^2 braking). sim.js holds the
// physics. Reference: Kleppner and Kolenkow, Mechanics 2e, Ch. 3;
// Morin, Introduction to Classical Mechanics, Ch. 3 (double Atwood).

import {
  createAtwood, step, tensions, energy, pulleyInertia,
  createDouble, stepDouble, doubleAccel, doubleVels, energyDouble, G,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['a (m/s²)', 'T1 (N)', 'T2 (N)', 'net (N)', 'state'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}

const W = canvas.width, H = canvas.height;
const PX = 150;                 // pixels per metre
const PULLEY_Y = 86;
const FLOOR_Y = H - 54;
// A block hangs ROPE0 m below its pulley at rest; it may rise until it
// is just under the pulley or fall until it meets the floor. LLIM is
// that half-travel in metres (symmetric about the rest position).
const ROPE0 = (FLOOR_Y - PULLEY_Y) / PX / 2;
const LLIM = ROPE0 - 0.16;
const PXD = 64;                 // px per metre for the compound rig
const LLIM2 = 1.4;              // travel bound for the m2/m3 pair (q2)

const DEF = { m1: 3, m2: 2, M: 0, R: 0.4, kind: 'disk' };
const DEFD = { m1: 4, m2: 2, m3: 1 };
let mode = 'single';
let s = createAtwood({ ...DEF });
let running = !DETERMINISTIC, vHist = [], aHist = [];
const HIST = 240;
const drag = { active: false, which: null, lastY: 0, lastT: 0, v: 0 };

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
function resetMotion() {
  if (mode === 'double') { s.q1 = 0; s.v1 = 0; s.q2 = 0; s.v2 = 0; s.t = 0; }
  else { s.x = 0; s.v = 0; s.t = 0; }
  vHist = []; aHist = []; s.stopped = false;
}

const modeRow = document.createElement('div'); modeRow.className = 'row';
const modeLab = document.createElement('span'); modeLab.className = 'label'; modeLab.textContent = 'machine';
const modeSel = document.createElement('select'); modeSel.setAttribute('aria-label', 'machine type');
for (const [v, t] of [['single', 'single Atwood'], ['double', 'double (compound)']]) { const o = document.createElement('option'); o.value = v; o.textContent = t; modeSel.appendChild(o); }
modeRow.appendChild(modeLab); modeRow.appendChild(modeSel); const mSp = document.createElement('span'); mSp.className = 'value'; modeRow.appendChild(mSp);
controlsEl.appendChild(modeRow);

const sM1 = buildSlider('m₁ (kg)', 0.5, 8, 0.1, DEF.m1, v => { s.m1 = v; resetMotion(); render(); });
const sM2 = buildSlider('m₂ (kg)', 0.5, 8, 0.1, DEF.m2, v => { s.m2 = v; resetMotion(); render(); });
const sM3 = buildSlider('m₃ (kg)', 0.5, 8, 0.1, DEFD.m3, v => { s.m3 = v; resetMotion(); render(); });
const sMP = buildSlider('pulley M (kg, adv.)', 0, 12, 0.1, DEF.M, v => { s.M = v; resetMotion(); render(); });
const m3row = sM3.closest('.row'); const mProw = sMP.closest('.row');

function applyModeUI() {
  m3row.style.display = mode === 'double' ? '' : 'none';
  mProw.style.display = mode === 'double' ? 'none' : '';
}
modeSel.addEventListener('change', () => {
  mode = modeSel.value;
  if (mode === 'double') { s = createDouble({ ...DEFD }); sM1.value = String(DEFD.m1); sM2.value = String(DEFD.m2); sM3.value = String(DEFD.m3); }
  else { s = createAtwood({ ...DEF }); sM1.value = String(DEF.m1); sM2.value = String(DEF.m2); sMP.value = String(DEF.M); }
  sM1.dispatchEvent(new Event('input')); sM2.dispatchEvent(new Event('input'));
  applyModeUI(); resetMotion(); render();
});

const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running));
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  if (mode === 'double') { s = createDouble({ ...DEFD }); sM1.value = String(DEFD.m1); sM2.value = String(DEFD.m2); sM3.value = String(DEFD.m3); }
  else { s = createAtwood({ ...DEF }); sM1.value = String(DEF.m1); sM2.value = String(DEF.m2); sMP.value = String(DEF.M); }
  resetMotion(); running = true; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render();
});
bPause.addEventListener('click', () => { running = !running; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running)); });
applyModeUI();

const blockSize = (m) => 13 + 10 * Math.cbrt(m);   // halved: the rig was cramped
const clampF = (px) => Math.max(-150, Math.min(150, px));

function arrow(x, y, dx, dy, col, w = 4) {
  const L = Math.hypot(dx, dy); if (L < 0.5) return; const ux = dx / L, uy = dy / L;
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - 10 * ux + 6 * uy, y + dy - 10 * uy - 6 * ux);
  ctx.lineTo(x + dx - 10 * ux - 6 * uy, y + dy - 10 * uy + 6 * ux);
  ctx.closePath(); ctx.fill();
}

// Block screen y for a given downward displacement d (metres) from a
// pulley at py. Clamped so it never passes the pulley or the floor.
function blockY(py, d) {
  const yRest = py + ROPE0 * PX;
  return Math.max(py + 16, Math.min(FLOOR_Y, yRest + d * PX));
}

let blockHit = [];   // [{which,x,y,w,h}] for pointer hit-testing

function drawBlock(bx, by, m, label, col) {
  const bs = blockSize(m);
  ctx.fillStyle = col; ctx.fillRect(bx - bs / 2, by, bs, bs);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; ctx.strokeRect(bx - bs / 2, by, bs, bs);
  ctx.fillStyle = '#0b0b10'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(label, bx, by + bs / 2 + 4);
  return bs;
}

// The HTML readout panel overlays the canvas top-right; keep all canvas
// drawing in the machine column (x < 470) or the lower band (y > 360).
const HUD_SAFE_X = 470;
function capDown(by, bs, target) { return Math.max(8, Math.min(target, FLOOR_Y - (by + bs) - 4)); }
function capUp(by, target) { return Math.max(8, Math.min(target, by - PULLEY_Y - 6)); }

function renderSingle() {
  const { a, T1, T2 } = tensions(s);
  const cx = 224;
  const Rpx = 24 + s.R * 22 + 6 * Math.cbrt(Math.max(0.05, s.M));
  const g = ctx.createRadialGradient(cx - 6, PULLEY_Y - 6, 2, cx, PULLEY_Y, Rpx);
  g.addColorStop(0, '#7790c8'); g.addColorStop(1, 'rgba(34,42,66,1)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, PULLEY_Y, Rpx, 0, 6.28); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2; ctx.stroke();
  const th = s.x / Math.max(0.05, s.R);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, PULLEY_Y); ctx.lineTo(cx + Rpx * Math.cos(th), PULLEY_Y + Rpx * Math.sin(th)); ctx.stroke();
  ctx.strokeStyle = '#5a5f6a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, PULLEY_Y - Rpx); ctx.lineTo(cx, 22); ctx.stroke();

  const x1 = cx - Rpx, x2 = cx + Rpx;
  const y1 = blockY(PULLEY_Y, s.x), y2 = blockY(PULLEY_Y, -s.x);
  ctx.strokeStyle = '#c9cdd4'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x1, PULLEY_Y); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, PULLEY_Y); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, PULLEY_Y, Rpx, Math.PI, 2 * Math.PI); ctx.stroke();

  blockHit = [];
  for (const [bx, by, m, T, name, col, w] of [[x1, y1, s.m1, T1, 'm₁', '#ff9d6e', 1], [x2, y2, s.m2, T2, 'm₂', '#7cc6ff', 2]]) {
    const bs = drawBlock(bx, by, m, name, col);
    blockHit.push({ which: w, x: bx - bs / 2, y: by, w: bs, h: bs });
    const wLen = capDown(by, bs, m * G * 3.4), tLen = capUp(by, T * 3.4);
    arrow(bx, by + bs, 0, wLen, '#ef476f', 5);
    arrow(bx, by, 0, -tLen, '#06d6a0', 5);
    ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
    ctx.fillStyle = '#ef476f'; ctx.fillText(`mg=${(m * G).toFixed(0)}`, bx + bs / 2 + 6, by + bs + wLen / 2);
    ctx.fillStyle = '#06d6a0'; ctx.fillText(`T=${T.toFixed(0)}`, bx + bs / 2 + 6, by - tLen / 2);
  }
  ctx.textAlign = 'left';
  rEls['a (m/s²)'].textContent = a.toFixed(3);
  rEls['T1 (N)'].textContent = T1.toFixed(2);
  rEls['T2 (N)'].textContent = T2.toFixed(2);
  rEls['net (N)'].textContent = ((s.m1 - s.m2) * G).toFixed(2);
  rEls.state.textContent = s.stopped ? (s.x > 0 ? 'm₁ at floor' : 'm₂ at floor')
    : (Math.abs(a) < 1e-6 ? 'balanced' : (s.m1 > s.m2 ? 'm₁ falls' : 'm₂ falls'));
}

function renderDouble() {
  const { T, T2, a1 } = doubleAccel(s);
  const cxA = 200, RA = 22;
  ctx.fillStyle = '#6d86bf'; ctx.beginPath(); ctx.arc(cxA, PULLEY_Y, RA, 0, 6.28); ctx.fill();
  ctx.strokeStyle = '#5a5f6a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cxA, PULLEY_Y - RA); ctx.lineTo(cxA, 22); ctx.stroke();
  const xL = cxA - RA, xR = cxA + RA;
  // Rope 1 is inextensible: m1 down by q1 <=> movable pulley B up by q1.
  const y1 = Math.max(PULLEY_Y + RA + 8, Math.min(FLOOR_Y, PULLEY_Y + RA + (2.6 + s.q1) * PXD));
  const RB = 18;
  const yB = Math.max(PULLEY_Y + RA + RB + 26, Math.min(FLOOR_Y - 150, PULLEY_Y + RA + RB + 26 + (1.7 - s.q1) * PXD));
  ctx.strokeStyle = '#c9cdd4'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(xL, PULLEY_Y); ctx.lineTo(xL, y1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(xR, PULLEY_Y); ctx.lineTo(xR, yB - RB); ctx.stroke();
  ctx.beginPath(); ctx.arc(cxA, PULLEY_Y, RA, Math.PI, 2 * Math.PI); ctx.stroke();
  const cxB = xR;
  ctx.fillStyle = '#6d86bf'; ctx.beginPath(); ctx.arc(cxB, yB, RB, 0, 6.28); ctx.fill();
  const xB1 = cxB - RB, xB2 = cxB + RB;
  const y2 = Math.max(yB + RB + 8, Math.min(FLOOR_Y, yB + RB + (0.9 + s.q2) * PXD));
  const y3 = Math.max(yB + RB + 8, Math.min(FLOOR_Y, yB + RB + (0.9 - s.q2) * PXD));
  ctx.strokeStyle = '#c9cdd4'; ctx.lineWidth = 2;
  // Rope 2 drapes OVER the top of the movable pulley: it leaves the
  // side tangent points (y = yB) straight down to m2 / m3, and the
  // visible arc is the TOP half (PI..2PI in screen coords, like the
  // fixed pulley). It was 0..PI, which drew the rope wrapping under.
  ctx.beginPath(); ctx.moveTo(xB1, yB); ctx.lineTo(xB1, y2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(xB2, yB); ctx.lineTo(xB2, y3); ctx.stroke();
  ctx.beginPath(); ctx.arc(cxB, yB, RB, Math.PI, 2 * Math.PI); ctx.stroke();

  blockHit = [];
  for (const [bx, by, m, name, col, w] of [[xL, y1, s.m1, 'm₁', '#ff9d6e', 1], [xB1, y2, s.m2, 'm₂', '#7cc6ff', 2], [xB2, y3, s.m3, 'm₃', '#a0e0a0', 3]]) {
    const bs = drawBlock(bx, by, m, name, col);
    blockHit.push({ which: w, x: bx - bs / 2, y: by, w: bs, h: bs });
    arrow(bx, by + bs, 0, capDown(by, bs, m * G * 2.6), '#ef476f', 4);
  }
  // Tension annotations in the clear lower-right band (below the HUD).
  ctx.fillStyle = '#06d6a0'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`fixed-pulley rope:    T  = ${T.toFixed(1)} N`, 330, 400);
  ctx.fillText(`movable-pulley rope:  T₂ = ${T2.toFixed(1)} N`, 330, 422);
  ctx.fillStyle = '#9aa0a6';
  ctx.fillText('massless movable pulley  =>  T = 2 T₂', 330, 444);
  ctx.fillText(`m₁ at ${a1.toFixed(2)} m/s²,  movable pulley at ${(-a1).toFixed(2)} m/s²`, 330, 466);
  ctx.textAlign = 'left';
  rEls['a (m/s²)'].textContent = a1.toFixed(3);
  rEls['T1 (N)'].textContent = T.toFixed(2);
  rEls['T2 (N)'].textContent = T2.toFixed(2);
  rEls['net (N)'].textContent = `${(s.m1 * G).toFixed(1)}/${((s.m2 + s.m3) * G).toFixed(1)}`;
  rEls.state.textContent = s.stopped ? 'block reached a stop' : 'running';
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  // Floor (under the machine column only).
  ctx.strokeStyle = '#3a3f4a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(20, FLOOR_Y); ctx.lineTo(HUD_SAFE_X - 30, FLOOR_Y); ctx.stroke();
  ctx.fillStyle = '#22252c';
  for (let x = 24; x < HUD_SAFE_X - 34; x += 16) { ctx.beginPath(); ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x - 8, FLOOR_Y + 9); ctx.lineTo(x + 2, FLOOR_Y); ctx.fill(); }
  if (mode === 'double') renderDouble(); else renderSingle();
  if (drag.active) {
    ctx.fillStyle = 'rgba(255,209,102,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
    ctx.fillText('tugging the block; release to resume the dynamics', 24, H - 14);
  }
  // v(t) / a(t) trace (single only), in the clear lower band.
  if (mode === 'single') {
    const px0 = 330, px1 = W - 24, pyt = 372, pyb = H - 26, midY = (pyt + pyb) / 2;
    ctx.fillStyle = '#0c0c14'; ctx.fillRect(px0 - 8, pyt - 22, px1 - px0 + 32, pyb - pyt + 40);
    ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px0, midY); ctx.lineTo(px1, midY); ctx.moveTo(px0, pyt); ctx.lineTo(px0, pyb); ctx.stroke();
    ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left'; ctx.fillText('v(t)  and  a(t)', px0, pyt - 7);
    const plot = (hist, sc, col) => {
      if (hist.length < 2) return;
      ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.beginPath();
      hist.forEach((val, i) => { const X = px0 + i / HIST * (px1 - px0); const Y = midY - Math.max(-((pyb - pyt) / 2), Math.min((pyb - pyt) / 2, val * sc)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
      ctx.stroke();
    };
    plot(vHist, 14, '#ffd166'); plot(aHist, 22, '#5bc0eb');
    ctx.fillStyle = '#ffd166'; ctx.fillText('v', px1 - 16, pyt + 12); ctx.fillStyle = '#5bc0eb'; ctx.fillText('a', px1 - 16, pyt + 28);
  }
}

const PHYS_DT = 0.002;
function clampStops() {
  if (mode === 'double') {
    // Only m1 reaching the floor / fixed pulley is a true full stop.
    if (Math.abs(s.q1) >= LLIM) { s.q1 = Math.sign(s.q1) * LLIM; s.v1 = 0; s.v2 = 0; s.stopped = true; }
    // m2 / m3 hitting their travel limit just pins THAT pair (clamp,
    // zero its rate); the machine keeps running on the q1 degree of
    // freedom. The old code froze the whole rig here, which made it
    // stop at seemingly random times.
    else if (Math.abs(s.q2) >= LLIM2) { s.q2 = Math.sign(s.q2) * LLIM2; s.v2 = 0; }
  } else if (Math.abs(s.x) >= LLIM) { s.x = Math.sign(s.x) * LLIM; s.v = 0; s.stopped = true; }
}
function advance(dtSim) {
  if (s.stopped || drag.active) return;
  const n = Math.min(4000, Math.round(dtSim / PHYS_DT));
  for (let i = 0; i < n; i += 1) {
    if (mode === 'double') stepDouble(s, PHYS_DT); else step(s, PHYS_DT);
    clampStops();
    if (s.stopped) break;
    if (mode === 'single' && i % 6 === 0) {
      vHist.push(s.v); aHist.push(tensions(s).a);
      if (vHist.length > HIST) vHist.shift();
      if (aHist.length > HIST) aHist.shift();
    }
  }
}

// Grab and tug. Pointer maps to a block; dragging sets the constrained
// displacement, releasing hands a velocity back to the dynamics.
function canvasPos(ev) {
  const r = canvas.getBoundingClientRect();
  return { x: (ev.clientX - r.left) * (W / r.width), y: (ev.clientY - r.top) * (H / r.height) };
}
canvas.addEventListener('pointerdown', (ev) => {
  const p = canvasPos(ev);
  for (const b of blockHit) {
    if (p.x >= b.x - 6 && p.x <= b.x + b.w + 6 && p.y >= b.y - 6 && p.y <= b.y + b.h + 18) {
      drag.active = true; drag.which = b.which; drag.lastY = p.y; drag.lastT = performance.now(); drag.v = 0;
      s.stopped = false; canvas.setPointerCapture(ev.pointerId); ev.preventDefault(); return;
    }
  }
});
canvas.addEventListener('pointermove', (ev) => {
  if (!drag.active) return;
  const p = canvasPos(ev);
  const now = performance.now(); const dtm = Math.max(1e-3, (now - drag.lastT) / 1000);
  // Map screen pixels to metres with the SAME scale the active rig is
  // drawn at (single uses PX, the compound rig uses PXD). Using PX for
  // both made the double-mode drag and the released velocity wrong.
  const sPx = mode === 'double' ? PXD : PX;
  const dMetres = (p.y - drag.lastY) / sPx;
  drag.v = (p.y - drag.lastY) / sPx / dtm;
  // m1 down is +; dragging m2/m3 down pulls m1 up (sign per block).
  const signFor = (w) => (w === 1 ? 1 : -1);
  if (mode === 'double') {
    if (drag.which === 1) s.q1 = Math.max(-LLIM, Math.min(LLIM, s.q1 + dMetres));
    else s.q2 = Math.max(-LLIM2, Math.min(LLIM2, s.q2 + dMetres * (drag.which === 2 ? 1 : -1)));
  } else {
    s.x = Math.max(-LLIM, Math.min(LLIM, s.x + dMetres * signFor(drag.which)));
  }
  drag.lastY = p.y; drag.lastT = now; render();
});
function endDrag(ev) {
  if (!drag.active) return;
  drag.active = false;
  const vv = Math.max(-6, Math.min(6, drag.v));
  if (mode === 'double') { if (drag.which === 1) s.v1 = vv; else s.v2 = vv * (drag.which === 2 ? 1 : -1); }
  else s.v = vv * (drag.which === 1 ? 1 : -1);
  if (ev && ev.pointerId !== undefined && canvas.hasPointerCapture?.(ev.pointerId)) canvas.releasePointerCapture(ev.pointerId);
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) advance(dt);
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    if (f >= 0.8) { mode = 'double'; modeSel.value = 'double'; s = createDouble({ ...DEFD }); applyModeUI(); advanceCapture(0.5 + (f - 0.8) * 4); }
    else { advanceCapture(0.25 + f * 2.3); }
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
function advanceCapture(tSec) {
  const n = Math.round(tSec / PHYS_DT);
  for (let i = 0; i < n; i += 1) { if (mode === 'double') stepDouble(s, PHYS_DT); else step(s, PHYS_DT); clampStops(); if (s.stopped) break; if (mode === 'single' && i % 6 === 0) { vHist.push(s.v); aHist.push(tensions(s).a); if (vHist.length > HIST) vHist.shift(); if (aHist.length > HIST) aHist.shift(); } }
}

window.__physicsCheck = async () => {
  const t0 = tensions({ m1: 3, m2: 2, M: 0, R: 0.4, kind: 'disk' });
  if (Math.abs(t0.T1 - t0.T2) > 1e-9) return { name: 'massless tensions', pass: false, msg: `dT=${(t0.T1 - t0.T2).toExponential(2)}` };
  const c = createAtwood({ m1: 3, m2: 2, M: 1.5, R: 0.4, kind: 'disk' }); const E0 = energy(c);
  for (let i = 0; i < 5000; i += 1) step(c, 0.001);
  if (Math.abs(energy(c) - E0) > 1e-6) return { name: 'energy', pass: false, msg: 'drift' };
  const d = createDouble({ m1: 4, m2: 2, m3: 1 }); const Ed = energyDouble(d);
  for (let i = 0; i < 5000; i += 1) stepDouble(d, 0.001);
  const dEd = Math.abs(energyDouble(d) - Ed);
  if (dEd > 1e-5) return { name: 'double energy', pass: false, msg: `dE=${dEd.toExponential(2)}` };
  return { name: 'single+double tensions and energy consistent', pass: true, msg: `dEd=${dEd.toExponential(2)}` };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
