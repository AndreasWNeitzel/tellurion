// sim.js
// Pure, DOM-free numerical core for the liouvillian-flow playground.
//
// System: N independent 1D pendulums sharing a single symplectic-engine
// instance. State is laid out as positions = [theta_0, ..., theta_{N-1}],
// velocities = [p_0, ..., p_{N-1}]. accelerationFn computes
// -omega^2 sin(theta_i) per tracer.
//
// Liouville diagnostic: covariance-matrix determinant
//   det Sigma = var(theta) * var(p) - cov(theta, p)^2
// which is proportional to the squared 1-sigma phase-space area of the cloud.

import { makeRng, gaussian } from '../../../shared/js/render/rng.js';
import {
  create as engineCreate,
  step as engineStep,
} from '../../../shared/js/engine/symplectic.js';

export const DEFAULT_OMEGA = 1.0;
export const DEFAULT_PHYSICS_DT = 1e-2;
export const DEFAULT_N = 256;
export const DEFAULT_SIGMA_THETA = 0.15;
export const DEFAULT_SIGMA_P     = 0.15;

// Sample N tracers from a Gaussian in (theta, p) centered at (mu_theta, mu_p)
// with diagonal sigma. Returns { positions, velocities } as Float64Arrays of
// length N. Deterministic at the supplied seed.
export function sampleGaussian(N, muTheta, muP, sigmaTheta, sigmaP, seed) {
  const rng = makeRng(seed);
  const positions  = new Float64Array(N);
  const velocities = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    positions[i]  = muTheta + gaussian(rng, 0, sigmaTheta);
    velocities[i] = muP     + gaussian(rng, 0, sigmaP);
  }
  return { positions, velocities };
}

// Acceleration callback for the engine. Closure over omega.
function makeAccel(omega) {
  const omega2 = omega * omega;
  return function accelerationFn(q, _qdot, _m, _t, out) {
    for (let i = 0; i < q.length; i += 1) out[i] = -omega2 * Math.sin(q[i]);
  };
}

// Total energy of the cloud (sum over all tracers). Per-tracer energy is
// 0.5 p_i^2 - omega^2 cos(theta_i); a single mass.
function makeEnergy(omega) {
  const omega2 = omega * omega;
  return function energyFn(q, qdot, _m) {
    let E = 0;
    for (let i = 0; i < q.length; i += 1) {
      E += 0.5 * qdot[i] * qdot[i] - omega2 * Math.cos(q[i]);
    }
    return E;
  };
}

// Energy of a single tracer. Used by invariant tests.
export function tracerEnergy(theta, p, omega = DEFAULT_OMEGA) {
  return 0.5 * p * p - omega * omega * Math.cos(theta);
}

// Covariance-determinant area metric in (theta, p). Uses theta as the
// raw (universal-cover) value; the engine does not wrap theta.
export function covarianceArea(positions, velocities) {
  const N = positions.length;
  if (N < 2) return 0;
  let sumT = 0, sumP = 0;
  for (let i = 0; i < N; i += 1) { sumT += positions[i]; sumP += velocities[i]; }
  const meanT = sumT / N, meanP = sumP / N;
  let varT = 0, varP = 0, covTP = 0;
  for (let i = 0; i < N; i += 1) {
    const dt = positions[i]  - meanT;
    const dp = velocities[i] - meanP;
    varT += dt * dt;
    varP += dp * dp;
    covTP += dt * dp;
  }
  varT /= (N - 1);
  varP /= (N - 1);
  covTP /= (N - 1);
  const det = varT * varP - covTP * covTP;
  // 1-sigma area of a 2D Gaussian: pi * sqrt(det Sigma) * (chi^2_{2, p=0.39}/2 factor of 1)
  // For our diagnostic purpose we use the bare 2*pi*sqrt(det Sigma).
  return 2 * Math.PI * Math.sqrt(Math.max(det, 0));
}

// Builder for the engine instance. The masses array is all 1 (massless tracers
// in dimensionless units).
export function createSwarm({
  N = DEFAULT_N,
  omega = DEFAULT_OMEGA,
  blobCenter = { theta: 0.6, p: 0 },
  sigmaTheta = DEFAULT_SIGMA_THETA,
  sigmaP     = DEFAULT_SIGMA_P,
  seed       = 0xC0FFEE,
} = {}) {
  const { positions, velocities } = sampleGaussian(
    N, blobCenter.theta, blobCenter.p, sigmaTheta, sigmaP, seed,
  );
  const masses = new Float64Array(N);
  masses.fill(1);
  const inst = engineCreate({
    positions, velocities, masses,
    accelerationFn: makeAccel(omega),
    energyFn:       makeEnergy(omega),
    integrator: 'verlet',
  });
  return { inst, N, omega };
}

// Step the whole swarm one engine step (each tracer advances dt).
export function stepSwarm(swarm, dt = DEFAULT_PHYSICS_DT) {
  engineStep(swarm.inst, dt);
}

// Convenience: run swarm for many steps and return final snapshot.
export function runSwarm(swarm, nSteps, dt = DEFAULT_PHYSICS_DT) {
  for (let i = 0; i < nSteps; i += 1) engineStep(swarm.inst, dt);
  return {
    positions:  Float64Array.from(swarm.inst.q),
    velocities: Float64Array.from(swarm.inst.qdot),
    t:          swarm.inst.t,
  };
}
