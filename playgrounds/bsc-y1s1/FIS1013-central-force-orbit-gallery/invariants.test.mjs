// Central-force orbits: conservation under the symplectic integrator,
// the Bertrand closed-orbit cases, the virial theorem, and bound vs
// unbound classification.

import { describe, it, expect } from 'vitest';
import { createOrbit, step, energy, angularMomentum, lrlAngle, orbitClass, potential, MU } from './sim.js';

function run(s, n, dt) { for (let i = 0; i < n; i += 1) step(s, dt); }

describe('central-force-orbit-gallery invariants', () => {
  it('energy conserved within 1e-4 over 2e4 Verlet steps (Kepler)', () => {
    const s = createOrbit({ k: -1, p: -1, L: 1.0, r0: 1.6 });
    const E0 = energy(s);
    run(s, 20000, 0.002);
    expect(Math.abs((energy(s) - E0) / E0)).toBeLessThan(1e-4);
  });

  it('angular momentum conserved within 1e-7 (central force)', () => {
    const s = createOrbit({ k: -1, p: -1, L: 1.0, r0: 1.6 });
    const L0 = angularMomentum(s);
    run(s, 20000, 0.002);
    expect(Math.abs(angularMomentum(s) - L0)).toBeLessThan(1e-7);
  });

  it('inverse-square: perihelion is fixed (closed ellipse)', () => {
    const s = createOrbit({ k: -1, p: -1, L: 1.0, r0: 1.6 });
    const a0 = lrlAngle(s);
    let maxDrift = 0;
    for (let i = 0; i < 30000; i += 1) { step(s, 0.002); let d = Math.abs(lrlAngle(s) - a0); d = Math.min(d, 2 * Math.PI - d); maxDrift = Math.max(maxDrift, d); }
    expect(maxDrift).toBeLessThan(0.02);
  });

  it('non-inverse-square precesses (rosette): perihelion drifts', () => {
    const s = createOrbit({ k: 0.5, p: 2, L: 1.0, r0: 1.4 });
    const a0 = lrlAngle(s);
    let maxDrift = 0;
    for (let i = 0; i < 6000; i += 1) { step(s, 0.002); let d = Math.abs(lrlAngle(s) - a0); d = Math.min(d, 2 * Math.PI - d); maxDrift = Math.max(maxDrift, d); }
    expect(maxDrift).toBeGreaterThan(0.2);
  });

  it('virial theorem: time-averaged 2<T> = p<V> within 4%', () => {
    // Isotropic oscillator V = k r^2 (p = 2): 2<T> = 2<V>.
    const s = createOrbit({ k: 0.5, p: 2, L: 1.0, r0: 1.4 });
    let sT = 0, sV = 0, N = 0;
    for (let i = 0; i < 60000; i += 1) {
      step(s, 0.002);
      sT += 0.5 * MU * (s.vx * s.vx + s.vy * s.vy);
      sV += potential(Math.hypot(s.x, s.y), s.k, s.p);
      N += 1;
    }
    const T = sT / N, V = sV / N;
    expect(Math.abs(2 * T - 2 * V) / Math.abs(2 * V)).toBeLessThan(0.04);
  });

  it('bound vs unbound classification by total energy', () => {
    // Attractive 1/r, low speed -> bound; high speed -> unbound.
    const bound = createOrbit({ k: -1, p: -1, L: 0.8, r0: 1.5 });
    expect(orbitClass(bound)).toBe('bound');
    const fast = createOrbit({ k: -1, p: -1, L: 3.0, r0: 1.5, vr0: 3.0 });
    expect(orbitClass(fast)).toBe('unbound');
  });
});
