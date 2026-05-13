// sim.js
// Perihelion precession in a Schwarzschild-like effective potential.
//
// Pure Newtonian gravity gives closed elliptic orbits (Bertrand 1873): the
// perihelion does not move. The 1PN (first post-Newtonian) correction in
// the orbit-averaged Schwarzschild metric adds an effective potential
// proportional to L^2 / r^3 that breaks the closure and causes a per-orbit
// perihelion advance of
//
//   delta omega = 6 pi G M / (c^2 a (1 - e^2))
//
// For Mercury this is 43 arcsec / century; way too slow to render. We use a
// tunable parameter `alpha` so the user can dial the effect from Newtonian
// (alpha = 0) to "very visible in five orbits" (alpha ~ 0.05). Units in the
// sim: GM = 1, semi-major axis a = 1.
//
// Effective acceleration (Binney-Tremaine 3.6, Misner-Thorne-Wheeler 25.5):
//
//   a_x = -G M x / r^3 * (1 + alpha / r^2)
//   a_y = -G M y / r^3 * (1 + alpha / r^2)
//
// (radial-only correction, conservative; works with velocity-Verlet).
//
// Wraps shared/js/engine/symplectic.js.

import { create as engineCreate, step as engineStep, diagnostics as engineDiagnostics } from '../../shared/js/engine/symplectic.js';

export const G_M = 1.0;
export const DEFAULT_DT = 0.005;
export const DEFAULT_ALPHA = 0.02;
export const DEFAULT_E = 0.4;

function makeAccel(alpha) {
  return function accel(q, _qdot, _m, _t, out) {
    const x = q[0], y = q[1];
    const r2 = x * x + y * y;
    const r = Math.sqrt(r2);
    const r3 = r2 * r;
    const corr = 1 + alpha / r2;
    const k = -G_M / r3 * corr;
    out[0] = k * x;
    out[1] = k * y;
  };
}

function makeEnergyFn(alpha) {
  return function energy(q, qdot, m) {
    const x = q[0], y = q[1];
    const vx = qdot[0], vy = qdot[1];
    const r2 = x * x + y * y;
    const r = Math.sqrt(r2);
    const ke = 0.5 * m[0] * (vx * vx + vy * vy);
    // Potential energy for V(r) = -GM/r - alpha GM / (3 r^3) so that
    // -dV/dr = -GM/r^2 - alpha GM / r^4, matching the radial force above.
    const pe = -G_M * m[0] / r - alpha * G_M * m[0] / (3 * r * r2);
    return ke + pe;
  };
}

function angMom(q, qdot, m) {
  // 2D: scalar L_z = m (x vy - y vx).
  return m[0] * (q[0] * qdot[1] - q[1] * qdot[0]);
}

// Initial conditions for an orbit with semi-major axis a = 1 and eccentricity e,
// starting at aphelion on the +x axis.
export function initialConditions(e = DEFAULT_E) {
  const r_aphelion = 1 + e;
  const v_aphelion = Math.sqrt(G_M * (1 - e) / (1 + e));
  return {
    positions: Float64Array.from([r_aphelion, 0]),
    velocities: Float64Array.from([0, v_aphelion]),
  };
}

export function createMercury({ alpha = DEFAULT_ALPHA, e = DEFAULT_E, integrator = 'verlet' } = {}) {
  const { positions, velocities } = initialConditions(e);
  const accelerationFn = makeAccel(alpha);
  const energyFn = makeEnergyFn(alpha);
  const inst = engineCreate({
    positions, velocities, masses: 1.0, accelerationFn, energyFn, integrator,
    angularMomentumFn: angMom,
  });
  return { inst, alpha, e };
}

export function stepMercury(merc, dt = DEFAULT_DT) {
  engineStep(merc.inst, dt);
}

export function mercuryDiagnostics(merc) {
  return engineDiagnostics(merc.inst);
}

// Find the angle of perihelion in the current orbit by tracking the local
// minimum of r over a single orbital period. Returns NaN if no minimum has
// been found yet in this call.
export function findPerihelionAngle(merc, nSteps, dt = DEFAULT_DT) {
  let rPrev = Infinity, rCurr = Infinity, rNext = Infinity;
  let theta = NaN;
  const y = merc.inst.q;
  const v = merc.inst.qdot;
  for (let i = 0; i < nSteps; i += 1) {
    stepMercury(merc, dt);
    rPrev = rCurr; rCurr = rNext;
    const r = Math.hypot(y[0], y[1]);
    rNext = r;
    if (rPrev > rCurr && rCurr < rNext && Number.isFinite(rPrev)) {
      theta = Math.atan2(y[1], y[0]);
      break;
    }
  }
  return theta;
  void v;
}
