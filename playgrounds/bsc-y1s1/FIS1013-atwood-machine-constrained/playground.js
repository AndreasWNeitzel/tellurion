import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, fit } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for the constrained Atwood machine: two weights on a
// rope over a pulley of finite moment of inertia. The teaching points are
// (1) the acceleration is set by the mass difference over the mass sum
// (plus the pulley inertia), and (2) a massive pulley makes the two rope
// tensions unequal, since a net torque (T1 - T2) R spins it up.
// Top region: the rig with weight and tension vectors and a live readout
// of a, T1, T2. Bottom region: |a|, T1, T2 versus the mass ratio m1/m2,
// with a cursor at the current pair.

import {
  createAtwood, step, tensions, energy, pulleyInertia, G,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const controlsEl = document.getElementById('controls');

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.0 },
    { name: 'diagnostic', weight: 1.5 },
  ]);
}

const PHYSICS_DT = 0.002;

const DEF = { m1: 3, m2: 2, M: 4, R: 0.4, kind: 'disk' };
let s = createAtwood({ ...DEF });
let running = !DETERMINISTIC;
let holdFrames = 0;

// Scene geometry, in physics-domain units, shared by drawScene.
const DOM_W = 2.0, DOM_H = 3.0;
const PUL_X = 1.0, PUL_Y = 2.6, PUL_R = 0.26;
const REST_Y = 1.5, LLIM = 0.85;

function buildSlider(label, min, max, stp, value, onInput, fmt = v => v.toFixed(1)) {
  const row = document.createElement('div');
  row.className = 'row';
  const lab = document.createElement('span');
  lab.className = 'label';
  lab.textContent = label;
  const inp = document.createElement('input');
  inp.type = 'range';
  inp.min = String(min);
  inp.max = String(max);
  inp.step = String(stp);
  inp.value = String(value);
  inp.setAttribute('aria-label', label);
  const val = document.createElement('span');
  val.className = 'value';
  val.textContent = fmt(+value);
  inp.addEventListener('input', () => {
    val.textContent = fmt(+inp.value);
    onInput(parseFloat(inp.value));
  });
  row.appendChild(lab);
  row.appendChild(inp);
  row.appendChild(val);
  controlsEl.appendChild(row);
  return inp;
}

function resetMotion() {
  s.x = 0;
  s.v = 0;
  s.t = 0;
  s.stopped = false;
  holdFrames = 0;
}

const sM1 = buildSlider('m₁ (kg)', 0.5, 8, 0.1, DEF.m1, v => {
  s.m1 = v;
  resetMotion();
  render();
});
const sM2 = buildSlider('m₂ (kg)', 0.5, 8, 0.1, DEF.m2, v => {
  s.m2 = v;
  resetMotion();
  render();
});
const sMP = buildSlider('pulley M (kg)', 0, 12, 0.1, DEF.M, v => {
  s.M = v;
  resetMotion();
  render();
});

const bRow = document.createElement('div');
bRow.className = 'row buttons';
const bReset = document.createElement('button');
bReset.type = 'button';
bReset.textContent = 'Reset';
const bPause = document.createElement('button');
bPause.type = 'button';
bPause.id = 'btn-pause';
bPause.textContent = running ? 'Pause' : 'Play';
bPause.setAttribute('aria-pressed', String(!running));
bRow.appendChild(bReset);
bRow.appendChild(bPause);
controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  s = createAtwood({ ...DEF });
  sM1.value = String(DEF.m1);
  sM2.value = String(DEF.m2);
  sMP.value = String(DEF.M);
  resetMotion();
  running = true;
  bPause.textContent = 'Pause';
  bPause.setAttribute('aria-pressed', 'false');
  render();
});
bPause.addEventListener('click', () => {
  running = !running;
  bPause.textContent = running ? 'Pause' : 'Play';
  bPause.setAttribute('aria-pressed', String(!running));
});

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    weight: '#ef476f',
    m1: '#ff9d6e',
    m2: '#7cc6ff',
    rope: '#c9ced8',
    border: 'rgba(255,255,255,0.12)',
    grid: 'rgba(255,255,255,0.08)',
  };
}

