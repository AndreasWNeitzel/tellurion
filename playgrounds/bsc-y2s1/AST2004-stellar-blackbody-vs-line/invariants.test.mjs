import { describe, it, expect } from 'vitest';
import { planckLambda, wienPeakNm, spectrum, LINES } from './sim.js';
describe('stellar-blackbody-vs-line', () => {
  it('Wien peak at 5800 K is ~500 nm', () => {
    expect(Math.abs(wienPeakNm(5800) - 499.6)).toBeLessThan(2);
  });
  it('hotter star peaks at shorter wavelength', () => {
    expect(wienPeakNm(10000)).toBeLessThan(wienPeakNm(5000));
  });
  it('planck never negative', () => {
    for (let lam = 100; lam < 2000; lam += 50) expect(planckLambda(lam * 1e-9, 5800)).toBeGreaterThan(0);
  });
  it('absorption line dips below continuum', () => {
    const T = 5800;
    const lam_line = 656.3;
    const continuum = planckLambda(lam_line * 1e-9, T);
    expect(spectrum(lam_line, T, 1)).toBeLessThan(continuum);
  });
  it('far from any line: spectrum ~ continuum', () => {
    const T = 5800;
    const f = spectrum(700, T, 1);
    const c = planckLambda(700e-9, T);
    expect(Math.abs(f - c) / c).toBeLessThan(0.05);
  });
});
