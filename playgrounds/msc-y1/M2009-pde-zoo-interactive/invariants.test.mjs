import { describe, it, expect } from 'vitest';
import {
  makeGrid, makeWave, stepWave, waveAnalytic, waveEnergy,
  makeHeat, stepHeat, heatAnalytic, solvePoisson, poissonAnalytic,
  makeSchrodinger, stepSchrodinger, schrodingerNorm,
  makeBurgers, stepBurgers, burgersIntegral, burgersEnergy, maxError,
} from './sim.js';

describe('pde-zoo-interactive invariants', () => {
  const N = 160;

  it('the wave equation reproduces the analytic standing mode and bounds energy', () => {
    let s = makeWave(N, 1.0, 2);
    expect(s.r2).toBeLessThanOrEqual(1);                       // CFL: (c dt/dx)^2 <= 1
    const e0 = waveEnergy(s);
    for (let i = 0; i < 200; i += 1) s = stepWave(s);
    expect(maxError(s.u, waveAnalytic(s.x, s.t, 1.0, 2))).toBeLessThan(5e-3);
    let drift = 0;
    for (let i = 0; i < 400; i += 1) { s = stepWave(s); drift = Math.max(drift, Math.abs(waveEnergy(s) / e0 - 1)); }
    expect(drift).toBeLessThan(0.05);                          // leapfrog energy bounded
  });

  it('the heat equation decays at the analytic rate and is monotone', () => {
    let s = makeHeat(N, 0.02, 3);
    const peak0 = Math.max(...s.u);
    let prevPeak = peak0;
    for (let k = 0; k < 60; k += 1) {
      s = stepHeat(s);
      const pk = Math.max(...s.u);
      expect(pk).toBeLessThanOrEqual(prevPeak + 1e-9);         // monotone decay (no growth)
      prevPeak = pk;
    }
    expect(maxError(s.u, heatAnalytic(s.x, s.t, 0.02, 3))).toBeLessThan(3e-3);
    expect(Math.max(...s.u)).toBeLessThan(peak0);              // amplitude shrank
    expect(s.u[0]).toBeCloseTo(0, 9); expect(s.u[N - 1]).toBeCloseTo(0, 9);
  });

  it('the Poisson solve matches the analytic solution and the boundary conditions', () => {
    const P = solvePoisson(N, 2), A = poissonAnalytic(P.x, 2);
    expect(maxError(P.u, A)).toBeLessThan(1e-4);
    expect(P.u[0]).toBe(0); expect(P.u[N - 1]).toBe(0);        // Dirichlet 0
    // interior residual of u'' = -sin(k x): small
    const dx = 1 / (N - 1), k = 2 * Math.PI;
    let res = 0;
    for (let i = 1; i < N - 1; i += 1) {
      const lap = (P.u[i + 1] - 2 * P.u[i] + P.u[i - 1]) / (dx * dx);
      res = Math.max(res, Math.abs(lap + Math.sin(k * P.x[i])));
    }
    expect(res).toBeLessThan(1e-2);
  });

  it('the Schrodinger Crank-Nicolson step is unitary (norm conserved)', () => {
    let s = makeSchrodinger(N);
    const n0 = schrodingerNorm(s);
    expect(n0).toBeCloseTo(1, 6);                              // packet normalised
    let maxRel = 0;
    for (let i = 0; i < 300; i += 1) { s = stepSchrodinger(s); maxRel = Math.max(maxRel, Math.abs(schrodingerNorm(s) / n0 - 1)); }
    expect(maxRel).toBeLessThan(1e-9);                         // unitary
    // a stationary packet spreads: spatial variance grows over time
    const variance = (st) => {
      const h = 1 / (N - 1); let n = 0, mx = 0;
      for (let i = 0; i < N; i += 1) { const p = (st.re[i] ** 2 + st.im[i] ** 2) * h; n += p; mx += p * st.x[i]; }
      mx /= n; let v = 0;
      for (let i = 0; i < N; i += 1) v += ((st.re[i] ** 2 + st.im[i] ** 2) * h) * (st.x[i] - mx) ** 2;
      return v / n;
    };
    let g = makeSchrodinger(N, 0.5, 0, 0.06);                  // centred, zero momentum
    const vStart = variance(g);
    for (let i = 0; i < 4000; i += 1) g = stepSchrodinger(g);
    expect(variance(g)).toBeGreaterThan(vStart);               // free-particle dispersion
  });

  it('Burgers conserves the integral of u and dissipates its energy', () => {
    let s = makeBurgers(N, 0.005);
    const q0 = burgersIntegral(s), e0 = burgersEnergy(s);
    let prevE = e0;
    for (let i = 0; i < 500; i += 1) {
      s = stepBurgers(s);
      expect(burgersEnergy(s)).toBeLessThanOrEqual(prevE + 1e-9); // viscous dissipation
      prevE = burgersEnergy(s);
    }
    expect(Math.abs(burgersIntegral(s) - q0)).toBeLessThan(1e-8); // mass conserved
    expect(burgersEnergy(s)).toBeLessThan(e0);
    // more viscosity dissipates faster, compared at the SAME physical time
    let lo = makeBurgers(N, 0.001), hi = makeBurgers(N, 0.02);
    const Tend = 0.15;
    while (lo.t < Tend) lo = stepBurgers(lo);
    while (hi.t < Tend) hi = stepBurgers(hi);
    expect(burgersEnergy(hi)).toBeLessThan(burgersEnergy(lo));
  });

  it('deterministic: identical setups reproduce every PDE bit-for-bit', () => {
    let a = makeWave(N, 1, 2), b = makeWave(N, 1, 2);
    for (let i = 0; i < 50; i += 1) { a = stepWave(a); b = stepWave(b); }
    expect(a.u[80]).toBe(b.u[80]);
    expect(solvePoisson(N, 3).u[77]).toBe(solvePoisson(N, 3).u[77]);
    let p = makeSchrodinger(N), q = makeSchrodinger(N);
    for (let i = 0; i < 40; i += 1) { p = stepSchrodinger(p); q = stepSchrodinger(q); }
    expect(p.re[90]).toBe(q.re[90]);
    expect(maxError([1, 2, 3], [1, 2, 3.5])).toBeCloseTo(0.5, 12);
  });
});
