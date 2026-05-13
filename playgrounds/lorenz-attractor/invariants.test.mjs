// Lorenz attractor invariant tests at seed-free defaults.

import { describe, it, expect } from 'vitest';
import {
  createLorenz, stepLorenz, runLorenz, maxLyapunov,
  DEFAULT_DT, DEFAULT_PARAMS,
} from './sim.js';

describe('lorenz: classical-parameter invariants', () => {
  it('max-Lyapunov over 10^4 rescale cycles is in [0.7, 1.05]', () => {
    const lz = createLorenz({ params: DEFAULT_PARAMS });
    // warm-up onto attractor
    for (let i = 0; i < 2000; i += 1) stepLorenz(lz);
    // reset rescale counters after warmup
    lz.logSum = 0;
    lz.nRescale = 0;
    runLorenz(lz, 12_000, 50);
    const lam = maxLyapunov(lz, 50);
    expect(lam).toBeGreaterThan(0.7);
    expect(lam).toBeLessThan(1.05);
  }, 30_000);

  it('trajectory remains bounded over 50 time units', () => {
    const lz = createLorenz({ params: DEFAULT_PARAMS });
    const y = lz.inst.y;
    let rmax = 0;
    for (let i = 0; i < 10_000; i += 1) {
      stepLorenz(lz);
      const r = Math.hypot(y[0], y[1], y[2]);
      if (r > rmax) rmax = r;
    }
    expect(rmax).toBeLessThan(100);
  });
});

describe('lorenz: limiting cases', () => {
  it('rho < 1 contracts onto the origin', () => {
    const lz = createLorenz({ params: { sigma: 10, rho: 0.5, beta: 8 / 3 }, ic: [5, 5, 5] });
    for (let i = 0; i < 10_000; i += 1) stepLorenz(lz);
    const r = Math.hypot(lz.inst.y[0], lz.inst.y[1], lz.inst.y[2]);
    expect(r).toBeLessThan(0.1);
  });

  it('1 < rho < rho_H lands on one of the two nontrivial fixed points', () => {
    const params = { sigma: 10, rho: 15, beta: 8 / 3 };
    const cExp = Math.sqrt(params.beta * (params.rho - 1));
    const zExp = params.rho - 1;
    const lz = createLorenz({ params, ic: [1, 1, 1] });
    for (let i = 0; i < 25_000; i += 1) stepLorenz(lz);
    const y = lz.inst.y;
    // Either C+ or C- should be the resting state.
    const okPos = Math.hypot(y[0] - cExp, y[1] - cExp, y[2] - zExp) < 0.5;
    const okNeg = Math.hypot(y[0] + cExp, y[1] + cExp, y[2] - zExp) < 0.5;
    expect(okPos || okNeg).toBe(true);
  }, 30_000);
});

describe('lorenz: reproducibility', () => {
  it('bit-identical trajectory at fixed dt', () => {
    function go() {
      const lz = createLorenz({ params: DEFAULT_PARAMS, ic: [1, 1, 1], dt: DEFAULT_DT, method: 'rk4' });
      for (let i = 0; i < 2000; i += 1) stepLorenz(lz);
      return Float64Array.from(lz.inst.y);
    }
    const a = go(), b = go();
    for (let i = 0; i < 3; i += 1) expect(a[i]).toBe(b[i]);
  });
});
