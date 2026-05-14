import { describe, it, expect } from 'vitest';
import { intensity, fringesBetween, visibility, ringPattern } from './sim.js';
describe('michelson-fringe-counter', () => {
  it('I(0) = 2 I0 (bright fringe at zero OPD)', () => {
    expect(Math.abs(intensity(0, 632e-9, 1, 1) - 2)).toBeLessThan(1e-12);
  });
  it('I(lambda/4) = 0 (destructive at quarter wavelength displacement)', () => {
    const lam = 632e-9;
    expect(Math.abs(intensity(lam / 4, lam))).toBeLessThan(1e-9);
  });
  it('moving mirror by lambda/2 produces one full fringe', () => {
    const lam = 500e-9;
    expect(Math.abs(fringesBetween(0, lam / 2, lam) - 1)).toBeLessThan(1e-12);
  });
  it('one micron of displacement at 633 nm gives ~3.16 fringes', () => {
    const n = fringesBetween(0, 1e-6, 633e-9);
    expect(Math.abs(n - 2 / 633e-3)).toBeLessThan(0.01);
  });
  it('visibility V = 1 for equal arms', () => {
    expect(Math.abs(visibility(0.5, 0.5) - 1)).toBeLessThan(1e-12);
  });
  it('visibility V < 1 for unequal arms', () => {
    expect(visibility(0.1, 0.9)).toBeLessThan(1);
  });
  it('ring pattern symmetric in x and y', () => {
    expect(ringPattern(0.1, 0.2, 1e-6, 633e-9)).toBeCloseTo(ringPattern(0.2, 0.1, 1e-6, 633e-9), 10);
  });
});
