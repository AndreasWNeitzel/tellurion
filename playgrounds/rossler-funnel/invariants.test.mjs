// Rossler funnel invariant tests.
// Confirm: (a) tangent-vector linearity yields a positive Lyapunov exponent
// in the chaotic regime, (b) the attractor is bounded, (c) the period-2
// limit cycle exists for small c.

import { describe, it, expect } from 'vitest';
import { createRossler, stepRossler, maxLyapunov, DEFAULT_DT, DEFAULT_PARAMS } from './sim.js';

describe('Rossler attractor: boundedness', () => {
  it('classical parameters: trajectory stays inside a finite box', () => {
    const r = createRossler({ params: DEFAULT_PARAMS, dt: DEFAULT_DT });
    let xmax = 0, ymax = 0, zmax = 0;
    for (let i = 0; i < 30_000; i += 1) {
      stepRossler(r);
      const y = r.inst.y;
      if (Math.abs(y[0]) > xmax) xmax = Math.abs(y[0]);
      if (Math.abs(y[1]) > ymax) ymax = Math.abs(y[1]);
      if (Math.abs(y[2]) > zmax) zmax = Math.abs(y[2]);
    }
    expect(xmax).toBeLessThan(20);
    expect(ymax).toBeLessThan(20);
    expect(zmax).toBeLessThan(40);
  });
});

describe('Rossler attractor: chaos at c = 5.7', () => {
  it('largest Lyapunov exponent > 0.04 after 50k steps', () => {
    const r = createRossler({ params: { a: 0.2, b: 0.2, c: 5.7 }, dt: DEFAULT_DT });
    const RESCALE_EVERY = 50;
    for (let i = 0; i < 50_000; i += 1) {
      stepRossler(r);
      if ((r.inst.nSteps % RESCALE_EVERY) === 0) {
        const y = r.inst.y;
        const tnorm = Math.hypot(y[3], y[4], y[5]);
        if (tnorm > 0) {
          r.logSum += Math.log(tnorm);
          r.nRescale += 1;
          y[3] /= tnorm; y[4] /= tnorm; y[5] /= tnorm;
        }
      }
    }
    const lambda = maxLyapunov(r, RESCALE_EVERY);
    expect(lambda).toBeGreaterThan(0.04);
    expect(lambda).toBeLessThan(0.15);
  }, 20_000);
});

describe('Rossler attractor: period-2 limit cycle at low c', () => {
  it('largest Lyapunov exponent near zero at c = 3.5', () => {
    const r = createRossler({ params: { a: 0.2, b: 0.2, c: 3.5 }, dt: DEFAULT_DT });
    const RESCALE_EVERY = 50;
    for (let i = 0; i < 50_000; i += 1) {
      stepRossler(r);
      if ((r.inst.nSteps % RESCALE_EVERY) === 0) {
        const y = r.inst.y;
        const tnorm = Math.hypot(y[3], y[4], y[5]);
        if (tnorm > 0) {
          r.logSum += Math.log(tnorm);
          r.nRescale += 1;
          y[3] /= tnorm; y[4] /= tnorm; y[5] /= tnorm;
        }
      }
    }
    const lambda = maxLyapunov(r, RESCALE_EVERY);
    expect(Math.abs(lambda)).toBeLessThan(0.05);
  }, 20_000);
});
