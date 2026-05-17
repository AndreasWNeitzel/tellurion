// Ising 2D phase transition, playground-level invariants over the
// sim.js analysis API (the Metropolis engine itself is gate-tested
// in tests/engines/lattice-mc.test.mjs):
//   - Onsager T_c within 0.5 percent and to machine precision;
//   - M -> +-1 as T -> 0, M -> 0 at high T;
//   - the susceptibility chi peaks near T_c (the phase transition);
//   - measured |M| below T_c tracks the Onsager curve;
//   - the magnetization exponent beta = 1/8.

import { describe, it, expect } from 'vitest';
import {
  create, accumulate, magnetizationCurve, onsagerTc, onsagerM,
} from './sim.js';

describe('ising-2d-gpu-phase-transition invariants', () => {
  it('Onsager T_c within 0.5 percent and exact', () => {
    const Tc = onsagerTc(1);
    expect(Math.abs(Tc - 2.269185314213022) / 2.269185314213022).toBeLessThan(5e-3);
    expect(Tc).toBeCloseTo(2.269185314213022, 9);
  });

  it('M -> +-1 as T -> 0', () => {
    const inst = create({ L: 32, T: 1.0, seed: 0xC0FFEE, init: 'up' });
    const d = accumulate(inst, { warm: 500, meas: 300 });
    expect(d.absM).toBeGreaterThan(0.95);
    expect(d.E).toBeLessThan(-1.85);                  // toward -2J
  });

  it('disordered at high T: |M| small', () => {
    const inst = create({ L: 32, T: 6.0, seed: 0xC0FFEE, init: 'random' });
    const d = accumulate(inst, { warm: 400, meas: 400 });
    expect(d.absM).toBeLessThan(0.12);
  });

  it('susceptibility peaks near T_c', () => {
    const Tc = onsagerTc(1);
    const lo = accumulate(create({ L: 32, T: 1.6, seed: 0xC0FFEE, init: 'up' }), { warm: 1200, meas: 800 });
    const cr = accumulate(create({ L: 32, T: Tc, seed: 0xC0FFEE, init: 'up' }), { warm: 1200, meas: 800 });
    const hi = accumulate(create({ L: 32, T: 3.4, seed: 0xC0FFEE, init: 'random' }), { warm: 1200, meas: 800 });
    expect(cr.chi).toBeGreaterThan(lo.chi * 3);
    expect(cr.chi).toBeGreaterThan(hi.chi * 3);
  });

  it('measured |M| below T_c tracks the Onsager curve', () => {
    const [m16, m20] = magnetizationCurve([1.6, 2.0], { L: 40, warm: 1800, meas: 900 });
    expect(Math.abs(m16 - onsagerM(1.6))).toBeLessThan(0.08);
    expect(Math.abs(m20 - onsagerM(2.0))).toBeLessThan(0.10);
  });

  it('magnetization exponent beta = 1/8', () => {
    const Tc = onsagerTc(1);
    const t1 = 1e-3, t2 = 4e-3;
    const b = Math.log(onsagerM(Tc * (1 - t1)) / onsagerM(Tc * (1 - t2))) / Math.log(t1 / t2);
    expect(Math.abs(b - 0.125)).toBeLessThan(5e-3);
  });
});
