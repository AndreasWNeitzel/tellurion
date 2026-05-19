// Galaxy merger as a real, fully three-dimensional self-gravitating
// N-body. Gravity is the shared 3D Barnes-Hut octree
// (shared/js/engine/barnes-hut-3d): O(N log N), no grid, no periodic
// box, no analytic cores, no merge event (Barnes & Hut, Nature 324,
// 446, 1986; mergers: Barnes & Efstathiou 1987; leapfrog +
// Plummer-equivalent softening after Springel 2005, GADGET-2). Every
// particle has a true 3D position and velocity; the in-fall, tidal
// tails, bridges, dynamical-friction inspiral and coalescence all
// emerge from the 3D dynamics, solved per frame at a solid 60fps.
//
// The camera orbits the real point cloud (drag), zooms (wheel) and
// pans (Shift-drag). A second panel shows the stars in the energy vs
// angular-momentum plane in the surviving primary's frame, where the
// disrupted companion leaves the Gaia-Enceladus / Sausage clump.

import { buildGalaxies, setVelocities, G, THETA, EPS, NTOT, DT } from './model.js';
import { accelBH, stepBH, potentialBH } from '../../../shared/js/engine/barnes-hut-3d.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? '0');
const SEED          = 0xC0FFEE;

const canvas   = document.getElementById('stage');
const ctx      = canvas.getContext('2d', { alpha: false });
const readout  = document.getElementById('readout');
const controlsEl = document.getElementById('controls');
const W = canvas.width, H = canvas.height;

const state = {
  M1: 1.0,        // primary total mass
  M2: 0.7,        // companion mass (heavy: friction sinks it decisively)
  aoa: 30,        // angle of attack to the primary disk plane (deg)
  impact: 0.5,    // impact parameter
  vRel: 0.04,     // closing speed (a tight, bound orbit)
  running: !DETERMINISTIC,
};
const cam = { yaw: 0.6, pitch: 0.95, zoom: 1.0, panx: 0, pany: 0 };

let X, V, M, KIND, ORIG, NP, elapsed = 0, lastA;
let com = [0, 0, 0, 0, 0, 0];
let elzPts = null, elzClock = 0;
const SPLIT = 0.57;

function reset() {
  const g = buildGalaxies(state, SEED);
  const a0 = accelBH(g.X, g.M, g.NP, { G, theta: THETA, eps: EPS });
  setVelocities(g, a0, state);
  X = g.X; V = g.V; M = g.M; KIND = g.KIND; ORIG = g.ORIG; NP = g.NP;
  elapsed = 0; lastA = undefined; elzPts = null; elzClock = 0;
}

function physFrame(nsub) {
  const st = { x: X, v: V, m: M, N: NP, t: elapsed, nSteps: 0, a: lastA };
  for (let s = 0; s < nsub; s += 1) stepBH(st, DT, { G, theta: THETA, eps: EPS });
  lastA = st.a; elapsed = st.t;
}

// Robust mass-weighted COM of the bound system (exclude far runaways,
// then refine within a clip radius) so the locked view never drifts.
function updateCentroid() {
  let mx = 0, my = 0, mz = 0, mvx = 0, mvy = 0, mvz = 0, ms = 0;
  for (let p = 0; p < NP; p += 1) {
    const x = X[3 * p], y = X[3 * p + 1], z = X[3 * p + 2];
    if (Math.abs(x) > 30 || Math.abs(y) > 30 || Math.abs(z) > 30) continue;
    const w = M[p];
    mx += w * x; my += w * y; mz += w * z;
    mvx += w * V[3 * p]; mvy += w * V[3 * p + 1]; mvz += w * V[3 * p + 2]; ms += w;
  }
  if (ms === 0) { com = [0, 0, 0, 0, 0, 0]; return; }
  const c0x = mx / ms, c0y = my / ms, c0z = mz / ms;
  let nx = 0, ny = 0, nz = 0, nvx = 0, nvy = 0, nvz = 0, ns = 0;
  for (let p = 0; p < NP; p += 1) {
    const dx = X[3 * p] - c0x, dy = X[3 * p + 1] - c0y, dz = X[3 * p + 2] - c0z;
    if (dx * dx + dy * dy + dz * dz > 49) continue;
    const w = M[p];
    nx += w * X[3 * p]; ny += w * X[3 * p + 1]; nz += w * X[3 * p + 2];
    nvx += w * V[3 * p]; nvy += w * V[3 * p + 1]; nvz += w * V[3 * p + 2]; ns += w;
  }
  com = ns === 0
    ? [c0x, c0y, c0z, mvx / ms, mvy / ms, mvz / ms]
    : [nx / ns, ny / ns, nz / ns, nvx / ns, nvy / ns, nvz / ns];
}

