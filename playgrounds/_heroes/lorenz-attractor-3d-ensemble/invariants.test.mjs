import { describe, it, expect } from 'vitest';
import { initEnsemble, rk4, centroid } from './sim.js';
describe('lorenz-ensemble', () => {
  it('initial ensemble within microscopic ball', () => {
    const s = initEnsemble(100, 1e-3, 0xC0FFEE);
    const c0 = centroid(s);
    expect(Math.hypot(c0[0] - 1, c0[1] - 1, c0[2] - 1)).toBeLessThan(0.01);
  });
  it('after 4000 steps, attractor centroid ~ (0, 0, 23.6)', () => {
    const s = initEnsemble(200, 1e-3);
    for (let i = 0; i < 4000; i += 1) rk4(s, 0.01);
    const c = centroid(s);
    expect(c[2]).toBeGreaterThan(15);
    expect(c[2]).toBeLessThan(30);
  });
  it('ensemble diameter grows initially', () => {
    const s = initEnsemble(100, 1e-3);
    const initSpread = (() => { let s2 = 0; for (let i = 0; i < 100; i += 1) s2 += s[3 * i] ** 2; return s2; })();
    for (let i = 0; i < 500; i += 1) rk4(s, 0.01);
    let s2 = 0; for (let i = 0; i < 100; i += 1) s2 += s[3 * i] ** 2;
    expect(s2).toBeGreaterThan(initSpread);
  });
});
