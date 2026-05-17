// tests/engines/chorin-2d-cpu.test.mjs
// Reference tests for shared/js/engine/chorin-2d-cpu.js (2D
// incompressible Navier-Stokes, Chorin projection). These are the
// invariants the spec promises are reachable OFFLINE on a coarse
// grid with a converged projection:
//  1. converged projection drives max|div u| < 1e-3 (strong);
//  2. projection idempotence: re-projecting a divergence-free field
//     barely moves it, < 1e-6 (strong);
//  3. determinism: identical inputs reproduce the field, < 1e-12
//     (no RNG, bitwise-stable);
//  4. boundedness: no NaN/Inf and bounded speed at Re=1000 over
//     >= 2000 steps (strong);
//  5. Stokes top-bottom symmetry for a centred obstacle at Re=1,
//     < 5% RMS (strong);
//  6. a constant scalar is preserved exactly by semi-Lagrangian
//     advection (medium; the conservative-transport sanity bound).

import { describe, it, expect } from 'vitest';
import {
  createState, setBlockObstacle, step, project, divergenceMax,
  advectScalar, cellVelocity,
} from '../../shared/js/engine/chorin-2d-cpu.js';

const finiteAll = (a) => { for (let i = 0; i < a.length; i += 1) if (!Number.isFinite(a[i])) return false; return true; };
const maxAbs = (a) => { let m = 0; for (let i = 0; i < a.length; i += 1) m = Math.max(m, Math.abs(a[i])); return m; };

describe('chorin-2d-cpu engine invariants', () => {
  it('a converged projection drives max|div u| below 1e-3', () => {
    const s = createState(44, 32, 100);
    setBlockObstacle(s, 0.3, 3, 4);
    for (let n = 0; n < 6; n += 1) step(s, 0.02, { projOpts: { tol: 1e-7, maxIter: 6000 } });
    expect(divergenceMax(s)).toBeLessThan(1e-3);
  });

  it('projection is the identity on an exactly divergence-free field', () => {
    // the uniform inflow stream u=1, v=0 is exactly divergence-free
    // and BC-consistent (no obstacle): projecting it must not move it
    const s = createState(40, 30, 100);
    const u0 = s.u.slice(), v0 = s.v.slice();
    project(s, { tol: 1e-9, maxIter: 4000 });
    let d = 0;
    for (let k = 0; k < u0.length; k += 1) d = Math.max(d, Math.abs(s.u[k] - u0[k]), Math.abs(s.v[k] - v0[k]));
    expect(d).toBeLessThan(1e-6);
  });

  it('is deterministic: identical inputs reproduce the field', () => {
    const mk = () => { const s = createState(40, 30, 200); setBlockObstacle(s, 0.3, 3, 3); for (let n = 0; n < 25; n += 1) step(s, 0.02, { projOpts: { tol: 1e-5, maxIter: 800 } }); return s; };
    const a = mk(), b = mk();
    let d = 0;
    for (let k = 0; k < a.u.length; k += 1) d = Math.max(d, Math.abs(a.u[k] - b.u[k]), Math.abs(a.v[k] - b.v[k]));
    expect(d).toBeLessThan(1e-12);
  });

  it('stays finite and bounded at Re=1000 over 2000 steps', () => {
    const s = createState(36, 28, 1000);
    setBlockObstacle(s, 0.3, 2, 3);
    for (let n = 0; n < 2000; n += 1) step(s, 0.02, { diffuseSweeps: 12, projOpts: { tol: 1e-3, maxIter: 120 } });
    expect(finiteAll(s.u)).toBe(true);
    expect(finiteAll(s.v)).toBe(true);
    expect(maxAbs(s.u)).toBeLessThan(50);
    expect(maxAbs(s.v)).toBeLessThan(50);
  });

  it('Stokes flow (Re=1) past a centred block is top-bottom symmetric', () => {
    const NX = 48, NY = 32;
    const s = createState(NX, NY, 1);
    setBlockObstacle(s, 0.35, 3, 4);
    for (let n = 0; n < 500; n += 1) step(s, 0.02, { diffuseSweeps: 24, projOpts: { tol: 1e-6, maxIter: 1500 } });
    const { uc, vc } = cellVelocity(s);              // compare cell-centred
    let su = 0, du = 0, sv = 0, dv = 0;
    for (let j = 2; j < NY - 2; j += 1) {
      const jm = NY - 1 - j;
      for (let i = 2; i < NX - 2; i += 1) {
        const k = j * NX + i, km = jm * NX + i;
        su += uc[k] * uc[k]; du += (uc[k] - uc[km]) ** 2;        // u symmetric
        sv += vc[k] * vc[k]; dv += (vc[k] + vc[km]) ** 2;        // v antisymmetric
      }
    }
    expect(Math.sqrt(du / (su || 1))).toBeLessThan(0.05);
    expect(Math.sqrt(dv / (sv || 1))).toBeLessThan(0.05);
  });

  it('a constant scalar is preserved by semi-Lagrangian advection', () => {
    const s = createState(40, 30, 100);
    setBlockObstacle(s, 0.3, 3, 3);
    const scal = new Float64Array(40 * 30); scal.fill(1);
    for (let n = 0; n < 150; n += 1) {
      step(s, 0.02, { projOpts: { tol: 1e-4, maxIter: 400 } });
      advectScalar(s, scal, 0.02);
    }
    // interior (away from the boundary ring) must stay at 1
    let m = 0;
    for (let j = 2; j < 28; j += 1) for (let i = 2; i < 38; i += 1) m = Math.max(m, Math.abs(scal[j * 40 + i] - 1));
    expect(m).toBeLessThan(1e-6);
  });
});
