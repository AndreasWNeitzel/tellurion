// Liouvillian Flow invariant tests at seed 0xC0FFEE.

import { describe, it, expect } from 'vitest';
import {
  createSwarm,
  stepSwarm,
  covarianceArea,
  tracerEnergy,
  DEFAULT_PHYSICS_DT,
  DEFAULT_OMEGA,
} from './sim.js';

const SEED = 0xC0FFEE;
const DT   = DEFAULT_PHYSICS_DT;

describe('liouvillian-flow: strong invariants', () => {
  it('per-tracer energy conserved to |dE/E| < 1e-3 over 10^4 dt (default blob)', () => {
    const sw = createSwarm({ N: 256, blobCenter: { theta: 0.6, p: 0 }, seed: SEED });
    const idx = [0, 50, 128, 200, 255];
    const E0 = idx.map(i => tracerEnergy(sw.inst.q[i], sw.inst.qdot[i], DEFAULT_OMEGA));
    let worst = 0;
    for (let n = 0; n < 10_000; n += 1) {
      stepSwarm(sw, DT);
      if ((n & 0xFF) === 0) {
        for (let k = 0; k < idx.length; k += 1) {
          const i = idx[k];
          const E = tracerEnergy(sw.inst.q[i], sw.inst.qdot[i], DEFAULT_OMEGA);
          const rel = Math.abs((E - E0[k]) / E0[k]);
          if (rel > worst) worst = rel;
        }
      }
    }
    expect(worst).toBeLessThan(1e-3);
  });

  it('covariance-area conserved to 5 percent over 10^3 dt (default blob)', () => {
    const sw = createSwarm({ N: 256, blobCenter: { theta: 0.6, p: 0 }, seed: SEED });
    const A0 = covarianceArea(sw.inst.q, sw.inst.qdot);
    for (let n = 0; n < 1000; n += 1) stepSwarm(sw, DT);
    const A1 = covarianceArea(sw.inst.q, sw.inst.qdot);
    const rel = Math.abs(A1 - A0) / A0;
    expect(rel).toBeLessThan(0.05);
  });

  it('per-tracer reproducibility: bit-identical state after 1000 steps at seed 0xC0FFEE', () => {
    function run() {
      const sw = createSwarm({ N: 256, blobCenter: { theta: 0.6, p: 0 }, seed: SEED });
      for (let n = 0; n < 1000; n += 1) stepSwarm(sw, DT);
      return { q: Float64Array.from(sw.inst.q), p: Float64Array.from(sw.inst.qdot) };
    }
    const a = run();
    const b = run();
    for (let i = 0; i < a.q.length; i += 1) {
      expect(a.q[i]).toBe(b.q[i]);
      expect(a.p[i]).toBe(b.p[i]);
    }
  });
});

describe('liouvillian-flow: limiting cases', () => {
  it('small-amplitude blob at (0, 0) returns close to start after one period', () => {
    const sw = createSwarm({
      N: 256, blobCenter: { theta: 0, p: 0 },
      sigmaTheta: 0.02, sigmaP: 0.02, seed: SEED,
    });
    const q0 = Float64Array.from(sw.inst.q);
    const p0 = Float64Array.from(sw.inst.qdot);
    const T = 2 * Math.PI;
    const steps = Math.round(T / DT);
    for (let n = 0; n < steps; n += 1) stepSwarm(sw, DT);
    let sumdt = 0, sumdp = 0;
    for (let i = 0; i < sw.N; i += 1) {
      sumdt += (sw.inst.q[i] - q0[i]) ** 2;
      sumdp += (sw.inst.qdot[i] - p0[i]) ** 2;
    }
    const rmsd_theta = Math.sqrt(sumdt / sw.N);
    const rmsd_p     = Math.sqrt(sumdp / sw.N);
    expect(rmsd_theta).toBeLessThan(0.01);
    expect(rmsd_p).toBeLessThan(0.01);
  });
});
