// Invariants for the quantum occupation distributions: the Fermi-Dirac bounds and
// particle-hole symmetry, the zero-temperature step, the BE > MB > FD ordering above
// the chemical potential, and convergence to the classical limit in the dilute regime.

import { describe, it, expect } from 'vitest';
import { fermiDirac, boseEinstein, maxwellBoltzmann, classicalDeparture } from './sim.js';

describe('Fermi-Dirac', () => {
  it('lies in [0,1] and equals 1/2 at the chemical potential', () => {
    for (const E of [0, 1, 3, 4, 7, 10]) { const n = fermiDirac(E, 4, 1); expect(n).toBeGreaterThanOrEqual(0); expect(n).toBeLessThanOrEqual(1); }
    expect(fermiDirac(4, 4, 1)).toBeCloseTo(0.5, 12);
  });
  it('has particle-hole symmetry n(mu+d) + n(mu-d) = 1', () => {
    for (const d of [0.3, 1, 2.5]) expect(fermiDirac(4 + d, 4, 0.7) + fermiDirac(4 - d, 4, 0.7)).toBeCloseTo(1, 12);
  });
  it('approaches a step at the Fermi level as kT -> 0', () => {
    expect(fermiDirac(3.5, 4, 1e-3)).toBeCloseTo(1, 6);
    expect(fermiDirac(4.5, 4, 1e-3)).toBeCloseTo(0, 6);
  });
});

describe('Ordering above the chemical potential', () => {
  it('n_BE > n_MB > n_FD for E > mu', () => {
    for (const E of [4.5, 5, 7, 9]) {
      const be = boseEinstein(E, 4, 1), mb = maxwellBoltzmann(E, 4, 1), fd = fermiDirac(E, 4, 1);
      expect(be).toBeGreaterThan(mb); expect(mb).toBeGreaterThan(fd);
    }
  });
});

describe('Bose-Einstein', () => {
  it('diverges as E -> mu and is undefined below mu', () => {
    expect(boseEinstein(4.001, 4, 1)).toBeGreaterThan(100);
    expect(isFinite(boseEinstein(3.5, 4, 1))).toBe(false);
  });
});

describe('Classical limit', () => {
  it('FD and BE converge to MB for E - mu >> kT', () => {
    expect(classicalDeparture('fd', 12, 4, 1)).toBeLessThan(1e-3);
    expect(classicalDeparture('be', 12, 4, 1)).toBeLessThan(1e-3);
  });
  it('the quantum corrections are large near the chemical potential', () => {
    expect(classicalDeparture('fd', 4.2, 4, 1)).toBeGreaterThan(0.3);
  });
});
