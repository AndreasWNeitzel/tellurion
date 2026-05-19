// Shared-engine tests for shared/js/engine/friedmann-cpu.js (built
// before the expanding-universe-3d hero). The Friedmann constraint,
// the matter-only power law, the de Sitter exponential, the closed
// recollapse, and 1+z = a-ratio prove the integrator is real
// cosmology, not a scripted zoom.

import { describe, it, expect } from 'vitest';
import {
  curvature, friedmannE, hubble, integrateScaleFactor, scaleAt,
  redshift, recession,
} from '../shared/js/engine/friedmann-cpu.js';

describe('closure and the Friedmann constraint', () => {
  it('Om_k closes the budget; flat models have Om_k = 0', () => {
    expect(curvature({ m: 0.3, L: 0.7 })).toBeCloseTo(0, 12);
    expect(curvature({ m: 1.0 })).toBeCloseTo(0, 12);
    expect(curvature({ m: 1.5, L: 0.0 })).toBeLessThan(0);   // closed
    expect(curvature({ m: 0.2, L: 0.0 })).toBeGreaterThan(0); // open
  });

  it('the integrated a(t) satisfies (a_dot/a)^2 = H0^2 E(a) to 1e-3', () => {
    const sol = integrateScaleFactor({ m: 0.3, L: 0.7 }, 1, { dt: 0.002, tMax: 8 });
    for (let i = sol.iNow + 5; i < sol.iNow + 200; i += 40) {
      const adot = (sol.a[i + 1] - sol.a[i - 1]) / (sol.t[i + 1] - sol.t[i - 1]);
      const lhs = (adot / sol.a[i]) ** 2;
      const rhs = friedmannE(sol.a[i], sol.Om);
      expect(Math.abs(lhs - rhs) / Math.max(rhs, 1e-6)).toBeLessThan(1e-3);
    }
  });
});

describe('limiting cosmologies', () => {
  it('flat matter-only: a ~ (t - t_bb)^(2/3) (Einstein-de Sitter)', () => {
    const sol = integrateScaleFactor({ m: 1.0 }, 1, { dt: 0.001, tMax: 6 });
    const tbb = sol.t[0];                             // Big Bang (a -> 0)
    // measure the power law in time-since-the-Big-Bang
    const tA = tbb + 0.4, tB = tbb + 2.0;
    const p = Math.log(scaleAt(sol, tB) / scaleAt(sol, tA)) / Math.log((tB - tbb) / (tA - tbb));
    expect(p).toBeCloseTo(2 / 3, 1);
  });

  it('dark-energy-dominated expands quasi-exponentially (accelerating)', () => {
    const sol = integrateScaleFactor({ m: 0.0, L: 1.0 }, 1, { dt: 0.002, tMax: 6 });
    const a1 = scaleAt(sol, 1), a2 = scaleAt(sol, 2), a3 = scaleAt(sol, 3);
    // convex growth: each unit of time multiplies a by more than before
    expect(a3 / a2).toBeGreaterThan(a2 / a1);
  });

  it('closed matter universe recollapses to a Big Crunch', () => {
    const sol = integrateScaleFactor({ m: 1.8, L: 0.0 }, 1, { dt: 0.002, tMax: 30, aMin: 1e-3 });
    const amax = Math.max(...sol.a);
    expect(amax).toBeGreaterThan(1);                 // it did expand past today
    expect(sol.a[sol.a.length - 1]).toBeLessThan(0.05); // and collapsed back
  });

  it('empty (Milne) universe coasts: a grows linearly in time', () => {
    const sol = integrateScaleFactor({ m: 0, L: 0 }, 1, { dt: 0.002, tMax: 6 });
    expect(curvature({ m: 0, L: 0 })).toBeCloseTo(1, 12);
    const a1 = scaleAt(sol, 1), a2 = scaleAt(sol, 2), a4 = scaleAt(sol, 4);
    expect((a2 - a1)).toBeCloseTo((a4 - a2) / 2, 1);  // constant da/dt
  });
});

describe('observables', () => {
  it('1 + z equals the ratio of scale factors', () => {
    const sol = integrateScaleFactor({ m: 0.3, L: 0.7 }, 1, { dt: 0.002, tMax: 8 });
    const tE = -2, tO = 0;
    const z = redshift(sol, tE, tO);
    expect(1 + z).toBeCloseTo(scaleAt(sol, tO) / scaleAt(sol, tE), 6);
    expect(z).toBeGreaterThan(0);                     // light from the past is redshifted
  });

  it("Hubble's law: recession speed is proportional to distance", () => {
    const sol = integrateScaleFactor({ m: 0.3, L: 0.7 }, 1, { dt: 0.004, tMax: 4 });
    const v1 = recession(sol, 1, 0, 1);
    const v3 = recession(sol, 3, 0, 1);
    expect(v3 / v1).toBeCloseTo(3, 2);                // v = H d, linear, no centre
  });

  it('deterministic: identical parameters reproduce a(t)', () => {
    const s1 = integrateScaleFactor({ m: 0.3, L: 0.7 }, 1, { dt: 0.004, tMax: 5 });
    const s2 = integrateScaleFactor({ m: 0.3, L: 0.7 }, 1, { dt: 0.004, tMax: 5 });
    expect(s1.a.length).toBe(s2.a.length);
    expect(s1.a[s1.iNow + 100]).toBe(s2.a[s2.iNow + 100]);
  });
});
