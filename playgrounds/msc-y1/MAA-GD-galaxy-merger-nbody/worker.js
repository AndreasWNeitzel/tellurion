// worker.js  (module Web Worker)
// Owns the 10000-body 3D Barnes-Hut state and integrates it as fast as
// the O(N log N) tree solve allows (~20 steps/s at 10k). It posts a
// fresh position snapshot after every step so the main thread can
// render at a steady 60fps without ever blocking on the ~50 ms solve.
// The robust bound centroid and the energy / angular-momentum
// diagnostic are computed here (the worker has the full state) and
// posted alongside.

import { accelBH, stepBH, potentialBH } from '../../../shared/js/engine/barnes-hut-3d.js';
import { buildGalaxies, setVelocities, G, THETA, EPS, DT } from './model.js';

let g = null, st = null, running = false, step = 0, loopArmed = false;
let KIND = null, ORIG = null;
const SEED = 0xC0FFEE;

function init(state) {
  g = buildGalaxies(state, SEED);
  const a0 = accelBH(g.X, g.M, g.NP, { G, theta: THETA, eps: EPS });
  setVelocities(g, a0, state);
  st = { x: g.X, v: g.V, m: g.M, N: g.NP, t: 0, nSteps: 0, a: undefined };
  step = 0;
  KIND = g.KIND.slice();
  ORIG = g.ORIG.slice();
  postMessage({ type: 'meta', NP: g.NP, kind: g.KIND, orig: g.ORIG },
    [g.KIND.buffer, g.ORIG.buffer]);
}

function centroid() {
  const X = g.X, V = g.V, M = g.M, NP = g.NP;
  let mx = 0, my = 0, mz = 0, mvx = 0, mvy = 0, mvz = 0, ms = 0;
  for (let p = 0; p < NP; p += 1) {
    const x = X[3 * p], y = X[3 * p + 1], z = X[3 * p + 2];
    if (Math.abs(x) > 30 || Math.abs(y) > 30 || Math.abs(z) > 30) continue;
    const w = M[p];
    mx += w * x; my += w * y; mz += w * z;
    mvx += w * V[3 * p]; mvy += w * V[3 * p + 1]; mvz += w * V[3 * p + 2]; ms += w;
  }
  if (ms === 0) return [0, 0, 0, 0, 0, 0];
  const c0x = mx / ms, c0y = my / ms, c0z = mz / ms;
  let nx = 0, ny = 0, nz = 0, nvx = 0, nvy = 0, nvz = 0, ns = 0;
  for (let p = 0; p < NP; p += 1) {
    const dx = X[3 * p] - c0x, dy = X[3 * p + 1] - c0y, dz = X[3 * p + 2] - c0z;
    if (dx * dx + dy * dy + dz * dz > 49) continue;
    const w = M[p];
    nx += w * X[3 * p]; ny += w * X[3 * p + 1]; nz += w * X[3 * p + 2];
    nvx += w * V[3 * p]; nvy += w * V[3 * p + 1]; nvz += w * V[3 * p + 2]; ns += w;
  }
  if (ns === 0) return [c0x, c0y, c0z, mvx / ms, mvy / ms, mvz / ms];
  return [nx / ns, ny / ns, nz / ns, nvx / ns, nvy / ns, nvz / ns];
}

function elzList(com) {
  const X = g.X, V = g.V, NP = g.NP;
  const phi = potentialBH(X, g.M, NP, { G, theta: THETA, eps: EPS });
  const out = [];
  for (let p = 0; p < NP; p += 4) {
    if (KIND[p] >= 2) continue;
    const dx = X[3 * p] - com[0], dy = X[3 * p + 1] - com[1];
    const vx = V[3 * p] - com[3], vy = V[3 * p + 1] - com[4], vz = V[3 * p + 2] - com[5];
    out.push(dx * vy - dy * vx, 0.5 * (vx * vx + vy * vy + vz * vz) + phi[p], ORIG[p]);
  }
  return Float32Array.from(out);
}

function loop() {
  loopArmed = false;
  if (!running || !st) return;
  stepBH(st, DT, { G, theta: THETA, eps: EPS });
  step += 1;
  const com = centroid();
  const pos = g.X.slice();
  const msg = { type: 'frame', step, t: st.t, com, pos };
  const xfer = [pos.buffer];
  if (step % 6 === 0) { msg.elz = elzList(com); xfer.push(msg.elz.buffer); }
  postMessage(msg, xfer);
  arm();
}
function arm() { if (!loopArmed && running) { loopArmed = true; setTimeout(loop, 0); } }

onmessage = (e) => {
  const d = e.data;
  if (d.type === 'init' || d.type === 'reset') {
    init(d.state); running = true; arm();
  } else if (d.type === 'pause') {
    running = false;
  } else if (d.type === 'play') {
    if (!running) { running = true; arm(); }
  }
};
