import { describe, it, expect } from 'vitest';
import { deltaP, modePeriods, trapping, gModeEnvelope, gModePhase } from './sim.js';
describe('mode-trapping-evolved-stars', () => {
  it('A=0: uniform spacing', () => {
    const ps = modePeriods(10, 80, 0, 300, 1000);
    for (let i = 1; i < ps.length; i += 1) expect(Math.abs(ps[i] - ps[i - 1] - 80)).toBeLessThan(0.01);
  });
  it('A>0: ΔP oscillates', () => {
    expect(Math.abs(deltaP(0, 80, 0.2, 300) - 64)).toBeLessThan(0.01);
    expect(Math.abs(deltaP(150, 80, 0.2, 300) - 96)).toBeLessThan(0.01);
  });
  it('mean ΔP equals Π_1', () => {
    let s = 0;
    for (let i = 0; i < 1000; i += 1) s += deltaP(i, 80, 0.2, 300);
    expect(Math.abs(s / 1000 - 80)).toBeLessThan(1);
  });
  it('trapping is in [0,1] and periodic with P_trap', () => {
    for (let P = 0; P < 2000; P += 37) {
      const t = trapping(P, 350);
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(1);
      expect(Math.abs(trapping(P, 350) - trapping(P + 350, 350))).toBeLessThan(1e-9);
    }
  });
  it('trapping is maximal exactly where ΔP is minimal', () => {
    // ΔP minimal when cos(2πP/P_trap)=+1, i.e. P a multiple of P_trap
    const Pt = 300;
    expect(trapping(Pt, Pt)).toBeGreaterThan(0.999);                 // fully trapped
    expect(deltaP(Pt, 80, 0.2, Pt)).toBeLessThan(deltaP(Pt / 2, 80, 0.2, Pt));
    expect(trapping(Pt / 2, Pt)).toBeLessThan(0.001);                // propagating
  });
  it('gModeEnvelope is non-negative and vanishes at the cavity ends', () => {
    expect(gModeEnvelope(0, 0.25, 0.8, 0.62)).toBe(0);
    expect(gModeEnvelope(0.62, 0.25, 0.8, 0.62)).toBe(0);
    let maxE = 0;
    for (let x = 0.001; x < 0.62; x += 0.005) {
      const e = gModeEnvelope(x, 0.25, 0.8, 0.62);
      expect(e).toBeGreaterThanOrEqual(0);
      if (e > maxE) maxE = e;
    }
    expect(maxE).toBeGreaterThan(0.1);
    expect(Number.isFinite(gModePhase(0.3, 12, 0.25))).toBe(true);
  });
});