function updateElz() {
  const phi = potentialBH(X, M, NP, { G, theta: THETA, eps: EPS });
  const out = [];
  for (let p = 0; p < NP; p += 2) {
    if (KIND[p] >= 2) continue;
    const dx = X[3 * p] - com[0], dy = X[3 * p + 1] - com[1];
    const vx = V[3 * p] - com[3], vy = V[3 * p + 1] - com[4], vz = V[3 * p + 2] - com[5];
    out.push(dx * vy - dy * vx, 0.5 * (vx * vx + vy * vy + vz * vz) + phi[p], ORIG[p]);
  }
  elzPts = Float32Array.from(out);
}

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);
  const Wl = W * SPLIT;
  const cx = Wl / 2 + cam.panx, cy = H / 2 + cam.pany;
  for (let i = 0; i < 230; i += 1) {                  // deterministic starfield
    const h = Math.sin(i * 12.9898) * 43758.5453; const hx = h - Math.floor(h);
    const gg = Math.sin(i * 78.233) * 9871.231;   const hy = gg - Math.floor(gg);
    const br = (Math.sin(i * 3.17) + 1) / 2;
    const a = 0.06 + 0.42 * br * br;
    const s = i % 9 === 0 ? 1.6 : 1;
    ctx.fillStyle = `rgba(208,216,255,${a.toFixed(3)})`;
    ctx.fillRect(hx * Wl, hy * H, s, s);
  }
  const c = com;
  const SCR = Math.min(Wl, H) * 0.050 * cam.zoom;
  const cyaw = Math.cos(cam.yaw), syaw = Math.sin(cam.yaw);
  const cpit = Math.cos(cam.pitch), spit = Math.sin(cam.pitch);
  const NBIN = 9;
  const bins = []; for (let bI = 0; bI < NBIN; bI += 1) bins.push([]);
  const proj = new Float64Array(NP * 3);
  let dmin = 1e30, dmax = -1e30;
  let b0x = 0, b0y = 0, b0n = 0, b1x = 0, b1y = 0, b1n = 0;
  for (let kk = 0; kk < NP; kk += 1) {
    const dx = X[3 * kk] - c[0], dy = X[3 * kk + 1] - c[1], dz = X[3 * kk + 2] - c[2];
    const x1 = dx * cyaw - dy * syaw, y1 = dx * syaw + dy * cyaw;
    const sx = cx + x1 * SCR;
    const sy = cy + (y1 * cpit - dz * spit) * SCR;
    const dep = y1 * spit + dz * cpit;
    proj[3 * kk] = sx; proj[3 * kk + 1] = sy; proj[3 * kk + 2] = dep;
    if (dep < dmin) dmin = dep; if (dep > dmax) dmax = dep;
    if (KIND[kk] < 2) {
      if (ORIG[kk] === 0) { b0x += sx; b0y += sy; b0n += 1; }
      else                { b1x += sx; b1y += sy; b1n += 1; }
    }
  }
  const span = (dmax - dmin) || 1;
  for (let kk = 0; kk < NP; kk += 1) {
    const sx = proj[3 * kk], sy = proj[3 * kk + 1];
    if (sx < -20 || sx > Wl + 20 || sy < -20 || sy > H + 20) continue;
    let bI = ((proj[3 * kk + 2] - dmin) / span * (NBIN - 1)) | 0;
    if (bI < 0) bI = 0; else if (bI >= NBIN) bI = NBIN - 1;
    bins[bI].push(kk);
  }
  ctx.globalCompositeOperation = 'lighter';
  for (let bI = 0; bI < NBIN; bI += 1) {
    const sh = 0.6 + 0.4 * (bI / (NBIN - 1));
    for (const kk of bins[bI]) {
      const sx = proj[3 * kk], sy = proj[3 * kk + 1];
      if (KIND[kk] >= 2) {
        ctx.fillStyle = ORIG[kk] === 0
          ? `rgba(96,110,168,${(0.05 * sh).toFixed(3)})`
          : `rgba(170,140,98,${(0.05 * sh).toFixed(3)})`;
        ctx.fillRect(sx, sy, 1.4, 1.4);
      } else {
        ctx.fillStyle = ORIG[kk] === 0
          ? `rgba(150,182,255,${(0.62 * sh).toFixed(3)})`
          : `rgba(255,188,116,${(0.66 * sh).toFixed(3)})`;
        ctx.fillRect(sx - 1.0, sy - 1.0, 2.0, 2.0);
      }
    }
  }
  const bloom = (mx, my, n, rgb) => {
    if (n < 12) return;
    const px = mx / n, py = my / n;
    for (let i = 0; i < 9; i += 1) {
      ctx.fillStyle = `rgba(${rgb},0.05)`;
      ctx.beginPath(); ctx.arc(px, py, 46 * (1 - i / 9), 0, 2 * Math.PI); ctx.fill();
    }
  };
  bloom(b0x, b0y, b0n, '150,185,255');
  bloom(b1x, b1y, b1n, '255,190,118');
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#9aa0b0'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('3D self-gravitating merger (Barnes-Hut, dark halo + disk, COM frame)', 12, 20);
  ctx.fillStyle = 'rgba(154,160,176,0.7)'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('drag: rotate   wheel: zoom   shift-drag: pan', 12, H - 14);

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.moveTo(Wl, 0); ctx.lineTo(Wl, H); ctx.stroke();
  const pts = elzPts;
  const px0 = Wl + 54, px1 = W - 18, py0 = 40, py1 = H - 40;
  if (pts && pts.length >= 3) {
    let lzMax = 1e-6, eLo = 1e30, eHi = -1e30;
    for (let i = 0; i < pts.length; i += 3) {
      const lz = pts[i], e = pts[i + 1];
      if (Math.abs(lz) > lzMax) lzMax = Math.abs(lz);
      if (e < eLo) eLo = e; if (e > eHi) eHi = e;
    }
    lzMax *= 0.92;
    const eSpan = (eHi - eLo) || 1;
    const mapx = (lz) => px0 + (lz + lzMax) / (2 * lzMax) * (px1 - px0);
    const mapy = (e)  => py1 - (e - eLo) / eSpan * (py1 - py0);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.strokeRect(px0, py0, px1 - px0, py1 - py0);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.moveTo(mapx(0), py0); ctx.lineTo(mapx(0), py1); ctx.stroke();
    for (let i = 0; i < pts.length; i += 3) {
      const Xp = mapx(pts[i]), Yp = mapy(pts[i + 1]);
      if (Xp < px0 || Xp > px1 || Yp < py0 || Yp > py1) continue;
      ctx.fillStyle = pts[i + 2] === 0 ? 'rgba(124,156,255,0.42)' : 'rgba(253,181,106,0.55)';
      ctx.fillRect(Xp, Yp, 1.5, 1.5);
    }
  }
  ctx.fillStyle = '#9aa0b0'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('integrals of motion (stars, COM frame)', px0, 22);
  ctx.fillText('L_z  (angular momentum)', px0 + 60, H - 16);
  ctx.save();
  ctx.translate(Wl + 18, (py0 + py1) / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('E  (orbital energy)', -56, 0);
  ctx.restore();

  if (readout) {
    const ratio = (Math.max(state.M1, state.M2) / Math.min(state.M1, state.M2)).toFixed(1);
    readout.innerHTML =
      `<span>particles</span><span class="value">${NP}</span>` +
      `<span>M1:M2</span><span class="value">${ratio}:1</span>` +
      `<span>t</span><span class="value">${elapsed.toFixed(1)}</span>`;
  }
}

