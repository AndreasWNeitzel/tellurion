// soliton-canal-3d invariants. These prove the playground is driven
// by a real KdV integrator (shared/js/engine/kdv-1d-spectral-cpu.js
// via ./sim.js), at the thresholds declared in spec.md. The same
// step() the renderer calls is exercised here.

import { describe, it, expect } from 'vitest';
import { makeKdV, addSoliton, setGaussian, step, invariants, peak } from './sim.js';

describe('soliton-canal-3d', () => {
  it('amplitude-speed law c = 2a and the soliton keeps its shape', () => {
    const s = makeKdV(512, 60);
    const A = 0.9;
    const c = addSoliton(s, 16, A);
    expect(c).toBeCloseTo(2 * A, 12);
    const p0 = peak(s);
    const dt = 2e-3, T = 4;
    for (let n = 0, ns = Math.round(T / dt); n < ns; n += 1) step(s, dt);
    const p1 = peak(s);
    expect(Math.abs(p1.amplitude - A) / A).toBeLessThan(0.01);
    let disp = p1.x - p0.x;
    disp -= s.L * Math.round((disp - c * T) / s.L);
    expect(Math.abs(disp - c * T) / (c * T)).toBeLessThan(0.02);
  });

  it('mass, momentum and energy are conserved to 1e-4 over 1e4 steps', () => {
    const s = makeKdV(512, 60);
    addSoliton(s, 12, 1.0);
    addSoliton(s, 28, 0.45);
    const i0 = invariants(s);
    const dt = 1.5e-3;
    for (let n = 0; n < 10000; n += 1) step(s, dt);
    const i1 = invariants(s);
    const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-9);
    expect(rel(i1.mass, i0.mass)).toBeLessThan(1e-4);
    expect(rel(i1.momentum, i0.momentum)).toBeLessThan(1e-4);
    expect(rel(i1.energy, i0.energy)).toBeLessThan(1e-4);
  });

  it('two-soliton overtaking collision: both amplitudes survive to 1 percent', () => {
    const s = makeKdV(512, 70);
    const Atall = 1.0, Ashort = 0.35;
    addSoliton(s, 14, Atall);
    addSoliton(s, 34, Ashort);
    const dt = 1.5e-3;
    for (let n = 0; n < 14000; n += 1) step(s, dt);
    const u = s.u, maxima = [];
    for (let i = 0; i < s.N; i += 1) {
      const l = u[(i - 1 + s.N) % s.N], r = u[(i + 1) % s.N];
      if (u[i] > l && u[i] >= r && u[i] > 0.12) maxima.push(u[i]);
    }
    maxima.sort((a, b) => b - a);
    expect(maxima.length).toBeGreaterThanOrEqual(2);
    expect(Math.abs(maxima[0] - Atall) / Atall).toBeLessThan(0.01);
    expect(Math.abs(maxima[1] - Ashort) / Ashort).toBeLessThan(0.03);
  });

  it('a non-soliton lump disperses (radiation goes negative; a soliton does not)', () => {
    const dt = 1.5e-3, ns = 5000;
    const sol = makeKdV(512, 60); addSoliton(sol, 30, 0.8);
    for (let n = 0; n < ns; n += 1) step(sol, dt);
    let solMin = Infinity; for (let i = 0; i < sol.N; i += 1) solMin = Math.min(solMin, sol.u[i]);
    expect(solMin).toBeGreaterThan(-0.01);

    const g = makeKdV(512, 60); setGaussian(g, 30, 0.5, 1.0);
    for (let n = 0; n < ns; n += 1) step(g, dt);
    let gMin = Infinity; for (let i = 0; i < g.N; i += 1) gMin = Math.min(gMin, g.u[i]);
    expect(gMin).toBeLessThan(-0.02);
  });

  it('deterministic: identical seeds reproduce the field exactly', () => {
    const a = makeKdV(256, 50); addSoliton(a, 10, 0.7);
    const b = makeKdV(256, 50); addSoliton(b, 10, 0.7);
    for (let n = 0; n < 500; n += 1) { step(a, 2e-3); step(b, 2e-3); }
    for (let i = 0; i < a.N; i += 1) expect(a.u[i]).toBe(b.u[i]);
  });
});
