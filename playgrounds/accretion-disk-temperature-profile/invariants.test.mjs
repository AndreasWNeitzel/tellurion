// Accretion-disc temperature invariants.
// (a) T(R_in) = 0.
// (b) Maximum at r = 49/36 R_in.
// (c) Far-edge T(r) ~ r^(-3/4).
// (d) Monotonic decrease beyond peak.
// (e) Bare profile is r^(-3/4).
// (f) full / bare ratio is [1 - sqrt(R_in / r)]^(1/4).

import { describe, it, expect } from 'vitest';
import {
  temperature, temperatureBare, R_IN, R_OUT, R_TMAX, T_MAX,
} from './sim.js';

describe('Disc: inner-edge boundary condition', () => {
  it('T(R_in) = 0', () => {
    expect(temperature(R_IN)).toBeCloseTo(0, 12);
  });
});

describe('Disc: maximum at 49/36 R_in', () => {
  it('R_TMAX = 49/36 R_in and is a local max', () => {
    expect(R_TMAX).toBeCloseTo(49 / 36 * R_IN, 12);
    expect(temperature(R_TMAX)).toBeGreaterThan(temperature(R_TMAX * 0.95));
    expect(temperature(R_TMAX)).toBeGreaterThan(temperature(R_TMAX * 1.05));
  });
});

describe('Disc: far-edge T ~ r^(-3/4)', () => {
  it('T / T_bare approaches 1 within 1 percent at r >= 1e4 R_in', () => {
    for (const r of [1e4, 1e5, 1e6]) {
      const ratio = temperature(r) / temperatureBare(r);
      expect(Math.abs(ratio - 1)).toBeLessThan(0.01);
    }
  });
});

describe('Disc: monotonic decrease beyond peak', () => {
  it('T decreases for r > R_TMAX through R_OUT', () => {
    let prev = T_MAX;
    for (let r = R_TMAX; r <= R_OUT; r += 0.5) {
      const T = temperature(r);
      expect(T).toBeLessThanOrEqual(prev + 1e-9);
      prev = T;
    }
  });
});

describe('Disc: bare profile is r^(-3/4)', () => {
  it('T_bare(2 r) / T_bare(r) = 2^(-3/4)', () => {
    for (const r of [5, 10, 50]) {
      expect(temperatureBare(2 * r) / temperatureBare(r)).toBeCloseTo(Math.pow(2, -0.75), 12);
    }
  });
});

describe('Disc: bare vs full ratio', () => {
  it('full / bare = [1 - sqrt(R_in / r)]^(1/4)', () => {
    for (const r of [2, 5, 10, 50]) {
      const ratio = temperature(r) / temperatureBare(r);
      const expected = Math.pow(1 - Math.sqrt(R_IN / r), 0.25);
      expect(ratio).toBeCloseTo(expected, 12);
    }
  });
});
