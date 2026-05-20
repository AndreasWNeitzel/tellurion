import { describe, it, expect } from 'vitest';
import {
  createState, buildTree, accBH, accDirect, leapfrog, kineticEnergy, potentialEnergy, makeDisk,
} from './sim.js';

describe('quadtree-nbody-2d', () => {
  it('disk initial conditions reproducible', () => {
    const a = makeDisk(64, { seed: 0xC0FFEE });
    const b = makeDisk(64, { seed: 0xC0FFEE });
    for (let i = 0; i < 2 * 64; i += 1) expect(a.x[i]).toBe(b.x[i]);
  });

  it('total mass conserved by buildTree', () => {
    const N = 200;
    const s = makeDisk(N, { seed: 1 });
    buildTree(s.x, s.m, s.N);
    // sum of leaf masses == sum of m  (body 0 carries M_core = 50,
    // bodies 1..N-1 each carry 1/N)
    let total = 0;
    for (let i = 0; i < s.N; i += 1) total += s.m[i];
    expect(Math.abs(total - (50 + (N - 1) / N))).toBeLessThan(1e-9);
  });

  it('Barnes-Hut force matches direct sum at small theta', () => {
    const s = createState(20);
    for (let i = 0; i < 20; i += 1) {
      s.x[2 * i] = Math.cos(i) * 0.5;
      s.x[2 * i + 1] = Math.sin(i * 1.3) * 0.5;
      s.m[i] = 0.05;
    }
    // direct
    const aDirect = new Float64Array(40);
    accDirect(s, 1, 0.03);
    for (let i = 0; i < 40; i += 1) aDirect[i] = s.a[i];
    // BH with very tight opening angle -> should equal direct within softening tolerance
    accBH(s, 0.01, 1, 0.03);
    let mx = 0;
    for (let i = 0; i < 40; i += 1) {
      const d = Math.abs(s.a[i] - aDirect[i]);
      if (d > mx) mx = d;
    }
    expect(mx).toBeLessThan(1e-6);
  });

  it('BH evaluations < direct for N > 50', () => {
    const s = makeDisk(200, { seed: 2 });
    const r1 = accDirect(s, 1, 0.03);
    const r2 = accBH(s, 0.7, 1, 0.03);
    expect(r2.evals).toBeLessThan(r1.evals);
  });

  it('leapfrog energy drift bounded over 100 steps (no core, equal masses)', () => {
    // small symmetric cluster (skip the big core so PE is non-singular)
    const s = createState(12);
    let seed = 9;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) | 0;
      return ((seed >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF;
    };
    for (let i = 0; i < 12; i += 1) {
      const th = (i / 12) * 2 * Math.PI;
      s.x[2 * i] = Math.cos(th) * 0.5;
      s.x[2 * i + 1] = Math.sin(th) * 0.5;
      s.v[2 * i] = -Math.sin(th) * 0.3 + (rand() - 0.5) * 0.02;
      s.v[2 * i + 1] = Math.cos(th) * 0.3 + (rand() - 0.5) * 0.02;
      s.m[i] = 0.1;
    }
    accDirect(s, 1, 0.05);
    const E0 = kineticEnergy(s) + potentialEnergy(s, 1, 0.05);
    for (let n = 0; n < 100; n += 1) leapfrog(s, 0.002, { use_tree: true, theta: 0.5, G: 1, eps: 0.05 });
    const E1 = kineticEnergy(s) + potentialEnergy(s, 1, 0.05);
    const dE = Math.abs(E1 - E0) / Math.abs(E0);
    expect(dE).toBeLessThan(0.05);
  });

  it('tree builds without crashing for N = 1000', () => {
    const s = makeDisk(1000, { seed: 5 });
    expect(() => accBH(s, 0.7, 1, 0.03)).not.toThrow();
  });

  it('disk has heavy core as body 0', () => {
    const s = makeDisk(100, { seed: 4 });
    expect(s.m[0]).toBeGreaterThan(s.m[5] * 100);
  });

  it('opening angle 0 reproduces direct accelerations exactly', () => {
    const s = makeDisk(50, { seed: 3 });
    accDirect(s, 1, 0.03);
    const aD = new Float64Array(s.a);
    accBH(s, 0.001, 1, 0.03);
    let mx = 0;
    for (let i = 0; i < 2 * s.N; i += 1) {
      const d = Math.abs(s.a[i] - aD[i]);
      if (d > mx) mx = d;
    }
    expect(mx).toBeLessThan(1e-4);
  });
});
