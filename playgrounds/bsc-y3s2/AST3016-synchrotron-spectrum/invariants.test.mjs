import { describe, it, expect } from 'vitest';
import { nu_c, singleSpec, powerLawSpec, spectralIndex } from './sim.js';
describe('synchrotron-spectrum', () => {
  it('1 GeV electron in 100 microGauss field has nu_c in radio', () => {
    const gamma = 2000, B = 1e-8;
    const v = nu_c(gamma, B);
    expect(v).toBeGreaterThan(1e6);
    expect(v).toBeLessThan(2e9);
  });
  it('nu_c scales as gamma^2', () => {
    expect(Math.abs(nu_c(100, 1) / nu_c(50, 1) - 4)).toBeLessThan(1e-9);
  });
  it('nu_c scales as B', () => {
    expect(Math.abs(nu_c(100, 2) / nu_c(100, 1) - 2)).toBeLessThan(1e-9);
  });
  it('F(x) peaks near x = 0.29 (single-electron)', () => {
    const at_peak = singleSpec(0.29);
    expect(singleSpec(0.5)).toBeLessThan(at_peak * 1.05);
    expect(singleSpec(0.1)).toBeLessThan(at_peak * 1.05);
  });
  it('spectral index (p-1)/2 = 0.7 for p=2.4', () => {
    expect(Math.abs(spectralIndex(2.4) - 0.7)).toBeLessThan(1e-9);
  });
});
