// laser-cavity-3d invariants. The emergent lasing threshold, the
// gain-clamped inversion, the sharp output kink and the Q-switched
// giant pulse prove the shared rate-equation engine (via ./sim.js)
// is real dynamics, not a scripted ignition.

import { describe, it, expect } from 'vitest';
import {
  cavityLifetime, thresholdInversion, thresholdPump, makeLaser, step,
  outputPower, steadyState,
} from './sim.js';

describe('laser-cavity-3d', () => {
  const B = 1, tauC = 0.5, tau = 1;
  const Pth = thresholdPump(B, tauC, tau);

  it('cavity lifetime grows with reflectivity; N_th = 1/(B tauC)', () => {
    expect(cavityLifetime(1, 0.9)).toBeGreaterThan(cavityLifetime(1, 0.5));
    expect(thresholdInversion(2, 0.5)).toBeCloseTo(1, 12);
  });

  it('below threshold the photon number is the negligible seed floor', () => {
    expect(steadyState({ P: 0.6 * Pth, tau, tauC, B, seed: 1e-6 }).n).toBeLessThan(1e-2);
  });

  it('above threshold the inversion clamps at N_th to 1 percent', () => {
    const Nth = thresholdInversion(B, tauC);
    const below = steadyState({ P: 0.8 * Pth, tau, tauC, B, seed: 1e-6 }).n;
    for (const k of [1.5, 2.5, 4]) {
      const ss = steadyState({ P: k * Pth, tau, tauC, B, seed: 1e-6 });
      expect(Math.abs(ss.N - Nth) / Nth).toBeLessThan(0.01);
      expect(ss.n).toBeGreaterThan(1e4 * below);
    }
  });

  it('output is a sharp kink: ~0 below, linear above', () => {
    const below = steadyState({ P: 0.8 * Pth, tau, tauC, B, seed: 1e-6 }).output;
    const o1 = steadyState({ P: 1.5 * Pth, tau, tauC, B, seed: 1e-6 }).output;
    const o2 = steadyState({ P: 2.0 * Pth, tau, tauC, B, seed: 1e-6 }).output;
    const o3 = steadyState({ P: 2.5 * Pth, tau, tauC, B, seed: 1e-6 }).output;
    expect(below).toBeLessThan(0.05 * o1);
    expect(Math.abs((o2 - o1) - (o3 - o2)) / (o2 - o1)).toBeLessThan(0.05);
  });

  it('Q-switch: stores inversion, then a transient giant pulse drains it', () => {
    const s = makeLaser({ P: 0.5, tau: 20, tauC: 0.5, B: 1, seed: 1e-4, qLow: 1e-3 });
    for (let i = 0; i < 60000; i += 1) step(s, 2e-3, false);
    const Nstored = s.N;
    expect(Nstored).toBeGreaterThan(2.5 * thresholdInversion(1, 0.5));
    let peak = 0, energy = 0, Nmin = Infinity;
    for (let i = 0; i < 16000; i += 1) { step(s, 5e-4, true); peak = Math.max(peak, s.n); Nmin = Math.min(Nmin, s.N); energy += outputPower(s) * 5e-4; }
    for (let i = 0; i < 20000; i += 1) step(s, 5e-4, true);
    expect(peak / s.n).toBeGreaterThan(10);
    expect(Nmin).toBeLessThan(thresholdInversion(1, 0.5));
    const drained = Nstored - Nmin;
    expect(energy).toBeGreaterThan(0.5 * drained);
    expect(energy).toBeLessThan(1.6 * drained);
  });

  it('deterministic: identical setup reproduces the trajectory', () => {
    const a = makeLaser({ P: 3, tauC: 0.4 }); const b = makeLaser({ P: 3, tauC: 0.4 });
    for (let i = 0; i < 2000; i += 1) { step(a, 1e-3); step(b, 1e-3); }
    expect(a.n).toBe(b.n);
  });
});
