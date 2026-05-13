// Three-body figure-eight invariant tests at seed 0xC0FFEE (no RNG used).

import { describe, it, expect } from 'vitest';
import {
  createThreeBody,
  stepThreeBody,
  threeBodyDiagnostics,
  DEFAULT_DT,
} from './sim.js';

const T_PERIOD = 6.3259;

describe('three-body-orbit: strong invariants', () => {
  it('|dE/E| < 1e-3 over 10^4 dt at the canonical figure-eight IC', () => {
    const tb = createThreeBody();
    let maxRel = 0;
    for (let i = 0; i < 10_000; i += 1) {
      stepThreeBody(tb);
      const d = threeBodyDiagnostics(tb);
      if (Math.abs(d.energyDrift) > maxRel) maxRel = Math.abs(d.energyDrift);
    }
    expect(maxRel).toBeLessThan(1e-3);
  });

  it('total linear momentum stays within 1e-10 of zero over 10^4 dt', () => {
    const tb = createThreeBody();
    const P0 = threeBodyDiagnostics(tb).momentumMag;
    expect(P0).toBeLessThan(1e-12);
    let maxP = 0;
    for (let i = 0; i < 10_000; i += 1) {
      stepThreeBody(tb);
      const P = threeBodyDiagnostics(tb).momentumMag;
      if (P > maxP) maxP = P;
    }
    expect(maxP).toBeLessThan(1e-10);
  });

  it('total angular momentum stays within 1e-10 of zero over 10^4 dt', () => {
    const tb = createThreeBody();
    const L0 = threeBodyDiagnostics(tb).angularMomentum;
    expect(Math.abs(L0)).toBeLessThan(1e-12);
    let maxL = 0;
    for (let i = 0; i < 10_000; i += 1) {
      stepThreeBody(tb);
      const L = threeBodyDiagnostics(tb).angularMomentum;
      if (Math.abs(L) > maxL) maxL = Math.abs(L);
    }
    expect(maxL).toBeLessThan(1e-10);
  });
});

describe('three-body-orbit: choreography', () => {
  it('after one period each body returns within 5e-3 of its start', () => {
    const tb = createThreeBody();
    const q0 = Float64Array.from(tb.inst.q);
    const steps = Math.round(T_PERIOD / DEFAULT_DT);
    for (let i = 0; i < steps; i += 1) stepThreeBody(tb);
    // Each body returns to a permutation of the original positions (after T/3 each body
    // moves to the next slot). After exactly T = 6.326, all bodies should return to
    // their starting positions.
    for (let k = 0; k < 6; k += 1) {
      expect(Math.abs(tb.inst.q[k] - q0[k])).toBeLessThan(5e-3);
    }
  });
});

describe('three-body-orbit: reproducibility', () => {
  it('bit-identical state after 1000 steps at canonical IC', () => {
    function run() {
      const tb = createThreeBody();
      for (let i = 0; i < 1000; i += 1) stepThreeBody(tb);
      return Float64Array.from(tb.inst.q);
    }
    const a = run();
    const b = run();
    for (let i = 0; i < 6; i += 1) expect(a[i]).toBe(b[i]);
  });
});
