// Invariants for the Lane-Emden polytrope: the known surface zeros, the analytic
// n=0 and n=1 solutions, the central concentration, the mass profile, and the
// monotone increase of central concentration with index.

import { describe, it, expect } from 'vitest';
import { model, surfaceRadius, theta, densityRatio, massFraction, centralConcentration, thetaAnalytic } from './sim.js';

describe('Surface zeros match the known values', () => {
  it('xi_1: n=0 -> sqrt(6), n=1 -> pi, n=3 -> 6.897', () => {
    expect(surfaceRadius(model(0))).toBeCloseTo(Math.sqrt(6), 2);
    expect(surfaceRadius(model(1))).toBeCloseTo(Math.PI, 2);
    expect(surfaceRadius(model(3))).toBeCloseTo(6.89685, 1);
  });
});

describe('Analytic solutions', () => {
  it('n=1: theta(xi) = sin(xi)/xi', () => {
    const m = model(1); for (const xi of [0.5, 1.5, 2.5, 3.0]) expect(theta(m, xi)).toBeCloseTo(thetaAnalytic(1, xi), 2);
  });
  it('n=0: theta(xi) = 1 - xi^2/6', () => {
    const m = model(0); for (const xi of [0.5, 1.0, 2.0]) expect(theta(m, xi)).toBeCloseTo(thetaAnalytic(0, xi), 2);
  });
});

describe('Density and mass profiles', () => {
  it('density is 1 at the centre and 0 at the surface', () => {
    const m = model(3); expect(densityRatio(m, 0)).toBeCloseTo(1, 6); expect(densityRatio(m, 1)).toBeCloseTo(0, 6);
  });
  it('the enclosed mass fraction rises from 0 to 1 monotonically', () => {
    const m = model(3); expect(massFraction(m, 0)).toBeCloseTo(0, 6); expect(massFraction(m, 1)).toBeCloseTo(1, 2);
    let prev = 0; for (let x = 0.05; x <= 1; x += 0.05) { const mf = massFraction(m, x); expect(mf).toBeGreaterThanOrEqual(prev - 1e-9); prev = mf; }
  });
});

describe('Central concentration', () => {
  it('rho_c/<rho>: n=0 -> 1, n=3 -> ~54', () => {
    expect(centralConcentration(model(0))).toBeCloseTo(1, 2);
    expect(centralConcentration(model(3))).toBeCloseTo(54.18, 0);
  });
  it('higher index concentrates the star more', () => {
    let prev = 0; for (const n of [0.5, 1, 2, 3, 4]) { const c = centralConcentration(model(n)); expect(c).toBeGreaterThan(prev); prev = c; }
  });
});
