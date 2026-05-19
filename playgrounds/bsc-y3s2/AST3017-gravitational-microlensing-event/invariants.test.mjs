// Single point-mass microlensing invariants, tested directly on sim.js
// (the Paczynski magnification and image geometry the playground draws).
// Closed-form, exact, non-tautological.

import { describe, it, expect } from 'vitest';
import {
  magnification, imagePositions, uOfT, lightCurve, peakMagnification,
} from './sim.js';

describe('point-lens magnification A(u)', () => {
  it('A(0.3) = 3.4448 (exact Paczynski closed form)', () => {
    // 2.09 / (0.3 sqrt(4.09)) = 3.44479...; the legacy hard-coded 3.461
    // was an arithmetic slip (0.604 vs the correct 0.60671).
    expect(magnification(0.3)).toBeCloseTo(3.4448, 3);
  });

  it('A -> 1 as u -> infinity (no lensing far away)', () => {
    expect(magnification(50)).toBeCloseTo(1, 3);
    expect(magnification(1e4)).toBeCloseTo(1, 8);
  });

  it('A is strictly decreasing in u and always > 1', () => {
    let prev = Infinity;
    for (const u of [0.05, 0.1, 0.3, 0.6, 1, 2, 5]) {
      const A = magnification(u);
      expect(A).toBeGreaterThan(1);
      expect(A).toBeLessThan(prev);
      prev = A;
    }
  });

  it('A(u=1) = 3/sqrt(5) ~ 1.342 (Einstein-ring crossing)', () => {
    expect(magnification(1)).toBeCloseTo(3 / Math.sqrt(5), 9);
  });
});

describe('image geometry', () => {
  it('theta_+ theta_- = -1 and theta_+ + theta_- = u (lens equation roots)', () => {
    for (const u of [0.2, 0.5, 1, 2.5]) {
      const [tp, tm] = imagePositions(u);
      expect(tp * tm).toBeCloseTo(-1, 9);
      expect(tp + tm).toBeCloseTo(u, 9);
      expect(tp).toBeGreaterThan(0);
      expect(tm).toBeLessThan(0);
    }
  });
});

describe('Paczynski light curve', () => {
  it('peaks at closest approach t = t0 (u = u_min) and is time-symmetric', () => {
    const uMin = 0.25, tE = 60;
    const A0 = magnification(uOfT(uMin, tE, 0));
    expect(A0).toBeCloseTo(peakMagnification(uMin), 9);
    for (const dt of [10, 35, 80]) {
      expect(magnification(uOfT(uMin, tE, dt)))
        .toBeCloseTo(magnification(uOfT(uMin, tE, -dt)), 9);
      expect(magnification(uOfT(uMin, tE, dt))).toBeLessThan(A0);
    }
  });

  it('a smaller impact parameter gives a sharper, higher peak', () => {
    expect(peakMagnification(0.1)).toBeGreaterThan(peakMagnification(0.5));
  });

  it('lightCurve length matches the time array and is deterministic', () => {
    const ts = [-100, -50, 0, 50, 100];
    const a = lightCurve(0.3, 40, ts);
    const b = lightCurve(0.3, 40, ts);
    expect(a.length).toBe(ts.length);
    for (let i = 0; i < a.length; i += 1) expect(a[i]).toBe(b[i]);
  });
});