function panel(col, r, title) {
  ctx.fillStyle = col.panel;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.fillStyle = col.muted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

function arrow(x, y, dx, dy, col, w = 3) {
  const L = Math.hypot(dx, dy);
  if (L < 0.5) return;
  const ux = dx / L, uy = dy / L;
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();
  const arrowSize = 9;
  ctx.beginPath();
  ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - arrowSize * ux + 5 * uy, y + dy - arrowSize * uy - 5 * ux);
  ctx.lineTo(x + dx - arrowSize * ux - 5 * uy, y + dy - arrowSize * uy + 5 * ux);
  ctx.closePath();
  ctx.fill();
}

function roundRect(x, y, w, h, rad) {
  const rr = Math.min(rad, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function niceCeil(v) {
  if (!(v > 0)) return 1;
  const e = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / e;
  const nf = f <= 1 ? 1 : f <= 1.5 ? 1.5 : f <= 2 ? 2 : f <= 3 ? 3
    : f <= 4 ? 4 : f <= 5 ? 5 : f <= 6 ? 6 : f <= 8 ? 8 : 10;
  return nf * e;
}

function drawInfo(col, box) {
  const { a } = tensions(s);
  const IR2 = pulleyInertia(s.M, s.R, s.kind) / (s.R * s.R);
  const dT = IR2 * a;             // T1 - T2 = I a / R^2
  const x = box.x;
  let y = box.y + 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('What sets the motion', x, y);
  y += 24;

  // a = (m1 - m2) g / (m1 + m2 + I/R^2), drawn as a stacked fraction.
  ctx.fillStyle = col.fg;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('a =', x, y + 9);
  const fx = x + ctx.measureText('a = ').width;
  const num = '(m₁ − m₂) g';
  const den = 'm₁ + m₂ + I/R²';
  const numW = ctx.measureText(num).width;
  const denW = ctx.measureText(den).width;
  const fw = Math.max(numW, denW);
  ctx.fillText(num, fx + (fw - numW) / 2, y);
  ctx.strokeStyle = col.fg;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(fx, y + 16);
  ctx.lineTo(fx + fw, y + 16);
  ctx.stroke();
  ctx.fillText(den, fx + (fw - denW) / 2, y + 19);
  y += 44;

  ctx.fillStyle = col.accent;
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.fillText(`= ${a.toFixed(2)} m/s²`, x, y);
  y += 28;

  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'tick', 'sans');
  const lines = [
    'The pulley adds',
    `I/R² = ${IR2.toFixed(1)} kg to the`,
    'mass sum, and needs',
    'torque to spin up, so',
    'the tensions differ:',
  ];
  for (const ln of lines) { ctx.fillText(ln, x, y); y += 15; }
  y += 4;
  ctx.fillStyle = col.fg;
  ctx.font = fontString(canvas, 'tick', 'mono', 700);
  ctx.fillText(`T₁ − T₂ = ${dT.toFixed(1)} N`, x, y);
}

function drawScene(col, r) {
  panel(col, r, 'Forces on each mass');

  // Reserve a clean strip at the bottom for the live readout so the
  // hanging masses and their force arrows never collide with the numbers.
  const strip = 46;
  const sceneRect = { x: r.x, y: r.y + 22, w: r.w, h: r.h - 22 - strip };

  // On a wide canvas, give the left of the scene to the governing
  // equation and keep the rig on the right; on a narrow (phone) canvas,
  // drop the side panel and centre the rig.
  const infoW = sceneRect.w > 520 ? Math.min(300, sceneRect.w * 0.42) : 0;
  const rigRect = {
    x: sceneRect.x + infoW, y: sceneRect.y, w: sceneRect.w - infoW, h: sceneRect.h,
  };
  if (infoW > 0) {
    drawInfo(col, { x: sceneRect.x + 12, y: sceneRect.y + 6, w: infoW - 16, h: sceneRect.h });
  }
  const fo = fit(rigRect, DOM_W, DOM_H, { pad: 14, flipY: true });

  const cx = fo.x(PUL_X), cy = fo.y(PUL_Y), R = fo.s(PUL_R);
  const { a, T1, T2 } = tensions(s);

  // m1 (left) falls as s.x grows (sim convention: s.x is m1's drop);
  // m2 (right) rises by the same amount. Ropes hang vertically from the
  // pulley's two tangent points at x = PUL_X +/- PUL_R.
  const x1 = fo.x(PUL_X - PUL_R), x2 = fo.x(PUL_X + PUL_R);
  const y1 = fo.y(REST_Y - s.x);
  const y2 = fo.y(REST_Y + s.x);

  ctx.save();
  ctx.beginPath();
  ctx.rect(rigRect.x, rigRect.y, rigRect.w, rigRect.h);
  ctx.clip();

  // Ceiling mount and hanger down to the axle.
  ctx.fillStyle = '#23262f';
  ctx.fillRect(cx - fo.s(0.32), sceneRect.y, fo.s(0.64), 5);
  ctx.strokeStyle = col.muted;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, sceneRect.y + 4);
  ctx.lineTo(cx, cy - R);
  ctx.stroke();

  // Rope: down the left to m1, over the top of the pulley, down to m2.
  ctx.strokeStyle = col.rope;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(cx - R, cy);
  ctx.arc(cx, cy, R, Math.PI, 2 * Math.PI);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Pulley disk (inside the rope groove), spokes that turn by the true
  // wrap angle s.x / R, and a hub.
  const diskR = R * 0.88;
  const grd = ctx.createRadialGradient(
    cx - diskR * 0.35, cy - diskR * 0.35, diskR * 0.1, cx, cy, diskR,
  );
  grd.addColorStop(0, '#9fb0dc');
  grd.addColorStop(1, '#39435f');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, diskR, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const th = s.x / PUL_R;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    const ang = th + k * 2 * Math.PI / 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + diskR * 0.8 * Math.cos(ang), cy + diskR * 0.8 * Math.sin(ang));
    ctx.stroke();
  }
  ctx.fillStyle = '#11141c';
  ctx.beginPath();
  ctx.arc(cx, cy, diskR * 0.18, 0, 2 * Math.PI);
  ctx.fill();

  // Masses, force vectors, and outboard labels.
  const FSCALE = 0.010;             // domain length per newton
  const flen = (F) => fo.s(Math.min(0.45, F * FSCALE));
  const masses = [
    { x: x1, yTop: y1, m: s.m1, T: T1, name: 'm₁', fill: col.m1, dir: -1 },
    { x: x2, yTop: y2, m: s.m2, T: T2, name: 'm₂', fill: col.m2, dir: +1 },
  ];
  for (const mb of masses) {
    const side = fo.s(Math.min(0.34, Math.max(0.15, 0.105 * Math.cbrt(mb.m))));
    const bx = mb.x - side / 2, by = mb.yTop;
    const wlen = flen(mb.m * G);
    const tlen = flen(mb.T);

    // Weight (down) and tension (up) vectors.
    arrow(mb.x, by + side, 0, wlen, col.weight, 3);
    arrow(mb.x, by, 0, -tlen, mb.fill, 3);

    // Block.
    ctx.fillStyle = mb.fill;
    roundRect(bx, by, side, side, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#0a0c12';
    ctx.font = fontString(canvas, 'caption', 'sans', 700);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mb.name, mb.x, by + side / 2);

    // Outboard labels: mass (white), weight (red), tension (mass color).
    ctx.font = fontString(canvas, 'tick', 'mono', 600);
    ctx.textAlign = mb.dir > 0 ? 'left' : 'right';
    ctx.textBaseline = 'middle';
    const lx = mb.dir > 0 ? bx + side + 6 : bx - 6;
    ctx.fillStyle = col.fg;
    ctx.fillText(`${mb.m.toFixed(1)} kg`, lx, by + side / 2);
    ctx.fillStyle = col.weight;
    ctx.fillText(`W ${(mb.m * G).toFixed(0)} N`, lx, by + side + wlen / 2);
    ctx.fillStyle = mb.fill;
    ctx.fillText(`T ${mb.T.toFixed(0)} N`, lx, by - tlen / 2);
  }

  ctx.restore();

  // Live readout strip: a, T1, T2 colour-keyed to the diagnostic curves.
  const ry = r.y + r.h - strip / 2 + 1;
  const items = [
    [`a = ${a.toFixed(2)} m/s²`, col.accent],
    [`T₁ = ${T1.toFixed(1)} N`, col.m1],
    [`T₂ = ${T2.toFixed(1)} N`, col.m2],
  ];
  ctx.font = fontString(canvas, 'body', 'mono', 700);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => {
    ctx.fillStyle = c;
    ctx.fillText(txt, r.x + r.w * (i + 0.5) / 3, ry);
  });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Acceleration and rope tensions vs mass ratio');

  const inner = {
    x: r.x + 44,
    y: r.y + 30,
    w: r.w - 44 - 48,
    h: r.h - 30 - 42,
  };

  // Sweep the mass ratio on a log axis, holding m2 at its current value
  // so the cursor lands exactly on the plotted curves. Everything comes
  // from the sim's own tensions() so the diagnostic cannot drift from
  // the scene.
  const RMIN = 0.2;
  const RMAX = Math.max(4, (s.m1 / s.m2) * 1.25);
  const lnMin = Math.log(RMIN), lnMax = Math.log(RMAX);
  const xOf = (ratio) => inner.x + (Math.log(ratio) - lnMin) / (lnMax - lnMin) * inner.w;

  const N = 140;
  const pts = [];
  let maxF = 0;
  for (let i = 0; i <= N; i++) {
    const ratio = Math.exp(lnMin + (i / N) * (lnMax - lnMin));
    const t = tensions({ m1: ratio * s.m2, m2: s.m2, M: s.M, R: s.R, kind: s.kind });
    maxF = Math.max(maxF, t.T1, t.T2);
    pts.push({ ratio, a: Math.abs(t.a), T1: t.T1, T2: t.T2 });
  }
  const fMax = niceCeil(maxF);
  const yA = (a) => inner.y + inner.h - (a / G) * inner.h;
  const yF = (F) => inner.y + inner.h - (F / fMax) * inner.h;

  // Horizontal grid.
  ctx.strokeStyle = col.grid;
  ctx.lineWidth = 0.8;
  for (let i = 0; i <= 4; i++) {
    const y = inner.y + i * inner.h / 4;
    ctx.beginPath();
    ctx.moveTo(inner.x, y);
    ctx.lineTo(inner.x + inner.w, y);
    ctx.stroke();
  }

  // Ratio gridlines and ticks; the equal-mass line at ratio 1 is bolder.
  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'tick', 'mono');
  for (const rr of [0.2, 0.5, 1, 2, 3, 4, 6, 8, 12, 16]) {
    if (rr < RMIN || rr > RMAX) continue;
    const x = xOf(rr);
    ctx.strokeStyle = rr === 1 ? col.border : col.grid;
    ctx.lineWidth = rr === 1 ? 1.3 : 0.8;
    ctx.beginPath();
    ctx.moveTo(x, inner.y);
    ctx.lineTo(x, inner.y + inner.h);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(rr < 1 ? rr.toFixed(1) : String(rr), x, inner.y + inner.h + 4);
  }

  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  const curve = (key, yfn, color, w) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const X = xOf(p.ratio), Y = yfn(p[key]);
      if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
    });
    ctx.stroke();
  };
  curve('T1', yF, col.m1, 2);
  curve('T2', yF, col.m2, 2);
  curve('a', yA, col.accent, 2.6);

  // Cursor at the current ratio, with a dot on each curve.
  const cr = s.m1 / s.m2;
  if (cr >= RMIN && cr <= RMAX) {
    const cxp = xOf(cr);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cxp, inner.y);
    ctx.lineTo(cxp, inner.y + inner.h);
    ctx.stroke();
    ctx.setLineDash([]);
    const cur = tensions(s);
    const dot = (yy, c) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(cxp, yy, 3.5, 0, 2 * Math.PI);
      ctx.fill();
    };
    dot(yF(cur.T1), col.m1);
    dot(yF(cur.T2), col.m2);
    dot(yA(Math.abs(cur.a)), col.accent);
  }

  // Left axis (acceleration, 0..g).
  ctx.fillStyle = col.accent;
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('0', inner.x - 5, yA(0));
  ctx.fillText(G.toFixed(1), inner.x - 5, yA(G));
  ctx.save();
  ctx.translate(inner.x - 32, inner.y + inner.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('|a|  (m/s²)', 0, 0);
  ctx.restore();

  // Right axis (force, 0..fMax).
  ctx.fillStyle = col.muted;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('0', inner.x + inner.w + 5, yF(0));
  ctx.fillText(String(fMax), inner.x + inner.w + 5, yF(fMax));
  ctx.save();
  ctx.translate(inner.x + inner.w + 36, inner.y + inner.h / 2);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('T  (N)', 0, 0);
  ctx.restore();

  // X label.
  ctx.fillStyle = col.muted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('mass ratio  m₁ / m₂', inner.x + inner.w / 2, inner.y + inner.h + 20);

  // Legend on a faint plate, top-left inside the plot.
  const legend = [['|a|', col.accent], ['T₁', col.m1], ['T₂', col.m2]];
  ctx.fillStyle = 'rgba(10,12,18,0.72)';
  ctx.fillRect(inner.x + 5, inner.y + 5, 150, 18);
  let lx = inner.x + 12, ly = inner.y + 14;
  ctx.font = fontString(canvas, 'legend', 'mono');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (const [lab, c] of legend) {
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + 15, ly);
    ctx.stroke();
    ctx.fillStyle = col.fg;
    ctx.fillText(lab, lx + 19, ly);
    lx += 48;
  }
}

