// Mercury PN (Schwarzschild effective-potential) invariant tests.
// (a) Newtonian limit (alpha = 0): per-orbit perihelion advance is < 0.005 rad.
// (b) Linear scaling: per-orbit advance is linear in alpha for small alpha.
// (c) Energy and angular momentum conservation by velocity-Verlet.

import { describe, it, expect } from 'vitest';
import { createMercury, stepMercury, mercuryDiagnostics, DEFAULT_DT } from './sim.js';

function tracePerihelions(merc, dt, maxSteps) {
  const angles = [];
  let rPrev = Infinity, rCurr = Infinity, rNext = Infinity;
  const y = merc.inst.q;
  for (let i = 0; i < maxSteps; i += 1) {
    stepMercury(merc, dt);
    rPrev = rCurr; rCurr = rNext;
    rNext = Math.hypot(y[0], y[1]);
    if (Number.isFinite(rPrev) && rPrev > rCurr && rCurr < rNext) {
      angles.push(Math.atan2(y[1], y[0]));
    }
  }
  return angles;
}

function perOrbitAdvance(angles) {
  let total = 0;
  for (let i = 1; i < angles.length; i += 1) {
    let d = angles[i] - angles[i - 1];
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    total += d;
  }
  return angles.length > 1 ? total / (angles.length - 1) : 0;
}

describe('Mercury PN: Newtonian limit', () => {
  it('alpha = 0 returns a closed orbit (per-orbit advance < 0.005 rad)', () => {
    const merc = createMercury({ alpha: 0, e: 0.4, integrator: 'verlet' });
    const angles = tracePerihelions(merc, DEFAULT_DT, 40_000);
    expect(angles.length).toBeGreaterThanOrEqual(8);
    const adv = perOrbitAdvance(angles);
    expect(Math.abs(adv)).toBeLessThan(0.005);
  });
});

describe('Mercury PN: precession scales linearly with alpha', () => {
  it('per-orbit advance is proportional to alpha for small alpha', () => {
    const e = 0.4;
    const m1 = createMercury({ alpha: 0.005, e, integrator: 'verlet' });
    const m2 = createMercury({ alpha: 0.020, e, integrator: 'verlet' });
    const a1 = perOrbitAdvance(tracePerihelions(m1, DEFAULT_DT, 30_000));
    const a2 = perOrbitAdvance(tracePerihelions(m2, DEFAULT_DT, 30_000));
    expect(a1).toBeGreaterThan(0);
    expect(a2).toBeGreaterThan(0);
    // a2/a1 should be close to 4 in the small-alpha limit
    const ratio = a2 / a1;
    expect(ratio).toBeGreaterThan(3.6);
    expect(ratio).toBeLessThan(4.6);
  }, 10_000);

  it('alpha = 0.01 gives per-orbit advance in [0.07, 0.12] rad at e = 0.4', () => {
    const merc = createMercury({ alpha: 0.01, e: 0.4, integrator: 'verlet' });
    const adv = perOrbitAdvance(tracePerihelions(merc, DEFAULT_DT, 30_000));
    expect(adv).toBeGreaterThan(0.07);
    expect(adv).toBeLessThan(0.12);
  }, 10_000);
});

describe('Mercury PN: conservation under velocity-Verlet', () => {
  it('|dE/E| < 5e-4 over 30k steps at default parameters', () => {
    const merc = createMercury({ alpha: 0.02, e: 0.4, integrator: 'verlet' });
    let maxDrift = 0;
    for (let i = 0; i < 30_000; i += 1) {
      stepMercury(merc, DEFAULT_DT);
      if (i % 200 === 0) {
        const d = mercuryDiagnostics(merc);
        if (Math.abs(d.energyDrift) > maxDrift) maxDrift = Math.abs(d.energyDrift);
      }
    }
    expect(maxDrift).toBeLessThan(5e-4);
  }, 10_000);

  it('angular momentum L conserved to 1e-6 relative', () => {
    const merc = createMercury({ alpha: 0.02, e: 0.4, integrator: 'verlet' });
    const L0 = mercuryDiagnostics(merc).angularMomentum;
    let maxDev = 0;
    for (let i = 0; i < 20_000; i += 1) {
      stepMercury(merc, DEFAULT_DT);
      if (i % 200 === 0) {
        const Lnow = mercuryDiagnostics(merc).angularMomentum;
        const dev = Math.abs(Lnow - L0) / Math.abs(L0);
        if (dev > maxDev) maxDev = dev;
      }
    }
    expect(maxDev).toBeLessThan(1e-6);
  }, 10_000);
});
