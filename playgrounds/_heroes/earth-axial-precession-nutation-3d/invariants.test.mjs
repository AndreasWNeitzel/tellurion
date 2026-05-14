import { describe, it, expect } from 'vitest';
import { precessionLongitude, nutation, obliquity, EPS0_DEG, PREC_RATE_ARCSEC_YR } from './sim.js';
describe('earth-axial-precession-nutation-3d', () => {
  it('precession rate 50.29 arcsec/yr', () => {
    expect(Math.abs(precessionLongitude(1) - 50.29)).toBeLessThan(0.01);
  });
  it('precession completes 360 deg in ~25,800 yr', () => {
    const full = 360 * 3600 / PREC_RATE_ARCSEC_YR;
    expect(full).toBeGreaterThan(25000); expect(full).toBeLessThan(27000);
  });
  it('obliquity within ~50 arcsec of base value', () => {
    expect(Math.abs(obliquity(0) - EPS0_DEG)).toBeLessThan(0.01);
  });
  it('nutation 18.6-yr period: max amplitude ~9.2"', () => {
    let maxEps = 0;
    for (let y = 0; y < 18.6; y += 0.1) maxEps = Math.max(maxEps, Math.abs(nutation(y).dEps));
    expect(maxEps).toBeGreaterThan(8); expect(maxEps).toBeLessThan(12);
  });
  it('nutation 18.6-yr: maximum |dPsi| ~17.2"', () => {
    let maxPsi = 0;
    for (let y = 0; y < 18.6; y += 0.1) maxPsi = Math.max(maxPsi, Math.abs(nutation(y).dPsi));
    expect(maxPsi).toBeGreaterThan(15); expect(maxPsi).toBeLessThan(20);
  });
});
