// CR3BP invariant tests.
// (a) L4, L5 at exact equilateral coordinates (1/2 - mu, +/- sqrt(3)/2).
// (b) L1, L2 outside the triangular zone, on either side of the secondary.
// (c) Jacobi integral conservation by velocity-Verlet with predictor-corrector
//     pass (~ 1e-4 over 5000 steps).
// (d) Routh stability mu_R ~ 0.0385.
// (e) Test particle dropped at L4 with zero rotating-frame velocity stays
//     close (within 0.1) for low mu (Earth-Moon) over 10000 steps.
// (f) Test particle near L4 at moderate mu = 0.2 (above Routh) escapes.

import { describe, it, expect } from 'vitest';
import {
  createCR3BP, stepCR3BP, diagnosticsCR3BP, lagrangePoints, DEFAULT_DT,
  SQRT3_HALF, MU_ROUTH,
} from './sim.js';

describe('CR3BP: Lagrange-point coordinates', () => {
  it('L4 at exactly (1/2 - mu, +sqrt(3)/2)', () => {
    const L = lagrangePoints(0.05);
    expect(L.L4[0]).toBeCloseTo(0.45, 12);
    expect(L.L4[1]).toBeCloseTo(SQRT3_HALF, 12);
  });
  it('L5 at exactly (1/2 - mu, -sqrt(3)/2)', () => {
    const L = lagrangePoints(0.05);
    expect(L.L5[0]).toBeCloseTo(0.45, 12);
    expect(L.L5[1]).toBeCloseTo(-SQRT3_HALF, 12);
  });

  it('L1 lies between primaries', () => {
    const mu = 0.05;
    const L = lagrangePoints(mu);
    expect(L.L1[0]).toBeGreaterThan(-mu);
    expect(L.L1[0]).toBeLessThan(1 - mu);
  });

  it('L2 lies outside the secondary on the far side', () => {
    const mu = 0.05;
    const L = lagrangePoints(mu);
    expect(L.L2[0]).toBeGreaterThan(1 - mu);
    expect(L.L2[0]).toBeLessThan(2);
  });

  it('L3 lies on the far side of the primary', () => {
    const mu = 0.05;
    const L = lagrangePoints(mu);
    expect(L.L3[0]).toBeLessThan(-mu);
    expect(L.L3[0]).toBeGreaterThan(-2);
  });

  it('L1 in Earth-Moon system is near 0.836 (Hill radius)', () => {
    const L = lagrangePoints(0.01215);
    expect(L.L1[0]).toBeGreaterThan(0.82);
    expect(L.L1[0]).toBeLessThan(0.86);
  });
});

describe('CR3BP: Routh stability threshold', () => {
  it('mu_Routh ~ 0.0385', () => {
    expect(MU_ROUTH).toBeCloseTo(0.0385208965, 6);
  });
});

describe('CR3BP: Jacobi conservation by velocity-Verlet', () => {
  it('|dC| / |C| < 1e-6 over 5000 steps for a tight L4 orbit (well away from primaries)', () => {
    // Starting near L4 keeps the trajectory bounded away from the primaries,
    // where velocity-Verlet + predictor-corrector gets near-machine-precision
    // Jacobi conservation. Trajectories that swing close to either primary
    // see ~ 1e-2 drift at dt = 0.002.
    const mu = 0.01215;
    const L4 = [0.5 - mu, SQRT3_HALF];
    const sim = createCR3BP({ mu, ic: { q: [L4[0] + 1e-3, L4[1] + 1e-3], v: [0, 0] }, integrator: 'verlet' });
    const C0 = -diagnosticsCR3BP(sim).energy;
    let maxDrift = 0;
    for (let i = 0; i < 5000; i += 1) {
      stepCR3BP(sim, DEFAULT_DT);
      if (i % 100 === 0) {
        const C = -diagnosticsCR3BP(sim).energy;
        const drift = Math.abs((C - C0) / C0);
        if (drift > maxDrift) maxDrift = drift;
      }
    }
    expect(maxDrift).toBeLessThan(1e-6);
  }, 10_000);
});

describe('CR3BP: L4 stability vs Routh', () => {
  it('Earth-Moon mu (0.01215, below Routh): particle near L4 stays close', () => {
    const mu = 0.01215;
    const L4 = [0.5 - mu, SQRT3_HALF];
    const sim = createCR3BP({ mu, ic: { q: [L4[0] + 1e-3, L4[1] + 1e-3], v: [0, 0] }, integrator: 'verlet' });
    let maxDist = 0;
    for (let i = 0; i < 10_000; i += 1) {
      stepCR3BP(sim, DEFAULT_DT);
      if (i % 200 === 0) {
        const dx = sim.inst.q[0] - L4[0];
        const dy = sim.inst.q[1] - L4[1];
        const d = Math.hypot(dx, dy);
        if (d > maxDist) maxDist = d;
      }
    }
    expect(maxDist).toBeLessThan(0.10);
  }, 10_000);

  it('mu = 0.2 (above Routh): particle near L4 escapes (max distance > 0.5)', () => {
    const mu = 0.2;
    const L4 = [0.5 - mu, SQRT3_HALF];
    const sim = createCR3BP({ mu, ic: { q: [L4[0] + 1e-2, L4[1] + 1e-2], v: [0, 0] }, integrator: 'verlet' });
    let maxDist = 0;
    for (let i = 0; i < 15_000; i += 1) {
      stepCR3BP(sim, DEFAULT_DT);
      if (i % 200 === 0) {
        const dx = sim.inst.q[0] - L4[0];
        const dy = sim.inst.q[1] - L4[1];
        const d = Math.hypot(dx, dy);
        if (d > maxDist) maxDist = d;
      }
    }
    expect(maxDist).toBeGreaterThan(0.5);
  }, 15_000);
});
