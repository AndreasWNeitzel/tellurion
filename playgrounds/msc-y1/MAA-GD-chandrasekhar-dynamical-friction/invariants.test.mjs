// Chandrasekhar dynamical friction: invariants of the closed-form
// pieces (the field fraction f(X) and the deceleration law).

import { describe, it, expect } from 'vitest';
import { erf, fOfX, chandrasekharDecel } from './sim.js';

describe('chandrasekhar dynamical friction invariants', () => {
  it('erf is odd and saturates: erf(0)=0, erf(3)~1', () => {
    expect(erf(0)).toBeCloseTo(0, 6);
    expect(erf(-1)).toBeCloseTo(-erf(1), 6);
    expect(erf(3)).toBeGreaterThan(0.999);
  });

  it('f(X) vanishes at X=0 and saturates to 1 at large X', () => {
    expect(fOfX(0)).toBeCloseTo(0, 6);
    expect(fOfX(4)).toBeGreaterThan(0.99);
    expect(fOfX(4)).toBeLessThan(1.0001);
  });

  it('f(X) is monotonically increasing', () => {
    let prev = -1;
    for (let X = 0; X <= 5; X += 0.25) { const v = fOfX(X); expect(v).toBeGreaterThanOrEqual(prev - 1e-12); prev = v; }
  });

  it('fast-perturber limit: decel ~ 1/V^2 (f -> 1)', () => {
    const a1 = chandrasekharDecel(8, 1, 1, 3);
    const a2 = chandrasekharDecel(16, 1, 1, 3);
    expect(a1 / a2).toBeCloseTo(4, 1);
  });

  it('drag is non-monotonic in V: peaks near V ~ sigma, weak at both ends', () => {
    const slow = chandrasekharDecel(0.05, 1, 1, 3);
    const mid = chandrasekharDecel(1.0, 1, 1, 3);
    const fast = chandrasekharDecel(12, 1, 1, 3);
    expect(mid).toBeGreaterThan(slow);
    expect(mid).toBeGreaterThan(fast);
  });

  it('decel scales linearly with density and lnLambda', () => {
    const base = chandrasekharDecel(2, 1, 1, 3);
    expect(chandrasekharDecel(2, 1, 2, 3) / base).toBeCloseTo(2, 6);
    expect(chandrasekharDecel(2, 1, 1, 6) / base).toBeCloseTo(2, 6);
  });
});
