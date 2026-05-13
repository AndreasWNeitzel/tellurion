// sim.js
// Kepler orbit explorer headless core. 2D Newtonian Kepler with GM = 1.
// Reuses shared/js/engine/symplectic.js (separable, exact symplectic Verlet).

import {
  create as engineCreate,
  step as engineStep,
  diagnostics as engineDiagnostics,
} from '../../shared/js/engine/symplectic.js';

export const DEFAULT_DT = 0.01;

// Place the particle at apastron for the given (a, e). With GM = 1:
//   r_ap = a (1 + e), v_ap = sqrt((1 - e) / (a (1 + e))).
// Returns { positions, velocities } as Float64Array of length 2.
export function apastronIC(a, e) {
  const r_ap = a * (1 + e);
  const v_ap = Math.sqrt((1 - e) / (a * (1 + e)));
  return {
    positions:  Float64Array.from([r_ap, 0]),
    velocities: Float64Array.from([0,    v_ap]),
  };
}

function accelerationFn(q, _qdot, _m, _t, out) {
  const x = q[0], y = q[1];
  const r2 = x * x + y * y;
  const r3 = r2 * Math.sqrt(r2);
  out[0] = -x / r3;
  out[1] = -y / r3;
}

function energyFn(q, qdot, m) {
  const x = q[0], y = q[1];
  const vx = qdot[0], vy = qdot[1];
  const r = Math.sqrt(x * x + y * y);
  return 0.5 * m[0] * (vx * vx + vy * vy) - m[0] / r;
}

function angularMomentumFn(q, qdot, m) {
  return m[0] * (q[0] * qdot[1] - q[1] * qdot[0]);
}

function lrlFn(q, qdot, _m) {
  const x = q[0], y = q[1];
  const vx = qdot[0], vy = qdot[1];
  const r = Math.sqrt(x * x + y * y);
  const L = x * vy - y * vx;
  return Float64Array.from([vy * L - x / r, -vx * L - y / r]);
}

export function createOrbit(a, e) {
  const { positions, velocities } = apastronIC(a, e);
  const inst = engineCreate({
    positions, velocities,
    masses: 1,
    accelerationFn, energyFn, angularMomentumFn, lrlFn,
    integrator: 'verlet',
  });
  return { inst, a, e, period: 2 * Math.PI * Math.pow(a, 1.5) };
}

export function stepOrbit(orbit, dt = DEFAULT_DT) {
  engineStep(orbit.inst, dt);
}

export function orbitDiagnostics(orbit) {
  const d = engineDiagnostics(orbit.inst);
  const lrlMag = Math.hypot(d.lrl[0], d.lrl[1]);
  return { ...d, lrlMag };
}
