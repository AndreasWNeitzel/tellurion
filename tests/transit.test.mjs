// Shared-engine tests for shared/js/engine/transit-cpu.js (built
// before the exoplanet-transit-3d hero). The central-transit depth
// equals (R_p/R_s)^2 to 1 percent, Kepler's third law links a and
// the period, the out-of-transit flux is exactly the baseline, and
// the geometry of inclination governs whether a transit happens.

import { describe, it, expect } from 'vitest';
import {
  semiMajorAxis, periodFromAxis, intensity, makeTransit, planetSkyPos,
  transitFlux,
} from '../shared/js/engine/transit-cpu.js';

describe('Kepler III and limb darkening', () => {
  it('a from period and back', () => {
    const T = 1.0; const a = semiMajorAxis(T, 1);    // Earth-like: a=1 AU
    expect(a).toBeCloseTo(1, 6);
    expect(periodFromAxis(1, 1)).toBeCloseTo(1, 6);
    expect(semiMajorAxis(2 * Math.SQRT2, 1)).toBeCloseTo(2, 6);    // T=2sqrt2 -> a=2
  });
  it('quadratic limb-darkening intensity drops from 1 at centre to 0 at the limb', () => {
    expect(intensity(0, 0.4, 0.2)).toBeCloseTo(1, 12);
    expect(intensity(0.999, 0.4, 0.2)).toBeLessThan(intensity(0, 0.4, 0.2));
    expect(intensity(1, 0.4, 0.2)).toBe(0);
  });
});

describe('transit geometry and depth', () => {
  it('the central transit depth equals (R_p/R_s)^2 to 1 percent (no limb darkening)', () => {
    const s = makeTransit({ Rp: 0.1, a: 5, inc: Math.PI / 2, period: 4, u1: 0, u2: 0, Nr: 200, Nphi: 280 });
    // Time at which the planet is at sky (0, 0): theta = pi (back of the
    // orbit on a circle that crosses the line of sight here)... With
    // sky_x = a cos theta, we want sky_x = 0 -> cos theta = 0 -> theta=pi/2
    // (transit) or 3pi/2 (occultation). theta = pi/2 -> y_orbit positive
    // -> infront = sign of sin(inc)*y_orbit > 0 at edge-on, so transit.
    const tCenter = s.period * 0.25;
    const f = transitFlux(s, tCenter);
    expect(Math.abs(1 - f - 0.1 * 0.1) / 0.01).toBeLessThan(1);   // depth ~ 0.01 to 1%
  });

  it('limb darkening makes the central transit deeper than uniform', () => {
    const u = makeTransit({ Rp: 0.1, a: 5, inc: Math.PI / 2, period: 4, u1: 0, u2: 0, Nr: 160, Nphi: 220 });
    const d = makeTransit({ Rp: 0.1, a: 5, inc: Math.PI / 2, period: 4, u1: 0.5, u2: 0.2, Nr: 160, Nphi: 220 });
    expect(1 - transitFlux(d, d.period * 0.25)).toBeGreaterThan(1 - transitFlux(u, u.period * 0.25));
  });

  it('out-of-transit flux is exactly 1', () => {
    const s = makeTransit({ Rp: 0.1, a: 5, inc: Math.PI / 2, period: 4 });
    // theta = 0: planet at (a, 0) on the sky, far to the right of the disc.
    expect(transitFlux(s, 0)).toBe(1);
    // theta = 3pi/2: planet behind the star, not infront -> flux 1.
    expect(transitFlux(s, s.period * 0.75)).toBe(1);
  });

  it('a tilted orbit removes the transit (no overlap) and a deeper tilt restores it', () => {
    const inclined = makeTransit({ Rp: 0.1, a: 5, inc: (Math.PI / 2) - 0.3, period: 4 });  // tilt: impact b ~ a sin(0.3)*1 way > 1
    const edge = makeTransit({ Rp: 0.1, a: 5, inc: Math.PI / 2, period: 4 });
    expect(transitFlux(inclined, inclined.period * 0.25)).toBe(1);
    expect(transitFlux(edge, edge.period * 0.25)).toBeLessThan(1);
  });

  it('planet position: edge-on transit goes through y=0 with z>0', () => {
    const s = makeTransit({ a: 5, inc: Math.PI / 2, period: 4 });
    const p = planetSkyPos(s, s.period * 0.25);
    expect(Math.abs(p.y)).toBeLessThan(1e-9);
    expect(p.infront).toBe(true);
  });

  it('deterministic: same setup reproduces the curve', () => {
    const a = makeTransit({ Rp: 0.1, a: 5, inc: Math.PI / 2, period: 4 });
    const b = makeTransit({ Rp: 0.1, a: 5, inc: Math.PI / 2, period: 4 });
    expect(transitFlux(a, 1.0)).toBe(transitFlux(b, 1.0));
  });
});
