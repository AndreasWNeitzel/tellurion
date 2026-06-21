// Invariants for the tangent plane: it matches f in value and slope at the point,
// the error vanishes there and grows quadratically, with the Hessian setting the
// curvature.

import { describe, it, expect } from 'vitest';
import { SURFS, tangentPlane, approxError } from './sim.js';

describe('The tangent plane touches the surface at the point', () => {
  for (const key of Object.keys(SURFS)) {
    it(`${key}: L = f and the error is zero at the point`, () => {
      const s = SURFS[key]; const [x0, y0] = [0.6, -0.4];
      expect(tangentPlane(s, x0, y0, x0, y0)).toBeCloseTo(s.f(x0, y0), 12);
      expect(approxError(s, x0, y0, x0, y0)).toBeCloseTo(0, 12);
    });
  }
});

describe('The plane matches both partial slopes at the point', () => {
  it('the plane gradient equals (f_x, f_y) at the point', () => {
    const s = SURFS.bump; const [x0, y0] = [0.5, 0.3]; const h = 1e-5;
    const dLdx = (tangentPlane(s, x0, y0, x0 + h, y0) - tangentPlane(s, x0, y0, x0 - h, y0)) / (2 * h);
    const dLdy = (tangentPlane(s, x0, y0, x0, y0 + h) - tangentPlane(s, x0, y0, x0, y0 - h)) / (2 * h);
    expect(dLdx).toBeCloseTo(s.fx(x0, y0), 6);
    expect(dLdy).toBeCloseTo(s.fy(x0, y0), 6);
  });
});

describe('The error grows quadratically, set by the Hessian', () => {
  it('error along x is ~ (1/2) f_xx dx^2', () => {
    const s = SURFS.bowl; const [x0, y0] = [0.3, 0.2];
    for (const dx of [0.1, 0.05]) {
      const E = approxError(s, x0, y0, x0 + dx, y0);
      expect(E).toBeCloseTo(0.5 * s.fxx(x0, y0) * dx * dx, 6);
    }
  });
  it('halving the distance quarters the error (second order)', () => {
    // bowl is purely quadratic, so the error is exactly the second-order term.
    const s = SURFS.bowl; const [x0, y0] = [0.4, -0.2];
    const E1 = Math.abs(approxError(s, x0, y0, x0 + 0.2, y0 + 0.2));
    const E2 = Math.abs(approxError(s, x0, y0, x0 + 0.1, y0 + 0.1));
    expect(E1 / E2).toBeCloseTo(4, 4);
    // the wave surface is also second-order at small steps
    const w = SURFS.wave; const ratio = Math.abs(approxError(w, 0.4, -0.2, 0.43, -0.17)) / Math.abs(approxError(w, 0.4, -0.2, 0.415, -0.185));
    expect(ratio).toBeCloseTo(4, 0);
  });
});
