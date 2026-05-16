// sim.js
// Lorenz 1963 system, headless. Wraps shared/js/engine/ode-rk.js.
// State: [x, y, z, dx, dy, dz] where the last three are a tangent vector
// for the max-Lyapunov estimator.

import { create as engineCreate, step as engineStep } from '../../../shared/js/engine/ode-rk.js';

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

// A zoo of classic dissipative chaotic attractors. Each entry is just
// a 3D vector field plus integration data (not new engine code; reuses
// ode-rk). The Lorenz functions and their invariants above are
// untouched. Sources: Lorenz 1963; Roessler 1976; Aizawa (Langford);
// Thomas 1999; Halvorsen; Chen and Ueta 1999.
export const ATTRACTORS = {
  lorenz: {
    label: 'Lorenz 1963', dt: 0.006, scale: 8.5, center: [0, 0, 25], steps: 9000,
    rhs: (s, o) => { o[0] = 10 * (s[1] - s[0]); o[1] = s[0] * (28 - s[2]) - s[1]; o[2] = s[0] * s[1] - (8 / 3) * s[2]; },
    ic: [1, 1, 1],
  },
  rossler: {
    label: 'Roessler 1976', dt: 0.03, scale: 11, center: [0, 0, 6], steps: 9000,
    rhs: (s, o) => { o[0] = -s[1] - s[2]; o[1] = s[0] + 0.2 * s[1]; o[2] = 0.2 + s[2] * (s[0] - 5.7); },
    ic: [0.1, 0, 0],
  },
  aizawa: {
    label: 'Aizawa', dt: 0.01, scale: 150, center: [0, 0, 0], steps: 12000,
    rhs: (s, o) => {
      const x = s[0], y = s[1], z = s[2];
      o[0] = (z - 0.7) * x - 3.5 * y;
      o[1] = 3.5 * x + (z - 0.7) * y;
      o[2] = 0.6 + 0.95 * z - z * z * z / 3 - (x * x + y * y) * (1 + 0.25 * z) + 0.1 * z * x * x * x;
    },
    ic: [0.1, 0, 0],
  },
  thomas: {
    label: 'Thomas', dt: 0.04, scale: 42, center: [0, 0, 0], steps: 12000,
    rhs: (s, o) => { o[0] = Math.sin(s[1]) - 0.208186 * s[0]; o[1] = Math.sin(s[2]) - 0.208186 * s[1]; o[2] = Math.sin(s[0]) - 0.208186 * s[2]; },
    ic: [1.1, 1.1, -0.01],
  },
  halvorsen: {
    label: 'Halvorsen', dt: 0.006, scale: 13, center: [-3, -3, -3], steps: 9000,
    rhs: (s, o) => {
      const x = s[0], y = s[1], z = s[2], a = 1.4;
      o[0] = -a * x - 4 * y - 4 * z - y * y;
      o[1] = -a * y - 4 * z - 4 * x - z * z;
      o[2] = -a * z - 4 * x - 4 * y - x * x;
    },
    ic: [-5, 0, 0],
  },
  chen: {
    label: 'Chen-Ueta', dt: 0.0035, scale: 6.5, center: [0, 0, 24], steps: 9000,
    rhs: (s, o) => {
      const x = s[0], y = s[1], z = s[2], a = 35, b = 3, c = 28;
      o[0] = a * (y - x); o[1] = (c - a) * x - x * z + c * y; o[2] = x * y - b * z;
    },
    ic: [-0.1, 0.5, -0.6],
  },
};

export function createAttractor(key) {
  const A = ATTRACTORS[key] || ATTRACTORS.lorenz;
  const inst = engineCreate({
    state: Float64Array.from(A.ic),
    rhs: (_t, y, out) => A.rhs(y, out),
    method: 'rk4',
  });
  return { inst, dt: A.dt, key, def: A };
}

export function stepAttractor(at) { engineStep(at.inst, at.dt); }
