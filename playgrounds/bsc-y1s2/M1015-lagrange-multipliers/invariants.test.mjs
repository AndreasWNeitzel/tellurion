// Lagrange-multiplier invariant tests: at a constrained optimum the gradient of
// f is parallel to the gradient of g, the directional derivative along the
// constraint vanishes, and the known analytic optima are recovered.

import { describe, it, expect } from 'vitest';
import { PRESETS, constrainedValue, tangentSlope, gradientCross, optima } from './sim.js';

describe('Lagrange condition at the optima', () => {
  it('grad f is parallel to grad g (cross product zero) at every optimum', () => {
    for (const key of Object.keys(PRESETS)) {
      const p = PRESETS[key];
      const opt = optima(p);
      expect(opt.length).toBeGreaterThan(0);
      for (const o of opt) {
        expect(Math.abs(gradientCross(p, o.t))).toBeLessThan(1e-4);
        expect(Math.abs(tangentSlope(p, o.t))).toBeLessThan(1e-4);
      }
    }
  });
});

describe('Known analytic optima', () => {
  it('f = x + y on the unit circle peaks at sqrt(2) and bottoms at -sqrt(2)', () => {
    const p = PRESETS.circleLinear;
    const vals = optima(p).map((o) => o.value).sort((a, b) => a - b);
    expect(vals[0]).toBeCloseTo(-Math.SQRT2, 4);
    expect(vals[vals.length - 1]).toBeCloseTo(Math.SQRT2, 4);
  });
  it('f = x^2 + 3 y^2 on x + y = 1 is minimised at (0.75, 0.25)', () => {
    const p = PRESETS.lineQuad;
    const opt = optima(p);
    // the single interior extremum is a minimum.
    let best = opt[0]; for (const o of opt) if (o.value < best.value) best = o;
    const [x, y] = p.curve(best.t);
    expect(x).toBeCloseTo(0.75, 3);
    expect(y).toBeCloseTo(0.25, 3);
    expect(best.value).toBeCloseTo(0.75 ** 2 + 3 * 0.25 ** 2, 4);
  });
  it('f = x y on the unit circle has extrema +/- 1/2 at the 45 degree points', () => {
    const p = PRESETS.circleProduct;
    const vals = optima(p).map((o) => o.value).sort((a, b) => a - b);
    expect(vals[0]).toBeCloseTo(-0.5, 4);
    expect(vals[vals.length - 1]).toBeCloseTo(0.5, 4);
  });
});

describe('Constrained value and tangency', () => {
  it('the tangency slope is the derivative of the constrained value', () => {
    const p = PRESETS.ellipseDist;
    const h = 1e-6;
    for (const t of [0.3, 1.2, 2.5, 4.1]) {
      const fd = (constrainedValue(p, t + h) - constrainedValue(p, t - h)) / (2 * h);
      expect(tangentSlope(p, t)).toBeCloseTo(fd, 4);
    }
  });
});
