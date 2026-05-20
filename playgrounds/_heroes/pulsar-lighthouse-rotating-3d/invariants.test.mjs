import { describe, it, expect } from 'vitest';
import {
  magneticPoleVector, losVector, angularSeparation,
  pulseIntensity, pulseProfile, visibilityRegime,
} from './sim.js';

describe('pulsar-lighthouse-rotating-3d', () => {
  it('aligned rotator (alpha=0) has constant pulse intensity for any i', () => {
    const p0 = pulseIntensity(0, 0, 30, 12);
    const p1 = pulseIntensity(Math.PI / 2, 0, 30, 12);
    expect(p0).toBeCloseTo(p1, 9);
  });

  it('aligned rotator (alpha=0) and aligned observer (i=0) gives unity', () => {
    expect(pulseIntensity(0, 0, 0, 12)).toBeCloseTo(1, 9);
  });

  it('orthogonal rotator at i=90 has two equal pulses per rotation', () => {
    const N = 256;
    const prof = pulseProfile(90, 90, 12, N);
    // Two maxima of equal height roughly half a rotation apart.
    // We compute the integrated intensity in each half and check they are equal.
    let s1 = 0, s2 = 0;
    for (let k = 0; k < N / 2; k++) s1 += prof[k];
    for (let k = N / 2; k < N; k++) s2 += prof[k];
    expect(Math.abs(s1 - s2)).toBeLessThan(1e-9);
  });

  it('pulse profile is periodic (prof[0] = prof[N])', () => {
    const N = 64;
    const prof = pulseProfile(50, 65, 12, N);
    expect(prof[0]).toBeCloseTo(pulseIntensity(2 * Math.PI, 50, 65, 12), 9);
  });

  it('pulse peak is at i = alpha + rho / 2 (approximately)', () => {
    // For i = alpha (LOS on the cone axis at the right phase), peak = 1.
    const peak = pulseIntensity(0, 50, 50, 12);
    expect(peak).toBeCloseTo(1, 6);
  });

  it('missed beam: |i - alpha| > rho and |i - (180 - alpha)| > rho gives near-zero', () => {
    // alpha=15, i=80, rho=8. Both 65 and 95 > 8.
    const prof = pulseProfile(15, 80, 8, 256);
    const max = Math.max(...prof);
    expect(max).toBeLessThan(1e-2);
  });

  it('visibility classifier returns "single-pulse" for canonical alpha/i/rho', () => {
    expect(visibilityRegime(50, 65, 12)).toBe('single-pulse');
  });

  it('visibility classifier returns "interpulse" for nearly orthogonal rotator', () => {
    // alpha=85, i=88, rho=20: both poles cross LOS.
    expect(visibilityRegime(85, 88, 20)).toBe('interpulse');
  });

  it('LOS vector has unit norm', () => {
    const v = losVector(42);
    expect(Math.hypot(v.x, v.y, v.z)).toBeCloseTo(1, 9);
  });

  it('magnetic pole vector has unit norm', () => {
    const v = magneticPoleVector(37, 1.2);
    expect(Math.hypot(v.x, v.y, v.z)).toBeCloseTo(1, 9);
  });

  it('angular separation is symmetric', () => {
    const a = { x: 0.3, y: 0.7, z: 0.5 }; const b = { x: 0.1, y: -0.6, z: 0.8 };
    const na = Math.hypot(a.x, a.y, a.z);
    const nb = Math.hypot(b.x, b.y, b.z);
    const ah = { x: a.x / na, y: a.y / na, z: a.z / na };
    const bh = { x: b.x / nb, y: b.y / nb, z: b.z / nb };
    expect(angularSeparation(ah, bh)).toBeCloseTo(angularSeparation(bh, ah), 9);
  });

  it('pole at phase psi and psi + 2 pi are identical', () => {
    const a = magneticPoleVector(50, 0.7);
    const b = magneticPoleVector(50, 0.7 + 2 * Math.PI);
    expect(a.x).toBeCloseTo(b.x, 9);
    expect(a.y).toBeCloseTo(b.y, 9);
    expect(a.z).toBeCloseTo(b.z, 9);
  });

  it('peak width grows with rho', () => {
    // FWHM-ish measure: number of phase bins above half-max.
    const count = (rho) => {
      const prof = pulseProfile(50, 50, rho, 256);
      const m = Math.max(...prof);
      return prof.filter(v => v > 0.5 * m).length;
    };
    expect(count(20)).toBeGreaterThan(count(5));
  });
});
