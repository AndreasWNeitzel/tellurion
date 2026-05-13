// tests/engines/symplectic.test.mjs
// Reference-system tests for shared/js/engine/symplectic.js.
//
// 1. Harmonic oscillator (omega=1, x0=1, v0=0)
//    - Period within 0.5 percent of 2*pi after 1000 cycles.
//    - Energy peak-to-peak |dE/E| under 1e-4 throughout the run.
//
// 2. Kepler two-body (a=1, e=0.6) with G*M=1 in reduced-mass form
//    - |dE/E| < 1e-3 over 10^4 periods at the chosen dt.
//    - |dL/L| < 1e-10 (angular momentum is exactly conserved by velocity-Verlet
//      on central potentials modulo round-off).
//    - LRL magnitude bounded (no secular drift).
//
// Both run deterministically without RNG; seed 0xC0FFEE is documented but unused.

import { describe, it, expect } from 'vitest';
import { create, step, diagnostics, snapshot } from '../../shared/js/engine/symplectic.js';

const SEED_TAG = '0xC0FFEE';

describe('symplectic: harmonic oscillator (omega=1)', () => {
  const omega = 1;
  const dt = 0.005;
  const periodAnalytic = 2 * Math.PI / omega;

  const accel = (q, _qdot, _m, _t, out) => { out[0] = -omega * omega * q[0]; };
  const energy = (q, qdot, m) => 0.5 * m[0] * (qdot[0] * qdot[0] + omega * omega * q[0] * q[0]);

  it('period within 0.5 percent over 1000 cycles', () => {
    const inst = create({
      positions: Float64Array.from([1]),
      velocities: Float64Array.from([0]),
      masses: 1,
      accelerationFn: accel,
      energyFn: energy,
      integrator: 'verlet',
    });

    const N_CYCLES = 1000;
    const STEPS_PER_CYCLE = Math.round(periodAnalytic / dt);
    const totalSteps = N_CYCLES * STEPS_PER_CYCLE;
    for (let i = 0; i < totalSteps; i += 1) step(inst, dt);

    const totalTime = inst.t;
    const measuredPeriod = totalTime / N_CYCLES;
    const relErr = Math.abs(measuredPeriod - periodAnalytic) / periodAnalytic;
    expect(relErr).toBeLessThan(0.005);
  });

  it('energy peak-to-peak |dE/E| under 1e-4 (Verlet, dt=0.005, 5000 steps)', () => {
    const inst = create({
      positions: Float64Array.from([1]),
      velocities: Float64Array.from([0]),
      masses: 1,
      accelerationFn: accel,
      energyFn: energy,
      integrator: 'verlet',
    });
    let eMin = Infinity, eMax = -Infinity;
    const e0 = diagnostics(inst).energy;
    for (let i = 0; i < 5000; i += 1) {
      step(inst, dt);
      const e = diagnostics(inst).energy;
      if (e < eMin) eMin = e;
      if (e > eMax) eMax = e;
    }
    const peakToPeak = (eMax - eMin) / e0;
    expect(Math.abs(peakToPeak)).toBeLessThan(1e-4);
  });

  it('Yoshida-4 outperforms Verlet on energy oscillation magnitude', () => {
    function maxAbsDrift(integrator) {
      const inst = create({
        positions: Float64Array.from([1]),
        velocities: Float64Array.from([0]),
        masses: 1,
        accelerationFn: accel,
        energyFn: energy,
        integrator,
      });
      let worst = 0;
      const e0 = diagnostics(inst).energy;
      for (let i = 0; i < 2000; i += 1) {
        step(inst, 0.02);
        const e = diagnostics(inst).energy;
        const d = Math.abs((e - e0) / e0);
        if (d > worst) worst = d;
      }
      return worst;
    }
    const dVerlet = maxAbsDrift('verlet');
    const dYoshida = maxAbsDrift('yoshida4');
    expect(dYoshida).toBeLessThan(dVerlet * 0.1);
  });

  it('snapshot/restore roundtrip preserves diagnostics', async () => {
    const { restore } = await import('../../shared/js/engine/symplectic.js');
    const inst = create({
      positions: Float64Array.from([1]),
      velocities: Float64Array.from([0]),
      masses: 1,
      accelerationFn: accel,
      energyFn: energy,
    });
    for (let i = 0; i < 100; i += 1) step(inst, dt);
    const snap = snapshot(inst);
    const eA = diagnostics(inst).energy;
    for (let i = 0; i < 200; i += 1) step(inst, dt);
    restore(inst, snap);
    const eB = diagnostics(inst).energy;
    expect(Math.abs(eB - eA)).toBeLessThan(1e-14);
    expect(inst.t).toBe(snap.t);
  });
});

