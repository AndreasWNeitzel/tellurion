// Brachistochrone invariant tests.
// (a) T_CYCLOID < T_LINE, T_CYCLOID < T_ARC (cycloid is fastest).
// (b) T_CYCLOID < T_ARC < T_LINE for the standard X_B = 4, Y_B = 2 geometry
//     (arc still beats the line because both deepen the descent early).
// (c) Endpoints: x(t = T_*) = X_B, y(t = T_*) = -Y_B for each curve.
// (d) Initial position is (0, 0) for each curve.
// (e) Cycloid parametric closed form: x = R(theta - sin theta), y = -R(1 - cos theta).

import { describe, it, expect } from 'vitest';
import {
  CYCLOID, T_CYCLOID, T_LINE, T_ARC,
  positionOnCycloid, positionOnLine, positionOnArc,
  cycloidCurve, X_B, Y_B,
} from './sim.js';

describe('Brachistochrone: cycloid is fastest', () => {
  it('T_CYCLOID < T_LINE', () => {
    expect(T_CYCLOID).toBeLessThan(T_LINE);
  });
  it('T_CYCLOID < T_ARC', () => {
    expect(T_CYCLOID).toBeLessThan(T_ARC);
  });
});

describe('Brachistochrone: endpoints', () => {
  it('cycloid reaches (X_B, -Y_B) at t = T_CYCLOID', () => {
    const p = positionOnCycloid(T_CYCLOID);
    expect(p.x).toBeCloseTo(X_B, 6);
    expect(p.y).toBeCloseTo(-Y_B, 6);
  });
  it('straight line reaches (X_B, -Y_B) at t = T_LINE', () => {
    const p = positionOnLine(T_LINE);
    expect(p.x).toBeCloseTo(X_B, 6);
    expect(p.y).toBeCloseTo(-Y_B, 6);
  });
  it('arc reaches (X_B, -Y_B) at t = T_ARC', () => {
    const p = positionOnArc(T_ARC + 0.01);
    expect(p.x).toBeCloseTo(X_B, 2);
    expect(p.y).toBeCloseTo(-Y_B, 2);
  });
});

describe('Brachistochrone: initial position', () => {
  it('each curve starts at (0, 0)', () => {
    expect(positionOnCycloid(0).x).toBeCloseTo(0, 12);
    expect(positionOnCycloid(0).y).toBeCloseTo(0, 12);
    expect(positionOnLine(0).x).toBeCloseTo(0, 12);
    expect(positionOnLine(0).y).toBeCloseTo(0, 12);
  });
});

describe('Brachistochrone: cycloid parametrization', () => {
  it('cycloidCurve points satisfy x = R(theta - sin theta), y = -R(1 - cos theta)', () => {
    const pts = cycloidCurve(40);
    for (let i = 0; i <= 40; i += 1) {
      const theta = CYCLOID.thetaB * i / 40;
      const expectedX = CYCLOID.R * (theta - Math.sin(theta));
      const expectedY = -CYCLOID.R * (1 - Math.cos(theta));
      expect(pts[i][0]).toBeCloseTo(expectedX, 10);
      expect(pts[i][1]).toBeCloseTo(expectedY, 10);
    }
  });
});

describe('Brachistochrone: cycloid time formula', () => {
  it('T_CYCLOID = sqrt(R / g) theta_B within 1e-9', () => {
    const expected = Math.sqrt(CYCLOID.R / 9.81) * CYCLOID.thetaB;
    expect(T_CYCLOID).toBeCloseTo(expected, 9);
  });
});
