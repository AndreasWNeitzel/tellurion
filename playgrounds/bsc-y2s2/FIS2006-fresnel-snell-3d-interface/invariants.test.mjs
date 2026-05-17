// Fresnel/Snell: Snell's law to 0.01 deg, Brewster zero for p, energy
// conservation R+T=1, total internal reflection with a positive
// evanescent decay above the critical angle, the normal-incidence
// coincidence, and the grazing limit.

import { describe, it, expect } from 'vitest';
import {
  snellSinTheta2, snellTheta2, cosTheta2, brewster, criticalAngle, fresnel,
} from './sim.js';

const DEG = Math.PI / 180;

describe('fresnel-snell-3d-interface invariants', () => {
  it("Snell's law n1 sin th1 = n2 sin th2 within 0.01 deg", () => {
    for (const [n1, n2] of [[1, 1.5], [1.33, 1], [1, 2.4]]) {
      for (const d of [5, 20, 35, 50]) {
        const th1 = d * DEG, th2 = snellTheta2(n1, n2, th1);
        if (th2 === null) continue;
        const resid = Math.asin(Math.max(-1, Math.min(1, (n1 * Math.sin(th1) - n2 * Math.sin(th2)) / n2)));
        expect(Math.abs(resid) / DEG).toBeLessThan(0.01);
      }
    }
  });

  it("p-polarisation vanishes exactly at Brewster's angle", () => {
    for (const [n1, n2] of [[1, 1.5], [1, 1.33], [1.5, 1]]) {
      const tB = brewster(n1, n2);
      expect(fresnel(n1, n2, tB).Rp).toBeLessThan(1e-9);
      // Rp has a strict minimum at tB
      expect(fresnel(n1, n2, tB).Rp).toBeLessThan(fresnel(n1, n2, tB - 3 * DEG).Rp);
      expect(fresnel(n1, n2, tB).Rp).toBeLessThan(fresnel(n1, n2, tB + 3 * DEG).Rp);
      // s-polarisation has no such zero
      expect(fresnel(n1, n2, tB).Rs).toBeGreaterThan(1e-3);
    }
  });

  it('energy is conserved: R + T = 1 for both polarisations (below TIR)', () => {
    for (const [n1, n2] of [[1, 1.5], [1.5, 1.0], [1, 1.33]]) {
      const tc = criticalAngle(n1, n2);
      for (let d = 1; d < 89; d += 4) {
        const th1 = d * DEG;
        if (tc !== null && th1 >= tc - 0.5 * DEG) continue;     // skip the TIR region
        const f = fresnel(n1, n2, th1);
        expect(Math.abs(f.Rs + f.Ts - 1)).toBeLessThan(1e-4);
        expect(Math.abs(f.Rp + f.Tp - 1)).toBeLessThan(1e-4);
      }
    }
  });

  it('total internal reflection above the critical angle (R = 1, evanescent)', () => {
    const n1 = 1.5, n2 = 1.0, tc = criticalAngle(n1, n2);
    expect(tc).toBeCloseTo(Math.asin(1 / 1.5), 12);
    // below tc: partial reflection, real transmission
    const below = fresnel(n1, n2, tc - 5 * DEG);
    expect(below.tir).toBe(false);
    expect(below.Rs).toBeLessThan(1);
    expect(below.Ts).toBeGreaterThan(0);
    // above tc: R = 1, no transmitted power, growing evanescent decay
    let prevK = -1;
    for (const d of [1, 5, 12, 25]) {
      const f = fresnel(n1, n2, tc + d * DEG);
      expect(f.tir).toBe(true);
      expect(f.Rs).toBeCloseTo(1, 9);
      expect(f.Rp).toBeCloseTo(1, 9);
      expect(f.Ts).toBe(0);
      expect(f.kappaK0).toBeGreaterThan(prevK);                 // decay deepens with angle
      prevK = f.kappaK0;
    }
    expect(cosTheta2(n1, n2, tc + 10 * DEG).im).toBeGreaterThan(0);
  });

  it('at normal incidence s and p coincide at ((n1-n2)/(n1+n2))^2', () => {
    for (const [n1, n2] of [[1, 1.5], [1.5, 1.33], [1, 2.4]]) {
      const f = fresnel(n1, n2, 1e-7);
      const R0 = ((n1 - n2) / (n1 + n2)) ** 2;
      expect(f.Rs).toBeCloseTo(R0, 6);
      expect(f.Rp).toBeCloseTo(R0, 6);
      expect(Math.abs(f.Rs - f.Rp)).toBeLessThan(1e-6);
    }
  });

  it('grazing incidence reflects fully; no interface means no reflection', () => {
    const f = fresnel(1, 1.5, 89.9 * DEG);
    expect(f.Rs).toBeGreaterThan(0.97);
    expect(f.Rp).toBeGreaterThan(0.97);
    const same = fresnel(1.5, 1.5, 30 * DEG);
    expect(same.Rs).toBeLessThan(1e-9);
    expect(same.Rp).toBeLessThan(1e-9);
    expect(same.Ts).toBeCloseTo(1, 9);
    // Snell sine factor is exactly (n1/n2) sin th1
    expect(snellSinTheta2(1, 2, 30 * DEG)).toBeCloseTo((1 / 2) * Math.sin(30 * DEG), 12);
  });
});
