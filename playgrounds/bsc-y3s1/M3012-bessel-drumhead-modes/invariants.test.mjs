// Invariants for the drumhead modes: Bessel zeros match known values, the rim is
// clamped (J_m(j_{m,n}) = 0), modes have m nodal diameters and n-1 nodal circles,
// and the frequency ratios are inharmonic.

import { describe, it, expect } from 'vitest';
import { besselJ, besselZero, modeShape, nodalRadii, frequencyRatio } from './sim.js';

describe('Bessel function and its zeros', () => {
  it('J_0(0) = 1, J_m(0) = 0 for m > 0', () => {
    expect(besselJ(0, 0)).toBeCloseTo(1, 12); expect(besselJ(1, 0)).toBeCloseTo(0, 12); expect(besselJ(2, 0)).toBeCloseTo(0, 12);
  });
  it('matches tabulated values: J_0(1) = 0.7652, J_1(2) = 0.5767', () => {
    expect(besselJ(0, 1)).toBeCloseTo(0.7651976866, 6);
    expect(besselJ(1, 2)).toBeCloseTo(0.5767248078, 6);
  });
  it('zeros match known values', () => {
    expect(besselZero(0, 1)).toBeCloseTo(2.404825558, 5);
    expect(besselZero(1, 1)).toBeCloseTo(3.831705970, 5);
    expect(besselZero(2, 1)).toBeCloseTo(5.135622302, 5);
    expect(besselZero(0, 2)).toBeCloseTo(5.520078110, 5);
    expect(besselZero(1, 2)).toBeCloseTo(7.015586670, 5);
  });
});

describe('The clamped rim forces J_m(k a) = 0', () => {
  it('the mode vanishes at the boundary r = 1', () => {
    for (const [m, n] of [[0, 1], [1, 2], [2, 1], [3, 2]]) expect(besselJ(m, besselZero(m, n))).toBeCloseTo(0, 6);
  });
});

describe('Nodal structure', () => {
  it('mode (m,n) has n-1 interior nodal circles', () => {
    expect(nodalRadii(0, 1)).toHaveLength(0);
    expect(nodalRadii(0, 3)).toHaveLength(2);
    expect(nodalRadii(2, 2)).toHaveLength(1);
    for (const r of nodalRadii(0, 3)) { expect(r).toBeGreaterThan(0); expect(r).toBeLessThan(1); }
  });
  it('a nodal circle is where the radial profile vanishes', () => {
    const m = 0, n = 3; for (const r of nodalRadii(m, n)) expect(besselJ(m, besselZero(m, n) * r)).toBeCloseTo(0, 5);
  });
  it('the angular factor cos(m theta) has 2m zeros (m nodal diameters)', () => {
    const m = 3; let zeros = 0, prev = Math.cos(0);
    for (let i = 1; i <= 2000; i += 1) { const th = 2 * Math.PI * i / 2000; const c = Math.cos(m * th); if (prev * c < 0) zeros += 1; prev = c; }
    expect(zeros).toBe(2 * m);
  });
});

describe('The drum is inharmonic', () => {
  it('frequency ratios are not integers', () => {
    expect(frequencyRatio(0, 1)).toBeCloseTo(1, 9);
    expect(frequencyRatio(1, 1)).toBeCloseTo(1.5934, 3); // not 2
    expect(frequencyRatio(2, 1)).toBeCloseTo(2.1357, 3); // not 3
    expect(Number.isInteger(Math.round(frequencyRatio(1, 1) * 1000) / 1000)).toBe(false);
  });
});
