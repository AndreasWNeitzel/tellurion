// Tautochrone invariants.
// (a) Quarter-period independent of release amplitude.
// (b) Bottom of bowl at theta = pi.
// (c) Arc length to bottom = 4 R sin((theta - pi) / 2).
// (d) thetaFromS is the inverse of arclengthFromBottom.
// (e) Bead returns to release point after the full period.

import { describe, it, expect } from 'vitest';
import {
  beadPosition, cycloidXY, arclengthFromBottom, thetaFromS,
  R, OMEGA, QUARTER_PERIOD, FULL_PERIOD,
} from './sim.js';

describe('Tautochrone: quarter-period independent of amplitude', () => {
  it('beads released from any s0 reach y = 0 at t = QUARTER_PERIOD', () => {
    for (const s0 of [-3.5, -2.0, -1.0, 1.0, 2.0, 3.5]) {
      const pos = beadPosition(s0, QUARTER_PERIOD);
      expect(Math.abs(pos.y)).toBeLessThan(1e-9);
    }
  });
});

describe('Tautochrone: bottom of bowl', () => {
  it('cycloidXY(pi) = (R pi, 0)', () => {
    const p = cycloidXY(Math.PI);
    expect(p.x).toBeCloseTo(R * Math.PI, 12);
    expect(p.y).toBeCloseTo(0, 12);
  });
});

describe('Tautochrone: arc length formula', () => {
  it('arclengthFromBottom(theta) = 4 R sin((theta - pi) / 2)', () => {
    for (const theta of [0.5, 1.5, Math.PI, 4.5, 5.5]) {
      const s = arclengthFromBottom(theta);
      expect(s).toBeCloseTo(4 * R * Math.sin((theta - Math.PI) / 2), 12);
    }
  });
});

describe('Tautochrone: theta-s inversion', () => {
  it('thetaFromS(arclengthFromBottom(theta)) = theta for theta in [0, 2pi]', () => {
    for (const theta of [0.5, 1.5, 2.5, 3.5, 4.5, 5.5]) {
      const s = arclengthFromBottom(theta);
      const theta2 = thetaFromS(s);
      expect(theta2).toBeCloseTo(theta, 9);
    }
  });
});

describe('Tautochrone: period formulas', () => {
  it('FULL_PERIOD = 2 pi / omega = 4 pi sqrt(R / g)', () => {
    expect(FULL_PERIOD).toBeCloseTo(2 * Math.PI / OMEGA, 12);
    expect(FULL_PERIOD).toBeCloseTo(4 * Math.PI * Math.sqrt(R / 9.81), 9);
  });
});

describe('Tautochrone: full period closure', () => {
  it('beadPosition(s0, FULL_PERIOD) equals beadPosition(s0, 0)', () => {
    for (const s0 of [-2.5, -1.0, 1.0, 2.5]) {
      const pStart = beadPosition(s0, 0);
      const pEnd   = beadPosition(s0, FULL_PERIOD);
      expect(Math.abs(pStart.x - pEnd.x)).toBeLessThan(1e-9);
      expect(Math.abs(pStart.y - pEnd.y)).toBeLessThan(1e-9);
    }
  });
});
