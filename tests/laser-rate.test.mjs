// Shared-engine tests for shared/js/engine/laser-rate-cpu.js (built
// before the laser-cavity-3d hero). The lasing threshold, the
// gain-clamped inversion above it, the sharp output kink and the
// Q-switched energy balance prove the rate-equation dynamics are
// real, not a scripted ignition.

import { describe, it, expect } from 'vitest';
import {
  cavityLifetime, thresholdInversion, thresholdPump, makeLaser, step,
  outputPower, steadyState,
} from '../shared/js/engine/laser-rate-cpu.js';

describe('cavity and threshold', () => {
  it('cavity lifetime grows with mirror reflectivity and length', () => {
    expect(cavityLifetime(1, 0.9, 1)).toBeGreaterThan(cavityLifetime(1, 0.5, 1));
    expect(cavityLifetime(2, 0.9, 1)).toBeGreaterThan(cavityLifetime(1, 0.9, 1));
  });
  it('threshold inversion is 1/(B tauC)', () => {
    expect(thresholdInversion(2, 0.5)).toBeCloseTo(1, 12);
    expect(thresholdPump(2, 0.5, 4)).toBeCloseTo(0.25, 12);
  });
});

describe('lasing threshold emerges from the steady state', () => {
  const B = 1, tauC = 0.5, tau = 1;
  const Pth = thresholdPump(B, tauC, tau);             // = 1/(B tauC tau) = 2

  it('below threshold the photon number is the negligible seed floor', () => {
    const ss = steadyState({ P: 0.6 * Pth, tau, tauC, B, seed: 1e-6 });
    expect(ss.n).toBeLessThan(1e-2);
    expect(ss.output).toBeLessThan(1e-2);
  });

  it('above threshold the inversion clamps at N_th to 1 percent', () => {
    const Nth = thresholdInversion(B, tauC);
    const below = steadyState({ P: 0.8 * Pth, tau, tauC, B, seed: 1e-6 }).n;
    for (const k of [1.5, 2.5, 4]) {
      const ss = steadyState({ P: k * Pth, tau, tauC, B, seed: 1e-6 });
      expect(Math.abs(ss.N - Nth) / Nth).toBeLessThan(0.01);   // gain clamping
      // lasing: photon number is orders of magnitude above the
      // sub-threshold seed floor, and grows with pump
      expect(ss.n).toBeGreaterThan(1e4 * below);
    }
    const a = steadyState({ P: 1.5 * Pth, tau, tauC, B, seed: 1e-6 }).n;
    const c = steadyState({ P: 4 * Pth, tau, tauC, B, seed: 1e-6 }).n;
    expect(c).toBeGreaterThan(a);
  });

  it('the output is a sharp kink: ~0 below, rising linearly above', () => {
    const Pth2 = Pth;
    const below = steadyState({ P: 0.8 * Pth2, tau, tauC, B, seed: 1e-6 }).output;
    const o1 = steadyState({ P: 1.5 * Pth2, tau, tauC, B, seed: 1e-6 }).output;
    const o2 = steadyState({ P: 2.0 * Pth2, tau, tauC, B, seed: 1e-6 }).output;
    const o3 = steadyState({ P: 2.5 * Pth2, tau, tauC, B, seed: 1e-6 }).output;
    expect(below).toBeLessThan(0.05 * o1);                      // kink
    // linear above threshold: equal pump steps -> equal output steps
    expect(Math.abs((o2 - o1) - (o3 - o2)) / (o2 - o1)).toBeLessThan(0.05);
  });
});

describe('Q-switched giant pulse', () => {
  it('stores inversion with Q closed, then dumps it as one big pulse', () => {
    // Giant-pulse regime: a slow upper state (tau >> tauC) so the
    // pump cannot refill the inversion during the brief pulse.
    const s = makeLaser({ P: 0.5, tau: 20, tauC: 0.5, B: 1, seed: 1e-4, qLow: 1e-3 });
    // Q closed: pump up the inversion, photons cannot build
    for (let i = 0; i < 60000; i += 1) step(s, 2e-3, false);
    const Nstored = s.N;
    // well above the CW gain-clamped inversion N_th = 1/(B tauC)
    expect(Nstored).toBeGreaterThan(2.5 * thresholdInversion(1, 0.5));
    // open the Q: a giant pulse builds from the spontaneous seed,
    // peaks, and drains the inversion (a real build-up time, so the
    // window is long enough for the pulse to fully form and decay)
    // the giant pulse is brief (a few cavity lifetimes); integrate the
    // pulse energy and the inversion undershoot over the spike window
    // only (continued CW lasing afterwards is a separate, later phase).
    let peak = 0, pulseEnergy = 0, Nmin = Infinity;
    for (let i = 0; i < 16000; i += 1) {         // 8 time units: spike + drain
      step(s, 5e-4, true);                       // fine dt: the spike is stiff
      peak = Math.max(peak, s.n);
      Nmin = Math.min(Nmin, s.N);
      pulseEnergy += outputPower(s) * 5e-4;
    }
    // let it relax so the post-pulse level is the genuine CW value
    for (let i = 0; i < 20000; i += 1) step(s, 5e-4, true);
    const nEnd = s.n;
    // the output is a transient SPIKE that towers over the post-pulse
    // (continuous-wave) level: a giant pulse, not a new steady state
    expect(peak / nEnd).toBeGreaterThan(10);
    // the pulse drains the inversion far below the stored value and
    // undershoots below the CW gain-clamp N_th (the Q-switch signature)
    expect(Nmin).toBeLessThan(thresholdInversion(1, 0.5));
    expect(Nmin).toBeLessThan(Nstored * 0.4);
    // photon-energy accounting: every photon out is one de-excitation,
    // so the emitted energy matches the inversion the pulse drained
    const drained = Nstored - Nmin;
    expect(pulseEnergy).toBeGreaterThan(0.5 * drained);
    expect(pulseEnergy).toBeLessThan(1.6 * drained);
  });

  it('deterministic: identical setup reproduces the trajectory', () => {
    const a = makeLaser({ P: 3, tauC: 0.4 }); const b = makeLaser({ P: 3, tauC: 0.4 });
    for (let i = 0; i < 2000; i += 1) { step(a, 1e-3); step(b, 1e-3); }
    expect(a.n).toBe(b.n);
    expect(a.N).toBe(b.N);
  });
});
