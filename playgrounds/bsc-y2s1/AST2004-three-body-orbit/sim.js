// sim.js
// Three-body gravitational system headless core. Uses shared symplectic engine.
// State layout: positions = [x1, y1, x2, y2, x3, y3]; same for velocities.
// Masses are a 6-element array with mass[i] repeated for each (x, y) pair so the
// engine sees one mass per DOF; pairwise gravity is in accelerationFn.

import {
  create as engineCreate,
  step as engineStep,
  diagnostics as engineDiagnostics,
} from '../../../shared/js/engine/symplectic.js';

export const G = 1;
export const DEFAULT_DT = 0.005;

// Chenciner-Montgomery 2000 IC for the figure-eight choreography (G = m_i = 1).
export function chencinerMontgomeryIC(dvX = 0) {
  const x1 =  0.97000436, y1 = -0.24308753;
  const v3x = -0.93240737, v3y = -0.86473146;
  const v1x = -0.5 * v3x;
  const v1y = -0.5 * v3y;
  return {
    positions:  Float64Array.from([x1, y1, -x1, -y1, 0, 0]),
    velocities: Float64Array.from([v1x, v1y, v1x, v1y, v3x + dvX, v3y]),
  };
}

// Pairwise gravity in O(N^2). Bodies share a common mass per pair, indexed
// 0 = (x1, y1), 1 = (x2, y2), 2 = (x3, y3); we use bodyMass[i] = m[2*i].
function makeAccel(bodyMass) {
  const m = bodyMass.slice();
  return function accelerationFn(q, _qdot, _massPerDOF, _t, out) {
    out.fill(0);
    for (let i = 0; i < 3; i += 1) {
      const xi = q[2 * i], yi = q[2 * i + 1];
      for (let j = 0; j < 3; j += 1) {
        if (i === j) continue;
        const dx = q[2 * j]     - xi;
        const dy = q[2 * j + 1] - yi;
        const r2 = dx * dx + dy * dy;
        const r3 = r2 * Math.sqrt(r2);
        const a = G * m[j] / r3;
        out[2 * i]     += a * dx;
        out[2 * i + 1] += a * dy;
      }
    }
  };
}

function makeEnergy(bodyMass) {
  const m = bodyMass.slice();
  return function energyFn(q, qdot, _m) {
    let K = 0, V = 0;
    for (let i = 0; i < 3; i += 1) {
      const vx = qdot[2 * i], vy = qdot[2 * i + 1];
      K += 0.5 * m[i] * (vx * vx + vy * vy);
    }
    for (let i = 0; i < 3; i += 1) {
      for (let j = i + 1; j < 3; j += 1) {
        const dx = q[2 * j]     - q[2 * i];
        const dy = q[2 * j + 1] - q[2 * i + 1];
        const r = Math.sqrt(dx * dx + dy * dy);
        V += -G * m[i] * m[j] / r;
      }
    }
    return K + V;
  };
}

// Total linear momentum magnitude.
function makeMomentumMag(bodyMass) {
  const m = bodyMass.slice();
  return function (q, qdot, _m) {
    let px = 0, py = 0;
    for (let i = 0; i < 3; i += 1) {
      px += m[i] * qdot[2 * i];
      py += m[i] * qdot[2 * i + 1];
    }
    return Math.hypot(px, py);
  };
}

// Total angular momentum about the origin.
function makeLz(bodyMass) {
  const m = bodyMass.slice();
  return function (q, qdot, _m) {
    let L = 0;
    for (let i = 0; i < 3; i += 1) {
      L += m[i] * (q[2 * i] * qdot[2 * i + 1] - q[2 * i + 1] * qdot[2 * i]);
    }
    return L;
  };
}

// Create the three-body instance. masses default to (1, 1, 1).
export function createThreeBody({ dvX = 0, masses = [1, 1, 1] } = {}) {
  const { positions, velocities } = chencinerMontgomeryIC(dvX);
  const massPerDOF = new Float64Array(6);
  for (let i = 0; i < 3; i += 1) { massPerDOF[2 * i] = masses[i]; massPerDOF[2 * i + 1] = masses[i]; }
  const inst = engineCreate({
    positions, velocities,
    masses: massPerDOF,
    accelerationFn:    makeAccel(masses),
    energyFn:          makeEnergy(masses),
    angularMomentumFn: makeLz(masses),
    integrator: 'verlet',
  });
  // Stash the momentum diagnostic separately (engine does not expose it).
  inst._momentumFn = makeMomentumMag(masses);
  return { inst, masses };
}

export function stepThreeBody(tb, dt = DEFAULT_DT) {
  engineStep(tb.inst, dt);
}

export function threeBodyDiagnostics(tb) {
  const d = engineDiagnostics(tb.inst);
  return {
    energy: d.energy,
    energyDrift: d.energyDrift,
    angularMomentum: d.angularMomentum,
    momentumMag: tb.inst._momentumFn(tb.inst.q, tb.inst.qdot, tb.inst.m),
    t: tb.inst.t,
  };
}
