// expanding-universe-3d invariants. The Friedmann constraint, the
// closed-universe recollapse, Hubble's law and 1+z = a-ratio prove
// the cosmology engine (shared, via ./sim.js) is real.

import { describe, it, expect } from 'vitest';
import {
  curvature, friedmannE, integrateScaleFactor, scaleAt, redshift, recession,
} from './sim.js';

describe('expanding-universe-3d', () => {
  it('curvature closes the budget; flat models Om_k = 0', () => {
    expect(curvature({ m: 0.3, L: 0.7 })).toBeCloseTo(0, 12);
    expect(curvature({ m: 1.6 })).toBeLessThan(0);
  });

  it('integrated a(t) satisfies (a_dot/a)^2 = H0^2 E(a) to 1e-3', () => {
    const sol = integrateScaleFactor({ m: 0.3, L: 0.7 }, 1, { dt: 0.002, tMax: 8 });
    for (let i = sol.iNow + 5; i < sol.iNow + 240; i += 47) {
      const adot = (sol.a[i + 1] - sol.a[i - 1]) / (sol.t[i + 1] - sol.t[i - 1]);
      const rhs = friedmannE(sol.a[i], sol.Om);
      expect(Math.abs((adot / sol.a[i]) ** 2 - rhs) / Math.max(rhs, 1e-6)).toBeLessThan(1e-3);
    }
  });

  it("Hubble's law: recession speed proportional to distance to 1 percent", () => {
    const sol = integrateScaleFactor({ m: 0.3, L: 0.7 }, 1, { dt: 0.004, tMax: 4 });
    expect(recession(sol, 3, 0, 1) / recession(sol, 1, 0, 1)).toBeCloseTo(3, 2);
  });

  it('1 + z equals the ratio of scale factors and past light is redshifted', () => {
    const sol = integrateScaleFactor({ m: 0.3, L: 0.7 }, 1, { dt: 0.002, tMax: 8 });
    const z = redshift(sol, -2.5, 0);
    expect(1 + z).toBeCloseTo(scaleAt(sol, 0) / scaleAt(sol, -2.5), 6);
    expect(z).toBeGreaterThan(0);
  });

  it('closed matter universe expands then recollapses to a Big Crunch', () => {
    const sol = integrateScaleFactor({ m: 1.8, L: 0.0 }, 1, { dt: 0.002, tMax: 30 });
    expect(Math.max(...sol.a)).toBeGreaterThan(1);
    expect(sol.a[sol.a.length - 1]).toBeLessThan(0.05);
  });

  it('dark-energy universe accelerates: a_ddot > 0 in the future', () => {
    const sol = integrateScaleFactor({ m: 0.3, L: 0.7 }, 1, { dt: 0.002, tMax: 8 });
    // second difference of the integrated a(t) at a late (Lambda-
    // dominated) time is the exact definition of acceleration.
    const i = sol.iNow + 1500;
    const addot = (sol.a[i + 1] - 2 * sol.a[i] + sol.a[i - 1])
      / ((sol.t[i + 1] - sol.t[i]) ** 2);
    expect(addot).toBeGreaterThan(0);
    // contrast: matter-only is decelerating (a_ddot < 0)
    const m = integrateScaleFactor({ m: 1.0, L: 0 }, 1, { dt: 0.002, tMax: 8 });
    const j = m.iNow + 1500;
    const mdd = (m.a[j + 1] - 2 * m.a[j] + m.a[j - 1]) / ((m.t[j + 1] - m.t[j]) ** 2);
    expect(mdd).toBeLessThan(0);
  });

  it('deterministic: same parameters reproduce a(t)', () => {
    const a = integrateScaleFactor({ m: 0.3, L: 0.7 }, 1, { dt: 0.004, tMax: 5 });
    const b = integrateScaleFactor({ m: 0.3, L: 0.7 }, 1, { dt: 0.004, tMax: 5 });
    expect(a.a[a.iNow + 80]).toBe(b.a[b.iNow + 80]);
  });
});
