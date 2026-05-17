// Abrupt p-n junction: the ideal-diode law (I=0 at V=0, ~55 I0 at
// 4kT/q), the built-in potential, depletion width W ~ sqrt(V_bi-V)
// with bias narrowing/widening, charge neutrality, the triangular
// field and its potential drop, band continuity, and the C-V
// (Mott-Schottky) linearity.

import { describe, it, expect } from 'vitest';
import {
  Q, KB, thermalVoltage, builtInPotential, depletionWidth,
  depletionEdges, peakField, potentialDrop, depletionCharge,
  diodeCurrentOverI0, junctionCapacitance, invCsq, chargeDensity,
  bands, EPS_SI,
} from './sim.js';

const close = (a, b, t) => expect(Math.abs(a - b)).toBeLessThan(t);
const rel = (a, b, t) => expect(Math.abs(a - b) / Math.abs(b)).toBeLessThan(t);
const NA = 1e22, ND = 1e21;          // m^-3 (1e16, 1e15 cm^-3)

describe('semiconductor-pn-junction invariants', () => {
  it('ideal diode: I=0 at V=0, ~55 I0 at 4kT/q, -I0 in reverse', () => {
    close(diodeCurrentOverI0(0), 0, 1e-15);
    const i4 = diodeCurrentOverI0(4 * thermalVoltage());
    rel(i4, Math.exp(4) - 1, 1e-9);
    expect(i4).toBeGreaterThan(50); expect(i4).toBeLessThan(56);   // ~ 53.6
    close(diodeCurrentOverI0(-10 * thermalVoltage()), -1, 1e-3);   // reverse saturation
  });

  it('built-in potential is positive and grows with doping', () => {
    const Vbi = builtInPotential(NA, ND);
    expect(Vbi).toBeGreaterThan(0);
    rel(Vbi, thermalVoltage() * Math.log(NA * ND / (1e16 * 1e16)), 1e-12);
    expect(builtInPotential(10 * NA, ND)).toBeGreaterThan(Vbi);
    close(thermalVoltage(300), KB * 300 / Q, 1e-20);
  });

  it('W ~ sqrt(V_bi - V): reverse widens, forward narrows, ->0 at V_bi', () => {
    const Vbi = builtInPotential(NA, ND);
    const W0 = depletionWidth(NA, ND, 0);
    expect(depletionWidth(NA, ND, -5)).toBeGreaterThan(W0);        // reverse
    expect(depletionWidth(NA, ND, 0.3)).toBeLessThan(W0);          // forward
    // sqrt scaling: W(V1)/W(V2) = sqrt((Vbi-V1)/(Vbi-V2))
    const r = depletionWidth(NA, ND, -3) / depletionWidth(NA, ND, -1);
    rel(r, Math.sqrt((Vbi + 3) / (Vbi + 1)), 1e-9);
    close(depletionWidth(NA, ND, Vbi), 0, 1e-12);
  });

  it('depletion charge neutrality: NA x_p = ND x_n, net charge zero', () => {
    for (const V of [-4, -1, 0, 0.3]) {
      const { xp, xn } = depletionEdges(NA, ND, V);
      rel(NA * xp, ND * xn, 1e-10);
      const { Qn, Qp } = depletionCharge(NA, ND, V);
      rel(Qn, Qp, 1e-10);                                          // equal and opposite magnitude
    }
  });

  it('triangular field: E_max consistent both sides, drop = area = V_bi - V', () => {
    const Vbi = builtInPotential(NA, ND);
    for (const V of [-5, 0, 0.4]) {
      const { xn, xp, W } = depletionEdges(NA, ND, V);
      const EmaxN = Q * ND * xn / EPS_SI, EmaxP = Q * NA * xp / EPS_SI;
      rel(EmaxN, EmaxP, 1e-9);
      rel(peakField(NA, ND, V), EmaxN, 1e-9);
      rel(potentialDrop(NA, ND, V), Vbi - V, 1e-6);                // 1/2 Emax W
      rel(0.5 * peakField(NA, ND, V) * W, Vbi - V, 1e-6);
    }
  });

  it('charge-density profile: signs and zero net integral', () => {
    const V = -2, { xp, xn } = depletionEdges(NA, ND, V);
    expect(chargeDensity(-xp / 2, NA, ND, V)).toBeLessThan(0);     // p-side acceptors
    expect(chargeDensity(xn / 2, NA, ND, V)).toBeGreaterThan(0);   // n-side donors
    expect(chargeDensity(-xp - 1e-9, NA, ND, V)).toBe(0);          // neutral p
    expect(chargeDensity(xn + 1e-9, NA, ND, V)).toBe(0);           // neutral n
    const net = (-Q * NA) * xp + (Q * ND) * xn;                    // integral of rho
    close(net, 0, Math.abs(Q * ND * xn) * 1e-10);
  });

  it('bands: gap constant, total bending q(V_bi - V), flat in neutral', () => {
    const Vbi = builtInPotential(NA, ND), V = -1, Eg = 1.12;
    const { xp, xn } = depletionEdges(NA, ND, V);
    for (const x of [-xp - 5e-7, -xp / 2, xn / 2, xn + 5e-7]) {
      const bb = bands(x, NA, ND, V, Eg);
      close(bb.Ec - bb.Ev, Eg, 1e-12);                             // gap fixed
    }
    const deep = bands(xn + 1e-6, NA, ND, V, Eg).phi - bands(-xp - 1e-6, NA, ND, V, Eg).phi;
    rel(deep, Vbi - V, 1e-9);                                      // total bending
    close(bands(-xp - 1e-6, NA, ND, V, Eg).phi, 0, 1e-12);         // flat p
    rel(bands(xn + 1e-6, NA, ND, V, Eg).phi, Vbi - V, 1e-9);       // flat n
  });

  it('Mott-Schottky: 1/C^2 is linear in V with the right slope', () => {
    const Vbi = builtInPotential(NA, ND);
    // 1/C^2 = (2/(q eps)) (1/NA + 1/ND) (Vbi - V) -> linear, slope
    // negative in V; two points give the line.
    const a = invCsq(NA, ND, -4), b = invCsq(NA, ND, -1);
    const slope = (a - b) / (-4 - (-1));
    const want = -(2 / (Q * EPS_SI)) * (1 / NA + 1 / ND);
    rel(slope, want, 1e-6);
    // extrapolate 1/C^2 -> 0 at V = Vbi
    close(invCsq(NA, ND, Vbi), 0, Math.abs(a) * 1e-6);
    expect(junctionCapacitance(NA, ND, -5)).toBeLessThan(junctionCapacitance(NA, ND, 0));
  });

  it('reverse bias widens W and lowers C (depletion capacitor)', () => {
    expect(depletionWidth(NA, ND, -8)).toBeGreaterThan(depletionWidth(NA, ND, -2));
    expect(junctionCapacitance(NA, ND, -8)).toBeLessThan(junctionCapacitance(NA, ND, -2));
    rel(junctionCapacitance(NA, ND, 0), EPS_SI / depletionWidth(NA, ND, 0), 1e-12);
  });
});
