// Heat equation: energy conservation in an insulated box, the
// high-vs-low diffusivity rate, the steady Laplace balance and the
// linear conduction profile, and CFL stability.

import { describe, it, expect } from 'vitest';
import { createGrid, setFixed, setKappa, step, cflDt, totalHeat, variance, maxResidual, applyPreset } from './sim.js';

describe('heat-equation-2d-gpu invariants', () => {
  it('insulated box, no source: total heat conserved within 0.1%', () => {
    const g = createGrid(40);
    for (let j = 12; j < 28; j += 1) for (let i = 12; i < 28; i += 1) g.T[j * 40 + i] = 5; // hot blob
    const H0 = totalHeat(g);
    const dt = cflDt(g);
    for (let n = 0; n < 4000; n += 1) step(g, dt);
    expect(Math.abs(totalHeat(g) - H0) / H0).toBeLessThan(1e-3);
  });

  it('higher diffusivity equilibrates faster at equal physical time', () => {
    const mk = (kp) => { const g = createGrid(40); for (let i = 0; i < g.kap.length; i += 1) g.kap[i] = kp; for (let j = 16; j < 24; j += 1) for (let i = 16; i < 24; i += 1) g.T[j * 40 + i] = 8; return g; };
    const evolveTo = (g, Tend) => { const dt = cflDt(g); let t = 0; while (t < Tend) { step(g, dt); t += dt; } };
    const hi = mk(4), lo = mk(0.5);
    evolveTo(hi, 20); evolveTo(lo, 20);          // same elapsed physical time
    expect(variance(hi)).toBeLessThan(variance(lo));
  });

  it('uniform-kappa steady state is a linear profile (Laplace) within 1%', () => {
    const N = 50, g = createGrid(N);
    for (let j = 0; j < N; j += 1) { setFixed(g, 0, j, 1); setFixed(g, N - 1, j, 0); }
    const dt = cflDt(g);
    for (let n = 0; n < 20000; n += 1) step(g, dt);
    const mid = Math.floor(N / 2);
    for (const i of [10, 20, 30, 40]) {
      const expected = 1 - i / (N - 1);
      expect(Math.abs(g.T[mid * N + i] - expected)).toBeLessThan(1e-2);
    }
    expect(maxResidual(g)).toBeLessThan(5e-3);
  });

  it('composite wall: steeper gradient in the low-conductivity half', () => {
    const g = createGrid(60);
    applyPreset(g, 'composite');
    const dt = cflDt(g);
    for (let n = 0; n < 20000; n += 1) step(g, dt);
    const r = 30 * 60;
    const dLeft = Math.abs(g.T[r + 5] - g.T[r + 25]);     // high-kappa side
    const dRight = Math.abs(g.T[r + 35] - g.T[r + 55]);   // low-kappa side
    expect(dRight).toBeGreaterThan(dLeft);
  });

  it('CFL: at the stable dt the scheme stays bounded; 2x over blows up', () => {
    const g1 = createGrid(30); g1.T[15 * 30 + 15] = 10;
    const dt = cflDt(g1, 0.9);
    for (let n = 0; n < 5000; n += 1) step(g1, dt);
    let finite = true; for (const v of g1.T) if (!Number.isFinite(v) || Math.abs(v) > 1e3) finite = false;
    expect(finite).toBe(true);
    const g2 = createGrid(30); g2.T[15 * 30 + 15] = 10;
    for (let n = 0; n < 400; n += 1) step(g2, dt * 2.5);   // beyond CFL
    let blew = false; for (const v of g2.T) if (!Number.isFinite(v) || Math.abs(v) > 1e6) blew = true;
    expect(blew).toBe(true);
  });

  it('heat flows down-gradient: a hotspot warms its neighbours', () => {
    const g = createGrid(30); g.T[15 * 30 + 15] = 10;
    const before = g.T[15 * 30 + 17];
    const dt = cflDt(g);
    for (let n = 0; n < 200; n += 1) step(g, dt);
    expect(g.T[15 * 30 + 17]).toBeGreaterThan(before);
  });
});
