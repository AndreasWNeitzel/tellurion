import { describe, it, expect } from 'vitest';
import {
  bCritSchwarzschild, photonSphereSchwarzschild, iscoKerr,
  deflectionAngleSchwarzschild, deflectionWeakField,
  nullGeodesic, isCaptured, circularOrbit,
  hubbleLaw, hubbleRadius, particleHorizon, comovingDistance,
  scaleFactorHistory, redshiftToScale, scaleToRedshift,
} from './sim.js';

describe('geodesics-curved-spacetime-3d invariants', () => {
  it('the Schwarzschild critical impact parameter is b_c = 3 sqrt(3) M (0.1%)', () => {
    const bc = bCritSchwarzschild(1);
    expect(bc).toBeCloseTo(3 * Math.sqrt(3), 9);
    expect(Math.abs(bc - 3 * Math.sqrt(3)) / (3 * Math.sqrt(3))).toBeLessThan(1e-3);
    expect(photonSphereSchwarzschild(1)).toBe(3);
  });

  it('the Schwarzschild ISCO is 6 M; Kerr prograde is below and retrograde above', () => {
    expect(iscoKerr(0, 1)).toBeCloseTo(6, 9);
    expect(iscoKerr(0.998, 1)).toBeLessThan(2);          // near-extremal prograde
    expect(iscoKerr(-0.998, 1)).toBeGreaterThan(8);      // retrograde
    expect(circularOrbit(10).stable).toBe(true);         // r > 6
    expect(circularOrbit(4).stable).toBe(false);         // r < 6
  });

  it('the null-geodesic first integral (= b = L/E) is conserved to machine precision', () => {
    for (const b of [4, 5, 5.5, 8, 20]) {
      const g = nullGeodesic(b);
      expect(g.maxDrift).toBeLessThan(1e-9);             // (u')^2 + u^2 - 2u^3 = 1/b^2
    }
  });

  it('photons are captured iff b < b_c, and escaping rays follow 4M/b in the weak field', () => {
    expect(isCaptured(bCritSchwarzschild() - 0.1)).toBe(true);
    expect(isCaptured(bCritSchwarzschild() + 0.1)).toBe(false);
    expect(nullGeodesic(4.5).captured).toBe(true);       // b < b_c
    expect(nullGeodesic(7).captured).toBe(false);        // b > b_c
    const b = 50, cpu = deflectionAngleSchwarzschild(b);
    expect(cpu.captured).toBe(false);
    expect(Math.abs(cpu.deflection - deflectionWeakField(b)) / deflectionWeakField(b)).toBeLessThan(0.05);
  });

  it('the FLRW Hubble law is exactly v = H0 d (linear, slope H0)', () => {
    const H0 = 70;
    expect(hubbleLaw(100, H0)).toBeCloseTo(7000, 9);
    expect(hubbleLaw(200, H0) / hubbleLaw(100, H0)).toBeCloseTo(2, 12);  // linear
    expect(hubbleLaw(13, H0) / 13).toBeCloseTo(H0, 12);                 // slope = H0
    // recession reaches c exactly at the Hubble radius d = c/H0
    expect(hubbleLaw(hubbleRadius(H0, 1), H0)).toBeCloseTo(1, 12);       // v = c
    expect(hubbleLaw(2 * hubbleRadius(H0, 1), H0)).toBeGreaterThan(1);   // superluminal recession (allowed)
  });

  it('FLRW redshift is 1 + z = 1/a and the particle horizon exceeds the Hubble radius', () => {
    expect(redshiftToScale(1)).toBeCloseTo(0.5, 12);     // 1 + z = 1/a
    expect(scaleToRedshift(0.25)).toBeCloseTo(3, 12);
    const ph = particleHorizon(70, 0.3, 0.7, 1);
    const hr = hubbleRadius(70, 1);
    expect(ph).toBeGreaterThan(0);
    expect(ph / hr).toBeGreaterThan(2.5);                // LCDM particle horizon ~3.4 c/H0
    expect(ph / hr).toBeLessThan(4);
    expect(comovingDistance(2, 70, 0.3, 0.7, 1)).toBeGreaterThan(comovingDistance(1, 70, 0.3, 0.7, 1));
  });

  it('the FLRW scale factor grows monotonically (expansion, a-dot > 0)', () => {
    const { a, t } = scaleFactorHistory(70, 1, 0, 2.0);  // matter-only
    for (let i = 1; i < a.length; i += 1) {
      expect(a[i]).toBeGreaterThan(a[i - 1]);             // monotone increasing
      expect(t[i]).toBeGreaterThan(t[i - 1]);
    }
    expect(a[a.length - 1]).toBeGreaterThan(1.5);
  });

  it('deterministic: identical inputs reproduce the geodesic and cosmology', () => {
    expect(nullGeodesic(6).pts.length).toBe(nullGeodesic(6).pts.length);
    expect(nullGeodesic(6).maxDrift).toBe(nullGeodesic(6).maxDrift);
    expect(particleHorizon(70, 0.3, 0.7, 1)).toBe(particleHorizon(70, 0.3, 0.7, 1));
  });
});