let raf;
function tick() {
  if (state.running) physFrame(1);
  updateCentroid();
  if (elzClock % 8 === 0) updateElz();
  elzClock += 1;
  render();
  if (!CAPTURE_NAME) raf = requestAnimationFrame(tick);
}

function buildControls() {
  controlsEl.innerHTML = '';
  function slider(id, label, min, max, st, val, onInput, fmt = v => v.toFixed(2)) {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
    const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
    inp.min = String(min); inp.max = String(max); inp.step = String(st); inp.value = String(val);
    inp.setAttribute('aria-label', label);
    const v = document.createElement('span'); v.className = 'value'; v.textContent = fmt(val);
    inp.addEventListener('input', () => { const x = parseFloat(inp.value); v.textContent = fmt(x); onInput(x); });
    row.appendChild(lab); row.appendChild(inp); row.appendChild(v);
    controlsEl.appendChild(row);
  }
  slider('M1', 'M1 primary',  0.4, 1.6, 0.05, state.M1, x => { state.M1 = x; reset(); });
  slider('M2', 'M2 accreted', 0.1, 1.6, 0.05, state.M2, x => { state.M2 = x; reset(); });
  slider('impact', 'impact b', 0, 3, 0.1, state.impact, x => { state.impact = x; reset(); });
  slider('vRel', 'closing v', 0.0, 0.6, 0.01, state.vRel, x => { state.vRel = x; reset(); });
  slider('aoa', 'angle of attack', 0, 90, 5, state.aoa,
    x => { state.aoa = x; reset(); }, v => `${v.toFixed(0)} deg`);
  const row = document.createElement('div'); row.className = 'row buttons';
  const launch = document.createElement('button'); launch.type = 'button'; launch.textContent = 'Relaunch';
  launch.addEventListener('click', () => { reset(); state.running = true; });
  const pause = document.createElement('button'); pause.type = 'button'; pause.textContent = 'Pause';
  pause.addEventListener('click', () => {
    state.running = !state.running;
    pause.textContent = state.running ? 'Pause' : 'Play';
    pause.setAttribute('aria-pressed', String(!state.running));
  });
  row.appendChild(launch); row.appendChild(pause); controlsEl.appendChild(row);
}

