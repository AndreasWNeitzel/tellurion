import { describe, it, expect } from 'vitest';
import {
  FATE_PRESETS, cmbDeltaT, T_CMB_NOW, T_LAST_SCATTERING, Z_LAST_SCATTERING,
  POTENTIALS, epsilon, eta, nsOf, rOf,
  efolds_quadratic, efolds_starobinsky,
  integrateScaleFactor, scaleAt,
} from './sim.js';

describe('cosmology-legend-3d', () => {
  it('FATE_PRESETS includes lcdm with Omega_m ~ 0.31', () => {
    expect(FATE_PRESETS.lcdm.Om).toBeCloseTo(0.31, 2);
    expect(FATE_PRESETS.lcdm.Ol).toBeCloseTo(0.69, 2);
  });

  it('FATE_PRESETS.matter is Einstein-de-Sitter (Om = 1, Ol = 0)', () => {
    expect(FATE_PRESETS.matter.Om).toBe(1);
    expect(FATE_PRESETS.matter.Ol).toBe(0);
  });

  it('FATE_PRESETS.closed has Omega_m > 1 (recollapses)', () => {
    expect(FATE_PRESETS.closed.Om).toBeGreaterThan(1);
  });

  it('CMB temperature today is 2.725 K', () => {
    expect(T_CMB_NOW).toBe(2.725);
  });

  it('Last-scattering surface at z = 1089 has T ~ 3000 K', () => {
    expect(Z_LAST_SCATTERING).toBe(1089);
    expect(T_LAST_SCATTERING).toBeGreaterThan(2900);
    expect(T_LAST_SCATTERING).toBeLessThan(3100);
  });

  it('cmbDeltaT returns values in [-1, 1]', () => {
    for (let i = 0; i < 20; i++) {
      const theta = Math.random() * Math.PI;
      const phi = Math.random() * 2 * Math.PI;
      const dT = cmbDeltaT(theta, phi);
      expect(dT).toBeGreaterThanOrEqual(-1);
      expect(dT).toBeLessThanOrEqual(1);
    }
  });

  it('cmbDeltaT is deterministic for the same seed', () => {
    const a = cmbDeltaT(0.5, 0.7, 0xC0FFEE);
    const b = cmbDeltaT(0.5, 0.7, 0xC0FFEE);
    expect(a).toBe(b);
  });

  it('POTENTIALS.quadratic returns V = phi^2 / 2', () => {
    expect(POTENTIALS.quadratic.V(2)).toBe(2);
    expect(POTENTIALS.quadratic.V(4)).toBe(8);
  });

  it('Starobinsky V approaches 1 as phi -> infinity', () => {
    const V_large = POTENTIALS.starobinsky.V(20);
    expect(V_large).toBeCloseTo(1, 2);
  });

  it('Slow-roll epsilon is small in the slow-roll regime', () => {
    // For phi^2 at phi = 10 (well into slow-roll), epsilon = 1/2 / 50 = 0.02.
    expect(epsilon(10, 'quadratic')).toBeCloseTo(0.02, 3);
  });

  it('Slow-roll n_s for phi^2 at N = 60 is ~ 0.967', () => {
    const p60 = Math.sqrt(4 * 60 + 2);   // ~ sqrt(242) = 15.56
    const ns = nsOf(p60, 'quadratic');
    expect(ns).toBeGreaterThan(0.95);
    expect(ns).toBeLessThan(0.98);
  });

  it('Slow-roll r for phi^2 at N = 60 is ~ 0.13 (excluded by Planck)', () => {
    const p60 = Math.sqrt(4 * 60 + 2);
    const r = rOf(p60, 'quadratic');
    expect(r).toBeGreaterThan(0.10);
    expect(r).toBeLessThan(0.18);
  });

  it('Starobinsky r at N = 60 is very small (favoured by Planck)', () => {
    const p60 = Math.log(81.5 / 0.75) / Math.sqrt(2 / 3);
    const r = rOf(p60, 'starobinsky');
    expect(r).toBeLessThan(0.01);
  });

  it('Starobinsky n_s at N = 60 is ~ 0.967 (inside Planck box)', () => {
    const p60 = Math.log(81.5 / 0.75) / Math.sqrt(2 / 3);
    const ns = nsOf(p60, 'starobinsky');
    expect(ns).toBeGreaterThan(0.95);
    expect(ns).toBeLessThan(0.98);
  });

  it('Friedmann LCDM (Om = 0.31, Ol = 0.69): a accelerates after t = 0', () => {
    const sol = integrateScaleFactor({ m: 0.31, L: 0.69 }, 1.0);
    // a should grow monotonically in the future for LCDM.
    const a_now = scaleAt(sol, 0);
    const a_future = scaleAt(sol, 0.5);
    expect(a_future).toBeGreaterThan(a_now);
  });

  it('Friedmann closed (Om = 1.3, Ol = 0): a turns around', () => {
    const sol = integrateScaleFactor({ m: 1.3, L: 0 }, 1.0);
    // Find max a along the trajectory.
    let aMax = 0;
    for (const ai of sol.a) if (ai > aMax) aMax = ai;
    // Maximum must be greater than a(now) = 1, then descend.
    expect(aMax).toBeGreaterThan(1);
  });

  it('efolds: quadratic phi = sqrt(2) has N = 0 (inflation just ended)', () => {
    const N0 = efolds_quadratic(Math.sqrt(2));
    expect(N0).toBeCloseTo(0, 6);
  });

  it('efolds: quadratic phi = sqrt(242) has N ~ 60', () => {
    const N60 = efolds_quadratic(Math.sqrt(242));
    expect(N60).toBeCloseTo(60, 0);
  });
});
