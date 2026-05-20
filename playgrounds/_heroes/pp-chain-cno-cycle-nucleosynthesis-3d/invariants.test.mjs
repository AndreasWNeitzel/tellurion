import { describe, it, expect } from 'vitest';
import { epsilonPP, epsilonCNO, ppFraction, cnoFraction, A_PP, A_CNO, T7_CROSSOVER, Q_HELIUM, PRESETS } from './sim.js';

describe('pp-chain-cno-cycle-nucleosynthesis-3d', () => {
  it('epsilonPP scales as T^4', () => {
    expect(epsilonPP(2) / epsilonPP(1)).toBeCloseTo(16, 9);
  });

  it('epsilonCNO scales as T^17', () => {
    expect(epsilonCNO(2) / epsilonCNO(1)).toBeCloseTo(Math.pow(2, 17), 4);
  });

  it('pp fraction at Sun (T7 = 1.55) is about 99%', () => {
    expect(ppFraction(1.55)).toBeCloseTo(0.99, 2);
  });

  it('CNO fraction at Sun is about 1%', () => {
    expect(cnoFraction(1.55)).toBeCloseTo(0.01, 2);
  });

  it('pp + CNO fractions sum to 1', () => {
    for (const t of [1.0, 1.5, 2.0, 3.0]) {
      expect(ppFraction(t) + cnoFraction(t)).toBeCloseTo(1, 9);
    }
  });

  it('pp fraction strictly decreases with T', () => {
    let prev = 1;
    for (let t = 1.0; t <= 4.0; t += 0.1) {
      const f = ppFraction(t);
      expect(f).toBeLessThanOrEqual(prev + 1e-12);
      prev = f;
    }
  });

  it('CNO dominates above the cross-over', () => {
    expect(cnoFraction(T7_CROSSOVER + 0.2)).toBeGreaterThan(0.5);
  });

  it('pp dominates below the cross-over', () => {
    expect(ppFraction(T7_CROSSOVER - 0.2)).toBeGreaterThan(0.5);
  });

  it('cross-over is in the expected range 1.5 to 2.5 (T^4 vs T^17 power-law model anchored to Sun = 99% pp)', () => {
    expect(T7_CROSSOVER).toBeGreaterThan(1.5);
    expect(T7_CROSSOVER).toBeLessThan(2.5);
  });

  it('at O-star T (3.5), CNO is overwhelmingly dominant (>99%)', () => {
    expect(cnoFraction(3.5)).toBeGreaterThan(0.99);
  });

  it('at M-dwarf T (0.8), pp is essentially 100%', () => {
    expect(ppFraction(0.8)).toBeGreaterThan(0.999);
  });

  it('Q-value per net reaction is 26.73 MeV', () => {
    expect(Q_HELIUM).toBeCloseTo(26.73, 9);
  });

  it('PRESETS lists Sun core T7 ~ 1.55', () => {
    expect(PRESETS.Sun).toBeCloseTo(1.55, 9);
  });
});
