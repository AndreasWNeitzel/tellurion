// Plane EM wave: transversality, the |E| = c|B| relation, the
// Poynting direction, the linear time-average, and standing-wave nodes.

import { describe, it, expect } from 'vitest';
import { fields, avgPoynting, dot, cross, norm, C } from './sim.js';

describe('poynting-vector-wave-3d invariants', () => {
  it('E and B are perpendicular everywhere (transverse), linear & circular', () => {
    for (const mode of ['linear', 'circular', 'elliptical']) {
      for (let i = 0; i < 12; i += 1) {
        const { E, B } = fields(0.7 * i, 0.31 * i, { mode, k: 1.3, E0: 1.1, pol: 0.6 });
        expect(Math.abs(dot(E, B))).toBeLessThan(1e-12);
      }
    }
  });

  it('|E| = c|B| for the traveling wave within 1e-6', () => {
    for (let i = 0; i < 16; i += 1) {
      const { E, B } = fields(0.5 * i, 0.2 * i, { mode: 'linear', k: 1, E0: 2 });
      if (norm(E) < 1e-9) continue;
      expect(Math.abs(norm(E) - C * norm(B))).toBeLessThan(1e-6);
    }
  });

  it('Poynting vector is parallel to +z for the traveling plane wave', () => {
    for (let i = 1; i < 14; i += 1) {
      const { S } = fields(0.4 * i, 0.17 * i, { mode: 'circular', k: 1.2, E0: 1 });
      const c = cross(S, [0, 0, 1]);
      expect(norm(c)).toBeLessThan(1e-12);
      expect(S[2]).toBeGreaterThanOrEqual(-1e-12);
    }
  });

  it('time-averaged Poynting for linear polarisation is E0^2 / 2c', () => {
    const E0 = 1.7, k = 1, w = C * k;
    let sum = 0; const M = 4000;
    for (let n = 0; n < M; n += 1) { const t = (n / M) * (2 * Math.PI / w); sum += fields(0.0, t, { mode: 'linear', k, E0 }).S[2]; }
    const avg = sum / M;
    expect(Math.abs(avg - avgPoynting(E0)) / avgPoynting(E0)).toBeLessThan(0.01);
  });

  it('circular polarisation has constant |E| = E0 (helix of fixed radius)', () => {
    const E0 = 1.3;
    for (let i = 0; i < 20; i += 1) {
      const { E } = fields(0.6 * i, 0.27 * i, { mode: 'circular', k: 1, E0 });
      expect(Math.abs(norm(E) - E0)).toBeLessThan(1e-9);
    }
  });

  it('standing wave: |E| = 0 at the nodes kz = n pi for all t', () => {
    const k = 1.5;
    for (const n of [1, 2, 3, 4]) {
      const z = n * Math.PI / k;
      for (const t of [0.0, 0.3, 0.9, 1.7, 2.5]) {
        const { E } = fields(z, t, { mode: 'standing', k, E0: 1 });
        expect(norm(E)).toBeLessThan(1e-9);
      }
    }
  });
});
