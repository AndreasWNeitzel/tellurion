// IC cooling invariants.
// (a) Cooling time inversely proportional to gamma.
// (b) Cooling time inversely proportional to U_ph.
// (c) CMB at z = 0: U_ph ~ 4.17e-14 J/m^3.
// (d) Cluster scale (T = 1e8 K): U_ph way smaller than blackbody (we're treating the bath as thermal blackbody for the test).
// (e) Year conversion sane.

import { describe, it, expect } from 'vitest';
import {
  tCoolSeconds, tCoolYears, uPhotonThermalJM3, uCMB,
  SIGMA_T, M_E_KG, C,
} from './sim.js';

describe('inverse-compton-scattering-cooling', () => {
  it('CMB energy density at z = 0 is ~ 4.17e-14 J/m^3', () => {
    const U = uCMB(0);
    expect(Math.abs(U - 4.17e-14) / 4.17e-14).toBeLessThan(0.01);
  });

  it('CMB at z = 10 is 11^4 times higher than today', () => {
    const ratio = uCMB(10) / uCMB(0);
    expect(Math.abs(ratio - Math.pow(11, 4)) / Math.pow(11, 4)).toBeLessThan(1e-12);
  });

  it('Cooling time scales as 1 / gamma', () => {
    const U = 1e-13;
    const t1 = tCoolSeconds(100, U);
    const t2 = tCoolSeconds(1000, U);
    expect(Math.abs(t2 - t1 / 10) / t1).toBeLessThan(1e-12);
  });

  it('Cooling time scales as 1 / U_ph', () => {
    const t1 = tCoolSeconds(100, 1e-13);
    const t2 = tCoolSeconds(100, 1e-12);
    expect(Math.abs(t2 - t1 / 10) / t1).toBeLessThan(1e-12);
  });

  it('Cooling time formula matches t = 3 m_e c / (4 sigma_T gamma U)', () => {
    const gamma = 100, U = 1e-13;
    const expected = (3 * M_E_KG * C) / (4 * SIGMA_T * gamma * U);
    expect(Math.abs(tCoolSeconds(gamma, U) - expected) / expected).toBeLessThan(1e-12);
  });

  it('tCoolYears converts to years correctly', () => {
    const ts = tCoolSeconds(100, 1e-13);
    const ty = tCoolYears(100, 1e-13);
    expect(Math.abs(ty * 3.15576e7 - ts) / ts).toBeLessThan(1e-12);
  });

  it('100 GeV electron (gamma ~ 2e5) in CMB has cooling time of order 10^7 yr', () => {
    const gamma = 2e5;
    const U = uCMB(0);
    const ty = tCoolYears(gamma, U);
    expect(ty).toBeGreaterThan(1e6);
    expect(ty).toBeLessThan(1e8);
  });

  it('Higher temperature bath cools faster', () => {
    const t_cold = tCoolSeconds(100, uPhotonThermalJM3(2.725));
    const t_hot  = tCoolSeconds(100, uPhotonThermalJM3(1000));
    expect(t_hot).toBeLessThan(t_cold);
  });
});
