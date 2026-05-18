import { describe, it, expect } from 'vitest';
import {
  ALPHA, RY_EV, schrodingerLevel, diracLevel, allowedJ,
  fineStructureSplit, fineStructureExpansion, groupVelocity, zbOmega, zbPosition,
} from './sim.js';

describe('dirac-equation-relativistic-hydrogen invariants', () => {
  it('the Schrodinger ground state is -13.6057 eV and scales as Z^2/n^2', () => {
    expect(schrodingerLevel(1, 1)).toBeCloseTo(-13.605693, 3);
    expect(Math.abs(schrodingerLevel(1, 1) + 13.605693) / 13.605693).toBeLessThan(1e-4);
    expect(schrodingerLevel(1, 2) / schrodingerLevel(1, 1)).toBeCloseTo(4, 12);   // Z^2
    expect(schrodingerLevel(2, 1) / schrodingerLevel(1, 1)).toBeCloseTo(0.25, 12); // 1/n^2
    expect(RY_EV).toBeCloseTo(13.605693, 3);
  });

  it('the Dirac level equals Schrodinger to O((Z alpha)^2) and is slightly deeper', () => {
    // At the physical alpha the relativistic correction is O((Z alpha)^2):
    // Dirac / Schrodinger -> 1 with a residual of that order.
    for (const [n, Z] of [[1, 1], [2, 1], [1, 2]]) {
      const ratio = diracLevel(n, 0.5, Z) / schrodingerLevel(n, Z);
      expect(Math.abs(ratio - 1)).toBeLessThan((Z * ALPHA) ** 2);       // nonrel agreement
    }
    // relativistic binding is deeper (more negative) than nonrelativistic
    expect(diracLevel(1, 0.5, 1)).toBeLessThan(schrodingerLevel(1, 1));
    expect(diracLevel(1, 0.5, 1)).toBeCloseTo(-13.605874, 4);
  });

  it('the fine-structure splitting is proportional to Z^4', () => {
    for (const Z of [1, 2, 4]) {
      const r = fineStructureSplit(2, 2 * Z) / fineStructureSplit(2, Z);
      expect(r).toBeGreaterThan(15.8);
      expect(r).toBeLessThan(16.2);                                     // 2^4 = 16
    }
    expect(fineStructureSplit(2, 1)).toBeGreaterThan(0);                // j=3/2 above j=1/2
    expect(fineStructureSplit(2, 1)).toBeCloseTo(4.53e-5, 6);           // ~45 micro-eV (known)
  });

  it('the fine-structure splitting is proportional to alpha^4', () => {
    for (const Z of [1, 5]) {
      const r = fineStructureSplit(2, Z, 2 * ALPHA) / fineStructureSplit(2, Z, ALPHA);
      expect(r).toBeGreaterThan(15.5);
      expect(r).toBeLessThan(16.5);                                     // alpha^4
    }
  });

  it('Dirac levels depend only on (n, j): 2s1/2 = 2p1/2, and 2p3/2 lies above', () => {
    const j12 = diracLevel(2, 0.5, 1);                                  // 2s1/2 and 2p1/2 share j=1/2
    const j32 = diracLevel(2, 1.5, 1);                                  // 2p3/2
    expect(j32).toBeGreaterThan(j12);                                   // less bound
    expect(allowedJ(2)).toEqual([0.5, 1.5]);
    expect(allowedJ(1)).toEqual([0.5]);
    // the exact level matches the (Z alpha)^2 fine-structure expansion
    for (const [n, j] of [[1, 0.5], [2, 0.5], [2, 1.5], [3, 2.5]]) {
      const rel = Math.abs(diracLevel(n, j, 1) - fineStructureExpansion(n, j, 1)) / Math.abs(diracLevel(n, j, 1));
      expect(rel).toBeLessThan((ALPHA) ** 2);                           // agree to O((Z alpha)^2)
    }
  });

  it('Zitterbewegung: omega = 2 m c^2/hbar at rest, sub-luminal drift, bounded tremble', () => {
    expect(zbOmega(0)).toBeCloseTo(2, 12);                              // 2 m c^2 / hbar
    expect(zbOmega(1)).toBeCloseTo(2 * Math.SQRT2, 12);                 // 2 E/hbar = 2 sqrt(1+p^2)
    for (const p of [0, 0.5, 2, 10]) {
      expect(groupVelocity(p)).toBeGreaterThanOrEqual(0);
      expect(groupVelocity(p)).toBeLessThan(1);                         // v_g < c always
    }
    const a = zbPosition(3.0, 0.7);
    expect(a.x).toBeCloseTo(a.drift + a.tremble, 12);
    expect(a.drift).toBeCloseTo(groupVelocity(0.7) * 3.0, 12);          // drift = v_g t
    let mx = 0; for (let t = 0; t < 20; t += 0.01) mx = Math.max(mx, Math.abs(zbPosition(t, 0).tremble));
    expect(mx).toBeLessThanOrEqual(0.5 + 1e-9);                         // amplitude ~ Compton scale
  });

  it('deterministic: identical inputs reproduce the levels and trajectory', () => {
    expect(diracLevel(2, 1.5, 3)).toBe(diracLevel(2, 1.5, 3));
    expect(fineStructureSplit(2, 2)).toBe(fineStructureSplit(2, 2));
    expect(zbPosition(1.7, 0.4).x).toBe(zbPosition(1.7, 0.4).x);
  });
});
