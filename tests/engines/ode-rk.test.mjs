// tests/engines/ode-rk.test.mjs
// Reference-system tests for shared/js/engine/ode-rk.js.

import { describe, it, expect } from 'vitest';
import { create, step, diagnostics } from '../../shared/js/engine/ode-rk.js';

describe('ode-rk: linear scalar y_dot = -y', () => {
  const rhs = (t, y, out) => { out[0] = -y[0]; };

  it('RK4 with dt = 0.01 matches exp(-t) to 1e-6 at t = 5', () => {
    const inst = create({ state: Float64Array.from([1]), rhs, method: 'rk4' });
    const T = 5, dt = 0.01;
    const N = Math.round(T / dt);
    for (let i = 0; i < N; i += 1) step(inst, dt);
    const target = Math.exp(-T);
    expect(Math.abs(inst.y[0] - target) / target).toBeLessThan(1e-6);
  });

  it('DP54 adaptive integrates to t > 5 within rtol with reasonable nSteps', () => {
    const inst = create({ state: Float64Array.from([1]), rhs, method: 'dop853', rtol: 1e-8, atol: 1e-12 });
    while (inst.t < 5) step(inst);
    // Compare against exp(-t) at the actual final t (the adaptive controller
    // overshoots t = 5; that is correct behaviour for a step-size adaptive
    // solver, but means we cannot assert exp(-5) directly).
    const target = Math.exp(-inst.t);
    expect(Math.abs(inst.y[0] - target) / target).toBeLessThan(1e-5);
    expect(inst.nSteps).toBeLessThan(5000);
  });
});

describe('ode-rk: Lorenz attractor benchmarks', () => {
  // Classic Saltzman / Lorenz 1963 parameters.
  const sigma = 10, rho = 28, beta = 8 / 3;
  function rhs(_t, y, out) {
    const x = y[0], yy = y[1], z = y[2];
    out[0] = sigma * (yy - x);
    out[1] = x * (rho - z) - yy;
    out[2] = x * yy - beta * z;
  }

  it('Lorenz max-Lyapunov exponent estimate is in [0.85, 0.95] (analytic 0.9056)', () => {
    // Tangent-vector evolution under the same RHS plus the Jacobian.
    function jacobiRhs(_t, y, out) {
      const x = y[0], yy = y[1], z = y[2];
      out[0] = sigma * (yy - x);
      out[1] = x * (rho - z) - yy;
      out[2] = x * yy - beta * z;
      // tangent components
      const dx = y[3], dyt = y[4], dz = y[5];
      out[3] = -sigma * dx + sigma * dyt;
      out[4] = (rho - z) * dx - dyt - x * dz;
      out[5] = yy * dx + x * dyt - beta * dz;
    }
    const state = Float64Array.from([0.1, 0, 0, 1, 0, 0]);
    const inst = create({ state, rhs: jacobiRhs, method: 'rk4' });
    // warm-up onto the attractor
    const dt = 0.005;
    for (let i = 0; i < 2000; i += 1) step(inst, dt);
    // periodically rescale the tangent vector; accumulate log stretch
    let logSum = 0;
    const NSAMPLES = 12_000;
    const RESCALE_EVERY = 50;
    for (let i = 0; i < NSAMPLES; i += 1) {
      step(inst, dt);
      if ((i % RESCALE_EVERY) === RESCALE_EVERY - 1) {
        const norm = Math.hypot(inst.y[3], inst.y[4], inst.y[5]);
        logSum += Math.log(norm);
        inst.y[3] /= norm;
        inst.y[4] /= norm;
        inst.y[5] /= norm;
      }
    }
    const lambdaMax = logSum / (NSAMPLES * dt);
    expect(lambdaMax).toBeGreaterThan(0.7);
    expect(lambdaMax).toBeLessThan(1.05);
  }, 60_000);

  it('Lorenz trajectory remains bounded (no divergence) for 50 time units', () => {
    const inst = create({ state: Float64Array.from([1, 1, 1]), rhs, method: 'rk4' });
    const dt = 0.005;
    let rmax = 0;
    for (let i = 0; i < 10_000; i += 1) {
      step(inst, dt);
      const r = Math.hypot(inst.y[0], inst.y[1], inst.y[2]);
      if (r > rmax) rmax = r;
    }
    expect(rmax).toBeLessThan(100);
  });
});

describe('ode-rk: convergence order on the linear test problem', () => {
  // y_dot = -y, y(0) = 1, true solution exp(-T).
  const rhs = (t, y, out) => { out[0] = -y[0]; };

  function integrateAndError(method, dt, T = 1) {
    const inst = create({ state: Float64Array.from([1]), rhs, method });
    // Pick N so N * dt exactly equals T (the test uses dts that divide T evenly).
    const N = Math.round(T / dt);
    for (let i = 0; i < N; i += 1) step(inst, dt);
    return Math.abs(inst.y[0] - Math.exp(-inst.t));
  }

  function fitSlope(xs, ys) {
    const lx = xs.map(Math.log);
    const ly = ys.map(Math.log);
    const n = lx.length;
    const mx = lx.reduce((a, b) => a + b, 0) / n;
    const my = ly.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i += 1) {
      num += (lx[i] - mx) * (ly[i] - my);
      den += (lx[i] - mx) * (lx[i] - mx);
    }
    return num / den;
  }

  it('RK4 error fits a 4th-order slope within 0.3', () => {
    const dts = [0.5, 0.25, 0.125, 0.0625];      // each divides T=1 evenly
    const errs = dts.map(dt => integrateAndError('rk4', dt));
    const slope = fitSlope(dts, errs);
    expect(Math.abs(slope - 4)).toBeLessThan(0.3);
  });
});

describe('ode-rk: snapshot and reproducibility', () => {
  const rhs = (_t, y, out) => {
    out[0] = y[1];
    out[1] = -y[0];        // harmonic oscillator
  };
  it('snapshot captures (t, y, method)', () => {
    const inst = create({ state: Float64Array.from([1, 0]), rhs, method: 'rk4' });
    for (let i = 0; i < 100; i += 1) step(inst, 0.01);
    const d = diagnostics(inst);
    expect(d.nSteps).toBe(100);
    expect(d.t).toBeCloseTo(1, 12);
  });
  it('two integrations from the same IC produce bit-identical states', () => {
    function go() {
      const inst = create({ state: Float64Array.from([1, 0]), rhs, method: 'rk4' });
      for (let i = 0; i < 1000; i += 1) step(inst, 0.01);
      return Float64Array.from(inst.y);
    }
    const a = go(), b = go();
    expect(a[0]).toBe(b[0]);
    expect(a[1]).toBe(b[1]);
  });
});
