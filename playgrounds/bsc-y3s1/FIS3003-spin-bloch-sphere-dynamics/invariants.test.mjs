// Spin-1/2 Bloch dynamics: Rodrigues rotation correctness, exact norm
// conservation, free Larmor precession (Sz and the cone angle fixed,
// azimuth advancing at w0), resonant pi- and pi/2-pulses, the
// generalized off-resonance Rabi formula, the deepest-inversion bound
// and time-reversibility. The numeric lab-frame integrator is pinned
// to the closed-form rotating-frame solution.

import { describe, it, expect } from 'vitest';
import {
  cross, norm, rodrigues, omega, stepBloch, evolve,
  genRabi, rabiSz, maxInversionSz, blochAngles,
} from './sim.js';

const close = (a, b, t = 1e-9) => expect(Math.abs(a - b)).toBeLessThan(t);

describe('spin-bloch-sphere-dynamics invariants', () => {
  it('Rodrigues rotates correctly and preserves length', () => {
    const a = rodrigues([1, 0, 0], [0, 0, 1], Math.PI / 2);
    close(a[0], 0, 1e-12); close(a[1], 1, 1e-12); close(a[2], 0, 1e-12);
    const b = rodrigues([0, 0, 1], [1, 0, 0], Math.PI);     // z -> -z
    close(b[0], 0, 1e-12); close(b[1], 0, 1e-12); close(b[2], -1, 1e-12);
    const v = [0.3, -0.7, 0.5], full = rodrigues(v, [0.2, 0.9, -0.4], 2 * Math.PI);
    close(full[0], v[0], 1e-12); close(full[1], v[1], 1e-12); close(full[2], v[2], 1e-12);
    const c = cross([1, 0, 0], [0, 1, 0]); close(c[2], 1, 1e-15);
  });

  it('|S| is conserved to machine precision under a time-varying drive', () => {
    const p = { w0: 1.0, w1: 0.4, wrf: 0.9 };
    let S = [0.2, -0.3, Math.sqrt(1 - 0.04 - 0.09)];
    const dt = (2 * Math.PI / p.wrf) / 400;
    for (let i = 0; i < 6000; i += 1) S = stepBloch(S, i * dt, dt, p);
    close(norm(S), 1, 1e-9);
  });

  it('free Larmor: Sz and cone fixed, azimuth advances at w0', () => {
    const th = 0.7, p = { w0: 1.3, w1: 0, wrf: 0 };
    const S0 = [Math.sin(th), 0, Math.cos(th)];
    const T = 5.0, dt = T / 4000;
    const S = evolve(S0, p, T, dt);
    close(norm(S), 1, 1e-9);
    close(S[2], Math.cos(th), 1e-9);                          // Sz fixed
    close(Math.hypot(S[0], S[1]), Math.sin(th), 1e-9);        // cone fixed
    const phi = Math.atan2(S[1], S[0]);
    const want = ((p.w0 * T) % (2 * Math.PI));
    close(((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), want, 1e-7);
  });

  it('resonant pi-pulse inverts +z to -z', () => {
    const p = { w0: 1.3, w1: 0.5, wrf: 1.3 };                 // delta = 0
    const T = Math.PI / p.w1;
    const dt = (2 * Math.PI / p.w0) / 600;
    const S = evolve([0, 0, 1], p, T, dt);
    close(norm(S), 1, 1e-9);
    expect(S[2]).toBeLessThan(-0.998);                        // inverted
    close(S[2], rabiSz(T, p.w1, p.w0 - p.wrf), 2e-3);
  });

  it('resonant pi/2-pulse lands on the equator', () => {
    const p = { w0: 1.1, w1: 0.6, wrf: 1.1 };
    const T = Math.PI / (2 * p.w1);
    const dt = (2 * Math.PI / p.w0) / 600;
    const S = evolve([0, 0, 1], p, T, dt);
    close(norm(S), 1, 1e-9);
    close(S[2], 0, 3e-3);
    close(blochAngles(S).theta, Math.PI / 2, 4e-3);
  });

  it('off-resonance Sz tracks the generalized Rabi formula', () => {
    const w1 = 0.5, delta = 0.7, w0 = 1.4;
    const p = { w0, w1, wrf: w0 - delta };
    const dt = (2 * Math.PI / w0) / 800;
    for (const t of [1.0, 2.3, 4.1, 6.0, 9.0]) {
      const S = evolve([0, 0, 1], p, t, dt);
      close(S[2], rabiSz(t, w1, delta), 2e-3);
    }
    close(genRabi(w1, delta), Math.hypot(w1, delta), 1e-12);
  });

  it('deepest off-resonance inversion matches the analytic bound', () => {
    const w1 = 0.45, delta = 0.6, w0 = 1.2;
    const p = { w0, w1, wrf: w0 - delta };
    const OR = genRabi(w1, delta);
    const tDip = Math.PI / OR;                                // cos(OR t) = -1
    const dt = (2 * Math.PI / w0) / 800;
    const S = evolve([0, 0, 1], p, tDip, dt);
    close(S[2], maxInversionSz(w1, delta), 3e-3);
    expect(maxInversionSz(w1, delta)).toBeGreaterThan(-1);    // never full off resonance
  });

  it('integration is time-reversible', () => {
    const p = { w0: 1.0, w1: 0.5, wrf: 0.8 };
    const S0 = [0, 0, 1];
    const T = 7.0, dt = (2 * Math.PI / p.w0) / 500;
    const n = Math.round(T / dt), h = T / n;
    let S = [...S0];
    for (let i = 0; i < n; i += 1) S = stepBloch(S, i * h, h, p);
    // Exact inverse: reuse each forward step's midpoint axis, which
    // for the step launched at i*h is omega((i+1)*h - h/2).
    for (let i = n - 1; i >= 0; i -= 1) S = stepBloch(S, (i + 1) * h, -h, p);
    close(S[0], S0[0], 1e-7); close(S[1], S0[1], 1e-7); close(S[2], S0[2], 1e-7);
  });
});
