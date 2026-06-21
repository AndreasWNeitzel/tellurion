// Lane-Emden polytrope engine tests against the tabulated surface zeros and the
// analytic n=0 and n=1 solutions.

import { describe, it, expect } from 'vitest';
import { laneEmden, thetaAt, dthetaAt, soundSpeed2 } from '../../shared/js/engine/polytrope.js';

describe('Lane-Emden surface zeros', () => {
  it('n=0 has xi_1 = sqrt(6)', () => {
    expect(laneEmden(0).xi1).toBeCloseTo(Math.sqrt(6), 3);
  });
  it('n=1 has xi_1 = pi', () => {
    expect(laneEmden(1).xi1).toBeCloseTo(Math.PI, 3);
  });
  it('n=3 has xi_1 = 6.89685', () => {
    expect(laneEmden(3).xi1).toBeCloseTo(6.89685, 3);
  });
});

describe('Lane-Emden solution shape', () => {
  it('central boundary conditions theta(0)=1, theta\'(0)=0', () => {
    const m = laneEmden(3);
    expect(m.th[0]).toBeCloseTo(1, 12);
    expect(m.dth[0]).toBeCloseTo(0, 12);
  });
  it('n=0 reproduces theta = 1 - xi^2/6 analytically', () => {
    const m = laneEmden(0);
    for (const xi of [0.5, 1.0, 1.8, 2.3]) {
      expect(thetaAt(m, xi)).toBeCloseTo(1 - xi * xi / 6, 4);
    }
  });
  it('n=1 reproduces theta = sin(xi)/xi analytically', () => {
    const m = laneEmden(1);
    for (const xi of [0.5, 1.0, 2.0, 3.0]) {
      expect(thetaAt(m, xi)).toBeCloseTo(Math.sin(xi) / xi, 3);
    }
  });
  it('theta is monotonically decreasing and bounded in [0,1]', () => {
    const m = laneEmden(3);
    let prev = 1.0001;
    for (let x = 0; x <= 1; x += 0.02) {
      const t = thetaAt(m, x * m.xi1);
      expect(t).toBeLessThanOrEqual(prev);
      expect(t).toBeGreaterThanOrEqual(-1e-9);
      prev = t;
    }
  });
  it('theta\' is negative through the interior', () => {
    const m = laneEmden(3);
    for (let x = 0.05; x < 0.99; x += 0.05) {
      expect(dthetaAt(m, x * m.xi1)).toBeLessThan(0);
    }
  });
  it('sound speed squared falls from 1 at the centre to 0 at the surface', () => {
    const m = laneEmden(3);
    expect(soundSpeed2(m, 0)).toBeCloseTo(1, 6);
    expect(soundSpeed2(m, 1)).toBeCloseTo(0, 6);
    expect(soundSpeed2(m, 0.5)).toBeGreaterThan(0);
    expect(soundSpeed2(m, 0.5)).toBeLessThan(1);
  });
});
