import { describe, it, expect } from 'vitest';
import {
  cellCurrent, shortCircuitCurrent, openCircuitVoltage, power,
  maxPowerPoint, fillFactor, fillFactorGreen, sqLimit, sqCurve, ivCurve, VT,
} from './sim.js';

const P = { iL: 400, i0: 1e-9, n: 1 };

describe('solar-cell-generation-iv invariants', () => {
  it('at V = 0 the current is the short-circuit current (I_L)', () => {
    expect(shortCircuitCurrent(P)).toBeCloseTo(P.iL, 9);
    expect(cellCurrent(0, P)).toBeCloseTo(P.iL, 9);
  });

  it('at I = 0 the voltage is V_oc = n V_T ln(I_L/I_0 + 1)', () => {
    const voc = openCircuitVoltage(P);
    expect(voc).toBeCloseTo(P.n * VT * Math.log(P.iL / P.i0 + 1), 12);
    expect(Math.abs(cellCurrent(voc, P)) / P.iL).toBeLessThan(1e-9);    // current vanishes
  });

  it('the open-circuit voltage is below the bandgap voltage E_g/q (thermodynamic bound)', () => {
    for (const Eg of [0.5, 1.0, 1.34, 2.0, 3.0]) {
      const { Voc } = sqLimit(Eg, { Pin: 1000 });
      expect(Voc).toBeLessThan(Eg);                                     // V_oc < E_g/q (V vs eV)
      expect(Voc).toBeGreaterThan(0);
    }
  });

  it('the P-V curve has a single interior maximum and a fill factor in (0,1) matching Green', () => {
    const { Vmp, Pmp } = maxPowerPoint(P);
    const voc = openCircuitVoltage(P);
    expect(Vmp).toBeGreaterThan(0);
    expect(Vmp).toBeLessThan(voc);                                      // interior
    expect(power(Vmp, P)).toBeGreaterThan(power(0.5 * Vmp, P));
    expect(power(Vmp, P)).toBeGreaterThan(power(0.5 * (Vmp + voc), P));  // a maximum
    const ff = fillFactor(P);
    expect(ff).toBeGreaterThan(0);
    expect(ff).toBeLessThan(1);
    expect(ff).toBeCloseTo(Pmp / (voc * shortCircuitCurrent(P)), 12);
    expect(ff / fillFactorGreen(P)).toBeCloseTo(1, 2);                  // within ~1% of Green
  });

  it('the Shockley-Queisser efficiency has a single peak near 1.1-1.4 eV around 30%', () => {
    const { Eg, eta } = sqCurve(80, 0.4, 3.2, { Pin: 1000 });
    let bi = 0; for (let i = 0; i < eta.length; i += 1) if (eta[i] > eta[bi]) bi = i;
    expect(eta[bi]).toBeGreaterThan(0.27);
    expect(eta[bi]).toBeLessThan(0.40);
    expect(Eg[bi]).toBeGreaterThan(1.0);
    expect(Eg[bi]).toBeLessThan(1.5);
    // interior maximum: efficiency collapses at both ends
    expect(sqLimit(0.45, { Pin: 1000 }).eta).toBeLessThan(eta[bi]);
    expect(sqLimit(3.0, { Pin: 1000 }).eta).toBeLessThan(eta[bi]);
    expect(sqLimit(1.3, { Pin: 1000 }).eta).toBeGreaterThan(sqLimit(0.7, { Pin: 1000 }).eta);
    expect(sqLimit(1.3, { Pin: 1000 }).eta).toBeGreaterThan(sqLimit(2.4, { Pin: 1000 }).eta);
  });

  it('stronger illumination raises I_sc linearly and V_oc logarithmically', () => {
    const a = { iL: 200, i0: 1e-9, n: 1 }, b = { iL: 400, i0: 1e-9, n: 1 };
    expect(shortCircuitCurrent(b) / shortCircuitCurrent(a)).toBeCloseTo(2, 9);   // linear
    expect(openCircuitVoltage(b) - openCircuitVoltage(a)).toBeCloseTo(VT * Math.log(2), 6); // log
    expect(fillFactor(b)).toBeGreaterThan(fillFactor(a));               // brighter -> higher FF
  });

  it('deterministic: identical inputs reproduce the curves bit-for-bit', () => {
    const a = ivCurve(300, P), b = ivCurve(300, P);
    for (let i = 0; i <= 300; i += 1) { expect(a.I[i]).toBe(b.I[i]); expect(a.P[i]).toBe(b.P[i]); }
    expect(sqLimit(1.34, { Pin: 1000 }).eta).toBe(sqLimit(1.34, { Pin: 1000 }).eta);
  });
});
