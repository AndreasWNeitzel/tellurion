import { describe, it, expect } from 'vitest';
import { cherenkovAngle, frankTammFactor, wavelets, particleX, waveletRadius, C_LIGHT } from './sim.js';

describe('cherenkov-radiation-cone-3d', () => {
  it('threshold: beta * n = 1 gives null (no cone)', () => {
    expect(cherenkovAngle(1 / 1.33, 1.33)).toBe(null);
  });

  it('below threshold: beta * n < 1 gives null', () => {
    expect(cherenkovAngle(0.5, 1.33)).toBe(null);
  });

  it('water (n=1.33), beta=1: theta_C = acos(1/1.33) ≈ 41 deg', () => {
    const theta = cherenkovAngle(1.0, 1.33);
    expect(theta).not.toBe(null);
    expect(theta * 180 / Math.PI).toBeCloseTo(41.24, 1);
  });

  it('ultra-relativistic in water: theta_C approaches the asymptote arccos(1/n)', () => {
    const thetaUltra = cherenkovAngle(0.999, 1.33);
    const asymptote = Math.acos(1 / 1.33);
    expect(thetaUltra).toBeCloseTo(asymptote, 2);
  });

  it('higher n widens the cone (more refractive = larger angle at the same beta)', () => {
    const theta_water = cherenkovAngle(1.0, 1.33);
    const theta_glass = cherenkovAngle(1.0, 1.7);
    expect(theta_glass).toBeGreaterThan(theta_water);
  });

  it('Frank-Tamm factor is zero at threshold and 1 - 1/(beta n)^2 above', () => {
    expect(frankTammFactor(1 / 1.33, 1.33)).toBeCloseTo(0, 9);
    expect(frankTammFactor(1.0, 1.33)).toBeCloseTo(1 - 1 / (1.33 * 1.33), 9);
  });

  it('Frank-Tamm factor grows monotonically with beta', () => {
    const f1 = frankTammFactor(0.8, 1.33);
    const f2 = frankTammFactor(0.95, 1.33);
    expect(f2).toBeGreaterThan(f1);
  });

  it('particle x position scales as beta * c * t', () => {
    expect(particleX(2.5, 0.8)).toBeCloseTo(0.8 * C_LIGHT * 2.5, 12);
  });

  it('wavelet radius is c/n * (t_obs - t_emit)', () => {
    const r = waveletRadius(3.0, 1.0, 1.33);
    expect(r).toBeCloseTo((C_LIGHT / 1.33) * 2.0, 12);
  });

  it('wavelet radius is 0 if not yet emitted', () => {
    expect(waveletRadius(1.0, 2.0, 1.33)).toBe(0);
  });

  it('wavelets function returns N samples', () => {
    const ws = wavelets(2.0, 0.85, 1.33, 16);
    expect(ws.length).toBe(16);
  });

  it('Cherenkov cone half-angle formula: cos(theta) = 1/(beta * n)', () => {
    // For beta=0.85, n=1.5: cos(theta) = 1/(1.275) = 0.7843
    const theta = cherenkovAngle(0.85, 1.5);
    expect(Math.cos(theta)).toBeCloseTo(1 / (0.85 * 1.5), 12);
  });
});
