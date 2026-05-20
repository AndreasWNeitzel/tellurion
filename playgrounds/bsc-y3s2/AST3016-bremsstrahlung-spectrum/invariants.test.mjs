import { describe, it, expect } from 'vitest';
import { emissivity, cutoffHz, H, KB, makeRng, step, photonEnergyExp, maxwellVelocity, gauss } from './sim.js';

describe('bremsstrahlung-spectrum', () => {
  it('cutoff at h nu = kT', () => {
    expect(Math.abs(H * cutoffHz(1e7) / (KB * 1e7) - 1)).toBeLessThan(1e-12);
  });

  it('emissivity drops below cutoff exponentially', () => {
    const T = 1e7;
    const nu_c = cutoffHz(T);
    const ratio = emissivity(10 * nu_c, T, 1, 1) / emissivity(nu_c, T, 1, 1);
    expect(ratio).toBeLessThan(0.01);
  });

  it('flat below cutoff', () => {
    const T = 1e7;
    const nu_c = cutoffHz(T);
    expect(Math.abs(emissivity(0.01 * nu_c, T, 1, 1) / emissivity(0.1 * nu_c, T, 1, 1) - 1)).toBeLessThan(0.1);
  });

  it('scales as n_e n_i', () => {
    const T = 1e6, nu = 1e15;
    const a = emissivity(nu, T, 2, 3);
    const b = emissivity(nu, T, 1, 1);
    expect(Math.abs(a / b - 6)).toBeLessThan(1e-9);
  });

  it('emissivity positive at all positive nu', () => {
    for (let i = 1; i < 1e16; i *= 10) expect(emissivity(i, 1e7, 1, 1)).toBeGreaterThan(0);
  });

  it('step integrator moves electron under softened Coulomb force', () => {
    const ions = [{ x: 0, y: 0 }];
    const e = { x: 100, y: 0, vx: 0, vy: 0 };
    const a = step(e, ions, 1e4, 5, 0.01);
    expect(a).toBeGreaterThan(0);
    // The electron should now be moving toward the ion.
    expect(e.vx).toBeLessThan(0);
  });

  it('photonEnergyExp samples are non-negative', () => {
    const rng = makeRng(123);
    for (let i = 0; i < 1000; i += 1) expect(photonEnergyExp(1, rng)).toBeGreaterThanOrEqual(0);
  });

  it('photonEnergyExp mean ~= kT', () => {
    const rng = makeRng(42);
    let s = 0; const N = 20000;
    for (let i = 0; i < N; i += 1) s += photonEnergyExp(2.0, rng);
    expect(Math.abs(s / N - 2.0)).toBeLessThan(0.06);
  });

  it('gauss has approximately unit variance', () => {
    const rng = makeRng(7);
    let s2 = 0; const N = 20000;
    for (let i = 0; i < N; i += 1) { const g = gauss(rng); s2 += g * g; }
    expect(Math.abs(s2 / N - 1)).toBeLessThan(0.05);
  });

  it('maxwellVelocity scales with sigma', () => {
    const rng = makeRng(11);
    let s2 = 0; const N = 4000;
    for (let i = 0; i < N; i += 1) { const [vx, vy] = maxwellVelocity(3, rng); s2 += vx * vx + vy * vy; }
    expect(Math.abs(s2 / (2 * N) - 9)).toBeLessThan(0.6);
  });
});
