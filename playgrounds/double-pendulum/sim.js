// sim.js
// Pure, DOM-free numerical core for the double-pendulum playground.
// Imported by playground.js (UI binding) and invariants.test.mjs (headless tests).
//
// Generalized coordinates q = [theta1, theta2], velocities qdot = [omega1, omega2].
// All quantities in SI: kg, m, rad, s. Gravity is the constant G below.
// Equations of motion: Newman 2013 Exercise 8.15.
// Angular momentum about the support:
//   L_z = (m1+m2) l1^2 omega1 + m2 l2^2 omega2 + m2 l1 l2 cos(theta1-theta2) (omega1 + omega2)
// Energy cap policy: E_cap = ENVELOPE_FRAC * ((m1+m2) g l1 - m2 g l2).

export const G = 9.81;
export const ENVELOPE_FRAC = 0.85;
export const POINCARE_MIN_OMEGA = 0.05;
export const PHYSICS_DT = 1e-3;

// Acceleration. Signature matches the symplectic-engine contract.
// Out is filled with [theta1_ddot, theta2_ddot]. mass[0] = m1, mass[1] = m2.
// Note: l1 and l2 live on the params object passed via closure (see makeAccel).
export function makeAccel(params) {
  const { l1, l2 } = params;
  return function accelerationFn(q, qdot, mass, _t, out) {
    const t1 = q[0],  t2 = q[1];
    const w1 = qdot[0], w2 = qdot[1];
    const m1 = mass[0], m2 = mass[1];
    const M = m1 + m2;
    const d12 = t1 - t2;
    const s = Math.sin(d12), c = Math.cos(d12);
    const den = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * d12));
    out[0] = -(
      G * (2 * m1 + m2) * Math.sin(t1)
      + m2 * G * Math.sin(t1 - 2 * t2)
      + 2 * s * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * c)
    ) / den;
    out[1] = (
      2 * s * (
        w1 * w1 * l1 * M
        + G * M * Math.cos(t1)
        + w2 * w2 * l2 * m2 * c
      )
    ) / ((l2 / l1) * den);
  };
}

// Total mechanical energy T + V. Signature matches the engine contract.
export function makeEnergy(params) {
  const { l1, l2 } = params;
  return function energyFn(q, qdot, mass) {
    const t1 = q[0], t2 = q[1];
    const w1 = qdot[0], w2 = qdot[1];
    const m1 = mass[0], m2 = mass[1];
    const T_kin = 0.5 * (m1 + m2) * l1 * l1 * w1 * w1
                + 0.5 * m2 * l2 * l2 * w2 * w2
                + m2 * l1 * l2 * w1 * w2 * Math.cos(t1 - t2);
    const V = -(m1 + m2) * G * l1 * Math.cos(t1) - m2 * G * l2 * Math.cos(t2);
    return T_kin + V;
  };
}

// Angular momentum about the support (the z-component in the plane).
// Returns a scalar. Not conserved by the dynamics.
export function makeAngularMomentum(params) {
  const { l1, l2 } = params;
  return function angularMomentumFn(q, qdot, mass) {
    const t1 = q[0], t2 = q[1];
    const w1 = qdot[0], w2 = qdot[1];
    const m1 = mass[0], m2 = mass[1];
    return (m1 + m2) * l1 * l1 * w1
         + m2 * l2 * l2 * w2
         + m2 * l1 * l2 * Math.cos(t1 - t2) * (w1 + w2);
  };
}

// Energy cap for the spec's IC envelope. E < envelopeCap(...) implies a
// quasi-periodic regime well below the lowest saddle in V.
export function envelopeCap(m1, m2, l1, l2) {
  return ENVELOPE_FRAC * ((m1 + m2) * G * l1 - m2 * G * l2);
}

// Quick energy at rest. Used by the playground to clamp drag-IC inputs.
export function potentialAtRest(theta1, theta2, m1, m2, l1, l2) {
  return -(m1 + m2) * G * l1 * Math.cos(theta1) - m2 * G * l2 * Math.cos(theta2);
}

// Compute the Cartesian bob positions from generalized coords. Useful for both
// rendering and for the visual-test reference frames.
export function bobPositions(theta1, theta2, l1, l2) {
  const x1 = l1 * Math.sin(theta1);
  const y1 = -l1 * Math.cos(theta1);
  const x2 = x1 + l2 * Math.sin(theta2);
  const y2 = y1 - l2 * Math.cos(theta2);
  return { x1, y1, x2, y2 };
}

// Poincare detector: counts upward zero-crossings of theta1 with linear time
// interpolation; rejects crossings with |omega1| below POINCARE_MIN_OMEGA at the
// interpolated time.
export class PoincareCounter {
  constructor() {
    this.count = 0;
    this.lastTheta1 = null;
    this.lastOmega1 = null;
  }
  reset() {
    this.count = 0;
    this.lastTheta1 = null;
    this.lastOmega1 = null;
  }
  // Call once per integration step after `step()`. theta1_now is the new
  // theta1, omega1_now the new omega1.
  observe(theta1_now, omega1_now) {
    if (this.lastTheta1 === null) {
      this.lastTheta1 = theta1_now;
      this.lastOmega1 = omega1_now;
      return false;
    }
    let crossed = false;
    const prevTheta = this.lastTheta1;
    const prevOmega = this.lastOmega1;
    if (prevTheta < 0 && theta1_now >= 0) {
      const denom = theta1_now - prevTheta;
      const alpha = denom !== 0 ? -prevTheta / denom : 0;
      const omegaAtCross = prevOmega + alpha * (omega1_now - prevOmega);
      if (omegaAtCross > POINCARE_MIN_OMEGA) {
        this.count += 1;
        crossed = true;
      }
    }
    this.lastTheta1 = theta1_now;
    this.lastOmega1 = omega1_now;
    return crossed;
  }
}
