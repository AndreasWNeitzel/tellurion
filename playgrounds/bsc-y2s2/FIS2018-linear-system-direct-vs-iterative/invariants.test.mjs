import { describe, it, expect } from 'vitest';
import { thomas, makePoissonRHS, residual, jacobiStep, gaussSeidelStep, conjugateGradientStep, applyA } from './sim.js';
describe('linear-system-direct-vs-iterative', () => {
  it('Thomas solves N=8 system to high accuracy', () => {
    const b = makePoissonRHS(8);
    const x = thomas(b);
    expect(residual(x, b)).toBeLessThan(1e-10);
  });
  it('Jacobi residual decreases monotonically', () => {
    const N = 10, b = makePoissonRHS(N);
    let x = new Float64Array(N);
    const r0 = residual(x, b);
    for (let i = 0; i < 50; i += 1) x = jacobiStep(x, b);
    expect(residual(x, b)).toBeLessThan(r0);
  });
  it('GS converges faster than Jacobi', () => {
    const N = 10, b = makePoissonRHS(N);
    let xJ = new Float64Array(N), xGS = new Float64Array(N);
    for (let i = 0; i < 30; i += 1) { xJ = jacobiStep(xJ, b); xGS = gaussSeidelStep(xGS, b); }
    expect(residual(xGS, b)).toBeLessThan(residual(xJ, b));
  });
  it('CG converges in N steps (exact arithmetic)', () => {
    const N = 8, b = makePoissonRHS(N);
    let x = new Float64Array(N);
    let r = b.slice(), p = b.slice();
    for (let i = 0; i < N; i += 1) ({ x, r, p } = conjugateGradientStep(x, r, p, b));
    expect(residual(x, b)).toBeLessThan(1e-8);
  });
  it('applyA correct on basis vector', () => {
    const e = new Float64Array(5); e[2] = 1;
    const Ae = applyA(e);
    expect(Ae[1]).toBe(-1); expect(Ae[2]).toBe(2); expect(Ae[3]).toBe(-1);
  });
});
