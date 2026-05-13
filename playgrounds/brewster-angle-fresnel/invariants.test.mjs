// Brewster / Fresnel invariants.
// (a) Brewster angle theta_B = atan(n2 / n1).
// (b) R_p = 0 at Brewster.
// (c) Rs, Rp in [0, 1].
// (d) Normal incidence: R = ((n1 - n2)/(n1 + n2))^2.
// (e) Grazing: R -> 1.
// (f) TIR above critical angle.

import { describe, it, expect } from 'vitest';
import {
  fresnelR, brewsterAngle, criticalAngle, snellRefract,
} from './sim.js';

describe('Brewster: angle formula', () => {
  it('theta_B = atan(n2 / n1) exact', () => {
    for (const [n1, n2] of [[1.0, 1.5], [1.5, 1.0], [1.0, 1.33]]) {
      expect(brewsterAngle(n1, n2)).toBeCloseTo(Math.atan2(n2, n1), 12);
    }
  });
});

describe('Brewster: R_p = 0', () => {
  it('R_p at theta_B is below 1e-6', () => {
    const n1 = 1.0, n2 = 1.5;
    const tB = brewsterAngle(n1, n2);
    const { Rp } = fresnelR(tB, n1, n2);
    expect(Rp).toBeLessThan(1e-6);
  });
});

describe('Fresnel: R in [0, 1]', () => {
  it('over 0 to pi/2, Rs and Rp in [0, 1]', () => {
    const n1 = 1.0, n2 = 1.5;
    for (let i = 0; i <= 90; i += 1) {
      const theta = (i * Math.PI) / 180;
      const { Rs, Rp } = fresnelR(theta, n1, n2);
      expect(Rs).toBeGreaterThanOrEqual(0);
      expect(Rs).toBeLessThanOrEqual(1);
      expect(Rp).toBeGreaterThanOrEqual(0);
      expect(Rp).toBeLessThanOrEqual(1);
    }
  });
});

describe('Fresnel: normal incidence', () => {
  it('R = ((n1 - n2)/(n1 + n2))^2 at theta = 0', () => {
    const n1 = 1.0, n2 = 1.5;
    const expected = ((n1 - n2) / (n1 + n2)) ** 2;
    const { Rs, Rp } = fresnelR(0, n1, n2);
    expect(Rs).toBeCloseTo(expected, 6);
    expect(Rp).toBeCloseTo(expected, 6);
  });
});

describe('Fresnel: grazing', () => {
  it('R approaches 1 at theta -> pi/2', () => {
    const n1 = 1.0, n2 = 1.5;
    const { Rs, Rp } = fresnelR(Math.PI / 2 - 0.001, n1, n2);
    expect(Rs).toBeGreaterThan(0.95);
    expect(Rp).toBeGreaterThan(0.95);
  });
});

describe('Snell: TIR for n1 > n2 above critical', () => {
  it('critical angle = arcsin(n2 / n1) when n1 > n2; above gives R = 1', () => {
    const n1 = 1.5, n2 = 1.0;
    const tc = criticalAngle(n1, n2);
    expect(tc).toBeCloseTo(Math.asin(n2 / n1), 12);
    const { Rs, Rp } = fresnelR(tc + 0.01, n1, n2);
    expect(Rs).toBeCloseTo(1, 9);
    expect(Rp).toBeCloseTo(1, 9);
  });
});
