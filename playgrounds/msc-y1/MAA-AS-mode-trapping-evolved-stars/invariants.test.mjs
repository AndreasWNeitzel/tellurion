import { describe, it, expect } from 'vitest';
import { deltaP, modePeriods } from './sim.js';
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
});
