// D2Q9 lattice-Boltzmann invariants, tested directly on sim.js (the same
// solver the playground renders). These check the equilibrium moments,
// the rest fixed point, determinism, the viscosity law and the formation
// of a low-speed wake behind an obstacle. None are tautologies.

import { describe, it, expect } from 'vitest';
import {
  createLBM, advance, macro, feq, fluidMass,
  addCircle, viscosity, reynolds, W, CX,
} from './sim.js';

describe('D2Q9 equilibrium moments', () => {
  it('sum_k feq = rho and sum_k c_k feq = rho u (exact)', () => {
    for (const [rho, ux, uy] of [[1, 0, 0], [1.2, 0.08, -0.03], [0.7, -0.05, 0.06]]) {
      let m = 0, px = 0, py = 0;
      for (let k = 0; k < 9; k += 1) {
        const fk = feq(k, rho, ux, uy);
        m += fk; px += CX[k] * fk; py += [0, 0, 1, 0, -1, 1, 1, -1, -1][k] * fk;
      }
      expect(m).toBeCloseTo(rho, 12);
      expect(px).toBeCloseTo(rho * ux, 12);
      expect(py).toBeCloseTo(rho * uy, 12);
    }
  });

  it('weights sum to one', () => {
    expect(W.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });
});

describe('D2Q9 dynamics', () => {
  it('uniform fluid at rest is a fixed point (uIn = 0, no obstacle)', () => {
    const s = createLBM(40, 24, { tau: 0.6, uIn: 0 });
    advance(s, 60);
    for (let i = 0; i < s.NX * s.NY; i += 1) {
      const { rho, ux, uy } = macro(s, i);
      expect(rho).toBeCloseTo(1, 9);
      expect(Math.hypot(ux, uy)).toBeLessThan(1e-9);
    }
  });

  it('is deterministic: identical inputs reproduce f bit-for-bit', () => {
    const a = createLBM(48, 32, { tau: 0.62, uIn: 0.1 });
    const b = createLBM(48, 32, { tau: 0.62, uIn: 0.1 });
    addCircle(a, 12, 16, 4); addCircle(b, 12, 16, 4);
    advance(a, 120); advance(b, 120);
    for (let i = 0; i < a.f.length; i += 1) expect(a.f[i]).toBe(b.f[i]);
  });

  it('fluid mass stays finite and bounded over a long run', () => {
    const s = createLBM(96, 48, { tau: 0.6, uIn: 0.1 });
    addCircle(s, 24, 24, 5);
    const m0 = fluidMass(s);
    advance(s, 800);
    const m1 = fluidMass(s);
    expect(Number.isFinite(m1)).toBe(true);
    expect(m1).toBeGreaterThan(0.5 * m0);
    expect(m1).toBeLessThan(2.0 * m0);
  });

  it('an obstacle leaves a momentum deficit: wake centreline slower than the bypass flow beside it', () => {
    const NX = 192, NY = 96, ox = NX / 4, oy = NY / 2, r = 6;
    const s = createLBM(NX, NY, { tau: 0.6, uIn: 0.10 });
    addCircle(s, ox, oy, r);
    advance(s, 900);
    const meanSpeed = (x0, x1, y0, y1) => {
      let sum = 0, n = 0;
      for (let x = x0; x < x1; x += 1) {
        for (let y = y0; y <= y1; y += 1) {
          const { ux, uy } = macro(s, y * NX + x);
          sum += Math.hypot(ux, uy); n += 1;
        }
      }
      return sum / n;
    };
    // Same downstream x window: centreline wake vs the accelerated bypass
    // flow alongside it (well clear of the wall boundary layer at y = 95).
    const wake = meanSpeed(ox + r + 2, ox + r + 18, oy - 3, oy + 3);
    const side = meanSpeed(ox + r + 2, ox + r + 18, oy + 3 * r, oy + 3 * r + 6);
    expect(side).toBeGreaterThan(0.02);   // flow develops around the body
    expect(wake).toBeLessThan(side);      // momentum deficit in the lee
  });
});

describe('D2Q9 transport coefficients', () => {
  it('kinematic viscosity nu = (tau - 1/2) / 3 and Re = u D / nu', () => {
    expect(viscosity(0.6)).toBeCloseTo(0.1 / 3, 12);
    expect(viscosity(0.5)).toBeCloseTo(0, 12);
    expect(reynolds(0.10, 12, 0.6)).toBeCloseTo(0.10 * 12 / ((0.6 - 0.5) / 3), 9);
  });
});