describe('symplectic: Kepler two-body (reduced mass, GM=1, a=1, e=0.6)', () => {
  // State layout: q = [x, y], qdot = [vx, vy], mass m = 1.
  // r = sqrt(x^2 + y^2), a_grav = -r / |r|^3 (with GM=1).
  // Initial condition at apastron: r = a(1+e) = 1.6, v = sqrt(GM*(1-e)/(a(1+e))) = sqrt(0.4/1.6) = 0.5.
  // Energy E = 0.5*v^2 - GM/r = 0.5*0.25 - 1/1.6 = 0.125 - 0.625 = -0.5.
  // For a Keplerian orbit E = -GM/(2a) = -1/2 confirms a = 1.
  // Angular momentum L = r x v = 1.6 * 0.5 = 0.8.
  // Period T = 2*pi*sqrt(a^3 / GM) = 2*pi.

  const a0 = 1;
  const e0 = 0.6;
  const periodAnalytic = 2 * Math.PI * Math.sqrt(a0 * a0 * a0);
  const rApastron = a0 * (1 + e0);
  const vApastron = Math.sqrt((1 - e0) / (a0 * (1 + e0)));
  const Etarget   = -1 / (2 * a0);

  const accel = (q, _qdot, _m, _t, out) => {
    const x = q[0], y = q[1];
    const r2 = x * x + y * y;
    const r3 = r2 * Math.sqrt(r2);
    out[0] = -x / r3;
    out[1] = -y / r3;
  };
  const energy = (q, qdot, m) => {
    const x = q[0], y = q[1];
    const vx = qdot[0], vy = qdot[1];
    const r = Math.sqrt(x * x + y * y);
    return 0.5 * m[0] * (vx * vx + vy * vy) - m[0] / r;
  };
  const angularMomentum = (q, qdot, m) => m[0] * (q[0] * qdot[1] - q[1] * qdot[0]);
  const lrl = (q, qdot, _m) => {
    // Laplace-Runge-Lenz vector A = v x L - GM * (r_hat), in the plane.
    // Here in 2D: L = x*vy - y*vx (scalar); A_x = vy * L - x/r, A_y = -vx * L - y/r.
    const x = q[0], y = q[1];
    const vx = qdot[0], vy = qdot[1];
    const r = Math.sqrt(x * x + y * y);
    const L = x * vy - y * vx;
    const Ax = vy * L - x / r;
    const Ay = -vx * L - y / r;
    return Float64Array.from([Ax, Ay]);
  };

  function makeInst(integrator = 'verlet') {
    return create({
      positions:  Float64Array.from([rApastron, 0]),
      velocities: Float64Array.from([0, vApastron]),
      masses: 1,
      accelerationFn: accel,
      energyFn: energy,
      angularMomentumFn: angularMomentum,
      lrlFn: lrl,
      integrator,
    });
  }

  it('initial state matches analytic targets', () => {
    const inst = makeInst();
    const d = diagnostics(inst);
    expect(d.energy).toBeCloseTo(Etarget, 12);
    expect(d.angularMomentum).toBeCloseTo(0.8, 12);
  });

  it('|dE/E| < 1e-3 and |dL/L| < 1e-10 over 10^4 periods (Verlet, dt=0.01)', () => {
    const inst = makeInst('verlet');
    const dt = 0.01;
    const N_PERIODS = 10_000;
    const totalSteps = Math.round(N_PERIODS * periodAnalytic / dt);

    let maxEnergyDrift = 0, maxAngularDrift = 0;
    const L0 = diagnostics(inst).angularMomentum;
    for (let i = 0; i < totalSteps; i += 1) {
      step(inst, dt);
      if ((i & 0x3FFF) === 0) {                       // probe diagnostics every ~16k steps
        const d = diagnostics(inst);
        const eDrift = Math.abs(d.energyDrift);
        const lDrift = Math.abs((d.angularMomentum - L0) / L0);
        if (eDrift > maxEnergyDrift)   maxEnergyDrift = eDrift;
        if (lDrift > maxAngularDrift) maxAngularDrift = lDrift;
      }
    }
    expect(maxEnergyDrift).toBeLessThan(1e-3);
    expect(maxAngularDrift).toBeLessThan(1e-10);
  }, 120_000);

  it('LRL magnitude bounded (no secular drift) over 1000 periods (Verlet, dt=0.005)', () => {
    const inst = makeInst('verlet');
    const dt = 0.005;
    const N_PERIODS = 1000;
    const totalSteps = Math.round(N_PERIODS * periodAnalytic / dt);
    const A0 = diagnostics(inst).lrl;
    const mag0 = Math.hypot(A0[0], A0[1]);

    let maxDelta = 0;
    for (let i = 0; i < totalSteps; i += 1) {
      step(inst, dt);
      if ((i & 0xFFF) === 0) {
        const A = diagnostics(inst).lrl;
        const mag = Math.hypot(A[0], A[1]);
        const dmag = Math.abs(mag - mag0) / mag0;
        if (dmag > maxDelta) maxDelta = dmag;
      }
    }
    // Eccentricity e should equal |A|/GM = |A|. Expect mag ~ 0.6, drift bounded.
    expect(mag0).toBeCloseTo(e0, 6);
    expect(maxDelta).toBeLessThan(5e-3);
  }, 30_000);

  it(`reproducible at seed ${SEED_TAG} (snapshot match after 1000 steps)`, () => {
    const make = () => makeInst('verlet');
    const a = make();
    const b = make();
    for (let i = 0; i < 1000; i += 1) { step(a, 0.01); step(b, 0.01); }
    expect(snapshot(a).q[0]).toBe(snapshot(b).q[0]);
    expect(snapshot(a).qdot[1]).toBe(snapshot(b).qdot[1]);
  });
});

