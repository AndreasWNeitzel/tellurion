// Line integral playground. Draws a 2D vector field with arrows, the
// two paths from A to B, and the running integral values.

import {
  FIELDS, lineIntegral, straightPath, arcPath, closedLoopIntegral,
} from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutPaths = document.getElementById('readout-paths');
const readoutLoop  = document.getElementById('readout-loop');

const selectField = document.getElementById('select-field');
const valueField  = document.getElementById('value-field');

let fieldName = selectField.value;
selectField.addEventListener('change', () => {
  fieldName = selectField.value;
  valueField.textContent = FIELDS[fieldName].isConservative ? 'conservative' : 'non-conservative';
});

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    orange: '#f4a261',
    red:    '#ef476f',
    grid:   '#23252a',
  };
}

function arrow(c, x0, y0, x1, y1) {
  ctx.strokeStyle = c;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0);
  const head = 4;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - head * Math.cos(a - 0.32), y1 - head * Math.sin(a - 0.32));
  ctx.lineTo(x1 - head * Math.cos(a + 0.32), y1 - head * Math.sin(a + 0.32));
  ctx.closePath();
  ctx.fill();
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2, cy = canvas.height / 2;
  const scale = 100;
  const field = FIELDS[fieldName];

  // Field arrows on a grid.
  for (let ix = -2; ix <= 2; ix += 0.5) {
    for (let iy = -1.5; iy <= 1.5; iy += 0.5) {
      if (Math.abs(ix) < 1e-3 && Math.abs(iy) < 1e-3) continue;
      const x = ix, y = iy;
      const u = field.P(x, y), v = field.Q(x, y);
      const mag = Math.hypot(u, v);
      const len = Math.min(0.4, 0.06 + 0.05 * mag);
      const dx = len * (u / Math.max(mag, 1e-9));
      const dy = len * (v / Math.max(mag, 1e-9));
      const px = cx + scale * x;
      const py = cy - scale * y;
      const px2 = cx + scale * (x + dx);
      const py2 = cy - scale * (y + dy);
      arrow(c.muted, px, py, px2, py2);
    }
  }

  // Axes.
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); ctx.stroke();

  // Path A->B straight.
  const A = { x: -1, y: 0 }, B = { x: 1, y: 0 };
  const sp = straightPath(A, B);
  ctx.strokeStyle = c.orange;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 100; i += 1) {
    const t = i / 100;
    const px = cx + scale * sp.x(t);
    const py = cy - scale * sp.y(t);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Arc path.
  const ap = arcPath(A, B);
  ctx.strokeStyle = c.blue;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 100; i += 1) {
    const t = i / 100;
    const px = cx + scale * ap.x(t);
    const py = cy - scale * ap.y(t);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Endpoints.
  ctx.fillStyle = c.accent;
  ctx.beginPath(); ctx.arc(cx + scale * A.x, cy - scale * A.y, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + scale * B.x, cy - scale * B.y, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('A', cx + scale * A.x - 14, cy - scale * A.y + 16);
  ctx.fillText('B', cx + scale * B.x + 8, cy - scale * B.y + 16);

  // Legend.
  ctx.fillStyle = c.muted;
  ctx.fillText(`field: ${field.label}`, 12, 20);
  ctx.fillStyle = field.isConservative ? c.accent : c.red;
  ctx.fillText(field.isConservative ? '(conservative: path-independent)' : '(non-conservative)', 12, 36);
  ctx.fillStyle = c.orange;
  ctx.fillText('straight A to B', 12, 52);
  ctx.fillStyle = c.blue;
  ctx.fillText('arc A to B', 12, 68);
}

function updateReadout() {
  const A = { x: -1, y: 0 }, B = { x: 1, y: 0 };
  const field = FIELDS[fieldName];
  const sp = straightPath(A, B);
  const ap = arcPath(A, B);
  const sIp = lineIntegral(field, sp.x, sp.y, sp.dx, sp.dy);
  const aIp = lineIntegral(field, ap.x, ap.y, ap.dx, ap.dy);
  readoutPaths.textContent = `${sIp.toFixed(4)}, ${aIp.toFixed(4)}`;
  const loop = closedLoopIntegral(fieldName, A, B);
  readoutLoop.textContent = loop.toFixed(4);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const names = ['conservative1', 'conservative2', 'rotation', 'shear'];
    fieldName = names[Math.min(names.length - 1, Math.floor(frac * names.length))];
    selectField.value = fieldName;
  }
  valueField.textContent = FIELDS[fieldName].isConservative ? 'conservative' : 'non-conservative';
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, fieldName };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(loop);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(loop);
}
