// Tennis-racket-theorem invariant tests. Euler's free-rigid-body
// equations must conserve energy and |L|, keep major/minor-axis spin
// stable, and make intermediate-axis spin flip (Dzhanibekov).

import { describe, it, expect } from 'vitest';
import {
  createRacket, step, energy, angularMomentumMag, diagnostics,
} from './sim.js';

const DT = 1 / 480;
function run(s, n) { for (let i = 0; i < n; i += 1) step(s, DT); return s; }

describe('rigid body: conservation', () => {
  it('energy and |L| are conserved to 1e-3 over 1.2e4 steps (intermediate axis)', () => {
    const s = createRacket({ I: [1, 2, 3], spin: 6, axis: 1, perturb: 0.04 });
    s.E0 = energy(s); s.L0 = angularMomentumMag(s);
    run(s, 12000);
    const d = diagnostics(s);
    expect(Math.abs(d.energyDrift)).toBeLessThan(1e-3);
    expect(Math.abs(d.LDrift)).toBeLessThan(1e-3);
  });
});

describe('rigid body: stability of the principal axes', () => {
  it('major-axis spin is stable: transverse components stay small', () => {
    const s = createRacket({ I: [1, 2, 3], spin: 6, axis: 0, perturb: 0.04 });
    let maxT = 0;
    for (let i = 0; i < 16000; i += 1) { step(s, DT); maxT = Math.max(maxT, Math.abs(s.w[1]), Math.abs(s.w[2])); }
    expect(maxT).toBeLessThan(0.6 * 6);              // never approaches the spin
    expect(s.w[0]).toBeGreaterThan(0);               // primary never flips sign
  });

  it('minor-axis spin is stable', () => {
    const s = createRacket({ I: [1, 2, 3], spin: 6, axis: 2, perturb: 0.04 });
    let maxT = 0;
    for (let i = 0; i < 16000; i += 1) { step(s, DT); maxT = Math.max(maxT, Math.abs(s.w[0]), Math.abs(s.w[1])); }
    expect(maxT).toBeLessThan(0.6 * 6);
    expect(s.w[2]).toBeGreaterThan(0);
  });

  it('intermediate-axis spin is unstable: the primary component flips sign', () => {
    const s = createRacket({ I: [1, 2, 3], spin: 6, axis: 1, perturb: 0.04 });
    let flipped = false, sign0 = Math.sign(s.w[1]);
    for (let i = 0; i < 30000; i += 1) {
      step(s, DT);
      if (Math.sign(s.w[1]) === -sign0 && Math.abs(s.w[1]) > 3) flipped = true;
    }
    expect(flipped).toBe(true);                       // the Dzhanibekov flip
  });

  it('quaternion stays normalized', () => {
    const s = createRacket({ I: [1, 2, 3], spin: 6, axis: 1, perturb: 0.05 });
    run(s, 8000);
    expect(Math.hypot(s.q[0], s.q[1], s.q[2], s.q[3])).toBeCloseTo(1, 6);
  });
});
