import { describe, it, expect } from 'vitest';
import { miyamotoPotential, rk4Orbit, forceR, forceZ, effPotential, orbitEnergy, leapfrogMeridional } from './sim.js';
const KPC = 3.086e19, M = 5e40, A = 3 * KPC, B = 0.3 * KPC;
describe('orbits-in-axisymmetric-potential', () => {
  it('Potential negative', () => {
    expect(miyamotoPotential(1e20, 0, 1e41, 5e19, 3e18)).toBeLessThan(0);
  });
  it('Force radial inward', () => {
    expect(forceR(1e20, 0, 1e41, 5e19, 3e18)).toBeLessThan(0);
  });
  it('Force vertical points toward midplane', () => {
    expect(forceZ(1e20, 1e19, 1e41, 5e19, 3e18)).toBeLessThan(0);
    expect(forceZ(1e20, -1e19, 1e41, 5e19, 3e18)).toBeGreaterThan(0);
  });
  it('rk4 advances state', () => {
    const s0 = [1e20, 1e18, 0, 5e4];
    const s1 = rk4Orbit(s0, 1e12, 1e41, 5e19, 3e18);
    expect(s1[1]).not.toBe(s0[1]);
  });
  it('effPotential adds a positive centrifugal term for L_z != 0', () => {
    const R = 8 * KPC, z = 0.4 * KPC, Lz = 8 * KPC * 1.8e5;
    expect(effPotential(R, z, M, A, B, Lz)).toBeGreaterThan(miyamotoPotential(R, z, M, A, B));
    expect(effPotential(R, z, M, A, B, 0)).toBeCloseTo(miyamotoPotential(R, z, M, A, B), 6);
  });
  it('leapfrog conserves orbit energy to < 1e-3 over 20000 steps (symplectic)', () => {
    const Lz = 8 * KPC * 0.8e5;                 // sub-circular -> bound rosette
    let s = [8 * KPC, 0, 0, 4e4];
    const E0 = orbitEnergy(s, M, A, B, Lz);
    let worst = 0;
    for (let i = 0; i < 20000; i += 1) {
      s = leapfrogMeridional(s, 4e13, M, A, B, Lz);
      const d = Math.abs((orbitEnergy(s, M, A, B, Lz) - E0) / E0);
      if (d > worst) worst = d;
    }
    expect(worst).toBeLessThan(1e-3);
  });
  it('centrifugal barrier keeps R bounded away from 0 (no plunge) and below apo', () => {
    const Lz = 8 * KPC * 0.8e5;
    let s = [8 * KPC, 0, 0, 4e4];
    let Rmin = s[0], Rmax = s[0];
    for (let i = 0; i < 20000; i += 1) {
      s = leapfrogMeridional(s, 4e13, M, A, B, Lz);
      if (s[0] < Rmin) Rmin = s[0];
      if (s[0] > Rmax) Rmax = s[0];
    }
    // Released with vR=0 at R0 and sub-circular v_phi, the star falls
    // inward: R0 is the apocentre and peri < R0, a bound annulus.
    expect(Rmin).toBeGreaterThan(0.5 * KPC);   // never plunges to the centre
    expect(Rmin).toBeLessThan(7.5 * KPC);      // genuinely dips inside R0
    expect(Rmax).toBeGreaterThan(7.9 * KPC);   // apo stays at the release radius
    expect(Rmax).toBeLessThan(9 * KPC);        // bounded (no secular blow-up)
  });
});
