// Nuclear decay: each mode shifts (Z, N) by the exact rule with
// nucleon and charge conservation, Q > 0 along the U-238 chain which
// ends on stable Pb-206, the SEMF binding-energy curve peaks near
// iron, and the Geiger-Nuttall half-life falls with Q.

import { describe, it, expect } from 'vitest';
import {
  semf, bindingPerA, decay, qAlpha, qBetaMinus, qValue,
  log10HalfLifeAlpha, uraniumChain,
} from './sim.js';

describe('nuclear-decay-chain-animation invariants', () => {
  it('each mode shifts (Z, N) by the exact rule and conserves A and charge', () => {
    const Z = 90, N = 142, A = Z + N;
    const a = decay('alpha', Z, N);
    expect([a.Z, a.N]).toEqual([Z - 2, N - 2]);
    expect(a.Z + a.N + a.emit.A).toBe(A);                          // nucleon number
    expect(a.Z + a.emit.Z).toBe(Z);                                // charge
    const bm = decay('beta-minus', Z, N);
    expect([bm.Z, bm.N]).toEqual([Z + 1, N - 1]);
    expect(bm.Z + bm.N).toBe(A);                                   // A unchanged
    expect(bm.Z + bm.emit.Z).toBe(Z);                              // Z = (Z+1) + (-1)
    const bp = decay('beta-plus', Z, N);
    expect([bp.Z, bp.N]).toEqual([Z - 1, N + 1]);
    expect(bp.Z + bp.emit.Z).toBe(Z);
    const g = decay('gamma', Z, N);
    expect([g.Z, g.N]).toEqual([Z, N]);
  });

  it('SEMF binding energy per nucleon peaks near A ~ 56 (iron region)', () => {
    let bestA = 0, best = -1;
    for (let A = 12; A <= 238; A += 1) {
      const Z = Math.round(A / (1.98 + 0.0155 * Math.pow(A, 2 / 3)));  // valley of stability
      const b = bindingPerA(A, Z);
      if (b > best) { best = b; bestA = A; }
    }
    expect(bestA).toBeGreaterThan(45);
    expect(bestA).toBeLessThan(75);
    expect(best).toBeGreaterThan(8.4);                             // ~8.8 MeV/nucleon
    expect(best).toBeLessThan(9.2);
    // a known nucleus: Fe-56 binding ~ 492 MeV (within a few %)
    expect(Math.abs(semf(56, 26) - 492) / 492).toBeLessThan(0.03);
  });

  it('the U-238 chain ends on stable Pb-206 after 8 alpha and 6 beta', () => {
    const path = uraniumChain();
    const end = path[path.length - 1];
    expect([end.Z, end.N]).toEqual([82, 124]);                     // Pb-206
    expect(end.Z + end.N).toBe(206);
    const nA = path.filter(p => p.mode === 'alpha').length;
    const nB = path.filter(p => p.mode === 'beta-minus').length;
    expect(nA).toBe(8);
    expect(nB).toBe(6);
    // A drops by exactly 4 per alpha, unchanged per beta
    for (let i = 1; i < path.length; i += 1) {
      const dA = (path[i].Z + path[i].N) - (path[i - 1].Z + path[i - 1].N);
      expect(dA).toBe(path[i].mode === 'alpha' ? -4 : 0);
    }
  });

  it('the chain is exothermic: every alpha step Q > 0 and the net release is large', () => {
    const path = uraniumChain();
    let net = 0;
    for (let i = 1; i < path.length; i += 1) {
      const p = path[i - 1], m = path[i].mode, Q = qValue(m, p.Z, p.N);
      net += Q;
      if (m === 'alpha') expect(Q).toBeGreaterThan(0);            // Gamow-driven steps clearly allowed
      else expect(Q).toBeGreaterThan(-0.5);                       // beta within the SEMF's ~MeV accuracy
    }
    // total energy released over U-238 -> Pb-206 is tens of MeV
    // (SEMF gives ~38; the real value ~52 is larger because the
    // liquid drop misses the shell corrections)
    expect(net).toBeGreaterThan(30);
    expect(net).toBeLessThan(70);
  });

  it('Geiger-Nuttall: at fixed daughter Z, a higher alpha Q shortens the half-life', () => {
    // polonium isotopes (Z = 84, daughter Z = 82) at varying N: the
    // Z_d term is fixed so log t must fall monotonically as Q rises
    const rows = [120, 122, 124, 126, 128, 130].map(N => ({ Q: qAlpha(84, N), lg: log10HalfLifeAlpha(84, N) }))
      .filter(r => Number.isFinite(r.lg) && r.Q > 0)
      .sort((a, b) => a.Q - b.Q);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    let prevLog = Infinity;
    for (const r of rows) { expect(r.lg).toBeLessThan(prevLog); prevLog = r.lg; }
    // the Geiger-Nuttall slope is steep: a 1 MeV Q rise cuts log t hard
    const loQ = rows[0], hiQ = rows[rows.length - 1];
    expect(loQ.lg - hiQ.lg).toBeGreaterThan(2);
  });

  it('beta-minus Q uses the neutron-hydrogen mass difference sign', () => {
    // a neutron-rich nucleus is beta-minus unstable (Q > 0)
    expect(qBetaMinus(20, 30)).toBeGreaterThan(0);                 // very neutron-rich Ca
    // adding the (m_n - m_H) term shifts Q upward vs the bare B diff
    const Z = 28, N = 36, A = Z + N;
    expect(qBetaMinus(Z, N)).toBeCloseTo(semf(A, Z + 1) - semf(A, Z) + 0.782, 9);
  });
});
