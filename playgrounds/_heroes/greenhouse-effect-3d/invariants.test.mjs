import { describe, it, expect } from 'vitest';
import {
  S_SOLAR_WM2, SIGMA_SB,
  emissionTemperature_K, surfaceTemperature_K,
  multilayerSurfaceTemperature_K, tauFromCO2, GHE_PRESETS,
} from './sim.js';

describe('greenhouse-effect-3d', () => {
  it('Solar constant ~ 1361 W/m^2', () => {
    expect(S_SOLAR_WM2).toBeCloseTo(1361, 0);
  });

  it('Earth T_eff with A=0.30 is 255 K', () => {
    const T = emissionTemperature_K(S_SOLAR_WM2, 0.30);
    expect(T).toBeGreaterThan(253);
    expect(T).toBeLessThan(257);
  });

  it('At tau_LW = 1 (transparent IR), T_surf = T_eff', () => {
    const Tsurf = surfaceTemperature_K(S_SOLAR_WM2, 0.30, 1.0);
    const Teff = emissionTemperature_K(S_SOLAR_WM2, 0.30);
    expect(Tsurf).toBeCloseTo(Teff, 4);
  });

  it('At tau_LW = 0 (fully opaque IR), T_surf = T_eff * 2^(1/4)', () => {
    const Tsurf = surfaceTemperature_K(S_SOLAR_WM2, 0.30, 0.0);
    const Teff = emissionTemperature_K(S_SOLAR_WM2, 0.30);
    expect(Tsurf / Teff).toBeCloseTo(Math.pow(2, 0.25), 6);
  });

  it('CO2 = 280 ppm gives tau_LW = TAU_0 = 0.10', () => {
    expect(tauFromCO2(280)).toBeCloseTo(0.10, 6);
  });

  it('Doubling CO2 (280 -> 560 ppm) reduces tau by exp(-beta * 1)', () => {
    const t1 = tauFromCO2(280);
    const t2 = tauFromCO2(560);
    // ratio should be exp(-0.35) = 0.7047.
    expect(t2 / t1).toBeCloseTo(Math.exp(-0.35), 4);
  });

  it('Doubling CO2 gives Delta T_surf > 0 (warming)', () => {
    const T1 = surfaceTemperature_K(S_SOLAR_WM2, 0.30, tauFromCO2(280));
    const T2 = surfaceTemperature_K(S_SOLAR_WM2, 0.30, tauFromCO2(560));
    expect(T2).toBeGreaterThan(T1);
    // Climate sensitivity ~ 2 to 4 K range.
    expect(T2 - T1).toBeGreaterThan(0.5);
    expect(T2 - T1).toBeLessThan(8);
  });

  it('Higher albedo -> lower T_surf (cooling)', () => {
    const T_low_A = surfaceTemperature_K(S_SOLAR_WM2, 0.30, 0.10);
    const T_high_A = surfaceTemperature_K(S_SOLAR_WM2, 0.70, 0.10);
    expect(T_high_A).toBeLessThan(T_low_A);
  });

  it('Snowball albedo (0.70) drops T_eff to ~ 200 K', () => {
    const T = emissionTemperature_K(S_SOLAR_WM2, 0.70);
    expect(T).toBeGreaterThan(190);
    expect(T).toBeLessThan(220);
  });

  it('Stefan-Boltzmann constant in SI', () => {
    expect(SIGMA_SB).toBeCloseTo(5.67e-8, 9);
  });

  it('Multi-layer: N opaque layers give T_surf = T_eff * (N+1)^(1/4)', () => {
    const T_one = emissionTemperature_K(S_SOLAR_WM2, 0.30);
    const T_many = multilayerSurfaceTemperature_K(S_SOLAR_WM2, 0.30, 0, 15);
    expect(T_many / T_one).toBeCloseTo(Math.pow(16, 0.25), 6);
  });

  it('Venus runaway preset: T_surf in [700, 800] K (matches observed 737 K)', () => {
    const p = GHE_PRESETS.venus_runaway;
    const T = multilayerSurfaceTemperature_K(S_SOLAR_WM2, p.A, tauFromCO2(p.co2_ppm), p.n_layers);
    expect(T).toBeGreaterThan(700);
    expect(T).toBeLessThan(800);
  });

  it('GHE_PRESETS includes all five canonical scenarios', () => {
    for (const k of ['snowball', 'preindustrial', 'current', 'doubled_co2', 'venus_runaway']) {
      expect(GHE_PRESETS[k]).toBeDefined();
    }
  });

  it('Preindustrial T_surf in [280, 300] K (matches geological record within model)', () => {
    const p = GHE_PRESETS.preindustrial;
    const T = surfaceTemperature_K(S_SOLAR_WM2, p.A, tauFromCO2(p.co2_ppm));
    // Real 288 K vs model 296 K is within the 5% single-layer-model error.
    expect(T).toBeGreaterThan(280);
    expect(T).toBeLessThan(300);
  });
});
