// Crystal structure explorer (Canvas2D, no WebGL: a hand-rolled 3D
// projection per the stack rule). A rotating cubic cell with shaded
// atom spheres and a Miller plane, a reciprocal-lattice view, and
// the powder XRD pattern. sim.js is the gate-tested crystallography
// engine.

import {
  basis, atomsPerConventionalCell, dSpacing, primitiveVectors,
  reciprocalVectors, powderLines, bzFaceCount,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rLat = document.getElementById('readout-lat');
const rNat = document.getElementById('readout-nat');
const rD = document.getElementById('readout-d');
const rBz = document.getElementById('readout-bz');
const rL1 = document.getElementById('readout-l1');

const selLat = document.getElementById('select-lat');
const selView = document.getElementById('select-view');
const selHkl = document.getElementById('select-hkl');
const sSC = document.getElementById('slider-sc'), vSC = document.getElementById('value-sc');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const st = { lat: 'fcc', view: 'crystal', hkl: [1, 1, 1], sc: 1, yaw: 0.6, running: true };
const CX = 270, CY = 200, SCALE = 150, PITCH = 0.5;

function proj([x, y, z]) {
  const cy = Math.cos(st.yaw), sy = Math.sin(st.yaw);
  let X = x * cy + z * sy;
  let Zd = -x * sy + z * cy;
  const cp = Math.cos(PITCH), sp = Math.sin(PITCH);
  const Y = y * cp - Zd * sp;
  const depth = y * sp + Zd * cp;
  return { px: CX + X * SCALE, py: CY - Y * SCALE, d: depth };
}

function sphere(p, r, rgb) {
  const g = ctx.createRadialGradient(p.px - r * 0.4, p.py - r * 0.4, r * 0.15, p.px, p.py, r);
  g.addColorStop(0, `rgb(${rgb.map((c) => Math.min(255, c + 90)).join(',')})`);
  g.addColorStop(1, `rgb(${rgb.join(',')})`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.px, p.py, r, 0, 2 * Math.PI); ctx.fill();
}

function edge(a, b, col, lw) {
  const pa = proj(a), pb = proj(b);
  ctx.strokeStyle = col; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(pa.px, pa.py); ctx.lineTo(pb.px, pb.py); ctx.stroke();
}

function drawCrystal() {
  const N = st.sc, b = basis(st.lat), c = N / 2;
  const cube = [[0, 0, 0], [N, 0, 0], [N, N, 0], [0, N, 0], [0, 0, N], [N, 0, N], [N, N, N], [0, N, N]]
    .map((v) => [v[0] - c, v[1] - c, v[2] - c]);
  const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  for (const [i, j] of E) edge(cube[i], cube[j], 'rgba(150,160,180,0.4)', 1);

  // Atoms over the supercell. Include the outer boundary sites (far
  // corners/faces) so the conventional cell is the recognizable
  // textbook picture; dedupe by a rounded key.
  const atoms = [], seen = new Set();
  for (let i = 0; i <= N; i += 1) for (let j = 0; j <= N; j += 1) for (let k = 0; k <= N; k += 1) {
    for (const [bx, by, bz] of b) {
      const x = i + bx, y = j + by, z = k + bz;
      if (x > N + 1e-9 || y > N + 1e-9 || z > N + 1e-9) continue;
      const key = `${Math.round(x * 4)},${Math.round(y * 4)},${Math.round(z * 4)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      atoms.push([x - c, y - c, z - c]);
    }
  }
  const aR = Math.max(4, Math.min(18, (SCALE * 0.12) / N));
  // Miller plane through the cell centre
  const [h, k, l] = st.hkl, nn = Math.hypot(h, k, l);
  let millerQuad = null;
  if (st.view === 'crystal' && nn > 0) {
    const n = [h / nn, k / nn, l / nn];
    // build two in-plane axes
    const t = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    const u = norm(cross(n, t)), w = cross(n, u);
    const R = N * 0.74;
    millerQuad = [[-R, -R], [R, -R], [R, R], [-R, R]].map(([s1, s2]) => [
      u[0] * s1 + w[0] * s2, u[1] * s1 + w[1] * s2, u[2] * s1 + w[2] * s2,
    ]);
  }
  atoms.sort((p, q) => proj(p).d - proj(q).d);
  for (const a of atoms) sphere(proj(a), aR, st.lat === 'fcc' ? [91, 192, 235] : st.lat === 'bcc' ? [239, 71, 111] : [6, 214, 160]);
  // Miller plane on top of the atoms so its orientation is clear
  if (millerQuad) {
    ctx.fillStyle = 'rgba(255,209,102,0.34)'; ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.6;
    ctx.beginPath();
    millerQuad.forEach((q, idx) => { const p = proj(q); if (idx === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py); });
    ctx.closePath(); ctx.fill(); ctx.stroke();
    const lab = proj(millerQuad[1]);
    ctx.fillStyle = '#ffd166'; ctx.font = '13px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillText(`(${st.hkl.join('')})`, lab.px + 6, lab.py);
  }
}

function drawReciprocal() {
  const Brec = reciprocalVectors(primitiveVectors(st.lat));
  // reciprocal lattice points (scaled to fit), painter-sorted
  const pts = [];
  const sc = 0.22;
  for (let i = -2; i <= 2; i += 1) for (let j = -2; j <= 2; j += 1) for (let m = -2; m <= 2; m += 1) {
    pts.push([
      sc * (i * Brec[0][0] + j * Brec[1][0] + m * Brec[2][0]),
      sc * (i * Brec[0][1] + j * Brec[1][1] + m * Brec[2][1]),
      sc * (i * Brec[0][2] + j * Brec[1][2] + m * Brec[2][2]),
      i === 0 && j === 0 && m === 0,
    ]);
  }
  pts.sort((p, q) => proj(p).d - proj(q).d);
  for (const p of pts) sphere(proj(p), p[3] ? 9 : 5, p[3] ? [255, 209, 102] : [150, 160, 180]);
  // selected reciprocal vector G_hkl = h b1 + k b2 + l b3 (normal to
  // the (hkl) planes); reorients strongly with the Miller selector
  const [hh, kk, ll] = st.hkl;
  const G = [
    sc * (hh * Brec[0][0] + kk * Brec[1][0] + ll * Brec[2][0]),
    sc * (hh * Brec[0][1] + kk * Brec[1][1] + ll * Brec[2][1]),
    sc * (hh * Brec[0][2] + kk * Brec[1][2] + ll * Brec[2][2]),
  ];
  const o = proj([0, 0, 0]), g = proj(G);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(o.px, o.py); ctx.lineTo(g.px, g.py); ctx.stroke();
  const ang = Math.atan2(g.py - o.py, g.px - o.px);
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(g.px, g.py);
  ctx.lineTo(g.px - 12 * Math.cos(ang - 0.4), g.py - 12 * Math.sin(ang - 0.4));
  ctx.lineTo(g.px - 12 * Math.cos(ang + 0.4), g.py - 12 * Math.sin(ang + 0.4));
  ctx.closePath(); ctx.fill();
  ctx.font = 'bold 13px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(`G(${st.hkl.join('')})`, g.px + 8, g.py);
  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.font = '13px ui-monospace, monospace'; ctx.textAlign = 'center';
  const name = st.lat === 'fcc' ? 'BZ: truncated octahedron (14)' : st.lat === 'bcc' ? 'BZ: rhombic dodecahedron (12)' : 'BZ: cube (6)';
  ctx.fillText(`reciprocal lattice  |  ${name}`, CX, CY + 170);
}

function drawXRD() {
  const x0 = 40, x1 = W - 24, y0 = H - 110, y1 = H - 40;
  ctx.strokeStyle = 'rgba(150,160,180,0.8)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.8)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('powder XRD:  intensity vs  2 theta  (Cu K-alpha, a = 4 A)', (x0 + x1) / 2, H - 16);
  const lines = powderLines(st.lat, 4.0, 1.5406, 24);
  const tmax = Math.PI;                                   // 2 theta up to 180 deg
  const selS = st.hkl[0] ** 2 + st.hkl[1] ** 2 + st.hkl[2] ** 2;
  for (const ln of lines) {
    const x = x0 + (ln.twoTheta / tmax) * (x1 - x0);
    const sel = ln.s === selS;                            // the chosen plane's line
    ctx.strokeStyle = sel ? '#ffd166' : '#5bc0eb'; ctx.lineWidth = sel ? 4 : 2;
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, sel ? y0 - 16 : y0); ctx.stroke();
    if (ln.s <= 8 || sel) {
      ctx.fillStyle = sel ? '#ffd166' : 'rgba(150,160,180,0.75)';
      ctx.font = `${sel ? 'bold ' : ''}11px ui-monospace, monospace`; ctx.textAlign = 'center';
      ctx.fillText(ln.hkl.join(''), x, (sel ? y0 - 22 : y0 - 6));
    }
  }
  // selected-plane tag (also shown when the line is forbidden/absent)
  ctx.fillStyle = '#ffd166'; ctx.font = 'bold 12px ui-monospace, monospace'; ctx.textAlign = 'left';
  const onList = lines.some((ln) => ln.s === selS);
  ctx.fillText(`(${st.hkl.join('')}) ${onList ? 'allowed' : 'forbidden'}`, x0 + 4, y0 - 2);
}

function norm(v) { const n = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / n, v[1] / n, v[2] / n]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  if (st.view === 'recip') drawReciprocal(); else drawCrystal();
  drawXRD();
  const [h, k, l] = st.hkl;
  const lines = powderLines(st.lat, 4.0, 1.5406, 24);
  rLat.textContent = st.lat.toUpperCase();
  rNat.textContent = String(atomsPerConventionalCell(st.lat));
  rD.textContent = dSpacing(h, k, l, 1).toFixed(3);
  rBz.textContent = String(bzFaceCount(st.lat));
  rL1.textContent = lines.length ? lines[0].hkl.join('') : '-';
}

let last = (typeof performance !== 'undefined' ? performance.now() : 0);
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (st.running) st.yaw += dt * 0.5;
  render();
  requestAnimationFrame(tick);
}

selLat.addEventListener('change', () => { st.lat = selLat.value; render(); });
selView.addEventListener('change', () => { st.view = selView.value; render(); });
selHkl.addEventListener('change', () => { st.hkl = selHkl.value.split(',').map(Number); render(); });
sSC.addEventListener('input', () => { st.sc = parseInt(sSC.value, 10); vSC.textContent = String(st.sc); render(); });
bR.addEventListener('click', () => {
  st.lat = 'fcc'; st.view = 'crystal'; st.hkl = [1, 1, 1]; st.sc = 1; st.running = true;
  selLat.value = 'fcc'; selView.value = 'crystal'; selHkl.value = '1,1,1'; sSC.value = '1'; vSC.textContent = '1';
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); render();
});
bP.addEventListener('click', () => { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); });

function bootSync() {
  vSC.textContent = String(st.sc);
  if (CAPTURE_NAME) { st.yaw = 0.6 + (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) * 2 * Math.PI; }
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
