// Invariants for the Millikan oil drop: charge quantization, the balancing condition,
// the inverse relation between balance voltage and charge number, the velocity sign, the
// recovery of the radius from the field-off fall, and the charge inferred from balance.

import { describe, it, expect } from 'vitest';
import { E_CHARGE, charge, balanceVoltage, terminalVelocity, radiusFromFall, chargeFromBalance, dropWeight } from './sim.js';

describe('Charge quantization', () => {
  it('the charge is an exact integer multiple of e', () => {
    for (const n of [1, 2, 3, 5, 8]) expect(charge(n) / E_CHARGE).toBeCloseTo(n, 9);
  });
});

describe('Balancing', () => {
  it('the drop floats (zero terminal velocity) at the balancing voltage', () => {
    for (const [r, n] of [[1e-6, 3], [0.8e-6, 1], [1.3e-6, 6]]) { const V = balanceVoltage(r, n); expect(terminalVelocity(r, n, V)).toBeCloseTo(0, 9); }
  });
  it('the charge inferred from the balancing voltage equals n e', () => {
    for (const [r, n] of [[1e-6, 3], [1.1e-6, 4]]) { const V = balanceVoltage(r, n); expect(chargeFromBalance(r, V)).toBeCloseTo(charge(n), 24); }
  });
  it('balance voltage scales inversely with charge number', () => {
    const r = 1e-6; expect(balanceVoltage(r, 2)).toBeCloseTo(balanceVoltage(r, 1) / 2, 9);
    expect(balanceVoltage(r, 4) * 4).toBeCloseTo(balanceVoltage(r, 1), 9);
  });
});

describe('Velocity direction', () => {
  it('rises above the balancing voltage and falls below it', () => {
    const r = 1e-6, n = 3, Vb = balanceVoltage(r, n);
    expect(terminalVelocity(r, n, Vb + 50)).toBeGreaterThan(0);
    expect(terminalVelocity(r, n, Vb - 50)).toBeLessThan(0);
  });
});

describe('Field-off radius measurement', () => {
  it('the fall speed at V=0 recovers the drop radius', () => {
    for (const r of [0.7e-6, 1e-6, 1.3e-6]) { const vFall = terminalVelocity(r, 3, 0); expect(radiusFromFall(vFall)).toBeCloseTo(r, 9); }
  });
  it('the field-off velocity is downward', () => {
    expect(terminalVelocity(1e-6, 3, 0)).toBeLessThan(0);
  });
});
