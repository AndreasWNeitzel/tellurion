// Gradient and directional-derivative invariant tests. The analytic gradients
// are checked against central finite differences, and the directional
// derivative against its closed forms.

import { describe, it, expect } from 'vitest';
import { FIELDS, directionalDerivative, gradInfo } from './sim.js';

const PTS = [[0.3, -0.4], [1.0, 0.8], [-0.7, 0.2], [-1.2, -0.9]];

describe('Analytic gradients match finite differences', () => {
  it('every field gradient agrees with central differences', () => {
    const h = 1e-5;
    for (const key of Object.keys(FIELDS)) {
      const F = FIELDS[key];
      for (const [x, y] of PTS) {
        const [gx, gy] = F.grad(x, y);
        const fdx = (F.f(x + h, y) - F.f(x - h, y)) / (2 * h);
        const fdy = (F.f(x, y + h) - F.f(x, y - h)) / (2 * h);
        expect(gx).toBeCloseTo(fdx, 5);
        expect(gy).toBeCloseTo(fdy, 5);
      }
    }
  });
});

describe('Directional derivative relations', () => {
  it('D_u f equals grad f . u for arbitrary directions', () => {
    const F = FIELDS.ripple;
    for (const [x, y] of PTS) {
      const { gx, gy } = gradInfo(F, x, y);
      for (const t of [0, 0.6, 1.9, -2.4, Math.PI]) {
        expect(directionalDerivative(F, x, y, t)).toBeCloseTo(gx * Math.cos(t) + gy * Math.sin(t), 9);
      }
    }
  });
  it('is maximal along the gradient with value |grad f|, and minimal opposite', () => {
    for (const key of Object.keys(FIELDS)) {
      const F = FIELDS[key];
      for (const [x, y] of PTS) {
        const g = gradInfo(F, x, y);
        if (g.mag < 1e-6) continue;
        expect(directionalDerivative(F, x, y, g.ang)).toBeCloseTo(g.mag, 9);
        expect(directionalDerivative(F, x, y, g.ang + Math.PI)).toBeCloseTo(-g.mag, 9);
        // scan a full turn: nothing exceeds |grad f|.
        for (let t = 0; t < 2 * Math.PI; t += 0.05) {
          expect(directionalDerivative(F, x, y, t)).toBeLessThanOrEqual(g.mag + 1e-9);
        }
      }
    }
  });
  it('vanishes perpendicular to the gradient (along the level set)', () => {
    for (const key of Object.keys(FIELDS)) {
      const F = FIELDS[key];
      for (const [x, y] of PTS) {
        const g = gradInfo(F, x, y);
        if (g.mag < 1e-6) continue;
        expect(directionalDerivative(F, x, y, g.ang + Math.PI / 2)).toBeCloseTo(0, 9);
        expect(directionalDerivative(F, x, y, g.ang - Math.PI / 2)).toBeCloseTo(0, 9);
      }
    }
  });
  it('follows the cosine law D_u f = |grad f| cos(theta - theta_grad)', () => {
    const F = FIELDS.twohills;
    for (const [x, y] of PTS) {
      const g = gradInfo(F, x, y);
      for (const t of [0.2, 1.1, 2.7, 4.5]) {
        expect(directionalDerivative(F, x, y, t)).toBeCloseTo(g.mag * Math.cos(t - g.ang), 9);
      }
    }
  });
});
