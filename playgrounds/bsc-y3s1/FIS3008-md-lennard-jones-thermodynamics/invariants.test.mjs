// Lennard-Jones MD: the analytic LJ landmarks and shifted-force
// continuity, velocity-Verlet energy conservation, momentum
// conservation, the repulsive no-overlap core, the kinetic
// temperature, the g(r) structure, the ideal-gas pressure limit,
// and determinism. The integrator is the verified shared symplectic
// engine; these pin the LJ layer and the thermodynamic estimators.

import { describe, it, expect } from 'vitest';
import {
  makeLJ, ljStep, ljPotential, ljForce, ljPotentialRaw, ljForceRaw,
  temperature, pressure, totalMomentum, minPairDistance,
  radialDistribution, rescaleTo, diagnostics, RC,
} from './sim.js';

const close = (a, b, t) => expect(Math.abs(a - b)).toBeLessThan(t);

describe('md-lennard-jones-thermodynamics invariants', () => {
  it('LJ landmarks and shifted-force continuity', () => {
    close(ljPotentialRaw(1), 0, 1e-12);                  // U(sigma) = 0
    close(ljPotentialRaw(2 ** (1 / 6)), -1, 1e-12);      // well depth -epsilon
    close(ljForceRaw(2 ** (1 / 6)), 0, 1e-10);           // force zero at the minimum
    close(ljPotential(RC), 0, 1e-12);                    // shifted: U(rc) = 0
    close(ljForce(RC), 0, 1e-12);                        // shifted: F(rc) = 0
    expect(ljForce(0.9)).toBeGreaterThan(0);             // strongly repulsive core
  });

  it('velocity-Verlet conserves total energy (NVE)', () => {
    // Per-particle absolute drift is the well-posed MD criterion;
    // |dE/E| is ill-conditioned because total E (KE + negative PE)
    // can pass through zero.
    const s = makeLJ({ N: 100, rho: 0.55, T0: 1.0, seed: 0xC0FFEE });
    ljStep(s, 0.002, 400);                               // settle
    const e0 = diagnostics(s.inst).energy;
    for (let k = 0; k < 40; k += 1) ljStep(s, 0.002, 50);
    const e1 = diagnostics(s.inst).energy;
    expect(Math.abs(e1 - e0) / s.N).toBeLessThan(1e-3);
  });

  it('total momentum stays zero', () => {
    const s = makeLJ({ N: 100, rho: 0.6, T0: 1.2, seed: 7 });
    expect(totalMomentum(s)).toBeLessThan(1e-9);
    ljStep(s, 0.004, 1500);
    expect(totalMomentum(s)).toBeLessThan(1e-8);
  });

  it('no particle overlap (repulsive core holds)', () => {
    const s = makeLJ({ N: 144, rho: 0.7, T0: 1.5, seed: 0xC0FFEE });
    let mn = Infinity;
    for (let k = 0; k < 40; k += 1) { ljStep(s, 0.004, 40); mn = Math.min(mn, minPairDistance(s)); }
    expect(mn).toBeGreaterThan(0.7);
  });

  it('kinetic temperature matches the rescaled target', () => {
    const s = makeLJ({ N: 120, rho: 0.5, T0: 1.0, seed: 3 });
    for (let k = 0; k < 30; k += 1) { ljStep(s, 0.004, 40); if (k % 5 === 0) rescaleTo(s, 1.0); }
    rescaleTo(s, 1.0);
    let acc = 0;
    for (let k = 0; k < 40; k += 1) { ljStep(s, 0.004, 20); acc += temperature(s); }
    close(acc / 40, 1.0, 0.18);
  });

  it('g(r) has an excluded core, a first peak, and tends to 1', () => {
    const s = makeLJ({ N: 196, rho: 0.7, T0: 1.0, seed: 0xC0FFEE });
    for (let k = 0; k < 60; k += 1) { ljStep(s, 0.004, 40); if (k % 6 === 0) rescaleTo(s, 1.0); }
    const { r, g } = radialDistribution(s, 80);
    for (let b = 0; b < g.length; b += 1) if (r[b] < 0.8) expect(g[b]).toBeLessThan(0.15);
    let gmax = 0, rmaxAt = 0;
    for (let b = 0; b < g.length; b += 1) if (r[b] < 2 && g[b] > gmax) { gmax = g[b]; rmaxAt = r[b]; }
    expect(gmax).toBeGreaterThan(1.3);                   // a structured first peak
    expect(rmaxAt).toBeGreaterThan(1.0);
    expect(rmaxAt).toBeLessThan(1.4);                    // near the LJ minimum
    let tail = 0, nt = 0;
    for (let b = 0; b < g.length; b += 1) if (r[b] > 0.8 * r[g.length - 1]) { tail += g[b]; nt += 1; }
    close(tail / nt, 1.0, 0.25);
  });

  it('ideal-gas pressure when no pair interacts (virial = 0)', () => {
    // rho = 0.01 puts the lattice spacing at ~10 sigma, far beyond
    // the 2.5 cutoff; at low T the particles barely move over a few
    // steps so no pair ever enters the cutoff and the virial is
    // identically zero, giving P = rho T exactly.
    const s = makeLJ({ N: 64, rho: 0.01, T0: 0.3, seed: 11 });
    ljStep(s, 0.002, 60);
    expect(minPairDistance(s)).toBeGreaterThan(RC);      // no interactions
    const T = temperature(s);
    expect(Math.abs(pressure(s, T) / (s.rho * T) - 1)).toBeLessThan(1e-9);
  });

  it('determinism: same seed reproduces the trajectory', () => {
    const a = makeLJ({ N: 80, rho: 0.6, T0: 1.0, seed: 42 });
    const b = makeLJ({ N: 80, rho: 0.6, T0: 1.0, seed: 42 });
    ljStep(a, 0.004, 400); ljStep(b, 0.004, 400);
    for (let i = 0; i < 2 * a.N; i += 1) close(a.inst.q[i], b.inst.q[i], 1e-12);
    const c = makeLJ({ N: 80, rho: 0.6, T0: 1.0, seed: 43 });
    ljStep(c, 0.004, 400);
    let diff = 0;
    for (let i = 0; i < 2 * a.N; i += 1) diff += Math.abs(a.inst.q[i] - c.inst.q[i]);
    expect(diff).toBeGreaterThan(1e-3);
  });
});
