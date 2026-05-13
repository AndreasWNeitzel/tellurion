// Schwarzschild light-bending invariant tests. Deterministic; no RNG.

import { describe, it, expect } from 'vitest';
import { tracePhoton, B_CRIT, SWALLOWED, DEFLECTED } from './sim.js';

describe('schwarzschild-geodesics: critical impact parameter', () => {
  it('photon at |b| = 4 is swallowed', () => {
    expect(tracePhoton(4).fate).toBe(SWALLOWED);
    expect(tracePhoton(-4).fate).toBe(SWALLOWED);
  });

  it('photon at |b| = 7 is deflected', () => {
    expect(tracePhoton(7).fate).toBe(DEFLECTED);
    expect(tracePhoton(-7).fate).toBe(DEFLECTED);
  });

  it('critical boundary lies within +/- 0.1 of 3*sqrt(3)', () => {
    // |b| = 5.1 swallowed, |b| = 5.3 deflected per the numerical b_c ~ 5.196.
    expect(tracePhoton(5.0).fate).toBe(SWALLOWED);
    expect(tracePhoton(5.3).fate).toBe(DEFLECTED);
    expect(Math.abs(B_CRIT - 3 * Math.sqrt(3))).toBeLessThan(1e-12);
  });
});

describe('schwarzschild-geodesics: weak-field deflection', () => {
  it('large-b photon deflection of order 4M/b (with finite-b correction)', () => {
    // b = 20 (in M = 1 units). The exit direction relative to +x gives the
    // deflection angle. Measure it from the last two trail samples.
    const r = tracePhoton(20, { xInf: 50, maxSteps: 20000 });
    expect(r.fate).toBe(DEFLECTED);
    const t = r.trail;
    const n = t.length;
    const dx = t[n - 1].x - t[n - 2].x;
    const dy = t[n - 1].y - t[n - 2].y;
    const deflection = Math.abs(Math.atan2(dy, dx));
    const expected = 4 / 20;                   // 4 M / b, weak-field
    // Empirical deflection at b = 20 is ~ 1.18 * (4M/b). Allow 0.5 .. 2x.
    expect(deflection).toBeGreaterThan(0.5 * expected);
    expect(deflection).toBeLessThan(2.0 * expected);
  });
});

describe('schwarzschild-geodesics: limiting cases', () => {
  it('b = 0 (head-on) plunges to the horizon', () => {
    expect(tracePhoton(0).fate).toBe(SWALLOWED);
  });

  it('b large (b = 30) gives a near-straight-line deflection', () => {
    const r = tracePhoton(30, { xInf: 35, maxSteps: 4000 });
    expect(r.fate).toBe(DEFLECTED);
  });
});

describe('schwarzschild-geodesics: reproducibility', () => {
  it('tracePhoton is bit-identical on repeat for the same b', () => {
    const a = tracePhoton(5.5);
    const b = tracePhoton(5.5);
    expect(a.phiTotal).toBe(b.phiTotal);
    expect(a.trail.length).toBe(b.trail.length);
  });
});
