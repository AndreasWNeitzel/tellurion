import { describe, it, expect } from 'vitest';
import { makeOrrery, makeOrreryInstance, step, diagnostics, nbodyAccel3D, nbodyEnergy3D } from './sim.js';

describe('n-body-orrery-3d', () => {
  it('orrery reproducible from same seed', () => {
    const a = makeOrrery({ seed: 0xC0FFEE });
    const b = makeOrrery({ seed: 0xC0FFEE });
    for (let i = 0; i < a.positions.length; i += 1) expect(a.positions[i]).toBe(b.positions[i]);
  });

  it('sun at origin', () => {
    const o = makeOrrery({});
    expect(o.positions[0]).toBe(0);
    expect(o.positions[1]).toBe(0);
    expect(o.positions[2]).toBe(0);
  });

  it('ghost asteroids start separated by ~ 1e-6 phase', () => {
    const o = makeOrrery({});
    const i0 = 1 + o.n_planets;
    const i1 = i0 + 1;
    const dx = o.positions[3 * i0] - o.positions[3 * i1];
    const dy = o.positions[3 * i0 + 1] - o.positions[3 * i1 + 1];
    const dz = o.positions[3 * i0 + 2] - o.positions[3 * i1 + 2];
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    expect(d).toBeGreaterThan(1e-9);
    expect(d).toBeLessThan(1e-3);
  });

  it('Yoshida-4 conserves energy to bounded drift over 1000 steps', () => {
    const inst = makeOrreryInstance({});
    const E0 = diagnostics(inst).energy;
    for (let n = 0; n < 1000; n += 1) step(inst, 0.005);
    const E1 = diagnostics(inst).energy;
    const drift = Math.abs(E1 - E0) / Math.abs(E0);
    expect(drift).toBeLessThan(1e-2);
  });

  it('ghost separation grows over time', () => {
    const inst = makeOrreryInstance({});
    const orr = inst.orrery;
    const i0 = 1 + orr.n_planets, i1 = i0 + 1;
    const sep0 = Math.sqrt(
      (inst.q[3 * i0] - inst.q[3 * i1]) ** 2
      + (inst.q[3 * i0 + 1] - inst.q[3 * i1 + 1]) ** 2
      + (inst.q[3 * i0 + 2] - inst.q[3 * i1 + 2]) ** 2);
    for (let n = 0; n < 4000; n += 1) step(inst, 0.005);
    const sep1 = Math.sqrt(
      (inst.q[3 * i0] - inst.q[3 * i1]) ** 2
      + (inst.q[3 * i0 + 1] - inst.q[3 * i1 + 1]) ** 2
      + (inst.q[3 * i0 + 2] - inst.q[3 * i1 + 2]) ** 2);
    // Chaos: separation grows (numerical experiment shows it goes
    // ~1.5e6x by 6000 steps; 2x by 4000 is conservative).
    expect(sep1).toBeGreaterThan(sep0 * 2);
  });

  it('nbody acceleration is Newton-3 symmetric', () => {
    const o = makeOrrery({});
    const out = new Float64Array(o.positions.length);
    nbodyAccel3D(o.positions, o.velocities, o.masses, 0, out);
    // Sum of momentum changes = 0 (Newton's 3rd law)
    let sumX = 0, sumY = 0, sumZ = 0;
    const N = o.N;
    for (let i = 0; i < N; i += 1) {
      sumX += o.masses[3 * i] * out[3 * i];
      sumY += o.masses[3 * i] * out[3 * i + 1];
      sumZ += o.masses[3 * i] * out[3 * i + 2];
    }
    expect(Math.abs(sumX)).toBeLessThan(1e-10);
    expect(Math.abs(sumY)).toBeLessThan(1e-10);
    expect(Math.abs(sumZ)).toBeLessThan(1e-10);
  });

  it('total energy is finite', () => {
    const o = makeOrrery({});
    const E = nbodyEnergy3D(o.positions, o.velocities, o.masses);
    expect(Number.isFinite(E)).toBe(true);
  });
});