function render() {
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);

  if (!REG) relayout();
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

function clampStops() {
  if (Math.abs(s.x) >= LLIM) {
    s.x = Math.sign(s.x) * LLIM;
    s.v = 0;
    s.stopped = true;
  }
}

function advance(dtSim) {
  if (s.stopped) return;
  const n = Math.min(4000, Math.round(dtSim / PHYSICS_DT));
  for (let i = 0; i < n; i++) {
    step(s, PHYSICS_DT);
    clampStops();
    if (s.stopped) break;
  }
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) {
    advance(dt);
    if (s.stopped) {
      holdFrames += 1;
      if (holdFrames > 75) resetMotion();
    }
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    for (let i = 0; i < Math.round(f * 500); i++) {
      step(s, PHYSICS_DT);
      clampStops();
    }
  }
  relayout();
  render();
}

window.addEventListener('load', bootSync);
if (document.readyState !== 'loading') bootSync();
window.addEventListener('resize', () => {
  relayout();
  render();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else {
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'accel', label: 'acceleration $a$', value: tensions(s).a, format: 'float' },
      { key: 'speed', label: 'block speed $|v|$', value: Math.abs(s.v), format: 'float' },
      { key: 'energy', label: 'total energy $E$', value: energy(s), format: 'float' },
    ],
  };
};

// The system is released from rest at the x = 0 PE reference, so its
// total mechanical energy is identically zero while it evolves; the
// integrator drift is then |E| measured against the gravitational PE
// scale. The inelastic stop at the rope limit genuinely removes energy,
// so the reading is held (not flagged as integrator drift) while parked.
let lastInv = null;
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    try {
      if (s.stopped && lastInv) return lastInv;
      const E = energy(s);
      if (!Number.isFinite(E)) return lastInv || [];
      const scale = Math.max(1e-9, (s.m1 + s.m2) * G * LLIM);
      const dE = Math.abs(E) / scale;
      lastInv = [{
        key: 'energy',
        label: 'total energy conserved (rel. drift)',
        value: dE.toExponential(2),
        status: dE < 1e-3 ? 'pass' : (dE < 1e-2 ? 'pending' : 'drift'),
      }];
      return lastInv;
    } catch (e) {
      return lastInv || [];
    }
  };
}
