import { describe, it, expect } from 'vitest';
import {
  X_0, LAMBDA_I, E_C_EM, E_C_HAD,
  emShowerMax, emShowerXmax, hadronicXmax, nMuons, gaisserHillas,
  depthAtAltitude_gcm2, altitudeAtDepth_km, PRIMARIES,
} from './sim.js';

describe('cosmic-ray-air-shower-3d', () => {
  it('Radiation length in air is 36.6 g cm^-2', () => {
    expect(X_0).toBeCloseTo(36.6, 1);
  });

  it('Hadronic interaction length is 90 g cm^-2', () => {
    expect(LAMBDA_I).toBeCloseTo(90, 1);
  });

  it('EM critical energy in air is 87 MeV', () => {
    expect(E_C_EM).toBeCloseTo(0.087, 3);
  });

  it('EM N_max scales linearly with E_0', () => {
    const N1 = emShowerMax(1);
    const N10 = emShowerMax(10);
    expect(N10 / N1).toBeCloseTo(10, 6);
  });

  it('EM X_max grows logarithmically with E_0', () => {
    const X1 = emShowerXmax(1);
    const X10 = emShowerXmax(10);
    expect(X10 - X1).toBeCloseTo(X_0 * Math.log(10) / Math.log(2), 4);
  });

  it('Hadronic X_max for proton at 10^18 eV is in Heitler-model range', () => {
    const X = hadronicXmax(1e9, 1);     // E0 in GeV; 10^18 eV = 10^9 GeV
    // Pure Heitler with log_2 gives ~ 1200; observed (LPM-corrected) ~ 750.
    expect(X).toBeGreaterThan(900);
    expect(X).toBeLessThan(1400);
  });

  it('Hadronic X_max for iron is shallower than for proton at same energy', () => {
    const X_p = hadronicXmax(1e9, 1);
    const X_Fe = hadronicXmax(1e9, 56);
    expect(X_Fe).toBeLessThan(X_p);
  });

  it('X_max difference between proton and iron in expected mass-discrimination range', () => {
    const diff = hadronicXmax(1e9, 1) - hadronicXmax(1e9, 56);
    expect(diff).toBeGreaterThan(60);
    expect(diff).toBeLessThan(300);
  });

  it('Muon number scales sub-linearly with energy (alpha ~ 0.93)', () => {
    const N1 = nMuons(1e8, 1);
    const N10 = nMuons(1e9, 1);
    const ratio = N10 / N1;
    expect(ratio).toBeGreaterThan(5);    // less than linear (10)
    expect(ratio).toBeLessThan(10);
  });

  it('Muon number is larger for heavier nuclei (superposition)', () => {
    const Np = nMuons(1e9, 1);
    const NFe = nMuons(1e9, 56);
    expect(NFe).toBeGreaterThan(Np);
  });

  it('Gaisser-Hillas profile peaks at X = X_max', () => {
    const peak = gaisserHillas(800, 1, 800, 100);
    for (const X of [400, 600, 1000, 1200]) {
      expect(gaisserHillas(X, 1, 800, 100)).toBeLessThanOrEqual(peak + 1e-12);
    }
  });

  it('Gaisser-Hillas profile is zero before first interaction', () => {
    expect(gaisserHillas(50, 1, 800, 100)).toBe(0);
  });

  it('Atmospheric depth: sea level (h = 0) = 1030 g cm^-2', () => {
    expect(depthAtAltitude_gcm2(0)).toBeCloseTo(1030, 1);
  });

  it('Atmospheric depth: 8 km gives 1030/e', () => {
    expect(depthAtAltitude_gcm2(8)).toBeCloseTo(1030 / Math.E, 1);
  });

  it('Altitude / depth round trip', () => {
    const X = 300;
    expect(depthAtAltitude_gcm2(altitudeAtDepth_km(X))).toBeCloseTo(X, 6);
  });

  it('PRIMARIES contains proton + iron-56', () => {
    expect(PRIMARIES.find(p => p.name === 'proton')).toBeDefined();
    expect(PRIMARIES.find(p => p.name === 'iron-56')).toBeDefined();
  });

  it('PRIMARIES: iron-56 has A = 56', () => {
    const fe = PRIMARIES.find(p => p.name === 'iron-56');
    expect(fe.A).toBe(56);
  });
});