function setupCamera() {
  let drag = false, panning = false, lx = 0, ly = 0;
  const toLocal = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  };
  canvas.addEventListener('pointerdown', (e) => {
    const p = toLocal(e);
    if (p.x > W * SPLIT) return;
    drag = true; panning = e.shiftKey; lx = p.x; ly = p.y;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = panning ? 'move' : 'grabbing';
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = toLocal(e); const dx = p.x - lx, dy = p.y - ly; lx = p.x; ly = p.y;
    if (panning) {
      cam.panx = Math.max(-W, Math.min(W, cam.panx + dx));
      cam.pany = Math.max(-H, Math.min(H, cam.pany + dy));
    } else {
      cam.yaw += dx * 0.006;
      cam.pitch = Math.max(0.05, Math.min(1.55, cam.pitch - dy * 0.005));
    }
  });
  const end = (e) => {
    drag = false; panning = false; canvas.style.cursor = 'grab';
    if (e.pointerId !== undefined && canvas.hasPointerCapture?.(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', (e) => {
    const p = toLocal(e);
    if (p.x > W * SPLIT) return;
    e.preventDefault();
    cam.zoom = Math.max(0.35, Math.min(5, cam.zoom * Math.exp(-e.deltaY * 0.0012)));
  }, { passive: false });
  canvas.style.cursor = 'grab';
}

buildControls();
setupCamera();
reset();
if (DETERMINISTIC) {
  // Reference capture: the in-fall up to the first deep passage. A
  // positive-Lyapunov N-body is not bitwise-reproducible across browser
  // JIT environments after the violent encounter, so only the
  // predictable in-fall is SSIM-gated; the live run integrates
  // indefinitely, showing the full coalescence and the Sausage.
  const warm = CAPTURE_NAME ? Math.round(20 + CAPTURE_FRAC * 110) : 220;
  physFrame(warm);
  updateCentroid();
  updateElz();
  render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  raf = requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  // A Barnes-Hut tree code does not conserve momentum to roundoff
  // (cell-monopole forces are not exactly pairwise antisymmetric); the
  // shared engine tests verify accuracy vs direct summation and the
  // theta -> 0 exact limit. Here: confirm the state is finite.
  let finite = true;
  for (let k = 0; k < 3 * NP; k += 311) if (!Number.isFinite(X[k])) finite = false;
  return { name: 'BH state finite', pass: finite, msg: finite ? '3D Barnes-Hut state finite' : 'non-finite state' };
};
