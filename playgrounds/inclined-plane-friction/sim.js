// sim.js
// Block on an inclined plane with Coulomb friction (static / kinetic split).
//
// Geometry: slope of angle theta tilted up to the right. Position x is
// measured along the slope from the top, increasing downhill.
//
// Static regime:
//   Block held in equilibrium by static friction up to |f_s| <= mu_s N.
//   Threshold: motion begins when mg sin(theta) > mu_s mg cos(theta),
//   i.e., when theta > theta_c = atan(mu_s).
//
// Kinetic regime:
//   Once sliding, kinetic friction f_k = mu_k N opposes motion.
//   Acceleration along slope: a = g (sin(theta) - mu_k cos(theta)).
//   Position from rest: x(t) = 0.5 a t^2; velocity v(t) = a t.
//
// Reference: Marion and Thornton, Classical Dynamics 5e Ch. 2
// (`marion-thornton`).

export const G = 9.81;
export const M = 1.0;

export function createBlock({ theta = 0.5, muS = 0.4, muK = 0.3, slopeLength = 5.0 } = {}) {
  return {
    theta,       // slope angle (radians)
    muS,         // static friction coefficient
    muK,         // kinetic friction coefficient
    slopeLength, // total slope length (m)
    x: 0,        // distance traveled along slope from rest position
    v: 0,        // velocity along slope (positive = downhill)
    t: 0,        // simulation time
    moving: false,
    nSteps: 0,
  };
}

export function criticalAngle(muS) {
  return Math.atan(muS);
}

export function kineticAcceleration(theta, muK) {
  return G * (Math.sin(theta) - muK * Math.cos(theta));
}

export function staticThresholdSatisfied(theta, muS) {
  return Math.tan(theta) > muS;
}

// Closed-form position and velocity from rest under kinetic friction.
export function analyticPosition(theta, muK, t) {
  const a = kineticAcceleration(theta, muK);
  if (a <= 0) return 0;
  return 0.5 * a * t * t;
}
export function analyticVelocity(theta, muK, t) {
  const a = kineticAcceleration(theta, muK);
  if (a <= 0) return 0;
  return a * t;
}

// Step the block with a fixed dt. Once the block starts moving it does not
// stop (kinetic friction is constant; there is no opposing force to bring it
// to rest on the slope as long as a > 0). If a <= 0 (kinetic friction
// dominates gravity component) the block decelerates and may halt at v = 0.
export function stepBlock(s, dt = 0.01) {
  if (!s.moving) {
    if (staticThresholdSatisfied(s.theta, s.muS)) {
      s.moving = true;
    } else {
      // Still at rest: only the clock advances.
      s.t += dt;
      s.nSteps += 1;
      return;
    }
  }
  const a = kineticAcceleration(s.theta, s.muK);
  // Velocity-Verlet for constant acceleration is exact.
  s.x += s.v * dt + 0.5 * a * dt * dt;
  s.v += a * dt;
  if (s.v < 0) s.v = 0; // cannot move uphill from rest on a slope
  if (s.x > s.slopeLength) s.x = s.slopeLength;
  s.t += dt;
  s.nSteps += 1;
}

export function resetBlock(s) {
  s.x = 0; s.v = 0; s.t = 0; s.moving = false; s.nSteps = 0;
}

// Energy bookkeeping. Returns kinetic, potential (referenced to slope
// bottom), and the work done by friction since release.
export function energyBudget(s) {
  const h = (s.slopeLength - s.x) * Math.sin(s.theta);
  const ke = 0.5 * M * s.v * s.v;
  const pe = M * G * h;
  const wFriction = s.muK * M * G * Math.cos(s.theta) * s.x;
  return { ke, pe, wFriction, total: ke + pe + wFriction };
}
