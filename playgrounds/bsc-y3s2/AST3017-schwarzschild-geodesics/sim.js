// sim.js
// Schwarzschild null geodesics (light bending) headless core. Equatorial
// plane, geometric units G = c = M = 1.
//
// For null geodesics with conserved energy E and angular momentum L, the
// radial motion follows
//   (1/2) p_r^2 + V_null(r; L) = (1/2) E^2,    p_r = dr/d lambda
// with affine-parameter Hamiltonian
//   V_null(r; L) = (L^2 / (2 r^2)) * (1 - 2/r)
// and conserved angular coordinate dphi/d lambda = L / r^2.
//
// Critical impact parameter b_c = L/E = 3 sqrt(3) ~ 5.196; photons with
// |b| < b_c are swallowed, |b| > b_c are deflected. The unstable circular
// orbit (photon sphere) sits at r = 3.
//
// Each photon carries its own L (impact parameter at infinity); the engine
// state is the 1D radial position with one DOF per photon. accelerationFn
// applies a per-tracer acceleration -dV_null/dr.

import {
  create as engineCreate,
  step as engineStep,
} from '../../../shared/js/engine/symplectic.js';

export const DEFAULT_DT = 0.05;
export const B_CRIT = 3 * Math.sqrt(3);        // 5.196
export const R_HORIZON = 2.0;
export const R_PHOTON_SPHERE = 3.0;
export const SWALLOWED = 'swallowed';
export const DEFLECTED = 'deflected';
export const ESCAPED   = 'escaped';
export const RUNNING   = 'running';

// V_null(r; L) = L^2 (1 - 2/r) / (2 r^2).
export function Vnull(r, L) {
  return (L * L) * (1 - 2 / r) / (2 * r * r);
}

// dV_null/dr = L^2 (3 - r) / r^4. Positive for r in (2, 3) (potential rises
// from V(2)=0 toward V(3)=L^2/54), negative for r > 3 (potential falls back
// toward 0 at infinity).
export function dVnull_dr(r, L) {
  return (L * L) * (3 - r) / (r * r * r * r);
}

// Plane-wave initial condition: photon at (x = -x_inf, y = b) moving in +x.
// Returns r, p_r, phi consistent with E = 1, L = -b (sign chosen so phi
// decreases when b > 0; the engine only sees L^2 in the potential and
// L / r^2 in the angular coordinate update).
export function planeWaveIC(b, x_inf = 12) {
  const r    = Math.sqrt(x_inf * x_inf + b * b);
  const phi  = Math.atan2(b, -x_inf);
  // Null condition (E=1): p_r^2 = 1 - L^2 (1 - 2/r) / r^2.
  const Vinit = Vnull(r, b);
  const p_r2 = Math.max(0, 1 - 2 * Vinit);
  const p_r  = -Math.sqrt(p_r2);                 // negative: incoming
  // Sign of L: positive b above the x-axis, the photon curls clockwise (dphi/dlambda < 0).
  const L = -b;
  return { r, p_r, phi, L };
}

function makeAccel(Ls) {
  return function accelerationFn(q, _qdot, _m, _t, out) {
    for (let i = 0; i < q.length; i += 1) {
      out[i] = -dVnull_dr(q[i], Ls[i]);
    }
  };
}

function makeEnergy(Ls) {
  return function energyFn(q, qdot, _m) {
    let E = 0;
    for (let i = 0; i < q.length; i += 1) {
      E += 0.5 * qdot[i] * qdot[i] + Vnull(q[i], Ls[i]);
    }
    return E;
  };
}

