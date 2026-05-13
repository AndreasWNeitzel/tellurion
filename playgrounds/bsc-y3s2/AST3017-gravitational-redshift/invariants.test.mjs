// Gravitational-redshift invariants.
// (a) r >> 2M: redshift factor approaches 1.
// (b) r = 2M: factor = 0 (infinite redshift at horizon).
// (c) Clock rate = sqrt(1 - 2M/r) exact.
// (d) Reciprocity: redshiftFactor = clockRate(r_em) / clockRate(r_obs).
// (e) Weak-field expansion.
// (f) z = 1/f - 1.

import { describe, it, expect } from 'vitest';
import { redshiftFactor, clockRate, redshift_z, HORIZON, M } from './sim.js';

describe('Gravitational redshift: weak field', () => {
  it('r_em = 1e6 M: factor within 1e-6 of 1', () => {
    expect(redshiftFactor(1e6 * M)).toBeCloseTo(1, 5);
  });
});

describe('Gravitational redshift: at horizon', () => {
  it('r_em near 2M: factor near 0', () => {
    expect(redshiftFactor(HORIZON + 1e-6)).toBeLessThan(1e-3);
  });
  it('r_em <= 2M: factor = 0', () => {
    expect(redshiftFactor(HORIZON)).toBe(0);
    expect(redshiftFactor(0.5 * HORIZON)).toBe(0);
  });
});

describe('Gravitational redshift: clock rate formula', () => {
  it('clockRate(r) = sqrt(1 - 2 M / r) within 1e-12', () => {
    for (const r of [3, 5, 10, 100, 1000]) {
      expect(clockRate(r)).toBeCloseTo(Math.sqrt(1 - 2 * M / r), 12);
    }
  });
});

describe('Gravitational redshift: reciprocity', () => {
  it('redshiftFactor(r_em, r_obs) = clockRate(r_em) / clockRate(r_obs)', () => {
    for (const [r_em, r_obs] of [[5, 10], [3, 100], [10, 1000]]) {
      const direct = redshiftFactor(r_em, r_obs);
      const via = clockRate(r_em) / clockRate(r_obs);
      expect(direct).toBeCloseTo(via, 12);
    }
  });
});

describe('Gravitational redshift: weak-field expansion', () => {
  it('for large r: f ~ 1 - M (1/r_em - 1/r_obs) to leading order', () => {
    const r_em = 1e6 * M;
    const r_obs = 1e9 * M;
    const f = redshiftFactor(r_em, r_obs);
    const approx = 1 - M * (1 / r_em - 1 / r_obs);
    expect(f).toBeCloseTo(approx, 9);
  });
});

describe('Gravitational redshift: z definition', () => {
  it('z = 1/f - 1', () => {
    for (const r_em of [3, 5, 10]) {
      const f = redshiftFactor(r_em);
      expect(redshift_z(r_em)).toBeCloseTo(1 / f - 1, 12);
    }
  });
});
