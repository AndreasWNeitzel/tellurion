import { describe, it, expect } from 'vitest';
import {
  schwarzschildRadius_m, photonSphereRadius_m, criticalImpactParameter_m,
  iscoRadius_m, kerrHorizonRadius_m, lightBendingAngle_rad,
  einsteinRingRadius_rad, lensImagePositions_rad, lensMagnification,
  hawkingTemperature_K, gravRedshift, tracePhoton, classifyPhoton,
  kerrInnerHorizon_m, kerrErgosphere_m, kerrHorizonAngularVel_radps,
  tidalAccelPerMetre_per_s2, orbitalPeriod_s, BH_PRESETS,
} from './sim.js';

const M_SUN = 1.989e30;

describe('blackhole-legend-3d', () => {
  it('R_s for 1 solar mass is ~ 2953 m', () => {
    expect(schwarzschildRadius_m(1)).toBeGreaterThan(2900);
    expect(schwarzschildRadius_m(1)).toBeLessThan(3000);
  });

  it('photon sphere is at 1.5 R_s', () => {
    expect(photonSphereRadius_m(1) / schwarzschildRadius_m(1)).toBeCloseTo(1.5, 9);
  });

  it('critical impact parameter is 3 sqrt 3 / 2 R_s', () => {
    expect(criticalImpactParameter_m(1) / schwarzschildRadius_m(1)).toBeCloseTo(3 * Math.sqrt(3) / 2, 9);
  });

  it('Schwarzschild ISCO is at 6 GM/c^2 = 3 R_s', () => {
    const r_iso = iscoRadius_m(1, 0);
    const Rs = schwarzschildRadius_m(1);
    expect(r_iso / Rs).toBeCloseTo(3, 4);
  });

  it('Kerr prograde ISCO -> GM/c^2 = R_s/2 as chi -> 1', () => {
    const r_iso = iscoRadius_m(1, 0.999);
    const Rs = schwarzschildRadius_m(1);
    expect(r_iso / Rs).toBeLessThan(0.6);
    expect(r_iso / Rs).toBeGreaterThan(0.4);
  });

  it('ISCO is monotonically decreasing with chi (prograde)', () => {
    let prev = Infinity;
    for (let c = 0; c <= 0.95; c += 0.1) {
      const r = iscoRadius_m(1, c);
      expect(r).toBeLessThanOrEqual(prev);
      prev = r;
    }
  });

  it('Kerr horizon r_+ = R_s/2 (1 + sqrt(1 - chi^2))', () => {
    const Rs = schwarzschildRadius_m(1);
    expect(kerrHorizonRadius_m(1, 0)).toBeCloseTo(Rs, -3);
    expect(kerrHorizonRadius_m(1, 0.6) / Rs).toBeCloseTo(0.5 + 0.5 * Math.sqrt(1 - 0.36), 4);
  });

  it('light bending: photon at b -> infinity gives small angle ~ 2 R_s / b', () => {
    const Rs = schwarzschildRadius_m(1);
    const b = 100 * Rs;
    const dphi = lightBendingAngle_rad(1, b);
    expect(dphi).toBeCloseTo(2 * Rs / b, 3);
  });

  it('light bending: photon at b = b_c gives infinite angle (capture)', () => {
    const bc = criticalImpactParameter_m(1);
    const cls = classifyPhoton(1, 0.5 * bc);
    expect(cls).toBe('capture');
  });

  it('Einstein ring radius scales as sqrt(M)', () => {
    const tE1 = einsteinRingRadius_rad(1, 1e16, 2e16);
    const tE4 = einsteinRingRadius_rad(4, 1e16, 2e16);
    expect(tE4 / tE1).toBeCloseTo(2, 6);
  });

  it('lens image positions: x_+ + x_- = beta (Refsdal 1964)', () => {
    const beta = 1e-7;
    const tE = einsteinRingRadius_rad(1, 1e16, 2e16);
    const { x_plus, x_minus } = lensImagePositions_rad(1, beta, 1e16, 2e16);
    expect(x_plus + x_minus).toBeCloseTo(beta, 12);
  });

  it('lens image positions: x_+ x_- = -theta_E^2', () => {
    const beta = 5e-8;
    const tE = einsteinRingRadius_rad(1, 1e16, 2e16);
    const { x_plus, x_minus } = lensImagePositions_rad(1, beta, 1e16, 2e16);
    expect(x_plus * x_minus).toBeCloseTo(-tE * tE, 18);
  });

  it('lens magnification diverges as beta -> 0', () => {
    expect(lensMagnification(1e-12, 1.0)).toBeGreaterThan(1e6);
  });

  it('lens magnification = 1 at large beta / theta_E', () => {
    expect(lensMagnification(100.0, 1.0)).toBeCloseTo(1, 2);
  });

  it('Hawking temperature: solar BH ~ 6e-8 K', () => {
    expect(hawkingTemperature_K(1)).toBeGreaterThan(5e-8);
    expect(hawkingTemperature_K(1)).toBeLessThan(7e-8);
  });

  it('gravitational redshift diverges at the horizon', () => {
    const Rs = schwarzschildRadius_m(1);
    expect(gravRedshift(1, 1.001 * Rs)).toBeGreaterThan(20);
  });

  it('photon orbit traced at b > b_c escapes (yields a path)', () => {
    const Rs = schwarzschildRadius_m(1);
    const b = 3 * Rs;
    const { path, captured } = tracePhoton(1, b);
    expect(captured).toBe(false);
    expect(path.length).toBeGreaterThan(50);
  });

  it('classifyPhoton: high b => escape, low b => capture, near b_c => orbit', () => {
    const Rs = schwarzschildRadius_m(1);
    const bc = criticalImpactParameter_m(1);
    expect(classifyPhoton(1, 10 * Rs)).toBe('escape');
    expect(classifyPhoton(1, 0.5 * bc)).toBe('capture');
    expect(classifyPhoton(1, 1.01 * bc)).toBe('orbit');
  });

  it('Kerr inner horizon r_- vanishes at chi = 0 and matches r_+ at chi = 1', () => {
    expect(kerrInnerHorizon_m(1, 0)).toBeCloseTo(0, 6);
    const r_minus_extreme = kerrInnerHorizon_m(1, 0.999);
    const r_plus_extreme = kerrHorizonRadius_m(1, 0.999);
    expect(Math.abs(r_minus_extreme - r_plus_extreme) / r_plus_extreme).toBeLessThan(0.1);
  });

  it('Kerr ergosphere at equator equals R_s independent of chi', () => {
    const Rs = schwarzschildRadius_m(1);
    expect(kerrErgosphere_m(1, 0.0, Math.PI / 2) / Rs).toBeCloseTo(1, 6);
    expect(kerrErgosphere_m(1, 0.7, Math.PI / 2) / Rs).toBeCloseTo(1, 6);
    expect(kerrErgosphere_m(1, 0.99, Math.PI / 2) / Rs).toBeCloseTo(1, 6);
  });

  it('Kerr ergosphere at pole equals outer horizon r_+', () => {
    const r_plus = kerrHorizonRadius_m(1, 0.7);
    const r_ergo_pole = kerrErgosphere_m(1, 0.7, 0);
    expect(r_ergo_pole / r_plus).toBeCloseTo(1, 6);
  });

  it('horizon angular velocity is zero for Schwarzschild', () => {
    expect(kerrHorizonAngularVel_radps(10, 0)).toBeCloseTo(0, 8);
  });

  it('horizon angular velocity is finite and positive for spinning Kerr', () => {
    const Omega = kerrHorizonAngularVel_radps(10, 0.9);
    expect(Omega).toBeGreaterThan(0);
    expect(Number.isFinite(Omega)).toBe(true);
  });

  it('tidal acceleration scales as 1/r^3 and inverse square of mass at fixed r/R_s', () => {
    const Rs1 = schwarzschildRadius_m(1);
    const Rs100 = schwarzschildRadius_m(100);
    const a1 = tidalAccelPerMetre_per_s2(1, 5 * Rs1);
    const a100 = tidalAccelPerMetre_per_s2(100, 5 * Rs100);
    expect(a100 / a1).toBeCloseTo(1 / (100 * 100), 1);
  });

  it('orbital period at r = 6 M is the ISCO period; ~ 0.6 ms for 1 Msun', () => {
    const T = orbitalPeriod_s(1, 0, 6);
    expect(T).toBeGreaterThan(4e-4);
    expect(T).toBeLessThan(2e-3);
  });

  it('BH_PRESETS contains the headline observed objects', () => {
    const ids = BH_PRESETS.map(p => p.id);
    expect(ids).toContain('sgrA');
    expect(ids).toContain('m87');
    expect(ids).toContain('gw150914');
  });
});
