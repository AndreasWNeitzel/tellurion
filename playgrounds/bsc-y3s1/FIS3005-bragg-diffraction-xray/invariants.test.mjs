// Invariants for Bragg diffraction: the Bragg condition at each peak, integer order at
// the peaks, unit intensity at the Bragg angles and suppression between them, the order
// count floor(2d/lambda), and the absence of peaks when lambda > 2d.

import { describe, it, expect } from 'vitest';
import { pathDifference, orderValue, braggAngle, maxOrder, braggPeaks, intensity } from './sim.js';

describe('Bragg condition', () => {
  it('2 d sin(theta_n) = n lambda at each Bragg angle', () => {
    const d = 2.5, lam = 1.54;
    for (let n = 1; n <= maxOrder(d, lam); n += 1) { const t = braggAngle(n, d, lam); expect(pathDifference(t, d)).toBeCloseTo(n * lam, 9); expect(orderValue(t, d, lam)).toBeCloseTo(n, 9); }
  });
  it('no peak exists when n lambda exceeds 2 d', () => {
    expect(braggAngle(1, 1.0, 2.5)).toBeNull();
    expect(maxOrder(1.0, 2.5)).toBe(0);
  });
});

describe('Order count', () => {
  it('matches floor(2 d / lambda)', () => {
    expect(maxOrder(2.5, 1.54)).toBe(3);
    expect(maxOrder(4, 1)).toBe(8);
    expect(braggPeaks(2.5, 1.54).length).toBe(3);
  });
});

describe('Intensity', () => {
  it('is 1 at every Bragg angle', () => {
    const d = 3, lam = 1.2;
    for (const { theta } of braggPeaks(d, lam)) expect(intensity(theta, d, lam, 30)).toBeCloseTo(1, 6);
  });
  it('is suppressed between Bragg peaks', () => {
    const d = 2.5, lam = 1.54, t1 = braggAngle(1, d, lam), t2 = braggAngle(2, d, lam);
    const mid = (t1 + t2) / 2;
    expect(intensity(mid, d, lam, 30)).toBeLessThan(0.1);
  });
  it('stays within [0,1]', () => {
    const d = 2.5, lam = 1.54;
    for (let i = 0; i <= 200; i += 1) { const t = (Math.PI / 2) * i / 200; const I = intensity(t, d, lam, 30); expect(I).toBeGreaterThanOrEqual(-1e-9); expect(I).toBeLessThanOrEqual(1 + 1e-6); }
  });
});
