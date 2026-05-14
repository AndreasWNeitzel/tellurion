// Friedmann cosmography invariants.
// (a) E(0) = 1 for any (Om, Ol) summing to 1 (flat).
// (b) Hubble time 977.8/H0 Gyr.
// (c) LCDM age ~ 13.8 Gyr.
// (d) EdS (Om=1, Ol=0) age = 2/(3 H0).
// (e) Comoving distance grows monotonically in z.

import { describe, it, expect } from 'vitest';
import {
  E, comovingDistanceMpc, ageGyr, lookbackGyr,
  hubbleTimeGyr, H0_KMSMPC,
} from './sim.js';

describe('friedmann-cosmography', () => {
  it('E(0) = 1 for flat LCDM', () => {
    expect(Math.abs(E(0, 0.315, 0.685) - 1)).toBeLessThan(1e-12);
  });

  it('hubbleTimeGyr for H0 = 67.4 is approximately 14.5 Gyr', () => {
    expect(Math.abs(hubbleTimeGyr(67.4) - 14.51)).toBeLessThan(0.1);
  });

  it('LCDM age today is ~13.8 Gyr (Planck 2018)', () => {
    const age = ageGyr(0, 0.315, 0.685);
    expect(age).toBeGreaterThan(13.5);
    expect(age).toBeLessThan(14.0);
  });

  it('Einstein-de Sitter (Om = 1, Ol = 0): age = 2/(3 H_0)', () => {
    const age = ageGyr(0, 1, 0);
    const expected = (2 / 3) * hubbleTimeGyr();
    expect(Math.abs(age - expected) / expected).toBeLessThan(0.01);
  });

  it('comoving distance to z = 1 in LCDM is ~3300 Mpc', () => {
    const D = comovingDistanceMpc(1.0, 0.315, 0.685);
    expect(D).toBeGreaterThan(3200);
    expect(D).toBeLessThan(3500);
  });

  it('comoving distance grows monotonically with z', () => {
    const D1 = comovingDistanceMpc(0.5, 0.315, 0.685);
    const D2 = comovingDistanceMpc(1.0, 0.315, 0.685);
    const D3 = comovingDistanceMpc(2.0, 0.315, 0.685);
    expect(D2).toBeGreaterThan(D1);
    expect(D3).toBeGreaterThan(D2);
  });

  it('lookback at z = 1: a few Gyr', () => {
    const t = lookbackGyr(1.0, 0.315, 0.685);
    expect(t).toBeGreaterThan(5);
    expect(t).toBeLessThan(10);
  });

  it('age decreases with z (universe was younger)', () => {
    const a0 = ageGyr(0, 0.315, 0.685);
    const a1 = ageGyr(1, 0.315, 0.685);
    expect(a1).toBeLessThan(a0);
  });
});
