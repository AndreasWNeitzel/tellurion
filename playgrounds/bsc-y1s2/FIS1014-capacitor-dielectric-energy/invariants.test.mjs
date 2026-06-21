// Invariants for the dielectric capacitor: the capacitance law, the energy
// behaviour in each mode, the inward force, and the work-energy balance.

import { describe, it, expect } from 'vitest';
import { vacuumC, capacitance, chargeFor, energyConstQ, energyConstV, forceIn, energyDensityVac, energyDensityDiel, createSlab, stepSlab, workIn } from './sim.js';

const C0 = vacuumC();

describe('Capacitance of the partially-filled gap', () => {
  it('C(0) = C0 and C(1) = eps_r C0', () => {
    expect(capacitance(4, 0)).toBeCloseTo(C0, 12);
    expect(capacitance(4, 1)).toBeCloseTo(4 * C0, 12);
  });
  it('C grows linearly with the inserted fraction', () => {
    expect(capacitance(4, 0.5)).toBeCloseTo(C0 * (1 + 3 * 0.5), 12);
  });
});

describe('Energy in each mode', () => {
  it('constant charge: energy decreases as the slab goes in', () => {
    const Q = chargeFor(1, 0, 2);   // Q set at x=0 with V=2
    expect(energyConstQ(Q, 4, 1)).toBeLessThan(energyConstQ(Q, 4, 0));
  });
  it('constant voltage: energy increases as the slab goes in', () => {
    expect(energyConstV(4, 1, 2)).toBeGreaterThan(energyConstV(4, 0, 2));
  });
});

describe('The slab is pulled in', () => {
  it('the force is inward (positive) in both modes', () => {
    const Q = chargeFor(1, 0, 2);
    for (const x of [0, 0.3, 0.7, 1]) {
      expect(forceIn(4, x, 'Q', Q, 2)).toBeGreaterThan(0);
      expect(forceIn(4, x, 'V', Q, 2)).toBeGreaterThan(0);
    }
  });
  it('at constant voltage the force is independent of position', () => {
    const f0 = forceIn(4, 0, 'V', 0, 3), f1 = forceIn(4, 0.8, 'V', 0, 3);
    expect(f1).toBeCloseTo(f0, 12);
  });
  it('the released slab settles fully inserted (x = 1)', () => {
    const s = createSlab(0);
    const p = { epsR: 5, mode: 'V', Q: 0, V: 2, m: 1, gamma: 1.2 };
    for (let i = 0; i < 20000; i += 1) stepSlab(s, 0.002, p);
    expect(s.x).toBeCloseTo(1, 3);
  });
});

describe('Work-energy balance (constant charge)', () => {
  it('the work done by the inward force equals the energy released', () => {
    const Q = chargeFor(1, 0, 3);
    const w = workIn(4, 0, 1, 'Q', Q, 3);
    const dU = energyConstQ(Q, 4, 0) - energyConstQ(Q, 4, 1);
    expect(w).toBeCloseTo(dU, 4);
  });
});

describe('Energy density', () => {
  it('the dielectric stores eps_r times the vacuum energy density at the same field', () => {
    expect(energyDensityDiel(6, 2)).toBeCloseTo(6 * energyDensityVac(2), 12);
  });
});
