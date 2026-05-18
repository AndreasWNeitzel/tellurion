// Slow-roll inflation invariants. Tests the real physics in sim.js
// (previously this file was a skeleton mock that asserted a fake energy
// drift and never touched the inflation code, which let a wrong
// Starobinsky V'' ship). The derivative-consistency test below would
// have caught that bug.

import { describe, it, expect } from 'vitest';
import { V, Vp, Vpp, epsilon, eta } from './sim.js';

const MODELS = ['phi2', 'phi4', 'starobinsky'];
const K = Math.sqrt(2 / 3);

describe('slow-roll-inflation physics', () => {
  it('Vp is the phi-derivative of V (central difference, all models)', () => {
    const h = 1e-5;
    for (const m of MODELS) {
      for (const phi of [2, 3.5, 5, 8]) {
        const num = (V(phi + h, m) - V(phi - h, m)) / (2 * h);
        expect(Vp(phi, m)).toBeCloseTo(num, 4);
      }
    }
  });

  it('Vpp is the phi-derivative of Vp (central difference, all models)', () => {
    const h = 1e-5;
    for (const m of MODELS) {
      for (const phi of [2, 3.5, 5, 8]) {
        const num = (Vp(phi + h, m) - Vp(phi - h, m)) / (2 * h);
        expect(Vpp(phi, m)).toBeCloseTo(num, 3);
      }
    }
  });

  it('Starobinsky V and derivatives match the closed form', () => {
    for (const phi of [3, 5, 8]) {
      const e = Math.exp(-K * phi);
      expect(V(phi, 'starobinsky')).toBeCloseTo((1 - e) ** 2, 12);
      expect(Vp(phi, 'starobinsky')).toBeCloseTo(2 * K * e * (1 - e), 12);
      expect(Vpp(phi, 'starobinsky')).toBeCloseTo((4 / 3) * (2 * e * e - e), 12);
    }
  });

  it('phi^2 exact slow-roll at phi=8: epsilon=1/32, eta=1/32', () => {
    expect(epsilon(8, 'phi2')).toBeCloseTo(1 / 32, 12);
    expect(eta(8, 'phi2')).toBeCloseTo(1 / 32, 12);
  });

  it('phi^4 exact slow-roll at phi=8: epsilon=1/8, eta=3/16', () => {
    expect(epsilon(8, 'phi4')).toBeCloseTo(0.125, 12);
    expect(eta(8, 'phi4')).toBeCloseTo(0.1875, 12);
  });

  it('inflation ends at epsilon=1 (phi^2: epsilon=2/phi^2)', () => {
    expect(epsilon(Math.SQRT2, 'phi2')).toBeCloseTo(1, 9);
    expect(epsilon(8, 'phi2')).toBeLessThan(1);
  });

  it('Starobinsky slow-rolls (epsilon << 1) on the plateau', () => {
    expect(epsilon(6, 'starobinsky')).toBeLessThan(0.01);
  });
});
