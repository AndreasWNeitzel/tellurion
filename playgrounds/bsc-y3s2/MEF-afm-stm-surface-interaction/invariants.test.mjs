import { describe, it, expect } from 'vitest';
import {
  ljPotential, ljForce, ljMinDistance, kappa, stmCurrent,
  decadePerAngstrom, surfaceProfile, stmTopograph, afmForceScan,
  surfaceProfile2D,
} from './sim.js';

describe('afm-stm-surface-interaction invariants', () => {
  it('Lennard-Jones minimum at d = 2^{1/6} sigma with V = -eps and F = 0', () => {
    const eps = 0.02, sig = 3;
    const dm = ljMinDistance(sig);
    expect(dm).toBeCloseTo(Math.pow(2, 1 / 6) * sig, 12);
    expect(ljPotential(dm, eps, sig)).toBeCloseTo(-eps, 9);
    expect(ljForce(dm, eps, sig)).toBeCloseTo(0, 9);
  });

  it('LJ force is repulsive inside the minimum and attractive outside; decays to zero', () => {
    const eps = 0.02, sig = 3, dm = ljMinDistance(sig);
    expect(ljForce(dm * 0.9, eps, sig)).toBeGreaterThan(0);   // repulsive
    expect(ljForce(dm * 1.2, eps, sig)).toBeLessThan(0);      // attractive
    expect(Math.abs(ljPotential(50, eps, sig))).toBeLessThan(1e-6);
    expect(Math.abs(ljForce(50, eps, sig))).toBeLessThan(1e-6);
  });

  it('STM current is exactly I proportional to V exp(-2 kappa d)', () => {
    const phi = 4;
    const k = kappa(phi);
    for (const [d1, d2] of [[5, 6], [3, 5.5], [8, 8.7]]) {
      const ratio = stmCurrent(d1, 1, phi) / stmCurrent(d2, 1, phi);
      expect(ratio).toBeCloseTo(Math.exp(-2 * k * (d1 - d2)), 9);
    }
    // independent of the bias scale
    expect(stmCurrent(5, 2, phi) / stmCurrent(7, 2, phi))
      .toBeCloseTo(stmCurrent(5, 0.3, phi) / stmCurrent(7, 0.3, phi), 9);
    // monotone decreasing in gap
    expect(stmCurrent(6, 1, phi)).toBeLessThan(stmCurrent(5, 1, phi));
  });

  it('STM sensitivity is a decade of current per angstrom (metallic work function)', () => {
    expect(decadePerAngstrom(5.05)).toBeCloseTo(10, 1);       // exact ~ 10 at phi = 5.05 eV
    expect(Math.abs(decadePerAngstrom(5) - 10) / 10).toBeLessThan(0.05); // the rule of thumb
    expect(decadePerAngstrom(4)).toBeCloseTo(Math.exp(2 * kappa(4)), 12);
    expect(kappa(3.80998)).toBeCloseTo(1, 9);                 // kappa = sqrt(phi/3.81)
  });

  it('STM constant-current topograph reproduces the surface corrugation exactly', () => {
    const Iset = 1e-3, V = 0.1, phi = 4.5, amp = 0.6, a = 5;
    let off = null, maxDev = 0;
    for (let x = 0; x < 20; x += 0.37) {
      const h = stmTopograph(x, Iset, V, phi, amp, a);
      const dz = h - surfaceProfile(x, amp, a);
      if (off === null) off = dz;
      maxDev = Math.max(maxDev, Math.abs(dz - off));
    }
    expect(maxDev).toBeLessThan(1e-9);                        // topograph = surface + const
  });

  it('AFM scan: the force is most repulsive over the surface maxima (smallest gap)', () => {
    const h = ljMinDistance(3) + 0.4, a = 4, amp = 0.5;
    const fPeak = afmForceScan(0, h, 0.02, 3, amp, a);        // x=0: z_s max, smallest gap
    const fValley = afmForceScan(a / 2, h, 0.02, 3, amp, a);  // x=a/2: z_s min, largest gap
    expect(fPeak).toBeGreaterThan(fValley);
  });

  it('deterministic: pure functions reproduce outputs exactly', () => {
    expect(stmCurrent(5, 1, 4)).toBe(stmCurrent(5, 1, 4));
    expect(ljForce(3.2, 0.02, 3)).toBe(ljForce(3.2, 0.02, 3));
  });

  it('surfaceProfile2D is bounded by amp, lattice-periodic, and corrugated', () => {
    const amp = 0.6, a = 4;
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < 60; i += 1) for (let j = 0; j < 60; j += 1) {
      const v = surfaceProfile2D(i * 0.31, j * 0.27, amp, a);
      if (v < mn) mn = v; if (v > mx) mx = v;
    }
    expect(mx).toBeLessThanOrEqual(amp + 1e-9);
    expect(mn).toBeGreaterThanOrEqual(-amp - 1e-9);
    expect(mx - mn).toBeGreaterThan(0.3 * amp);                 // real corrugation
    // periodic under (x,y) -> (x + a, y) and (x, y + a)
    expect(surfaceProfile2D(1.3, 2.1, amp, a)).toBeCloseTo(surfaceProfile2D(1.3 + a, 2.1, amp, a), 9);
    expect(surfaceProfile2D(1.3, 2.1, amp, a)).toBeCloseTo(surfaceProfile2D(1.3, 2.1 + a, amp, a), 9);
  });
});
