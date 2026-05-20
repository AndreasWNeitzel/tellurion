import { describe, it, expect } from 'vitest';
import {
  chemicalPotential, thomasFermiRadius, healingLength,
  vortexAreaDensity, vortexCount, vortexSpacing, vortexLattice,
  density, phase, angularMomentumPerAtom, OMEGA_MAX,
} from './sim.js';

describe('bec-vortex-lattice-3d', () => {
  it('Thomas-Fermi mu scales as (N a_s)^{2/5}', () => {
    // mu = (1/2) (15 N a_s)^{2/5}, so mu(8X)/mu(X) = 8^{2/5}.
    const m1 = chemicalPotential(1);
    const m8 = chemicalPotential(8);
    expect(m8 / m1).toBeCloseTo(Math.pow(8, 0.4), 6);
  });

  it('Thomas-Fermi radius R = (15 N a_s)^{1/5}', () => {
    // doubling 15 N a_s multiplies R by 2^{1/5}.
    const r1 = thomasFermiRadius(1);
    const r2 = thomasFermiRadius(2);
    expect(r2 / r1).toBeCloseTo(Math.pow(2, 0.2), 6);
  });

  it('healing length xi = 1/sqrt(2 mu)', () => {
    const mu = chemicalPotential(1.5);
    expect(healingLength(1.5)).toBeCloseTo(1 / Math.sqrt(2 * mu), 9);
  });

  it('Feynman vortex density n_v = Omega / pi', () => {
    expect(vortexAreaDensity(0.4)).toBeCloseTo(0.4 / Math.PI, 9);
  });

  it('vortex spacing -> infinity as Omega -> 0', () => {
    expect(vortexSpacing(1e-6)).toBeGreaterThan(1000);
  });

  it('vortex count grows monotonically with Omega', () => {
    let prev = 0;
    for (let w = 0.05; w <= 0.9; w += 0.05) {
      const n = vortexCount(w, 2.0);
      expect(n).toBeGreaterThanOrEqual(prev);
      prev = n;
    }
  });

  it('vortex count grows with N a_s (larger condensate, more vortices)', () => {
    const small = vortexCount(0.5, 1.0);
    const big = vortexCount(0.5, 4.0);
    expect(big).toBeGreaterThan(small);
  });

  it('lattice points all fall inside the TF disk', () => {
    const lat = vortexLattice(0.5, 2.0);
    const R = thomasFermiRadius(2.0);
    for (const v of lat) {
      expect(Math.hypot(v.x, v.y)).toBeLessThan(R);
    }
  });

  it('density vanishes at each vortex core', () => {
    const lat = vortexLattice(0.5, 2.0);
    if (lat.length === 0) return;
    const v = lat[0];
    expect(density(v.x, v.y, 0.5, 2.0, lat)).toBeCloseTo(0, 9);
  });

  it('density vanishes outside the TF radius', () => {
    const Na = 2.0;
    const R = thomasFermiRadius(Na);
    expect(density(R + 0.5, 0, 0.5, Na, [])).toBe(0);
  });

  it('density is positive at the center for Omega = 0 (no vortices yet)', () => {
    expect(density(0, 0, 0, 2.0, [])).toBeGreaterThan(0);
  });

  it('phase winds by 2 pi around a single vortex', () => {
    const lat = [{ x: 0, y: 0 }];
    const r = 0.3;
    let total = 0;
    const N = 200;
    let prev = phase(r, 0, lat);
    for (let i = 1; i <= N; i++) {
      const th = (i / N) * 2 * Math.PI;
      const ph = phase(r * Math.cos(th), r * Math.sin(th), lat);
      let dph = ph - prev;
      while (dph > Math.PI) dph -= 2 * Math.PI;
      while (dph < -Math.PI) dph += 2 * Math.PI;
      total += dph;
      prev = ph;
    }
    expect(Math.abs(total - 2 * Math.PI)).toBeLessThan(1e-3);
  });

  it('L_z / N scales linearly with Omega', () => {
    const r1 = angularMomentumPerAtom(0.2, 2.0);
    const r2 = angularMomentumPerAtom(0.4, 2.0);
    expect(r2 / r1).toBeCloseTo(2, 6);
  });

  it('rotation is capped below the centrifugal limit', () => {
    expect(OMEGA_MAX).toBeLessThan(1);
  });
});
