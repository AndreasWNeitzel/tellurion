import { describe, it, expect } from 'vitest';
import { makeGrid, seedImpulse, step, totalEnergy } from './sim.js';

describe('wave-heightfield-clickable-3d', () => {
  it('initial energy zero', () => {
    const s = makeGrid(32);
    expect(totalEnergy(s, 1, 1)).toBe(0);
  });
  it('impulse increases energy', () => {
    const s = makeGrid(64);
    seedImpulse(s, 32, 32, 0.5, 3);
    expect(totalEnergy(s, 1, 1)).toBeGreaterThan(0);
  });
  it('zero damping: energy nearly conserved over 1000 steps', () => {
    const s = makeGrid(64);
    seedImpulse(s, 32, 32, 0.5, 3);
    const E0 = totalEnergy(s, 1, 1);
    for (let i = 0; i < 1000; i += 1) step(s, 0.5, 0, 0.1);
    const E1 = totalEnergy(s, 1, 1);
    expect(Math.abs(E1 - E0) / E0).toBeLessThan(0.6);
  });
  it('damped wave: energy decays', () => {
    const s = makeGrid(64);
    seedImpulse(s, 32, 32, 0.5, 3);
    const E0 = totalEnergy(s, 1, 1);
    for (let i = 0; i < 2000; i += 1) step(s, 0.5, 0.1, 0.5);
    expect(totalEnergy(s, 1, 1)).toBeLessThan(E0);
  });
  it('Dirichlet BC: edges stay near zero', () => {
    const s = makeGrid(48);
    seedImpulse(s, 24, 24, 1, 5);
    for (let i = 0; i < 500; i += 1) step(s, 0.4, 0, 0.5);
    const N = s.N;
    for (let x = 0; x < N; x += 1) {
      expect(Math.abs(s.u[x])).toBeLessThan(1e-5);
      expect(Math.abs(s.u[(N - 1) * N + x])).toBeLessThan(1e-5);
    }
  });
});
