// Exact 1D Ising decimation RG: the zero-field recursion
// K' = 1/2 ln cosh 2K, agreement with the brute-force decimation sum,
// the (0,0) stable and (infinity,0) unstable fixed points, flow to
// disorder (no finite-T transition), the field doubling near T = 0,
// the exact correlation-length halving under b = 2, and the
// RG-reconstructed free energy equal to the exact transfer matrix.

import { describe, it, expect } from 'vitest';
import {
  logcosh, rgStep, rgFlow, exactFreeEnergy, rgFreeEnergy,
  correlationLength, uOfK, kOfU,
} from './sim.js';

const close = (a, b, t) => expect(Math.abs(a - b)).toBeLessThan(t);

// Brute-force one decimation: sum the eliminated spin explicitly and
// read off (K', h') and the constant from the three spin patterns.
function bruteStep(K, h) {
  const f = (a, b) => 2 * Math.cosh(K * (a + b) + h);   // sum over s0 = +-1
  const pp = Math.log(f(1, 1)), mm = Math.log(f(-1, -1)), pm = Math.log(f(1, -1));
  // ln f = 2g + K' a b + (hi/2)(a+b); solve the 3 equations
  const Kp = (pp + mm - 2 * pm) / 4;
  const hi = (pp - mm) / 2;                              // induced field
  return { K: Kp, h: h + hi };
}

describe('renormalization-group-flow-1d invariants', () => {
  it('zero-field recursion is K\' = 1/2 ln cosh 2K, h stays 0', () => {
    for (const K of [0.2, 0.7, 1.5, 3.0]) {
      const r = rgStep(K, 0);
      close(r.K, 0.5 * Math.log(Math.cosh(2 * K)), 1e-12);
      close(r.h, 0, 1e-15);
    }
    close(logcosh(0), 0, 1e-15);
    close(logcosh(20) - (20 - Math.LN2), 0, 1e-8);       // ln cosh x ~ x - ln2
  });

  it('recursion matches the brute-force decimation sum', () => {
    for (const [K, h] of [[0.4, 0.3], [1.1, -0.6], [2.0, 0.9], [0.05, 0.02]]) {
      const r = rgStep(K, h), b = bruteStep(K, h);
      close(r.K, b.K, 1e-10);
      close(r.h, b.h, 1e-10);
    }
  });

  it('(0,0) is a fixed point; the sink is super-stable', () => {
    const r = rgStep(0, 0);
    close(r.K, 0, 1e-15); close(r.h, 0, 1e-15);
    const e = 1e-5, r2 = rgStep(e, 0);                   // dK'/dK = tanh 2K -> 0
    expect(r2.K).toBeLessThan(e * 0.5);
  });

  it('K always flows to 0 (no finite-T transition); h stays 0 only at h0=0', () => {
    // Zero field: the whole flow stays on h = 0 and K -> 0.
    const f0 = rgFlow(6.0, 0.0, 80);
    expect(f0[f0.length - 1].K).toBeLessThan(1e-6);
    expect(Math.abs(f0[f0.length - 1].h)).toBeLessThan(1e-12);
    // With a field: K still -> 0 (no transition) but the chain
    // decouples into independent spins in a finite residual field,
    // so h converges to a nonzero constant.
    for (const [K0, h0] of [[2.0, 0.4], [0.8, -1.2], [10, 0.01]]) {
      const f = rgFlow(K0, h0, 90);
      const last = f[f.length - 1], prev = f[f.length - 2];
      expect(last.K).toBeLessThan(1e-6);
      expect(Math.abs(last.h - prev.h)).toBeLessThan(1e-7);   // h converged
      expect(Math.abs(last.h)).toBeGreaterThan(1e-6);         // to a finite value
      expect(f.length).toBe(91);
    }
  });

  it('zero-temperature fixed point: K decreases by ~ln2/2, field doubles', () => {
    for (const K of [8, 12, 20]) {
      const r0 = rgStep(K, 0);
      close(r0.K, K - 0.5 * Math.LN2, 1e-6);             // unstable: flows away
      const r1 = rgStep(K, 0.02);
      close(r1.h, 2 * 0.02, 1e-3);                       // h relevant: h' ~ 2h
    }
  });

  it('correlation length halves under one decimation (b = 2)', () => {
    for (const K of [1.0, 1.8, 2.6]) {
      const r = rgStep(K, 0);
      const ratio = correlationLength(r.K) / correlationLength(K);
      close(ratio, 0.5, 5e-3);
    }
  });

  it('RG-reconstructed free energy equals the exact transfer matrix', () => {
    for (const [K, h] of [[0.3, 0.0], [1.2, 0.0], [0.7, 0.5], [2.5, -0.8], [0.05, 0.9]]) {
      close(rgFreeEnergy(K, h), exactFreeEnergy(K, h), 1e-9);
    }
    close(exactFreeEnergy(0, 0), Math.LN2, 1e-12);        // free spins
    close(exactFreeEnergy(1, 0), Math.log(2 * Math.cosh(1)), 1e-12);
  });

  it('the tanh compactification round-trips', () => {
    for (const K of [0.0, 0.5, 2.0, 6.0]) close(kOfU(uOfK(K)), K, 1e-9);
    expect(uOfK(0)).toBe(0);
    expect(uOfK(40)).toBeGreaterThan(0.999999);
  });
});
