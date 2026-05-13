// Schwarzschild effective-potential invariants.
// (a) Photon-sphere peak at r = 3M.
// (b) Photon peak value L^2 / (54 M^2).
// (c) ISCO at r = 6M for L = 2 sqrt(3) M.
// (d) Far-field massive V_eff ~ -M/r + L^2/(2 r^2).
// (e) V_eff(2M, L) = -1/2.
// (f) Turning-point formula.

import { describe, it, expect } from 'vitest';
import {
  veffMassive, veffPhoton, turningPoints,
  PHOTON_SPHERE, ISCO, L_ISCO, M,
} from './sim.js';

describe('Veff photon: peak at r = 3M', () => {
  it('V_eff_photon(3M) > V_eff_photon(3M +/- 0.1)', () => {
    const L = 5;
    const at3 = veffPhoton(PHOTON_SPHERE, L);
    expect(at3).toBeGreaterThan(veffPhoton(PHOTON_SPHERE + 0.1, L));
    expect(at3).toBeGreaterThan(veffPhoton(PHOTON_SPHERE - 0.1, L));
  });
});

describe('Veff photon: peak value', () => {
  it('V_eff_photon(3M, L) = L^2 / (54 M^2)', () => {
    for (const L of [3, 5, 7]) {
      const expected = L * L / (54 * M * M);
      expect(veffPhoton(PHOTON_SPHERE, L)).toBeCloseTo(expected, 9);
    }
  });
});

describe('Veff massive: ISCO', () => {
  it('at L = L_ISCO, turning points coincide near r = 6M', () => {
    const tps = turningPoints(L_ISCO);
    expect(tps.length).toBeGreaterThan(0);
    for (const r of tps) {
      expect(Math.abs(r - ISCO)).toBeLessThan(1e-6);
    }
  });
});

describe('Veff massive: far-field Newtonian', () => {
  it('at large r, V_eff_massive(r, L) approx -M/r + L^2/(2 r^2)', () => {
    const L = 4;
    for (const r of [100, 1000, 10000]) {
      const v = veffMassive(r, L);
      const approx = -M / r + L * L / (2 * r * r);
      expect(Math.abs(v - approx)).toBeLessThanOrEqual(3 * M * L * L / r ** 3);
    }
  });
});

describe('Veff massive: at horizon', () => {
  it('V_eff_massive(2M, L) = -1/2 for any L', () => {
    for (const L of [1, 3, 5]) {
      expect(veffMassive(2 * M, L)).toBeCloseTo(-0.5, 12);
    }
  });
});

describe('Veff massive: turning point formula', () => {
  it('turningPoints(L > L_ISCO) gives two distinct radii', () => {
    const L = 4;
    const tps = turningPoints(L);
    expect(tps.length).toBe(2);
    expect(tps[1]).toBeGreaterThan(tps[0]);
  });
});
