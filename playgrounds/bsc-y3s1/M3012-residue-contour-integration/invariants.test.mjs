// Invariants for the residue theorem: residues match known values, the contour
// integral equals 2 pi i times the enclosed-residue sum, enclosing no pole gives
// zero, and the integral jumps by 2 pi i Res when a pole is swallowed.

import { describe, it, expect } from 'vitest';
import { FUNCS, cabs, csub, contourIntegral, residueAt, residueTheoremValue } from './sim.js';

describe('Residues match known values', () => {
  it('z/((z-1)(z+2)): Res at 1 is 1/3, at -2 is 2/3', () => {
    const f = FUNCS.twoPoles;
    expect(residueAt(f, [1, 0])[0]).toBeCloseTo(1 / 3, 4); expect(residueAt(f, [1, 0])[1]).toBeCloseTo(0, 4);
    expect(residueAt(f, [-2, 0])[0]).toBeCloseTo(2 / 3, 4);
  });
  it('1/(z^2+1): Res at i is -i/2, at -i is i/2', () => {
    const f = FUNCS.imagPair;
    expect(residueAt(f, [0, 1])[0]).toBeCloseTo(0, 4); expect(residueAt(f, [0, 1])[1]).toBeCloseTo(-0.5, 4);
    expect(residueAt(f, [0, -1])[1]).toBeCloseTo(0.5, 4);
  });
});

describe('The contour integral equals 2 pi i times the enclosed residues', () => {
  for (const [key, R] of [['twoPoles', 1.5], ['twoPoles', 3], ['imagPair', 2], ['threeReal', 1.3], ['cubic', 0.5]]) {
    it(`${key}, R=${R}`, () => {
      const f = FUNCS[key]; const I = contourIntegral(f, [0, 0], R); const T = residueTheoremValue(f, [0, 0], R);
      expect(I[0]).toBeCloseTo(T[0], 2); expect(I[1]).toBeCloseTo(T[1], 2);
    });
  }
});

describe('Enclosing no pole gives zero', () => {
  it('a tiny contour at a regular point integrates to ~0', () => {
    const f = FUNCS.twoPoles; const I = contourIntegral(f, [0, 0], 0.4);
    expect(Math.hypot(I[0], I[1])).toBeLessThan(1e-2);
  });
});

describe('The integral jumps by 2 pi i Res when a pole is swallowed', () => {
  it('twoPoles: growing R past z=1 adds 2 pi i (1/3)', () => {
    const f = FUNCS.twoPoles;
    const before = contourIntegral(f, [0, 0], 0.8), after = contourIntegral(f, [0, 0], 1.5);
    const jump = [after[0] - before[0], after[1] - before[1]];
    expect(jump[0]).toBeCloseTo(0, 2); expect(jump[1]).toBeCloseTo(2 * Math.PI * (1 / 3), 1);
  });
  it('enclosing all poles of a proper rational function gives ~0 (residues sum to zero)', () => {
    const f = FUNCS.threeReal; const I = contourIntegral(f, [0, 0], 3.2);
    expect(Math.hypot(I[0], I[1])).toBeLessThan(0.05);
  });
});
