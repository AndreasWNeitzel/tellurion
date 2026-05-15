// Gravitational lensing critical curves and caustics for a single point
// lens (Einstein ring) and a two-point-lens binary (figure-eight caustic).
// Source on the source plane, multiple images on the image plane.

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

// Lenses (positions in image plane, units of theta_E).
const state = {
  lenses: [
    { x: 0, y: 0,    m: 1.0 },
  ],
  source: { x: 0.5, y: 0.1 },
  binary: false,
};

function makeBinary(on, separation = 0.8, q = 0.5) {
  if (on) {
    const m1 = 1 / (1 + q), m2 = q / (1 + q);
    state.lenses = [
      { x: -separation * m2, y: 0, m: m1 },
      { x:  separation * m1, y: 0, m: m2 },
    ];
  } else {
    state.lenses = [{ x: 0, y: 0, m: 1.0 }];
  }
}

// Image-plane to source-plane map: beta = theta - sum_i m_i (theta - z_i) / |theta - z_i|^2
function alphaAt(theta) {
  let ax = 0, ay = 0;
  for (const L of state.lenses) {
    const dx = theta.x - L.x, dy = theta.y - L.y;
    const r2 = dx * dx + dy * dy + 1e-12;
    ax += L.m * dx / r2;
    ay += L.m * dy / r2;
  }
  return { x: ax, y: ay };
}

function mapToSource(theta) {
  const a = alphaAt(theta);
  return { x: theta.x - a.x, y: theta.y - a.y };
}

function jacobianDet(theta) {
  // J = I - dalpha/dtheta. Compute analytically for point masses.
  let a11 = 1, a12 = 0, a21 = 0, a22 = 1;
  for (const L of state.lenses) {
    const dx = theta.x - L.x, dy = theta.y - L.y;
    const r2 = dx * dx + dy * dy + 1e-12;
    const r4 = r2 * r2;
    // d/dx (m dx/r2) = m (r2 - 2 dx^2) / r4
    a11 -= L.m * (r2 - 2 * dx * dx) / r4;
    a22 -= L.m * (r2 - 2 * dy * dy) / r4;
    const cross = -L.m * (-2 * dx * dy) / r4;
    a12 -= cross;
    a21 -= cross;
  }
  return a11 * a22 - a12 * a21;
}

function findImages(beta) {
  // Brute-force grid + Newton refine. Coarse enough for visualization.
  const found = [];
  const G = 80;
  const R = 2.5;
  for (let i = 0; i < G; i += 1) for (let j = 0; j < G; j += 1) {
    let tx = -R + (2 * R) * (i + 0.5) / G;
    let ty = -R + (2 * R) * (j + 0.5) / G;
    // 6 Newton steps.
    let ok = true;
    for (let it = 0; it < 6; it += 1) {
      const bm = mapToSource({ x: tx, y: ty });
      const fx = bm.x - beta.x, fy = bm.y - beta.y;
      if (fx * fx + fy * fy < 1e-10) break;
      // Approx Jacobian via finite diff.
      const eps = 1e-4;
      const bx_p = mapToSource({ x: tx + eps, y: ty });
      const bx_m = mapToSource({ x: tx - eps, y: ty });
      const by_p = mapToSource({ x: tx, y: ty + eps });
      const by_m = mapToSource({ x: tx, y: ty - eps });
      const j11 = (bx_p.x - bx_m.x) / (2 * eps);
      const j12 = (by_p.x - by_m.x) / (2 * eps);
      const j21 = (bx_p.y - bx_m.y) / (2 * eps);
      const j22 = (by_p.y - by_m.y) / (2 * eps);
      const det = j11 * j22 - j12 * j21;
      if (Math.abs(det) < 1e-8) { ok = false; break; }
      const dx = ( j22 * fx - j12 * fy) / det;
      const dy = (-j21 * fx + j11 * fy) / det;
      tx -= dx; ty -= dy;
      if (Math.abs(dx) + Math.abs(dy) < 1e-8) break;
    }
    if (!ok) continue;
    // De-duplicate.
    let dup = false;
    for (const im of found) if (Math.hypot(im.x - tx, im.y - ty) < 0.05) { dup = true; break; }
    if (dup) continue;
    const bm = mapToSource({ x: tx, y: ty });
    if (Math.hypot(bm.x - beta.x, bm.y - beta.y) < 0.02) {
      found.push({ x: tx, y: ty });
      if (found.length >= 5) break;
    }
  }
  return found;
}

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);

  // Two-panel layout: image plane left, source plane right.
  const pad = 24;
  const pw = (W - 3 * pad) / 2;
  const ph = H - 2 * pad;
  const cx0 = pad + pw / 2, cy0 = pad + ph / 2;
  const cx1 = 2 * pad + pw + pw / 2, cy1 = pad + ph / 2;
  const sc  = Math.min(pw, ph) * 0.32;

  function gridLines(cx, cy) {
    ctx.strokeStyle = 'rgba(220,220,240,0.08)';
    for (let g = -2; g <= 2; g += 1) {
      ctx.beginPath(); ctx.moveTo(cx + g * sc, cy - sc * 2); ctx.lineTo(cx + g * sc, cy + sc * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - sc * 2, cy + g * sc); ctx.lineTo(cx + sc * 2, cy + g * sc); ctx.stroke();
    }
  }
  gridLines(cx0, cy0);
  gridLines(cx1, cy1);
  ctx.strokeStyle = 'rgba(220,220,240,0.4)';
  ctx.strokeRect(pad, pad, pw, ph);
  ctx.strokeRect(2 * pad + pw, pad, pw, ph);
  ctx.fillStyle = '#dcdde2'; ctx.font = '14px sans-serif';
  ctx.fillText('Image plane (theta)', pad + 8, pad + 18);
  ctx.fillText('Source plane (beta)', 2 * pad + pw + 8, pad + 18);

  // Critical curves: scan a grid for det(J) sign change; mark.
  const G = 140;
  const R = 2.4;
  const lastSign = new Array(G);
  ctx.fillStyle = '#fdb56a';
  for (let i = 0; i < G; i += 1) lastSign[i] = null;
  for (let j = 0; j < G; j += 1) {
    let prev = null;
    for (let i = 0; i < G; i += 1) {
      const tx = -R + (2 * R) * i / (G - 1);
      const ty = -R + (2 * R) * j / (G - 1);
      const d = jacobianDet({ x: tx, y: ty });
      const sgn = d > 0 ? 1 : -1;
      if (prev !== null && sgn !== prev) {
        // Critical curve crosses near this cell. Draw the crossing point.
        const X = cx0 + tx * sc, Y = cy0 + ty * sc;
        ctx.fillRect(X - 1, Y - 1, 2, 2);
        // Map this point to source plane to draw the caustic.
        const bm = mapToSource({ x: tx, y: ty });
        const X2 = cx1 + bm.x * sc, Y2 = cy1 + bm.y * sc;
        ctx.fillRect(X2 - 1, Y2 - 1, 2, 2);
      }
      prev = sgn;
    }
  }

  // Lenses.
  ctx.fillStyle = '#cf7f3a';
  for (const L of state.lenses) {
    ctx.beginPath(); ctx.arc(cx0 + L.x * sc, cy0 + L.y * sc, 4, 0, 2 * Math.PI); ctx.fill();
  }

  // Source.
  ctx.fillStyle = '#ffd57f';
  ctx.beginPath(); ctx.arc(cx1 + state.source.x * sc, cy1 + state.source.y * sc, 5, 0, 2 * Math.PI); ctx.fill();

  // Images.
  const imgs = findImages(state.source);
  ctx.fillStyle = '#7c9cff';
  for (const im of imgs) {
    ctx.beginPath(); ctx.arc(cx0 + im.x * sc, cy0 + im.y * sc, 4, 0, 2 * Math.PI); ctx.fill();
  }

  readoutInv.textContent = `images=${imgs.length}  lenses=${state.lenses.length}  source=(${state.source.x.toFixed(2)},${state.source.y.toFixed(2)})`;
  readoutFrame.textContent = '-';
}

