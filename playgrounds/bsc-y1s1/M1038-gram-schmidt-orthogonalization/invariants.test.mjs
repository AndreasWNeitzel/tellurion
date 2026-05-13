// Gram-Schmidt invariants.
// (a) Output vectors are orthonormal: u_i . u_j = delta_ij within 1e-12.
// (b) For linearly dependent input, the redundant vector returns zero.
// (c) Span preservation: first k orthonormal vectors span the same space as
//     the first k input vectors (in 2D, check linear combination).
// (d) Inputs already orthonormal are unchanged (up to sign).
// (e) Works in arbitrary dimension (verify n = 4).

import { describe, it, expect } from 'vitest';
import { gramSchmidt, dot, norm, residual } from './sim.js';

const KRON = (i, j) => (i === j ? 1 : 0);

function checkOrthonormal(u, tol = 1e-12) {
  for (let i = 0; i < u.length; i += 1) {
    for (let j = 0; j < u.length; j += 1) {
      const expected = KRON(i, j);
      if (norm(u[i]) === 0 || norm(u[j]) === 0) continue;
      expect(Math.abs(dot(u[i], u[j]) - expected)).toBeLessThan(tol);
    }
  }
}

describe('gram-schmidt-orthogonalization', () => {
  it('two arbitrary 2D vectors become orthonormal', () => {
    const u = gramSchmidt([[3, 1], [1, 2]]);
    checkOrthonormal(u);
  });

  it('linearly dependent input gives zero vector', () => {
    const u = gramSchmidt([[1, 0], [2, 0]]);
    expect(norm(u[1])).toBeLessThan(1e-12);
  });

  it('already orthonormal input is preserved (up to sign)', () => {
    const u = gramSchmidt([[1, 0], [0, 1]]);
    expect(Math.abs(u[0][0] - 1)).toBeLessThan(1e-12);
    expect(Math.abs(u[1][1] - 1)).toBeLessThan(1e-12);
  });

  it('works in 4D', () => {
    const u = gramSchmidt([
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 1],
      [1, 0, 0, 1],
    ]);
    checkOrthonormal(u);
  });

  it('residual after projection is orthogonal to the unit vector', () => {
    const v = [3, 4];
    const u = [1, 0];
    const r = residual(v, u);
    expect(Math.abs(dot(r, u))).toBeLessThan(1e-12);
  });

  it('first orthonormal vector is just v_1 normalized', () => {
    const v1 = [2, 0];
    const u = gramSchmidt([v1, [1, 1]]);
    expect(u[0][0]).toBeCloseTo(1, 12);
    expect(u[0][1]).toBeCloseTo(0, 12);
  });

  it('span preserved in 2D: any linear combination of v expressible via u', () => {
    const v1 = [3, 1], v2 = [1, 2];
    const u = gramSchmidt([v1, v2]);
    // Express v2 in u basis: coefficients are <v2, u_i>.
    const c0 = dot(v2, u[0]);
    const c1 = dot(v2, u[1]);
    const recon = [c0 * u[0][0] + c1 * u[1][0], c0 * u[0][1] + c1 * u[1][1]];
    expect(Math.abs(recon[0] - v2[0])).toBeLessThan(1e-12);
    expect(Math.abs(recon[1] - v2[1])).toBeLessThan(1e-12);
  });
});
