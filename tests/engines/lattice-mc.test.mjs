// tests/engines/lattice-mc.test.mjs
// Reference tests for shared/js/engine/lattice-mc.js (2D Ising).
//
// 1. Onsager exact closed forms: T_c = 2/ln(1+sqrt2); m(T) formula,
//    m -> 1 as T -> 0, m -> 0 at T_c^-, exponent beta = 1/8.
// 2. T -> 0: an ordered start stays saturated, |M| ~ 1, E/spin -> -2J.
// 3. T -> infinity: |M| -> 0, E/spin -> 0.
// 4. Ferromagnetic phase: below T_c the simulated |M| matches the
//    Onsager curve within finite-size and finite-sample tolerance,
//    and is large below / small above T_c.
// 5. Ergodicity: ordered vs random start converge to the same |M|
//    away from criticality.
// 6. Determinism and snapshot/restore round-trip.

import { describe, it, expect } from 'vitest';
import {
  create, step, diagnostics, seed, snapshot, restore,
  onsagerTc, onsagerM, energyPerSpin, magPerSpin,
} from '../../shared/js/engine/lattice-mc.js';

const SEED = 0xC0FFEE;

function thermalAbsM(T, { L = 32, init = 'random', warm = 1200, meas = 800, s = SEED } = {}) {
  const inst = create({ L, T, seed: s, init });
  step(inst, warm);
  let acc = 0;
  for (let k = 0; k < meas; k += 1) { step(inst, 1); acc += Math.abs(magPerSpin(inst)); }
  return acc / meas;
}

describe('lattice-mc: Onsager closed forms', () => {
  it('T_c = 2/ln(1+sqrt2) to 0.5 percent and machine precision', () => {
    expect(Math.abs(onsagerTc(1) - 2.269185314213022) / 2.269185314213022).toBeLessThan(5e-3);
    expect(onsagerTc(1)).toBeCloseTo(2.269185314213022, 9);
    expect(onsagerTc(2)).toBeCloseTo(2 * 2.269185314213022, 9);
  });

  it('m(T) -> 1 cold, 0 at/above T_c, monotone, exponent beta = 1/8', () => {
    const Tc = onsagerTc(1);
    expect(onsagerM(0.2)).toBeGreaterThan(0.999);
    expect(onsagerM(Tc)).toBe(0);                     // by definition T >= Tc
    expect(onsagerM(Tc + 0.1)).toBe(0);
    expect(onsagerM(Tc * 0.9)).toBeGreaterThan(0.4);  // partially ordered
    expect(onsagerM(Tc * 0.9)).toBeLessThan(0.95);
    expect(onsagerM(1.5)).toBeGreaterThan(onsagerM(2.0));   // monotone in T
    // beta = 1/8: m ~ (1 - T/Tc)^{1/8} as T -> Tc^-.
    const t1 = 1e-3, t2 = 4e-3;                       // reduced temperatures
    const b = Math.log(onsagerM(Tc * (1 - t1)) / onsagerM(Tc * (1 - t2))) / Math.log(t1 / t2);
    expect(Math.abs(b - 0.125)).toBeLessThan(5e-3);
  });
});

describe('lattice-mc: limiting temperatures', () => {
  it('cold ordered start stays saturated, E/spin -> -2J', () => {
    const inst = create({ L: 32, T: 0.6, seed: SEED, init: 'up' });
    step(inst, 600);
    const d = diagnostics(inst);
    expect(d.absM).toBeGreaterThan(0.98);
    expect(d.E).toBeLessThan(-1.95);                  // approaches -2J = -2
    expect(d.E).toBeGreaterThanOrEqual(-2.0001);
  });

  it('hot lattice is disordered: |M| -> 0, E/spin -> 0', () => {
    const m = thermalAbsM(100, { L: 32, warm: 400, meas: 400 });
    expect(m).toBeLessThan(0.06);                     // ~ 1/sqrt(N) scale
    const inst = create({ L: 32, T: 100, seed: SEED });
    step(inst, 400);
    expect(Math.abs(energyPerSpin(inst))).toBeLessThan(0.1);
  });
});

describe('lattice-mc: ferromagnetic phase vs Onsager', () => {
  it('|M| is large below T_c and small above', () => {
    const mLo = thermalAbsM(1.8, { L: 32, warm: 1500, meas: 800 });
    const mHi = thermalAbsM(2.8, { L: 32, warm: 1500, meas: 800 });
    expect(mLo).toBeGreaterThan(0.85);
    expect(mHi).toBeLessThan(0.30);
    expect(mLo - mHi).toBeGreaterThan(0.6);
  });

  it('matches the Onsager magnetization curve within tolerance', () => {
    for (const T of [1.6, 2.0]) {
      const m = thermalAbsM(T, { L: 40, warm: 2000, meas: 1000 });
      expect(Math.abs(m - onsagerM(T))).toBeLessThan(0.08);
    }
  });
});

describe('lattice-mc: ergodicity, determinism, snapshot', () => {
  it('ordered and random starts converge away from criticality', () => {
    const a = create({ L: 32, T: 1.8, seed: SEED, init: 'up' });
    const b = create({ L: 32, T: 1.8, seed: 0xBEEF, init: 'random' });
    step(a, 2500); step(b, 2500);
    let ma = 0, mb = 0;
    for (let k = 0; k < 600; k += 1) { step(a, 1); step(b, 1); ma += Math.abs(magPerSpin(a)); mb += Math.abs(magPerSpin(b)); }
    expect(Math.abs(ma / 600 - mb / 600)).toBeLessThan(0.05);
  });

  it('same seed reproduces the exact spin configuration', () => {
    const a = create({ L: 24, T: 2.3, seed: 12345 });
    const b = create({ L: 24, T: 2.3, seed: 12345 });
    step(a, 300); step(b, 300);
    expect(Array.from(a.s)).toEqual(Array.from(b.s));
    const c = create({ L: 24, T: 2.3, seed: 999 });
    step(c, 300);
    expect(Array.from(c.s)).not.toEqual(Array.from(a.s));
  });

  it('snapshot is a faithful structured copy and restore round-trips', () => {
    const inst = create({ L: 20, T: 2.4, seed: SEED });
    step(inst, 150);
    const snap = snapshot(inst);
    const d0 = diagnostics(inst);
    const r = create({ L: 4, T: 1, seed: 1 });            // unrelated instance
    restore(r, snap);
    expect(r.L).toBe(20);
    expect(Array.from(r.s)).toEqual(Array.from(inst.s));
    expect(diagnostics(r).E).toBeCloseTo(d0.E, 12);
    expect(diagnostics(r).M).toBeCloseTo(d0.M, 12);
    // mutating the original must not change the snapshot
    step(inst, 50);
    expect(snap.s).toEqual(Array.from(r.s));
  });
});
