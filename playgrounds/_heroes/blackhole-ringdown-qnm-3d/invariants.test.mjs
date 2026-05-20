import { describe, it, expect } from 'vitest';
import { qnmFrequency, ringdownProperties, strain, qualityFactor, schwarzschildRadius_km } from './sim.js';

describe('blackhole-ringdown-qnm-3d', () => {
  it('Schwarzschild (chi = 0) gives M omega = 0.374 - 0.089 i', () => {
    const { omegaR_M, omegaI_M } = qnmFrequency(0);
    expect(omegaR_M).toBeCloseTo(0.3737, 3);
    expect(omegaI_M).toBeCloseTo(-0.0890, 3);
  });

  it('omega_R increases monotonically with spin', () => {
    let prev = 0;
    for (let chi = 0; chi <= 0.95; chi += 0.05) {
      const { omegaR_M } = qnmFrequency(chi);
      expect(omegaR_M).toBeGreaterThan(prev - 1e-9);
      prev = omegaR_M;
    }
  });

  it('omega_I -> 0 as chi -> 1 (rings forever near extremality)', () => {
    const { omegaI_M: i0 } = qnmFrequency(0);
    const { omegaI_M: i99 } = qnmFrequency(0.99);
    expect(Math.abs(i99)).toBeLessThan(Math.abs(i0));
  });

  it('GW150914 ringdown parameters give f ~ 250 Hz, tau ~ 4 ms', () => {
    const { f_Hz, tau_ms } = ringdownProperties(62, 0.69);
    expect(f_Hz).toBeGreaterThan(220);
    expect(f_Hz).toBeLessThan(290);
    expect(tau_ms).toBeGreaterThan(3.5);
    expect(tau_ms).toBeLessThan(5.0);
  });

  it('Q factor grows from ~ 2 at chi = 0 to large at chi -> 1', () => {
    const q0 = qualityFactor(0);
    const q90 = qualityFactor(0.90);
    expect(q0).toBeGreaterThan(1.5);
    expect(q0).toBeLessThan(3.0);
    expect(q90).toBeGreaterThan(q0);
  });

  it('Schwarzschild radius is 2.953 M_solar km', () => {
    expect(schwarzschildRadius_km(1)).toBeCloseTo(2.953, 3);
    expect(schwarzschildRadius_km(62)).toBeCloseTo(2.953 * 62, 3);
  });

  it('strain at t = 0 equals 1 (full amplitude)', () => {
    expect(strain(0, 62, 0.69)).toBeCloseTo(1, 9);
  });

  it('strain decays as exp(-t/tau) (envelope)', () => {
    const props = ringdownProperties(62, 0.69);
    // After 2 tau, |h(t)| <= exp(-2) ~ 0.135.
    // Sample at many phases to find the envelope.
    let env = 0;
    for (let dt = -1; dt <= 1; dt += 0.05) {
      const t = 2 * props.tau_ms + dt;
      const h = Math.abs(strain(t, 62, 0.69));
      if (h > env) env = h;
    }
    expect(env).toBeLessThan(Math.exp(-2) + 0.02);
  });

  it('frequency scales as 1/M (lighter BH -> higher f)', () => {
    const f30 = ringdownProperties(30, 0.69).f_Hz;
    const f60 = ringdownProperties(60, 0.69).f_Hz;
    expect(f30 / f60).toBeCloseTo(2, 1);
  });

  it('damping time scales as M', () => {
    const t30 = ringdownProperties(30, 0.69).tau_ms;
    const t60 = ringdownProperties(60, 0.69).tau_ms;
    expect(t60 / t30).toBeCloseTo(2, 1);
  });

  it('Q is independent of M', () => {
    expect(ringdownProperties(30, 0.69).Q).toBeCloseTo(ringdownProperties(200, 0.69).Q, 9);
  });

  it('chi clamped to [0, 0.99]', () => {
    const { omegaR_M } = qnmFrequency(1.5);
    const { omegaR_M: clamped } = qnmFrequency(0.99);
    expect(omegaR_M).toBeCloseTo(clamped, 9);
  });
});
