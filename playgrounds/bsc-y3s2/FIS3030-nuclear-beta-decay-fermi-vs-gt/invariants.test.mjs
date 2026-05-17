import { describe, it, expect } from 'vitest';
import { kurie, transitionType, betaSpectrum, fermiFunction } from './sim.js';
describe('nuclear-beta-decay-fermi-vs-gt', () => {
  it('Kurie zero at endpoint', () => {
    expect(kurie(1000, 1000)).toBe(0);
  });
  it('Kurie linear in T = Q - E_e (slope -1)', () => {
    expect(kurie(100, 1000) - kurie(101, 1000)).toBeCloseTo(1, 10);
  });
  it('0+ -> 0+: pure Fermi', () => {
    expect(transitionType(0, 0, 0)).toBe('Fermi (pure)');
  });
  it('1+ -> 0+: pure GT (J=1 to J=0)', () => {
    expect(transitionType(1, 0, 0)).toBe('GT (pure)');
  });
  it('1/2+ -> 1/2+: mixed', () => {
    expect(transitionType(0.5, 0.5, 0)).toBe('Mixed');
  });
  it('Parity change blocks allowed transitions', () => {
    expect(transitionType(0, 0, 1)).toBe('Forbidden');
  });
  it('beta spectrum vanishes at the endpoints E=0 and E=Q', () => {
    expect(betaSpectrum(0, 1000)).toBe(0);
    expect(betaSpectrum(1000, 1000)).toBe(0);
    expect(betaSpectrum(1200, 1000)).toBe(0);
  });
  it('beta spectrum is positive and single-peaked inside (0, Q)', () => {
    let peakE = 0, peakV = -1, prevUp = true, signChanges = 0, prev = 0;
    for (let E = 10; E < 1000; E += 10) {
      const v = betaSpectrum(E, 1000);
      expect(v).toBeGreaterThan(0);
      if (v > peakV) { peakV = v; peakE = E; }
      const up = v >= prev; if (E > 10 && up !== prevUp) signChanges += 1; prevUp = up; prev = v;
    }
    expect(peakE).toBeGreaterThan(0); expect(peakE).toBeLessThan(1000);
    expect(signChanges).toBeLessThanOrEqual(1);
  });
  it('higher Q gives a more energetic, larger-area spectrum', () => {
    const area = (Q) => { let s = 0; for (let E = 5; E < Q; E += 5) s += betaSpectrum(E, Q); return s; };
    expect(area(1500)).toBeGreaterThan(area(800));
  });
  it('Fermi function enhances low-energy electrons (F > 1, decreasing in E)', () => {
    expect(fermiFunction(20, 50)).toBeGreaterThan(1);
    expect(fermiFunction(20, 50)).toBeGreaterThan(fermiFunction(20, 1500));
  });
});
