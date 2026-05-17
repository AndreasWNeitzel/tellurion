// Brownian motion: the mean-squared displacement is 4 D t in 2D, the
// motion is isotropic and unbiased, the displacement law is Gaussian,
// and the diffusion coefficient obeys Stokes-Einstein.

import { describe, it, expect } from 'vitest';
import { createEnsemble, step, msd, moments, theoreticalMSD, ksNormal, stokesEinstein, kB } from './sim.js';

function run(N, D, dt, nstep, seed = 0xC0FFEE) {
  const e = createEnsemble(N, seed);
  for (let k = 0; k < nstep; k += 1) step(e, dt, D);
  return e;
}

describe('brownian-motion-diffusion invariants', () => {
  it('mean-squared displacement grows as 4 D t (within 5%)', () => {
    const D = 0.7, dt = 0.01, n = 400;
    const e = run(12000, D, dt, n);
    const ratio = msd(e) / theoreticalMSD(D, e.t);
    expect(Math.abs(ratio - 1)).toBeLessThan(0.05);
  });

  it('diffusion is linear in time: MSD(2t) ~ 2 MSD(t)', () => {
    const D = 0.5, dt = 0.01;
    const e1 = run(12000, D, dt, 200), e2 = run(12000, D, dt, 400);
    expect(Math.abs(msd(e2) / msd(e1) - 2)).toBeLessThan(0.05);
  });

  it('isotropic and unbiased: <x^2> ~ <y^2>, <x> ~ <y> ~ 0', () => {
    const D = 1.0, dt = 0.01, n = 300;
    const e = run(15000, D, dt, n);
    const mo = moments(e);
    expect(Math.abs(mo.x2 / mo.y2 - 1)).toBeLessThan(0.06);
    const sigma = Math.sqrt(2 * D * e.t);
    expect(Math.abs(mo.mx)).toBeLessThan(4 * sigma / Math.sqrt(e.N));
    expect(Math.abs(mo.my)).toBeLessThan(4 * sigma / Math.sqrt(e.N));
  });

  it('displacement distribution is Gaussian (KS vs normal < 0.05)', () => {
    const e = run(8000, 0.8, 0.01, 250);
    expect(ksNormal(Array.from(e.x))).toBeLessThan(0.05);
    expect(ksNormal(Array.from(e.y))).toBeLessThan(0.05);
  });

  it('Stokes-Einstein D = kB T / (6 pi eta r) scales correctly', () => {
    const D0 = stokesEinstein(300, 1e-3, 1e-6);
    expect(stokesEinstein(600, 1e-3, 1e-6) / D0).toBeCloseTo(2, 9);
    expect(stokesEinstein(300, 2e-3, 1e-6) / D0).toBeCloseTo(0.5, 9);
    expect(stokesEinstein(300, 1e-3, 2e-6) / D0).toBeCloseTo(0.5, 9);
    expect(D0).toBeCloseTo(kB * 300 / (6 * Math.PI * 1e-3 * 1e-6), 30);
  });

  it('deterministic in the seed; different seeds still obey 4 D t', () => {
    const a = run(6000, 0.6, 0.01, 200, 123), b = run(6000, 0.6, 0.01, 200, 123);
    expect(msd(a)).toBe(msd(b));
    const c = run(6000, 0.6, 0.01, 200, 999);
    expect(msd(c)).not.toBe(msd(a));
    expect(Math.abs(msd(c) / theoreticalMSD(0.6, c.t) - 1)).toBeLessThan(0.06);
  });
});
