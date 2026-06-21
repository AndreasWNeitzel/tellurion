// Stellar Oscillation Modes invariant tests. The physics module is exercised
// headlessly; each test asserts a strong-form property of the polytrope model,
// the asymptotic frequencies, or the spherical harmonics.

import { describe, it, expect } from 'vitest';
import {
  laneEmden, modeFrequency, radialEigenfunction, turningRadius,
  realYlm, surfaceNodes, SOLAR_DNU_UHZ,
} from './sim.js';

describe('Lane-Emden n=3 polytrope', () => {
  it('first zero xi_1 matches the tabulated 6.89685', () => {
    expect(laneEmden().xi1).toBeCloseTo(6.89685, 3);
  });
  it('central value theta(0) = 1', () => {
    expect(laneEmden().th[0]).toBeCloseTo(1, 12);
  });
});

describe('Radial eigenfunction', () => {
  it('has exactly n interior nodes for every (n, l)', () => {
    for (let l = 0; l <= 4; l += 1) {
      for (let n = 0; n <= 5; n += 1) {
        expect(radialEigenfunction(n, l).nodes.length).toBe(n);
      }
    }
  });
  it('is normalised to unit peak', () => {
    const { xi } = radialEigenfunction(4, 2);
    let peak = 0; for (const v of xi) peak = Math.max(peak, Math.abs(v));
    expect(peak).toBeCloseTo(1, 6);
  });
  it('is evanescent (near zero) below the turning point for l > 0', () => {
    const e = radialEigenfunction(3, 3);
    const rt = turningRadius(3, 3);
    for (let i = 0; i < e.x.length; i += 1) {
      if (e.x[i] < 0.7 * rt) expect(Math.abs(e.xi[i])).toBeLessThan(1e-6);
    }
    expect(rt).toBeGreaterThan(0);
  });
});

describe('Asymptotic acoustic frequencies', () => {
  it('radial (l=0) ladder is the pinned large separation', () => {
    for (let n = 1; n <= 6; n += 1) {
      const dnu = modeFrequency(n, 0) - modeFrequency(n - 1, 0);
      expect(dnu).toBeCloseTo(SOLAR_DNU_UHZ, 2);
    }
  });
  it('frequency increases with n at fixed l', () => {
    for (let l = 0; l <= 3; l += 1) {
      for (let n = 0; n < 5; n += 1) {
        expect(modeFrequency(n + 1, l)).toBeGreaterThan(modeFrequency(n, l));
      }
    }
  });
  it('frequency increases with l at fixed n (small separation > 0)', () => {
    for (let n = 1; n <= 5; n += 1) {
      for (let l = 0; l < 4; l += 1) {
        expect(modeFrequency(n, l + 1)).toBeGreaterThan(modeFrequency(n, l));
      }
    }
  });
});

describe('Turning point', () => {
  it('is the centre for l=0 and moves outward with l', () => {
    expect(turningRadius(3, 0)).toBe(0);
    let prev = 0;
    for (let l = 1; l <= 4; l += 1) {
      const rt = turningRadius(3, l);
      expect(rt).toBeGreaterThan(prev);
      expect(rt).toBeLessThan(1);
      prev = rt;
    }
  });
});

describe('Spherical harmonics', () => {
  it('Y_0^0 is the constant 1/(2 sqrt(pi))', () => {
    expect(realYlm(0, 0, 0.9, 0.3)).toBeCloseTo(1 / (2 * Math.sqrt(Math.PI)), 12);
  });
  it('orthonormal over the sphere (numerical quadrature)', () => {
    const NT = 400, NP = 400;
    let self = 0, cross = 0;
    for (let i = 0; i < NT; i += 1) {
      const th = Math.PI * (i + 0.5) / NT, w = Math.sin(th) * (Math.PI / NT) * (2 * Math.PI / NP);
      for (let j = 0; j < NP; j += 1) {
        const ph = 2 * Math.PI * (j + 0.5) / NP;
        const a = realYlm(2, 1, th, ph);
        self += a * a * w;
        cross += a * realYlm(3, 1, th, ph) * w;
      }
    }
    expect(self).toBeCloseTo(1, 2);
    expect(Math.abs(cross)).toBeLessThan(1e-2);
  });
  it('surface node counts follow l - |m| latitudes and 2|m| meridians', () => {
    expect(surfaceNodes(3, 1)).toEqual({ latitudes: 2, meridians: 2 });
    expect(surfaceNodes(4, 4)).toEqual({ latitudes: 0, meridians: 8 });
    expect(surfaceNodes(2, 0)).toEqual({ latitudes: 2, meridians: 0 });
  });
});
