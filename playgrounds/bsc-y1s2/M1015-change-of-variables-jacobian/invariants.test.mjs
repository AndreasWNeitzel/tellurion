// Change-of-variables invariants: the analytic Jacobian matches the numeric one,
// and the integral of |J| over the source region equals the true mapped area.

import { describe, it, expect } from 'vitest';
import { MAPS, numericJac, quadArea, accumulate } from './sim.js';

describe('Analytic |J| matches the numeric Jacobian', () => {
  for (const key of Object.keys(MAPS)) {
    it(`${key}`, () => {
      const m = MAPS[key];
      for (const [u, v] of [[0.3, 0.4], [0.6, 0.2], [0.9, 0.7]]) {
        const uu = m.u[0] + u * (m.u[1] - m.u[0]);
        const vv = m.v[0] + v * (m.v[1] - m.v[0]);
        expect(m.jac(uu, vv)).toBeCloseTo(numericJac(m.map, uu, vv), 4);
      }
    });
  }
});

describe('Integral of |J| equals the mapped area', () => {
  for (const key of Object.keys(MAPS)) {
    it(`${key}: jacInt converges to the true mapped area`, () => {
      const m = MAPS[key];
      const coarse = accumulate(m, 8);
      const fine = accumulate(m, 64);
      // The Jacobian integral and the shoelace mapped area agree, and the
      // agreement improves with resolution.
      const errFine = Math.abs(fine.jacInt - fine.mappedArea) / fine.mappedArea;
      const errCoarse = Math.abs(coarse.jacInt - coarse.mappedArea) / coarse.mappedArea;
      expect(errFine).toBeLessThan(2e-3);
      expect(errFine).toBeLessThanOrEqual(errCoarse + 1e-9);
    });
  }
});

describe('The naive (no-Jacobian) area is the source area, generally wrong', () => {
  it('polar: naive area is the (r,theta) rectangle area, not the mapped area', () => {
    const m = MAPS.polar;
    const acc = accumulate(m, 64);
    const srcArea = (m.u[1] - m.u[0]) * (m.v[1] - m.v[0]);
    expect(acc.naive).toBeCloseTo(srcArea, 6);
    expect(Math.abs(acc.naive - acc.mappedArea)).toBeGreaterThan(0.1);
  });
});

describe('Analytic areas where known', () => {
  it('polar mapped area equals half (r1^2 - r0^2) (t1 - t0)', () => {
    const m = MAPS.polar;
    expect(accumulate(m, 128).mappedArea).toBeCloseTo(m.area(), 3);
  });
  it('linear mapped area equals source area times |det|', () => {
    const m = MAPS.linear;
    expect(accumulate(m, 64).mappedArea).toBeCloseTo(m.area(), 3);
  });
});
