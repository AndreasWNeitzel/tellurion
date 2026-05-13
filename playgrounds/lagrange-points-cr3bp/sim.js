// sim.js
// Circular Restricted Three-Body Problem (CR3BP) in the synodic (co-rotating)
// frame. Two primaries of mass m1 (heavier) and m2 (lighter) orbit their
// common center of mass; a test particle moves in their combined gravity
// plus the rotating-frame Coriolis and centrifugal terms. Non-dimensional
// units: m1 + m2 = 1, separation = 1, omega = 1.
//
// Mass parameter: mu = m2 / (m1 + m2).
// Primaries are at (-mu, 0) and (1 - mu, 0).
//
// Equations of motion in the rotating frame:
//   x'' = 2 y' + x - (1 - mu) (x + mu) / r1^3 - mu (x - 1 + mu) / r2^3
//   y'' = -2 x' + y - (1 - mu) y / r1^3 - mu y / r2^3
//
// Jacobi integral (conserved):
//   C = 2 Omega(x, y) - (x'^2 + y'^2)
// where Omega(x, y) = (x^2 + y^2)/2 + (1 - mu)/r1 + mu/r2.
//
// Lagrange points:
//   L1, L2, L3 are roots of a quintic on the x-axis. Standard approximations:
//     L1 ~ (1 - (mu/3)^(1/3), 0)
//     L2 ~ (1 + (mu/3)^(1/3), 0)
//     L3 ~ (-1 - 5 mu / 12, 0)
//   L4 = (1/2 - mu, +sqrt(3)/2), L5 = (1/2 - mu, -sqrt(3)/2).
//   L4, L5 are stable for mu < 0.0385. Earth-Moon mu = 0.01215. Sun-Jupiter
//   mu = 9.5e-4. Both stable.
//
// We use velocity-Verlet with a predictor-corrector pass to handle the
// Coriolis term (qdot-dependent force); see shared/js/engine/symplectic.js.

import { create as engineCreate, step as engineStep, diagnostics as engineDiagnostics } from '../../shared/js/engine/symplectic.js';

export const DEFAULT_DT = 0.002;
export const DEFAULT_MU = 0.01215;   // Earth-Moon
export const SQRT3_HALF = Math.sqrt(3) / 2;

function makeAccel(mu) {
  return function accel(q, qdot, _m, _t, out) {
    const x = q[0], y = q[1];
    const xPrimary = -mu;
    const xSecondary = 1 - mu;
    const dx1 = x - xPrimary, dy1 = y;
    const dx2 = x - xSecondary, dy2 = y;
    const r1 = Math.hypot(dx1, dy1);
    const r2 = Math.hypot(dx2, dy2);
    const r1c = r1 * r1 * r1;
    const r2c = r2 * r2 * r2;
    const grav1x = (1 - mu) * dx1 / r1c;
    const grav1y = (1 - mu) * dy1 / r1c;
    const grav2x = mu * dx2 / r2c;
    const grav2y = mu * dy2 / r2c;
    out[0] = 2 * qdot[1] + x - grav1x - grav2x;
    out[1] = -2 * qdot[0] + y - grav1y - grav2y;
  };
}

function jacobi(q, qdot, mu) {
  const x = q[0], y = q[1];
  const vx = qdot[0], vy = qdot[1];
  const r1 = Math.hypot(x + mu, y);
  const r2 = Math.hypot(x - 1 + mu, y);
  const omega = 0.5 * (x * x + y * y) + (1 - mu) / r1 + mu / r2;
  return 2 * omega - (vx * vx + vy * vy);
}

function makeEnergyFn(mu) {
  return function energy(q, qdot, _m) {
    // Use Jacobi integral as the "energy" tracked by the engine. The engine
    // reports energyDrift = (energy - energy0) / energy0 which we can use.
    return -jacobi(q, qdot, mu);
  };
}

export function createCR3BP({
  mu = DEFAULT_MU, ic = null, integrator = 'verlet',
} = {}) {
  // Default IC: a near-circular orbit around the secondary at L4-ish offset.
  const positions = Float64Array.from(ic ? ic.q : [0.5 - mu, SQRT3_HALF]);
  const velocities = Float64Array.from(ic ? ic.v : [0, 0]);
  const accelerationFn = makeAccel(mu);
  const energyFn = makeEnergyFn(mu);
  const inst = engineCreate({
    positions, velocities, masses: 1.0, accelerationFn, energyFn, integrator,
  });
  return { inst, mu };
}

export function stepCR3BP(sim, dt = DEFAULT_DT) {
  engineStep(sim.inst, dt);
}

export function diagnosticsCR3BP(sim) {
  return engineDiagnostics(sim.inst);
}

// Find L1, L2, L3 by Newton solve along x axis. Equation:
//   x - (1 - mu)(x + mu)/|x + mu|^3 - mu (x - 1 + mu)/|x - 1 + mu|^3 = 0
// L1 lies between primaries; L2 outside the secondary; L3 on the opposite side.
function fAxis(x, mu) {
  const a = x + mu, b = x - 1 + mu;
  const sgnA = a >= 0 ? 1 : -1;
  const sgnB = b >= 0 ? 1 : -1;
  return x - (1 - mu) / (a * a) * sgnA - mu / (b * b) * sgnB;
}
function dfAxis(x, mu) {
  const a = x + mu, b = x - 1 + mu;
  const sgnA = a >= 0 ? 1 : -1;
  const sgnB = b >= 0 ? 1 : -1;
  return 1 + 2 * (1 - mu) / (a * a * a) * sgnA - (-2 * mu / (b * b * b)) * sgnB;
  // The minus sign on the third term is bookkeeping; bisection below is robust.
}

function bisect(f, x0, x1, mu, maxIter = 100, tol = 1e-12) {
  let lo = x0, hi = x1;
  let fLo = f(lo, mu), fHi = f(hi, mu);
  for (let it = 0; it < maxIter; it += 1) {
    const mid = 0.5 * (lo + hi);
    const fMid = f(mid, mu);
    if (Math.abs(fMid) < tol) return mid;
    if (fLo * fMid <= 0) { hi = mid; fHi = fMid; }
    else                 { lo = mid; fLo = fMid; }
    if (Math.abs(hi - lo) < tol) return mid;
  }
  return 0.5 * (lo + hi);
}

export function lagrangePoints(mu) {
  // Bisection brackets that work across the relevant mu range (1e-7 .. 0.5).
  const xL1 = bisect(fAxis, -mu + 1e-6, 1 - mu - 1e-6, mu);
  const xL2 = bisect(fAxis, 1 - mu + 1e-6, 2.5, mu);
  const xL3 = bisect(fAxis, -2.5, -mu - 1e-6, mu);
  return {
    L1: [xL1, 0],
    L2: [xL2, 0],
    L3: [xL3, 0],
    L4: [0.5 - mu, SQRT3_HALF],
    L5: [0.5 - mu, -SQRT3_HALF],
  };
}

export function effectivePotential(x, y, mu) {
  const r1 = Math.hypot(x + mu, y);
  const r2 = Math.hypot(x - 1 + mu, y);
  return -0.5 * (x * x + y * y) - (1 - mu) / r1 - mu / r2;
}

// Stability of L4: triangular Lagrange points are linearly stable iff
//   27 mu (1 - mu) < 1, equivalently mu < (1 - sqrt(1 - 4/27))/2 ~ 0.0385.
export const MU_ROUTH = 0.5 - Math.sqrt(1 - 4 / 27) / 2;