// Create a swarm of photons from a plane wave with N impact parameters
// linearly spaced in [-bMax, bMax]. Returns a swarm structure that the
// caller advances with stepSwarm() until each photon reaches its fate.
export function createPhotonSwarm({
  N = 41,
  bMax = 9,
  xInf = 12,
} = {}) {
  const Ls         = new Float64Array(N);
  const bs         = new Float64Array(N);
  const positions  = new Float64Array(N);
  const velocities = new Float64Array(N);
  const phis       = new Float64Array(N);
  const fates      = new Array(N).fill(RUNNING);
  const trails     = new Array(N).fill(null).map(() => []);

  for (let i = 0; i < N; i += 1) {
    // Distribute impact parameters with mild bunching near b_crit so the
    // critical region is well sampled.
    const t = -1 + 2 * i / (N - 1);
    const b = bMax * Math.sign(t) * Math.pow(Math.abs(t), 0.8);
    const ic = planeWaveIC(b, xInf);
    bs[i]         = b;
    Ls[i]         = ic.L;
    positions[i]  = ic.r;
    velocities[i] = ic.p_r;
    phis[i]       = ic.phi;
    // record starting (x, y) for the trail
    trails[i].push({ x: -xInf, y: b });
  }

  const masses = new Float64Array(N);
  masses.fill(1);

  const inst = engineCreate({
    positions, velocities, masses,
    accelerationFn: makeAccel(Ls),
    energyFn:       makeEnergy(Ls),
    integrator: 'verlet',
  });

  return {
    inst,
    Ls,
    bs,
    phis,
    fates,
    trails,
    N,
    xInf,
    // rEscape must exceed the maximum initial radius sqrt(xInf^2 + bMax^2) plus
    // a small buffer; otherwise photons start outside the integration zone and
    // are immediately classified as deflected. Use 1.3x the maximum r_init.
    rEscape: 1.3 * Math.sqrt(xInf * xInf + bMax * bMax),
  };
}

// Advance the swarm one step. For photons still RUNNING, advance phi and
// check fate (swallowed if r < horizon + small buffer; escaped if r >
// rEscape; otherwise still deflecting). Returns true if all photons have
// reached a terminal fate.
//
// Terminal photons get their velocity zeroed so subsequent engineStep calls
// do not propagate them into r < 0 territory (the 1/r^4 force becomes NaN
// near r = 0). Their q is also held at the last good value.
export function stepSwarm(sw, dt = DEFAULT_DT) {
  engineStep(sw.inst, dt);
  let allDone = true;
  for (let i = 0; i < sw.N; i += 1) {
    if (sw.fates[i] !== RUNNING) {
      // freeze terminal photons: hold the position, zero velocity and accel
      sw.inst.qdot[i] = 0;
      sw.inst.a[i] = 0;
      continue;
    }
    const r = sw.inst.q[i];
    if (!Number.isFinite(r) || r < R_HORIZON + 0.05) {
      sw.fates[i] = SWALLOWED;
      sw.inst.q[i] = Math.max(R_HORIZON, r);
      sw.inst.qdot[i] = 0;
      continue;
    }
    sw.phis[i] += dt * sw.Ls[i] / (r * r);
    sw.trails[i].push({ x: r * Math.cos(sw.phis[i]), y: r * Math.sin(sw.phis[i]) });
    if (r > sw.rEscape) {
      sw.fates[i] = DEFLECTED;
      sw.inst.qdot[i] = 0;
    } else {
      allDone = false;
    }
  }
  return allDone;
}

// Current (x, y) world position of photon i in the swarm. Useful for the
// renderer that draws a small dot at each photon's leading edge.
export function photonPosition(sw, i) {
  const r = sw.inst.q[i];
  if (!Number.isFinite(r)) return { x: 0, y: 0 };
  return { x: r * Math.cos(sw.phis[i]), y: r * Math.sin(sw.phis[i]) };
}

// Run the swarm to completion or up to maxSteps. Returns the swarm; query
// fates / trails afterward.
export function runSwarm(sw, maxSteps = 20000, dt = DEFAULT_DT) {
  for (let i = 0; i < maxSteps; i += 1) {
    if (stepSwarm(sw, dt)) break;
  }
  return sw;
}

// Convenience: trace a single photon and return its full trail and fate.
export function tracePhoton(b, opts = {}) {
  const sw = createPhotonSwarm({ N: 1, bMax: Math.abs(b) || 0.001, xInf: opts.xInf ?? 12 });
  // overwrite the single photon with the requested impact parameter exactly
  const ic = planeWaveIC(b, opts.xInf ?? 12);
  sw.Ls[0]         = ic.L;
  sw.bs[0]         = b;
  sw.inst.q[0]     = ic.r;
  sw.inst.qdot[0]  = ic.p_r;
  sw.phis[0]       = ic.phi;
  sw.fates[0]      = RUNNING;
  sw.trails[0]     = [{ x: -(opts.xInf ?? 12), y: b }];
  // re-prime engine acceleration with the updated state
  sw.inst.accelerationFn(sw.inst.q, sw.inst.qdot, sw.inst.m, 0, sw.inst.a);
  runSwarm(sw, opts.maxSteps ?? 20000, opts.dt ?? DEFAULT_DT);
  return { trail: sw.trails[0], fate: sw.fates[0], phiTotal: sw.phis[0] };
}
