// exoplanet-transit-3d invariants. Central transit depth = (Rp/Rs)^2
// to 1 percent, Kepler III links a and P, out-of-transit flux is
// exactly 1, an inclined orbit removes the transit. Shared engine
// (via ./sim.js) is real geometry, not a scripted light curve.

import { describe, it, expect } from 'vitest';
import {
  semiMajorAxis, periodFromAxis, makeTransit, planetSkyPos, transitFlux,
} from './sim.js';

describe('exoplanet-transit-3d', () => {
  it('Kepler III round-trip a <-> period', () => {
    expect(semiMajorAxis(1, 1)).toBeCloseTo(1, 6);
    expect(periodFromAxis(1, 1)).toBeCloseTo(1, 6);
  });

  it('out-of-transit flux is 1 plus a tiny reflected-light bump', () => {
    // With the secondary-eclipse model in place, OOT flux is 1 +
    // A_g (R_p/a)^2 phaseFn(alpha). For R_p/a = 0.02 and A_g = 0.4,
    // the maximum bump is 1.6e-4. Both samples below are out of transit
    // but the planet is not occulted, so we expect 1 + (small bump).
    const s = makeTransit({ Rp: 0.1, a: 5, inc: Math.PI / 2, period: 4 });
    const oot1 = transitFlux(s, 0);
    const oot2 = transitFlux(s, s.period * 0.75);
    expect(oot1).toBeGreaterThanOrEqual(1);
    expect(oot1).toBeLessThan(1.001);
    expect(oot2).toBeGreaterThanOrEqual(1);
    expect(oot2).toBeLessThan(1.001);
  });

  it('secondary eclipse: when planet is behind the disc, reflected-light bump vanishes', () => {
    // At theta = 3 pi / 2 with edge-on inclination, the planet sits
    // directly behind the stellar disc and is occulted; flux = 1 exactly.
    const s = makeTransit({ Rp: 0.1, a: 5, inc: Math.PI / 2, period: 4 });
    // Theta = 3 pi / 2 corresponds to t = period * 0.75.
    // Build a wider orbit so the planet really lies behind the disc.
    const s2 = makeTransit({ Rp: 0.1, a: 2, inc: Math.PI / 2, period: 1 });
    expect(transitFlux(s2, s2.period * 0.75)).toBe(1);
    void s;
  });

  it('central transit depth equals (Rp/Rs)^2 to 1 percent (no limb darkening)', () => {
    const s = makeTransit({ Rp: 0.1, a: 5, inc: Math.PI / 2, period: 4, u1: 0, u2: 0, Nr: 200, Nphi: 280 });
    const f = transitFlux(s, s.period * 0.25);
    expect(Math.abs(1 - f - 0.01)).toBeLessThan(0.0001);  // < 1% of the depth
  });

  it('limb-darkened transit is deeper than uniform', () => {
    const u = makeTransit({ Rp: 0.1, a: 5, inc: Math.PI / 2, period: 4, u1: 0, u2: 0, Nr: 160, Nphi: 220 });
    const d = makeTransit({ Rp: 0.1, a: 5, inc: Math.PI / 2, period: 4, u1: 0.5, u2: 0.2, Nr: 160, Nphi: 220 });
    expect(1 - transitFlux(d, d.period * 0.25)).toBeGreaterThan(1 - transitFlux(u, u.period * 0.25));
  });

  it('tilted orbit removes the transit (no overlap with the disc)', () => {
    const s = makeTransit({ Rp: 0.1, a: 5, inc: Math.PI / 2 - 0.3, period: 4 });
    // Out of transit, the reflected-light bump is non-zero but bounded.
    const f = transitFlux(s, s.period * 0.25);
    expect(f).toBeGreaterThanOrEqual(1);
    expect(f).toBeLessThan(1.001);
  });

  it('edge-on transit: at mid-transit y = 0 and z > 0', () => {
    const s = makeTransit({ a: 5, inc: Math.PI / 2, period: 4 });
    const p = planetSkyPos(s, s.period * 0.25);
    expect(Math.abs(p.y)).toBeLessThan(1e-9);
    expect(p.infront).toBe(true);
  });

  it('deterministic: identical setup reproduces the flux', () => {
    const a = makeTransit({ Rp: 0.1, a: 5, inc: Math.PI / 2, period: 4 });
    const b = makeTransit({ Rp: 0.1, a: 5, inc: Math.PI / 2, period: 4 });
    expect(transitFlux(a, 1.234)).toBe(transitFlux(b, 1.234));
  });
});
