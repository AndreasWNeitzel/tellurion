import { describe, it, expect } from 'vitest';
import { step, angularMomentum, energy, circularIC, eccentricIC, centralForce } from './sim.js';

describe('gravity-in-n-dimensions-3d', () => {
  it('central force is purely radial (no tangential component)', () => {
    const [fx, fy] = centralForce(0.5, 0.8, 3);
    // F is parallel (and opposite) to r. Cross product = 0.
    const cross = 0.5 * fy - 0.8 * fx;
    expect(Math.abs(cross)).toBeLessThan(1e-12);
  });

  it('d=3 circular orbit IC has |v|^2 = k/r', () => {
    const r = 1.5;
    const ic = circularIC(r, 3, 1.0);
    const v2 = ic.vx * ic.vx + ic.vy * ic.vy;
    expect(Math.abs(v2 - 1 / r)).toBeLessThan(1e-9);
  });

  it('d=3 closed circular orbit: returns near starting point after one period', () => {
    const ic = circularIC(1.0, 3);
    const x0 = ic.x, y0 = ic.y;
    // Period for r=1, v=1, k=1 is T = 2 pi r / v = 2 pi.
    const dt = 0.005;
    const nSteps = Math.round((2 * Math.PI) / dt);
    for (let n = 0; n < nSteps; n += 1) step(ic, dt);
    const dx = ic.x - x0, dy = ic.y - y0;
    expect(Math.sqrt(dx * dx + dy * dy)).toBeLessThan(0.05);
  });

  it('angular momentum conserved (central force) for d=3 over 1000 steps', () => {
    const ic = eccentricIC(1.0, 3, 1.1);
    const L0 = angularMomentum(ic);
    for (let n = 0; n < 1000; n += 1) step(ic, 0.005);
    const L1 = angularMomentum(ic);
    expect(Math.abs(L1 - L0)).toBeLessThan(1e-4);
  });

  it('angular momentum conserved for d=4 (also a central force)', () => {
    const ic = eccentricIC(1.5, 4, 1.05);
    const L0 = angularMomentum(ic);
    for (let n = 0; n < 500; n += 1) step(ic, 0.003);
    const L1 = angularMomentum(ic);
    expect(Math.abs(L1 - L0)).toBeLessThan(1e-3);
  });

  it('d=5 eccentric orbit decays: r reaches < 0.5 r0 within a few periods', () => {
    // A perfectly circular orbit at d=5 is on the unstable knife edge.
    // Perturb with f = 1.1, which tips the orbit toward the centre.
    // Reduce v below circular; at d > 4 this perturbation pulls the
    // orbit into the centre rather than letting it precess.
    const ic = eccentricIC(1.0, 5, 0.9);
    const r0 = Math.sqrt(ic.x * ic.x + ic.y * ic.y);
    let rMin = r0;
    for (let n = 0; n < 2000; n += 1) {
      step(ic, 0.002);
      const r = Math.sqrt(ic.x * ic.x + ic.y * ic.y);
      if (r < rMin) rMin = r;
    }
    // Plunging orbit: minimum radius drops well below the starting
    // radius, the hallmark of d > 4 instability.
    expect(rMin).toBeLessThan(0.5 * r0);
  });

  it('d=2 (log potential) finite energy', () => {
    const ic = circularIC(1.0, 2);
    const E = energy(ic);
    expect(Number.isFinite(E)).toBe(true);
  });

  it('d>2 potential is negative for r > softening', () => {
    const ic = { x: 1, y: 0, vx: 0, vy: 0, d: 3, k: 1, eps: 0.01 };
    const E_K = 0;
    const Etot = energy(ic);
    // Energy = K + V, K = 0 here, so V < 0 for d > 2 with positive k.
    expect(Etot).toBeLessThan(0);
  });
});
