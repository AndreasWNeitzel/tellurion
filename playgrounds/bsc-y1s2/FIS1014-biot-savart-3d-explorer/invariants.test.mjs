// Biot-Savart: the straight-wire and on-axis-loop closed forms, the
// Helmholtz uniform-field condition, the ideal-solenoid interior, and
// the divergence-free property of any magnetostatic field.

import { describe, it, expect } from 'vitest';
import { biotSavart, buildPreset, divergence, solenoidN, K } from './sim.js';

describe('biot-savart-3d-explorer invariants', () => {
  it('long straight wire: |B| = 2 I / s (1/s law) within 1.5%', () => {
    const seg = buildPreset('wire', { I: 3 });
    for (const s of [0.5, 1, 2, 4]) {
      const B = biotSavart(seg, [s, 0, 0]);
      const mag = Math.hypot(...B);
      const analytic = 2 * K * 3 / s;            // mu0 I / 2 pi s, units K
      expect(Math.abs(mag - analytic) / analytic).toBeLessThan(1.5e-2);
    }
  });

  it('straight wire field is azimuthal (B perpendicular to the wire and to r)', () => {
    const seg = buildPreset('wire', { I: 2 });
    const P = [1.3, 0, 0.4];
    const B = biotSavart(seg, P);
    expect(Math.abs(B[2])).toBeLessThan(1e-2);                 // no z component
    expect(Math.abs(B[0] * P[0] + B[1] * P[1])).toBeLessThan(1e-2); // B . s_hat = 0
  });

  it('circular loop on axis: Bz = 2 pi I R^2 / (R^2+z^2)^{3/2} within 0.5%', () => {
    const R = 1.4, I = 2.5;
    const seg = buildPreset('loop', { I, R });
    for (const z of [0, 0.5, 1.0, 2.0]) {
      const bz = biotSavart(seg, [0, 0, z])[2];
      const analytic = 2 * Math.PI * K * I * R * R / Math.pow(R * R + z * z, 1.5);
      expect(Math.abs(bz - analytic) / analytic).toBeLessThan(5e-3);
    }
  });

  it('Helmholtz (separation = R): dBz/dz = 0 and d2Bz/dz2 = 0 at centre', () => {
    const seg = buildPreset('helmholtz', { I: 1, R: 1 });
    const h = 0.01;
    const bz = (z) => biotSavart(seg, [0, 0, z])[2];
    const d1 = (bz(h) - bz(-h)) / (2 * h);
    const d2 = (bz(h) - 2 * bz(0) + bz(-h)) / (h * h);
    expect(Math.abs(d1)).toBeLessThan(1e-3);
    expect(Math.abs(d2)).toBeLessThan(2e-2);
  });

  it('finite solenoid: centre Bz matches the closed form, near zero outside', () => {
    const R = 1, I = 1.5, L = 4 * R;
    const seg = buildPreset('solenoid', { I, R });
    const inside = biotSavart(seg, [0, 0, 0])[2];
    // Finite solenoid on-axis centre: B = mu0 n I (L/2)/sqrt((L/2)^2+R^2),
    // mu0 = 4 pi K. It is a large fraction of the ideal mu0 n I and the
    // formula must hold within a few percent.
    const mu0nI = 4 * Math.PI * K * solenoidN(R) * I;
    const finite = mu0nI * (L / 2) / Math.sqrt((L / 2) ** 2 + R * R);
    expect(Math.abs(inside - finite) / finite).toBeLessThan(0.05);
    expect(inside / mu0nI).toBeGreaterThan(0.8);          // approaches the ideal
    const outside = Math.hypot(...biotSavart(seg, [3 * R, 0, 0]));
    expect(outside).toBeLessThan(0.12 * inside);
  });

  it('div B = 0 (no magnetic monopoles) at off-wire points', () => {
    for (const name of ['loop', 'helmholtz', 'solenoid']) {
      const seg = buildPreset(name, { I: 2, R: 1 });
      for (const P of [[0.4, 0.3, 0.2], [0.7, -0.2, 0.5], [0.2, 0.5, -0.3]]) {
        const dv = divergence(seg, P, 0.02);
        const scale = Math.hypot(...biotSavart(seg, P)) + 1e-6;
        expect(Math.abs(dv) / scale).toBeLessThan(1e-2);
      }
    }
  });
});
