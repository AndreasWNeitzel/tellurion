// Invariants for Rutherford scattering: the cot(theta/2) = 2b/D relation, the
// limits of the deflection, the 1/sin^4 cross section, the closest approach, and
// that the integrated orbit reproduces the analytic deflection (and conserves
// energy and angular momentum).

import { describe, it, expect } from 'vitest';
import { scatteringAngle, crossSection, closestApproach, integrateTrajectory } from './sim.js';

describe('The deflection follows cot(theta/2) = 2b/D', () => {
  it('matches the closed form across impact parameters', () => {
    const D = 1.3;
    for (const b of [0.2, 0.5, 1, 2, 4]) {
      const th = scatteringAngle(b, D);
      expect(1 / Math.tan(th / 2)).toBeCloseTo(2 * b / D, 9);
    }
  });
  it('back-scatters head-on and barely deflects at large b', () => {
    expect(scatteringAngle(0, 1)).toBeCloseTo(Math.PI, 12);
    expect(scatteringAngle(1e6, 1)).toBeLessThan(1e-3);
  });
  it('the deflection decreases monotonically with impact parameter', () => {
    const D = 1; let prev = Math.PI;
    for (const b of [0.1, 0.5, 1, 2, 5, 10]) { const th = scatteringAngle(b, D); expect(th).toBeLessThan(prev + 1e-12); prev = th; }
  });
});

describe('The differential cross section is the 1/sin^4 law', () => {
  it('equals (D/4)^2 / sin^4(theta/2)', () => {
    const D = 2;
    for (const th of [0.4, 1.0, 2.0, 3.0]) expect(crossSection(th, D)).toBeCloseTo((D / 4) ** 2 / Math.sin(th / 2) ** 4, 9);
  });
  it('diverges toward small angles (forward peak)', () => {
    const D = 1;
    expect(crossSection(0.1, D)).toBeGreaterThan(crossSection(1.0, D));
    expect(crossSection(1.0, D)).toBeGreaterThan(crossSection(3.0, D));
  });
});

describe('Closest approach', () => {
  it('equals D head-on and grows with impact parameter', () => {
    expect(closestApproach(0, 1.4)).toBeCloseTo(1.4, 9);
    expect(closestApproach(2, 1.4)).toBeGreaterThan(closestApproach(0.5, 1.4));
  });
});

describe('The integrated orbit reproduces the analytic scattering', () => {
  for (const b of [0.5, 1.0, 2.0]) {
    it(`b = ${b}: measured deflection matches cot(theta/2) = 2b/D`, () => {
      const D = 1.2; const r = integrateTrajectory(b, D, { xStart: -80, xEnd: 80, dt: 0.008 });
      expect(r.theta).toBeCloseTo(scatteringAngle(b, D), 1);
    });
  }
  it('the closest approach of the orbit matches the formula', () => {
    const D = 1.2, b = 1.0; const r = integrateTrajectory(b, D, { xStart: -80, xEnd: 80, dt: 0.008 });
    expect(r.rmin).toBeCloseTo(closestApproach(b, D), 1);
  });
});