// Drag source on right panel.
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  const cx1 = 2 * 24 + (W - 3 * 24) / 2 + (W - 3 * 24) / 4;
  if (x > W / 2) {
    const cy1 = H / 2;
    const sc = Math.min((W - 3 * 24) / 2, H - 48) * 0.32;
    state.source.x = (x - cx1) / sc;
    state.source.y = (y - cy1) / sc;
    render();
  }
});

function buildControls() {
  controlsEl.innerHTML = '';
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = 'binary-toggle'; lab.textContent = 'Mode';
  const sel = document.createElement('select'); sel.id = 'binary-toggle';
  sel.setAttribute('aria-label', 'Lens configuration');
  for (const [v, t] of [['single', 'single point lens'], ['binary', 'binary lens (q=0.5)']]) {
    const opt = document.createElement('option'); opt.value = v; opt.textContent = t; sel.appendChild(opt);
  }
  sel.value = state.binary ? 'binary' : 'single';
  sel.addEventListener('change', () => {
    state.binary = sel.value === 'binary';
    makeBinary(state.binary);
    render();
  });
  row.appendChild(lab); row.appendChild(sel);
  controlsEl.appendChild(row);

  // Info row.
  const info = document.createElement('div'); info.className = 'row';
  info.innerHTML = '<span class="label">Tip</span><span class="value">Click on the source plane (right) to move the source.</span>';
  controlsEl.appendChild(info);
}

buildControls();
render();
if (DETERMINISTIC) {
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
}

window.__physicsCheck = async () => {
  // Single lens: det(J) = 0 at |theta| = 1 (Einstein ring).
  state.binary = false; makeBinary(false);
  const d1 = jacobianDet({ x: 1, y: 0 });
  const d2 = jacobianDet({ x: 0.5, y: 0 });
  if (Math.abs(d1) > 0.05) return { name: 'Einstein ring', pass: false, msg: `det(J)(|theta|=1) = ${d1.toFixed(4)}` };
  if (d2 > 0) return { name: 'Einstein ring', pass: false, msg: `det(J)(|theta|=0.5) = ${d2.toFixed(4)} expected < 0` };
  return { name: 'critical curve at |theta|=1', pass: true, msg: `det(J)(1)=${d1.toFixed(4)} det(J)(0.5)=${d2.toFixed(4)}` };
};