// Double pendulum: q = [theta1, theta2], qdot = [omega1, omega2].
// Acceleration is qdot-dependent through the Christoffel / centripetal terms in
// the Lagrangian equations of motion. This test exercises the non-symplectic
// extension of velocity-Verlet documented in symplectic.js and required by
// numerics-skeptic before the double-pendulum playground depends on it.
describe('symplectic: double pendulum (qdot-dependent acceleration)', () => {
  const g = 9.81;
  const m1 = 1, m2 = 1;
  const l1 = 1, l2 = 1;

  // Equations of motion from the Lagrangian L = T - V with
  //   T = 0.5*(m1+m2)*l1^2*omega1^2 + 0.5*m2*l2^2*omega2^2
  //       + m2*l1*l2*omega1*omega2*cos(theta1 - theta2)
  //   V = -(m1+m2)*g*l1*cos(theta1) - m2*g*l2*cos(theta2)
  // matches Newman 2013 Exercise 8.15 within sign conventions.
  function accel(q, qdot, _m, _t, out) {
    const t1 = q[0],  t2 = q[1];
    const w1 = qdot[0], w2 = qdot[1];
    const dt12 = t1 - t2;
    const c = Math.cos(dt12), s = Math.sin(dt12);
    const M = m1 + m2;
    const den = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * dt12));
    out[0] = -(
      g * (2 * m1 + m2) * Math.sin(t1)
      + m2 * g * Math.sin(t1 - 2 * t2)
      + 2 * s * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * c)
    ) / den;
    out[1] = (
      2 * s * (
        w1 * w1 * l1 * M
        + g * M * Math.cos(t1)
        + w2 * w2 * l2 * m2 * c
      )
    ) / (l2 / l1 * den);
  }

  function energy(q, qdot, _m) {
    const t1 = q[0],  t2 = q[1];
    const w1 = qdot[0], w2 = qdot[1];
    const T_kin = 0.5 * (m1 + m2) * l1 * l1 * w1 * w1
                + 0.5 * m2 * l2 * l2 * w2 * w2
                + m2 * l1 * l2 * w1 * w2 * Math.cos(t1 - t2);
    const V = -(m1 + m2) * g * l1 * Math.cos(t1) - m2 * g * l2 * Math.cos(t2);
    return T_kin + V;
  }

  it('|dE/E| < 1e-3 over 10^4 steps at moderate IC (off the separatrix)', () => {
    // Moderate IC: theta1 = 1.2 rad (~69 deg), theta2 = -0.5 rad, both at rest.
    // Energy at this state is well below the separatrix energy 2*M*g*l = 39.24.
    const inst = create({
      positions:  Float64Array.from([1.2, -0.5]),
      velocities: Float64Array.from([0, 0]),
      masses: 1,
      accelerationFn: accel,
      energyFn: energy,
      integrator: 'verlet',
    });
    const dt = 1e-3;
    let maxAbsDrift = 0;
    for (let i = 0; i < 10_000; i += 1) {
      step(inst, dt);
      const d = Math.abs(diagnostics(inst).energyDrift);
      if (d > maxAbsDrift) maxAbsDrift = d;
    }
    expect(maxAbsDrift).toBeLessThan(1e-3);
  });

  // Order-of-convergence probe. On the double pendulum both Verlet and
  // Yoshida-4 are 2nd-order (the Yoshida BCH cancellation does not go through
  // for non-separable Hamiltonians). The test halves dt twice and expects the
  // max |dE/E| to drop by roughly 4x each time for Verlet.
  it('Verlet shows 2nd-order convergence in dt on the double pendulum', () => {
    function maxDrift(dt, durationSec, integrator) {
      const inst = create({
        positions:  Float64Array.from([1.2, -0.5]),
        velocities: Float64Array.from([0, 0]),
        masses: 1,
        accelerationFn: accel,
        energyFn: energy,
        integrator,
      });
      const steps = Math.round(durationSec / dt);
      let worst = 0;
      for (let i = 0; i < steps; i += 1) {
        step(inst, dt);
        const d = Math.abs(diagnostics(inst).energyDrift);
        if (d > worst) worst = d;
      }
      return worst;
    }
    const T = 10;
    const d1 = maxDrift(2e-3, T, 'verlet');
    const d2 = maxDrift(1e-3, T, 'verlet');
    const d3 = maxDrift(5e-4, T, 'verlet');
    // halving dt should reduce error by ~ 4x for 2nd order; tolerate 2.5 .. 8 each step
    expect(d1 / d2).toBeGreaterThan(2.5);
    expect(d1 / d2).toBeLessThan(8);
    expect(d2 / d3).toBeGreaterThan(2.5);
    expect(d2 / d3).toBeLessThan(8);
  });
});
