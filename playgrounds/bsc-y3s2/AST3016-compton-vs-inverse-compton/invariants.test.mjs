// Compton vs inverse Compton invariants.
// (a) Forward Compton: theta = 0 gives no shift.
// (b) IC Thomson typical energy = 4/3 gamma^2 E.
// (c) IC max energy at gamma = 10 boosts visible light into UV-X-ray.
// (d) Thomson regime check: gamma * E << m_e c^2 returns true at moderate gamma.
// (e) Klein-Nishina suppression ratio is 1 in Thomson limit and < 1 at high energy.

import { describe, it, expect } from 'vitest';
import {
  comptonForward, icMaxEnergy, icTypicalThomson, isThomsonRegime, suppressionFactor,
  M_E_EV,
} from './sim.js';

describe('compton-vs-inverse-compton', () => {
  it('forward Compton: theta = 0 gives no shift', () => {
    expect(Math.abs(comptonForward(1e5, 0) - 1e5)).toBeLessThan(1e-8);
  });

  it('forward Compton: theta = pi (backscatter) maximum shift', () => {
    const E = 1e6;
    const Ep = comptonForward(E, Math.PI);
    const expected = E / (1 + 2 * E / M_E_EV);
    expect(Math.abs(Ep - expected) / expected).toBeLessThan(1e-12);
  });

  it('IC typical Thomson: 4/3 gamma^2 E for gamma = 10, E = 1 eV', () => {
    const v = icTypicalThomson(10, 1);
    expect(Math.abs(v - (4 / 3) * 100)).toBeLessThan(1e-12);
  });

  it('IC max in Thomson limit equals 4 gamma^2 E', () => {
    // gamma = 100, E = 1 eV: gamma*E = 100 << m_e c^2 = 0.511e6.
    const v = icMaxEnergy(100, 1);
    expect(Math.abs(v - 4 * 1e4) / v).toBeLessThan(1e-3);
  });

  it('IC at gamma = 10 with optical photon (1 eV) reaches UV-X-ray (~100 eV)', () => {
    const v = icMaxEnergy(10, 1);
    expect(v).toBeGreaterThan(50);
    expect(v).toBeLessThan(500);
  });

  it('isThomsonRegime: gamma = 10, E = 1 eV is Thomson; gamma = 1e6, E = 1 keV is not', () => {
    expect(isThomsonRegime(10, 1)).toBe(true);
    expect(isThomsonRegime(1e6, 1e3)).toBe(false);
  });

  it('suppressionFactor: ~ 1 in Thomson limit; < 1 at high energy', () => {
    expect(suppressionFactor(1, 1)).toBeCloseTo(1, 4);
    expect(suppressionFactor(1e6, 1e3)).toBeLessThan(1);
  });

  it('forward Compton 511 keV photon backscatter gives ~ 170 keV', () => {
    const Ep = comptonForward(M_E_EV, Math.PI);
    expect(Math.abs(Ep - M_E_EV / 3) / (M_E_EV / 3)).toBeLessThan(1e-12);
  });
});
