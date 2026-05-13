// Hydrogen orbital invariant tests.
// (a) Radial normalization: integral_0^inf R_nl(r)^2 r^2 dr = 1.
// (b) Real spherical harmonics: <Y_lm | Y_lm> = 1 over sphere (numerical).
// (c) Number of radial nodes = n - l - 1.
// (d) 1s ground state at r = 0: |psi_100|^2 = 1 / pi.

import { describe, it, expect } from 'vitest';
import { R_nl, realY, psi } from './sim.js';

describe('Hydrogen: radial normalization', () => {
  it('integral R_nl(r)^2 r^2 dr = 1 within 1 percent for several (n, l)', () => {
    const NG = 6000;
    const rMax = 120;
    const dr = rMax / NG;
    for (const [n, l] of [[1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [3, 2]]) {
      let s = 0;
      for (let i = 0; i < NG; i += 1) {
        const r = (i + 0.5) * dr;
        const R = R_nl(n, l, r);
        s += R * R * r * r * dr;
      }
      expect(Math.abs(s - 1)).toBeLessThan(0.01);
    }
  });
});

describe('Hydrogen: 1s ground state at origin', () => {
  it('|psi_100(0, theta, phi)|^2 = 1 / pi', () => {
    const v = psi(1, 0, 0, 0, 0, 0);
    expect(v * v).toBeCloseTo(1 / Math.PI, 6);
  });
});

describe('Hydrogen: radial node count = n - l - 1', () => {
  // R_nl has exactly n - l - 1 nodes in r > 0.
  for (const [n, l, expectedNodes] of [[1, 0, 0], [2, 0, 1], [2, 1, 0], [3, 0, 2], [3, 1, 1], [3, 2, 0]]) {
    it(`R_${n}${l} has ${expectedNodes} radial nodes`, () => {
      const NG = 2000;
      const rMax = 80;
      let nodes = 0;
      let prev = R_nl(n, l, 0.001);
      for (let i = 1; i < NG; i += 1) {
        const r = 0.001 + (rMax - 0.001) * (i / (NG - 1));
        const cur = R_nl(n, l, r);
        if (prev * cur < 0) nodes += 1;
        prev = cur;
      }
      expect(nodes).toBe(expectedNodes);
    });
  }
});

describe('Hydrogen: spherical harmonic normalization', () => {
  it('integral |Y_lm|^2 sin theta dtheta dphi = 1', () => {
    const Nth = 80, Nph = 80;
    for (const [l, m] of [[0, 0], [1, 0], [1, 1], [2, 0], [2, 1], [2, 2]]) {
      let s = 0;
      for (let i = 0; i < Nth; i += 1) {
        const theta = (i + 0.5) * Math.PI / Nth;
        const dth = Math.PI / Nth;
        for (let j = 0; j < Nph; j += 1) {
          const phi = j * 2 * Math.PI / Nph;
          const dph = 2 * Math.PI / Nph;
          const y = realY(l, m, theta, phi);
          s += y * y * Math.sin(theta) * dth * dph;
        }
      }
      expect(Math.abs(s - 1)).toBeLessThan(0.02);
    }
  });
});

describe('Hydrogen: 2p_z has dumbbell along z (m = 0)', () => {
  it('|psi_210(x, 0, 0)|^2 < |psi_210(0, 0, z)|^2 for similar r', () => {
    // 2p_z is concentrated along z; at the same radius, |psi|^2 along z > |psi|^2 along x.
    const r0 = 4;
    const onZ = psi(2, 1, 0, r0, 0, 0);    // theta = 0 -> +z axis
    const onX = psi(2, 1, 0, r0, Math.PI / 2, 0);  // theta = pi/2 -> equator
    expect(onZ * onZ).toBeGreaterThan(onX * onX);
  });
});
