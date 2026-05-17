// Tight-binding: the 1D dispersion and bandwidth, Brillouin-zone
// periodicity, the group velocity vanishing at the band edges, the
// band-edge effective mass, the SSH gap and chiral symmetry, the 2D
// extrema and van Hove saddle, the 1D DOS normalization and band-
// edge divergence, and the band filling.

import { describe, it, expect } from 'vitest';
import {
  E1D, vGroup1D, curvature1D, effMassBottom, sshBands, sshGap,
  E2D, dos1D, filling1D, fermiSurface2D,
} from './sim.js';

const close = (a, b, t = 1e-9) => expect(Math.abs(a - b)).toBeLessThan(t);

describe('band-structure-tight-binding invariants', () => {
  it('1D dispersion: E = eps +- 2t at k = 0, pi/a; width 4t', () => {
    const t = 1.3, e0 = 0.5;
    close(E1D(0, t, e0), e0 - 2 * t, 1e-12);              // band bottom
    close(E1D(Math.PI, t, e0), e0 + 2 * t, 1e-12);        // band top (a=1)
    close(E1D(Math.PI / 2, t, e0), e0, 1e-12);            // mid-band
    close(E1D(Math.PI, t, e0) - E1D(0, t, e0), 4 * t, 1e-12);
  });

  it('E(k) is 2 pi / a periodic and even', () => {
    const t = 0.9;
    for (const k of [0.3, 1.1, 2.7]) {
      close(E1D(k + 2 * Math.PI, t), E1D(k, t), 1e-12);
      close(E1D(-k, t), E1D(k, t), 1e-12);
    }
  });

  it('group velocity vanishes at the band edges, peaks mid-zone', () => {
    const t = 1.1;
    close(vGroup1D(0, t), 0, 1e-12);
    close(vGroup1D(Math.PI, t), 0, 1e-12);
    expect(Math.abs(vGroup1D(Math.PI / 2, t))).toBeGreaterThan(Math.abs(vGroup1D(0.1, t)));
    // numeric dE/dk matches the analytic group velocity
    const h = 1e-6, k = 0.8;
    close((E1D(k + h, t) - E1D(k - h, t)) / (2 * h), vGroup1D(k, t), 1e-6);
  });

  it('band-edge effective mass m* = hbar^2 / (2 t a^2)', () => {
    const t = 1.4;
    close(curvature1D(0, t), 2 * t, 1e-12);               // d2E/dk2 at bottom
    close(1 / curvature1D(0, t), effMassBottom(t), 1e-12);
    expect(curvature1D(Math.PI, t)).toBeLessThan(0);      // hole-like at the top
  });

  it('SSH chain: gap 2|t1-t2| at the zone boundary, chiral symmetry', () => {
    const b = sshBands(Math.PI, 1.0, 0.4);
    close(b.plus - b.minus, sshGap(1.0, 0.4), 1e-9);      // gap at k = pi
    close(sshGap(1.0, 0.4), 2 * 0.6, 1e-12);
    const g = sshBands(0.7, 1.0, 1.0);
    close(g.plus + g.minus, 0, 1e-12);                    // E+ = -E- (chiral)
    expect(sshGap(1, 1)).toBe(0);                         // uniform chain: gapless
    // closed form equals the 2x2 Bloch eigenvalue
    const t1 = 1.2, t2 = 0.5, k = 0.9;
    const re = t1 + t2 * Math.cos(k), im = -t2 * Math.sin(k);
    close(sshBands(k, t1, t2).plus, Math.hypot(re, im), 1e-12);
  });

  it('2D square: min -4t at Gamma, max +4t at corner, saddle at (pi,0)', () => {
    const t = 1.0;
    close(E2D(0, 0, t), -4 * t, 1e-12);
    close(E2D(Math.PI, Math.PI, t), 4 * t, 1e-12);
    close(E2D(Math.PI, 0, t), 0, 1e-12);                  // van Hove saddle
    close(E2D(Math.PI, 0, t) - E2D(0, Math.PI, t), 0, 1e-12);
    close(E2D(Math.PI, Math.PI, t) - E2D(0, 0, t), 8 * t, 1e-12);
  });

  it('1D DOS: zero outside the band, diverges at the band edges', () => {
    const t = 1.0;
    expect(dos1D(2.0001 * t, t)).toBe(0);                 // above the top
    expect(dos1D(-2.0001 * t, t)).toBe(0);                // below the bottom
    close(dos1D(0, t), 1 / (Math.PI * 2 * t), 1e-12);     // band centre
    expect(dos1D(1.999 * t, t)).toBeGreaterThan(dos1D(1.5 * t, t));   // van Hove rise
    // normalization: integral of g(E) over the band = 1
    let s = 0; const n = 200000, lo = -2 * t, hi = 2 * t, dE = (hi - lo) / n;
    for (let i = 0; i < n; i += 1) s += dos1D(lo + (i + 0.5) * dE, t) * dE;
    close(s, 1, 5e-3);
  });

  it('band filling: 0 below the band, 1 above, 1/2 at mid-band', () => {
    const t = 1.0;
    close(filling1D(-2 * t, t), 0, 1e-9);
    close(filling1D(2 * t, t), 1, 1e-9);
    close(filling1D(0, t), 0.5, 1e-9);                    // half filled at E = eps0
    expect(filling1D(-3 * t, t)).toBe(0);
    expect(filling1D(3 * t, t)).toBe(1);
  });

  it('2D Fermi surface: empty when E_F is below the band, large at half', () => {
    const t = 1.0;
    expect(fermiSurface2D(-5 * t, t).length).toBe(0);     // below the band: no FS
    const half = fermiSurface2D(0, t, 0, 1, 120);         // half filling (E_F=0)
    expect(half.length).toBeGreaterThan(50);              // the (pi,0)-(0,pi) square
    // every returned point sits on the contour E = E_F
    for (const [kx, ky] of half) close(E2D(kx, ky, t), 0, 5e-2);
  });
});
