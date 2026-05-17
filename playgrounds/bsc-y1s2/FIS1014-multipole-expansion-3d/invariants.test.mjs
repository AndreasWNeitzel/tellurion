// Multipole expansion: far-field convergence, the leading-term decay
// laws, and that each extra order reduces the truncation error.

import { describe, it, expect } from 'vitest';
import { exactPotential, multipolePotential, monopole, dipole, quadrupole, buildDist, K } from './sim.js';

const at = (x) => [x, 0.3 * x, 0.2 * x];

describe('multipole-expansion-3d invariants', () => {
  it('single charge at origin: monopole term is exact', () => {
    const c = [{ q: 2, r: [0, 0, 0] }];
    for (const x of [1, 3, 7]) {
      const P = at(x), r = Math.hypot(...P);
      expect(multipolePotential(c, 0, P)).toBeCloseTo(K * 2 / r, 9);
      expect(exactPotential(c, P)).toBeCloseTo(K * 2 / r, 6);
    }
  });

  it('net charge != 0: monopole dominates far away (V ~ K Q / r)', () => {
    const c = buildDist('offset', 0.3);
    const Q = monopole(c);
    const P = at(60), r = Math.hypot(...P);
    const v = exactPotential(c, P);
    expect(Math.abs(v - K * Q / r) / Math.abs(v)).toBeLessThan(0.02);
  });

  it('pure dipole: zero monopole, far field ~ 1/r^2', () => {
    const c = buildDist('dipole', 0.3);
    expect(Math.abs(monopole(c))).toBeLessThan(1e-12);
    const v1 = Math.abs(exactPotential(c, at(20)));
    const v2 = Math.abs(exactPotential(c, at(40)));
    expect(v1 / v2).toBeGreaterThan(3.6);
    expect(v1 / v2).toBeLessThan(4.4);
  });

  it('pure quadrupole: zero monopole and dipole, far field ~ 1/r^3', () => {
    const c = buildDist('quadrupole', 0.3);
    expect(Math.abs(monopole(c))).toBeLessThan(1e-12);
    const p = dipole(c);
    expect(Math.hypot(...p)).toBeLessThan(1e-12);
    const v1 = Math.abs(exactPotential(c, at(20)));
    const v2 = Math.abs(exactPotential(c, at(40)));
    expect(v1 / v2).toBeGreaterThan(7);
    expect(v1 / v2).toBeLessThan(9);
  });

  it('truncation error collapses with distance', () => {
    const c = buildDist('quadrupole', 0.3);
    const err = (x) => Math.abs(exactPotential(c, at(x)) - multipolePotential(c, 2, at(x)));
    expect(err(15)).toBeLessThan(err(5));
    expect(err(40)).toBeLessThan(err(15));
  });

  it('each extra order reduces the error at fixed moderate distance', () => {
    const c = buildDist('octupole', 0.32);
    const P = at(4);
    const e0 = Math.abs(exactPotential(c, P) - multipolePotential(c, 0, P));
    const e1 = Math.abs(exactPotential(c, P) - multipolePotential(c, 1, P));
    const e2 = Math.abs(exactPotential(c, P) - multipolePotential(c, 2, P));
    expect(e1).toBeLessThanOrEqual(e0 + 1e-9);
    expect(e2).toBeLessThanOrEqual(e1 + 1e-9);
  });

  it('quadrupole moment of a pure dipole vanishes (parity)', () => {
    const Qm = quadrupole(buildDist('dipole', 0.3));
    for (let i = 0; i < 3; i += 1) for (let j = 0; j < 3; j += 1) expect(Math.abs(Qm[i][j])).toBeLessThan(1e-9);
  });
});
