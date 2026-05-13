// sim.js
// Schwarzschild geodesics headless core. Equatorial-plane massive test particle
// in geometric units G = c = M = 1. State is (r, p_r); angular coordinate phi
// integrated alongside via dphi/dtau = L / r^2. L is conserved by construction.

import {
  create as engineCreate,
  step as engineStep,
  diagnostics as engineDiagnostics,
} from '../../shared/js/engine/symplectic.js';

export const DEFAULT_DT = 0.05;

// V_eff(r; L) = -1/r + L^2/(2 r^2) - L^2/r^3.
export function Veff(r, L) {
  const L2 = L * L;
  return -1 / r + L2 / (2 * r * r) - L2 / (r * r * r);
}

// dV_eff/dr = 1/r^2 - L^2/r^3 + 3 L^2 / r^4.
export function dVeff_dr(r, L) {
  const L2 = L * L;
  return 1 / (r * r) - L2 / (r * r * r) + 3 * L2 / (r * r * r * r);
}

function makeAccel(L) {
  return function accelerationFn(q, _qdot, _m, _t, out) {
    out[0] = -dVeff_dr(q[0], L);
  };
}

function makeEnergy(L) {
  return function energyFn(q, qdot, _m) {
    return 0.5 * qdot[0] * qdot[0] + Veff(q[0], L);
  };
}

// Place the particle at apoapsis (r = r_ap, p_r = 0). Phi starts at 0.
export function createGeodesic(r_ap, L) {
  const inst = engineCreate({
    positions:  Float64Array.from([r_ap]),
    velocities: Float64Array.from([0]),
    masses: 1,
    accelerationFn: makeAccel(L),
    energyFn:       makeEnergy(L),
    integrator: 'verlet',
  });
  return { inst, L, phi: 0, r_ap };
}

export function stepGeodesic(g, dt = DEFAULT_DT) {
  engineStep(g.inst, dt);
  const r = g.inst.q[0];
  if (r > 0) g.phi += dt * g.L / (r * r);
}

export function geodesicDiagnostics(g) {
  const d = engineDiagnostics(g.inst);
  return {
    r: g.inst.q[0],
    p_r: g.inst.qdot[0],
    phi: g.phi,
    L: g.L,
    radialEnergy: d.energy,
    radialEnergyDrift: d.energyDrift,
    t: g.inst.t,
  };
}
