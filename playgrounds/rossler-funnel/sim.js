// sim.js
// Rossler 1976 attractor:
//   dx/dt = -y - z
//   dy/dt = x + a y
//   dz/dt = b + z (x - c)
// Classical parameter set: a = 0.2, b = 0.2, c = 5.7. For small c the system
// is regular; through a period-doubling cascade it becomes chaotic, and as
// c grows past about 5.7 the attractor takes on the "funnel" shape (the
// playground name). The tangent equation linearizes about the trajectory
// for a max-Lyapunov estimator.
// State: [x, y, z, dx, dy, dz] (3 phase-space coords + 3 tangent).
// Wraps shared/js/engine/ode-rk.js.

import { create as engineCreate, step as engineStep } from '../../shared/js/engine/ode-rk.js';

export const DEFAULT_DT = 0.02;
export const DEFAULT_PARAMS = { a: 0.2, b: 0.2, c: 5.7 };

export function makeRosslerRhs({ a, b, c }) {
  return function rhs(_t, y, out) {
    const x = y[0], yy = y[1], z = y[2];
    out[0] = -yy - z;
    out[1] = x + a * yy;
    out[2] = b + z * (x - c);
    // Tangent equation: d(delta)/dt = J(y) * delta.
    // J = [[ 0, -1, -1 ],
    //      [ 1,  a,  0 ],
    //      [ z,  0,  x - c ]]
    const dx = y[3], dyt = y[4], dz = y[5];
    out[3] = -dyt - dz;
    out[4] = dx + a * dyt;
    out[5] = z * dx + (x - c) * dz;
  };
}

export function createRossler({ params = DEFAULT_PARAMS, ic = [0.1, 0, 0], dt = DEFAULT_DT, method = 'rk4' } = {}) {
  const state = Float64Array.from([ic[0], ic[1], ic[2], 1, 0, 0]);
  const inst = engineCreate({ state, rhs: makeRosslerRhs(params), method });
  return { inst, params, dt, logSum: 0, nRescale: 0 };
}

export function rebuildRhs(rossler, params) {
  rossler.params = params;
  rossler.inst.rhs = makeRosslerRhs(params);
}

export function stepRossler(rossler) {
  engineStep(rossler.inst, rossler.dt);
}

export function maxLyapunov(rossler, rescaleEvery = 50) {
  const elapsed = rossler.nRescale * rescaleEvery * rossler.dt;
  if (elapsed === 0) return 0;
  return rossler.logSum / elapsed;
}
