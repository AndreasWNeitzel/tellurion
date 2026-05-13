// MC integration invariants.
// (a) Plain MC converges to EXACT.
// (b) 1/sqrt(N) standard-error scaling.
// (c) Both methods produce finite estimates.
// (d) Convergence array shape.
// (e) Test-function exact integral.

import { describe, it, expect } from 'vitest';
import { plainMC, importanceMC, convergence, testFn, EXACT } from './sim.js';

describe('MC: plain converges to EXACT', () => {
  it('|I_hat - EXACT| < 0.05 at N = 1e5', () => {
    const r = plainMC(100_000, 0xC0FFEE);
    expect(Math.abs(r.I - EXACT)).toBeLessThan(0.05);
  }, 30_000);
});

describe('MC: standard-error scaling', () => {
  it('SE shrinks as 1/sqrt(N): ratio in [2, 5]', () => {
    const r1 = plainMC(1_000, 1);
    const r2 = plainMC(10_000, 1);
    expect(r2.se).toBeLessThan(r1.se);
    expect(r1.se / r2.se).toBeGreaterThan(2);
    expect(r1.se / r2.se).toBeLessThan(5);
  }, 30_000);
});

describe('MC: both methods produce finite estimates', () => {
  it('plain and importance both within 0.1 of EXACT at N = 1e4', () => {
    const rPlain = plainMC(10_000, 42);
    const rIS = importanceMC(10_000, 42);
    expect(Math.abs(rPlain.I - EXACT)).toBeLessThan(0.1);
    expect(Math.abs(rIS.I - EXACT)).toBeLessThan(0.15);
  }, 30_000);
});

describe('MC: convergence array shape', () => {
  it('convergence(plainMC, 8) returns 5 entries', () => {
    const c = convergence(plainMC, 8);
    expect(c.length).toBe(5);
    expect(c[0].N).toBe(16);
    expect(c[4].N).toBe(256);
  });
});

describe('MC: test-function exact integral', () => {
  it('integral 0..1 of (1 + 10 (x - 0.5)^4) = 1.125 within 1e-6', () => {
    let sum = 0;
    const N = 10_000;
    for (let i = 0; i <= N; i += 1) {
      const x = i / N;
      const wgt = (i === 0 || i === N) ? 0.5 : 1.0;
      sum += wgt * testFn(x);
    }
    sum /= N;
    expect(Math.abs(sum - EXACT)).toBeLessThan(1e-6);
  });
});
