// MCMC Comparator invariant tests at seed 0xC0FFEE.

import { describe, it, expect } from 'vitest';
import {
  createChain, bananaTarget, gaussian2dTarget,
} from '../../shared/js/engine/mcmc-harness.js';

const SEED = 0xC0FFEE;

describe('mcmc-comparator: capture-mode integration', () => {
  it('three chains run side by side on the banana for 5k samples each', () => {
    const target = bananaTarget();
    const samplers = ['rwm', 'mala', 'hmc'];
    const params = {
      rwm:  { sigma: 1.2 },
      mala: { stepSize: 0.5 },
      hmc:  { stepSize: 0.15, nLeapfrog: 20 },
    };
    const chains = samplers.map((m, i) => createChain({
      method: m, target, x0: [0, 0],
      params: params[m],
      seed: SEED ^ (i * 0x9E37),
    }));
    const N = 5_000;
    for (const c of chains) c.run(N);
    for (const c of chains) {
      // Sanity bounds on the running acceptance for the banana target.
      expect(c.acceptance).toBeGreaterThan(0.05);
      expect(c.acceptance).toBeLessThan(1.0);
    }
  }, 30_000);

  it('HMC on the banana has ESS / sample > 3x RWM', () => {
    const target = bananaTarget();
    const N = 10_000;
    const rwm = createChain({ method: 'rwm', target, x0: [0, 0], params: { sigma: 1.2 }, seed: SEED });
    const hmc = createChain({ method: 'hmc', target, x0: [0, 0], params: { stepSize: 0.15, nLeapfrog: 20 }, seed: SEED });
    const trwm = rwm.run(N), thmc = hmc.run(N);
    const drwm = rwm.diagnostics(trwm), dhmc = hmc.diagnostics(thmc);
    expect(dhmc.ess[0] / drwm.ess[0]).toBeGreaterThan(3);
  }, 60_000);
});

describe('mcmc-comparator: reproducibility', () => {
  it('two boot-syncs at the same seed produce identical first-1000-sample states', () => {
    const t = gaussian2dTarget();
    function go() {
      const a = createChain({ method: 'rwm',  target: t, x0: [0, 0], params: { sigma: 1.5 }, seed: SEED });
      const b = createChain({ method: 'mala', target: t, x0: [0, 0], params: { stepSize: 0.5 }, seed: SEED ^ 0x9E37 });
      const c = createChain({ method: 'hmc',  target: t, x0: [0, 0], params: { stepSize: 0.15, nLeapfrog: 20 }, seed: SEED ^ 0x13C6E });
      const traceA = a.run(1000), traceB = b.run(1000), traceC = c.run(1000);
      return { a: traceA[999 * 2], b: traceB[999 * 2], c: traceC[999 * 2] };
    }
    const r1 = go();
    const r2 = go();
    expect(r1.a).toBe(r2.a);
    expect(r1.b).toBe(r2.b);
    expect(r1.c).toBe(r2.c);
  });
});
