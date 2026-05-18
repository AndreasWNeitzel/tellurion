import { describe, it, expect } from 'vitest';
import {
  PI, targetVal, coeffs, partialSum, epicycleChain,
  meanSquare, parsevalEnergy, gibbsOvershoot, gibbsConstant, gibbsAtJump,
} from './sim.js';

describe('fourier-series-convergence-gibb invariants', () => {
  it('the analytic coefficients match the textbook formulas', () => {
    const sq = coeffs('square', 8);
    for (let n = 1; n <= 8; n += 1) {
      expect(sq.b[n]).toBeCloseTo(n % 2 ? 4 / (n * PI) : 0, 12);
      expect(sq.a[n]).toBe(0);
    }
    const sw = coeffs('sawtooth', 6);
    for (let n = 1; n <= 6; n += 1) expect(sw.b[n]).toBeCloseTo(2 * (n % 2 ? 1 : -1) / (n * PI), 12);
    const tr = coeffs('triangle', 6);
    expect(tr.a[1]).toBeCloseTo(8 / (PI * PI), 12);          // positive: sum reproduces the tent
    expect(tr.a[2]).toBe(0);
    // the triangle series must reconstruct the target, not its inverse
    expect(partialSum(tr, 0, 6)).toBeGreaterThan(0.9);       // peak at the centre is +1
    expect(partialSum(tr, PI, 6)).toBeLessThan(-0.8);        // -1 at the ends
  });

  it('the series converges to the function away from the discontinuity', () => {
    const e = (N) => Math.abs(partialSum(coeffs('square', N), PI / 2, N) - 1);
    expect(e(200)).toBeLessThan(e(20));                       // error shrinks with N
    expect(e(400)).toBeLessThan(0.01);
    // sawtooth at an interior smooth point
    expect(Math.abs(partialSum(coeffs('sawtooth', 400), 0.7, 400) - 0.7 / PI)).toBeLessThan(0.02);
  });

  it('at a jump the partial sum equals the average of the two sides', () => {
    for (const N of [11, 99, 555]) {
      expect(Math.abs(partialSum(coeffs('square', N), 0, N))).toBeLessThan(1e-9); // (1 + -1)/2 = 0
    }
  });

  it('Parseval: the coefficient energy converges to the mean square', () => {
    let prev = 0;
    for (const N of [20, 100, 1000]) {
      const E = parsevalEnergy(coeffs('square', N), N);
      expect(E).toBeGreaterThan(prev - 1e-12);               // monotone increasing
      expect(E).toBeLessThan(meanSquare('square') + 1e-9);   // bounded by the total
      prev = E;
    }
    expect(Math.abs(parsevalEnergy(coeffs('square', 4000), 4000) / meanSquare('square') - 1)).toBeLessThan(1e-3);
    expect(Math.abs(parsevalEnergy(coeffs('sawtooth', 4000), 4000) / meanSquare('sawtooth') - 1)).toBeLessThan(1e-2);
  });

  it('the Gibbs overshoot persists at about 8.95 percent of the jump', () => {
    const G = gibbsConstant();
    expect(Math.abs(G - 0.08949)).toBeLessThan(1e-3);        // Wilbraham-Gibbs constant
    const f20 = gibbsOvershoot(20).fraction;
    const f100 = gibbsOvershoot(100).fraction;
    const f1000 = gibbsOvershoot(1000).fraction;
    for (const f of [f20, f100, f1000]) expect(Math.abs(f / G - 1)).toBeLessThan(0.01); // within 1 percent
    // it does NOT decay away with N (persists), only narrows
    expect(f1000).toBeGreaterThan(0.088);
    expect(gibbsOvershoot(1000).peak).toBeGreaterThan(1.17);  // a real overshoot above 1
    // the overshoot is at the actual jump of each target; the
    // continuous triangle has none
    expect(Math.abs(gibbsAtJump('square', 400).frac / G - 1)).toBeLessThan(0.01);
    expect(Math.abs(gibbsAtJump('sawtooth', 400).frac / G - 1)).toBeLessThan(0.03);
    expect(gibbsAtJump('triangle', 400)).toBe(null);
  });

  it('the epicycle reconstruction tip equals the partial sum', () => {
    const c = coeffs('square', 15);
    for (const x of [0.3, 1.1, 2.7, -0.9]) {
      const ch = epicycleChain(c, x, 15);
      expect(ch[ch.length - 1].x).toBeCloseTo(partialSum(c, x, 15), 9);
      expect(ch.length).toBe(2 * 15 + 1);                    // C_0 plus +-k pairs
    }
  });

  it('the targets are the stated piecewise functions', () => {
    expect(targetVal('square', 1)).toBe(1);
    expect(targetVal('square', -1)).toBe(-1);
    expect(targetVal('sawtooth', PI / 2)).toBeCloseTo(0.5, 12);
    expect(targetVal('triangle', 0)).toBeCloseTo(1, 12);
    expect(targetVal('triangle', PI)).toBeCloseTo(-1, 12);
  });

  it('deterministic: identical inputs reproduce the series', () => {
    expect(partialSum(coeffs('square', 50), 1.234, 50)).toBe(partialSum(coeffs('square', 50), 1.234, 50));
    expect(gibbsOvershoot(123).peak).toBe(gibbsOvershoot(123).peak);
    expect(parsevalEnergy(coeffs('triangle', 80), 80)).toBe(parsevalEnergy(coeffs('triangle', 80), 80));
  });
});
