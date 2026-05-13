// sim.js
// Lorenz 1963 system, headless. Wraps shared/js/engine/ode-rk.js.
// State: [x, y, z, dx, dy, dz] where the last three are a tangent vector
// for the max-Lyapunov estimator.

import { create as engineCreate, step as engineStep } from '../../shared/js/engine/ode-rk.js';

export const DEFAULT_DT = 0.005;
export const DEFAULT_PARAMS = { sigma: 10, rho: 28, beta: 8 / 3 };

// Build the 6D rhs (3 state + 3 tangent) closure.
export function makeLorenzRhs({ sigma, rho, beta }) {
  return function rhs(_t, y, out) {
    const x = y[0], yy = y[1], z = y[2];
    out[0] = sigma * (yy - x);
    out[1] = x * (rho - z) - yy;
    out[2] = x * yy - beta * z;
    const dx = y[3], dyt = y[4], dz = y[5];
    out[3] = -sigma * dx + sigma * dyt;
    out[4] = (rho - z) * dx - dyt - x * dz;
    out[5] = yy * dx + x * dyt - beta * dz;
  };
}

export function createLorenz({ params = DEFAULT_PARAMS, ic = [1, 1, 1], dt = DEFAULT_DT, method = 'rk4' } = {}) {
  const state = Float64Array.from([ic[0], ic[1], ic[2], 1, 0, 0]);
  const inst = engineCreate({
    state,
    rhs: makeLorenzRhs(params),
    method,
  });
  return {
    inst,
    params,
    dt,
    logSum: 0,            // accumulated log of tangent renorms
    nRescale: 0,
    tWarmup: 0,
  };
}

export function rebuildRhs(lorenz, params) {
  lorenz.params = params;
  lorenz.inst.rhs = makeLorenzRhs(params);
}

export function stepLorenz(lorenz) {
  engineStep(lorenz.inst, lorenz.dt);
}

// Run nSteps of Lorenz and periodically renorm the tangent vector.
// rescaleEvery = number of integrator steps between renormalizations.
export function runLorenz(lorenz, nSteps, rescaleEvery = 50) {
  const y = lorenz.inst.y;
  for (let i = 0; i < nSteps; i += 1) {
    engineStep(lorenz.inst, lorenz.dt);
    if ((i % rescaleEvery) === rescaleEvery - 1) {
      const norm = Math.hypot(y[3], y[4], y[5]);
      if (norm > 0) {
        lorenz.logSum += Math.log(norm);
        lorenz.nRescale += 1;
        y[3] /= norm;
        y[4] /= norm;
        y[5] /= norm;
      }
    }
  }
}

// Maximum Lyapunov estimator: logSum / (nRescale * rescaleEvery * dt).
export function maxLyapunov(lorenz, rescaleEvery = 50) {
  const elapsed = lorenz.nRescale * rescaleEvery * lorenz.dt;
  if (elapsed === 0) return 0;
  return lorenz.logSum / elapsed;
}
