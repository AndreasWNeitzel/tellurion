// Van der Waals reduced EOS: the critical point is an inflection of the
// isotherm, the Maxwell construction gives equal areas and equal end
// pressures, the spinodal nests inside the binodal, and the lever rule
// is consistent.

import { describe, it, expect } from 'vitest';
import { pVdW, dpdV, d2pdV2, criticalPoint, maxwell, spinodal, liquidFraction, observedP } from './sim.js';

describe('van-der-waals-maxwell-construction invariants', () => {
  it('critical point: dp/dV = d2p/dV2 = 0 at (V=1, T=1)', () => {
    const { Vc, Tc, pc } = criticalPoint();
    expect(Math.abs(pVdW(Vc, Tc) - pc)).toBeLessThan(1e-12);
    expect(Math.abs(dpdV(Vc, Tc))).toBeLessThan(1e-9);
    expect(Math.abs(d2pdV2(Vc, Tc))).toBeLessThan(1e-9);
  });

  it('Maxwell construction: equal areas and equal end pressures', () => {
    for (const T of [0.85, 0.9, 0.95]) {
      const m = maxwell(T);
      expect(Math.abs(m.area)).toBeLessThan(1e-4);
      expect(Math.abs(pVdW(m.Vl, T) - m.pco)).toBeLessThan(1e-4);
      expect(Math.abs(pVdW(m.Vg, T) - m.pco)).toBeLessThan(1e-4);
      expect(m.Vl).toBeLessThan(1);
      expect(m.Vg).toBeGreaterThan(1);
      expect(m.pco).toBeGreaterThan(0);
      expect(m.pco).toBeLessThan(1);
    }
  });

  it('binodal closes onto the critical point as T -> 1', () => {
    const wide = maxwell(0.85), tight = maxwell(0.999);
    expect(tight.Vg - tight.Vl).toBeLessThan(wide.Vg - wide.Vl);
    expect(tight.Vl).toBeLessThan(1);
    expect(tight.Vg).toBeGreaterThan(1);
    expect(tight.Vg - tight.Vl).toBeGreaterThan(0);
    expect(tight.Vg - tight.Vl).toBeLessThan(0.5);
    expect(maxwell(1.05)).toBe(null);
  });

  it('spinodal nests strictly inside the binodal', () => {
    for (const T of [0.8, 0.9, 0.97]) {
      const m = maxwell(T), s = spinodal(T);
      expect(m.Vl).toBeLessThan(s.Vsl);
      expect(s.Vsl).toBeLessThan(1);
      expect(1).toBeLessThan(s.Vsg);
      expect(s.Vsg).toBeLessThan(m.Vg);
    }
  });

  it('mechanical stability: dp/dV < 0 on the coexisting phases, > 0 between spinodals', () => {
    const T = 0.9, m = maxwell(T), s = spinodal(T);
    expect(dpdV(m.Vl, T)).toBeLessThan(0);                 // compressed liquid stable
    expect(dpdV(m.Vg, T)).toBeLessThan(0);                 // dilute gas stable
    expect(dpdV(0.5 * (s.Vsl + s.Vsg), T)).toBeGreaterThan(0); // unstable core
  });

  it('lever rule: 1 at Vl, 0 at Vg, monotone decreasing, 0.5 at the mid volume', () => {
    const T = 0.88, m = maxwell(T);
    expect(liquidFraction(m.Vl, T)).toBeCloseTo(1, 6);
    expect(liquidFraction(m.Vg, T)).toBeCloseTo(0, 6);
    const Vmid = 0.5 * (m.Vl + m.Vg);
    expect(liquidFraction(Vmid, T)).toBeCloseTo(0.5, 6);
    let prev = 1.0001;
    for (let V = m.Vl; V <= m.Vg; V += (m.Vg - m.Vl) / 50) { const x = liquidFraction(V, T); expect(x).toBeLessThanOrEqual(prev + 1e-9); prev = x; }
  });

  it('observed pressure is flat across coexistence and continuous at the binodal', () => {
    const T = 0.9, m = maxwell(T);
    expect(observedP(0.5 * (m.Vl + m.Vg), T)).toBeCloseTo(m.pco, 9);
    expect(observedP(m.Vg * 3, T)).toBeCloseTo(pVdW(m.Vg * 3, T), 9);
    expect(observedP(m.Vl, T)).toBeCloseTo(pVdW(m.Vl, T), 4);   // continuity at the liquid binodal
    expect(pVdW(m.Vl, T)).toBeCloseTo(m.pco, 4);
  });
});
