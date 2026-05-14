import { describe, it, expect } from 'vitest';
import { potential, field, inducedSigma, totalInducedCharge } from './sim.js';
describe('method-of-images-2d', () => {
  it('potential is zero on the conducting plane', () => {
    expect(potential(0.1, 1e-9, 1, 0, 1)).toBeLessThan(1e-6);
  });
  it('potential below plane is zero', () => {
    expect(potential(0.5, -0.5, 1, 0, 1)).toBe(0);
  });
  it('field tangent vanishes on the plane: E_x at y=eps is small', () => {
    const e = field(0.5, 1e-8, 1, 0, 1);
    expect(Math.abs(e.ex)).toBeLessThan(1e-3);
  });
  it('total induced charge equals -q', () => {
    expect(Math.abs(totalInducedCharge(1, 1) + 1)).toBeLessThan(0.05);
  });
  it('induced sigma at x=0 has expected sign', () => {
    expect(inducedSigma(0, 1, 1)).toBeLessThan(0);
  });
  it('induced sigma decays as |x|^{-3} at large |x|', () => {
    const s1 = Math.abs(inducedSigma(10, 1, 0.1));
    const s2 = Math.abs(inducedSigma(20, 1, 0.1));
    expect(Math.abs(s1 / s2 - 8)).toBeLessThan(0.05);
  });
});
