import { describe, it, expect } from 'vitest';
import { kurie, transitionType } from './sim.js';
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
});
