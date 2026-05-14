import { describe, it, expect } from 'vitest';
import { Pi_l, evolutionStage } from './sim.js';
describe('asymptotic-period-spacing', () => {
  it('Pi_l = Pi_0 / sqrt(l(l+1))', () => {
    expect(Math.abs(Pi_l(100, 1) - 100 / Math.sqrt(2))).toBeLessThan(1e-12);
    expect(Math.abs(Pi_l(100, 2) - 100 / Math.sqrt(6))).toBeLessThan(1e-12);
  });
  it('RGB classifier at Pi_1 ~ 80', () => {
    expect(evolutionStage(80)).toBe('RGB');
  });
  it('RC classifier at Pi_1 ~ 250', () => {
    expect(evolutionStage(250)).toBe('RC');
  });
  it('transition at Pi_1 ~ 140', () => {
    expect(evolutionStage(140)).toBe('transition');
  });
});
