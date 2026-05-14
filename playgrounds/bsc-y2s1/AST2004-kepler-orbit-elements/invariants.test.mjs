import { describe, it, expect } from 'vitest';
import { solveKepler, trueAnomaly, elementsToPos } from './sim.js';
describe('kepler-orbit-elements', () => {
  it('solveKepler converges for e=0.5, M=1', () => {
    const E = solveKepler(1, 0.5);
    expect(Math.abs(E - 0.5 * Math.sin(E) - 1)).toBeLessThan(1e-9);
  });
  it('circular orbit: r = a', () => {
    const p = elementsToPos(1, 0, 0.3, 0.5, 0.2, 1.7);
    expect(Math.abs(p.r - 1)).toBeLessThan(1e-12);
  });
  it('inclination 0: z = 0', () => {
    const p = elementsToPos(1, 0.3, 0, 0.5, 0.2, 1.7);
    expect(Math.abs(p.z)).toBeLessThan(1e-12);
  });
  it('inclination 90 deg: z varies', () => {
    const p = elementsToPos(1, 0.0, Math.PI / 2, 0, 0, Math.PI / 2);
    expect(Math.abs(p.z)).toBeGreaterThan(0.9);
  });
  it('e=0.9 perihelion distance: r = a(1-e)', () => {
    const p = elementsToPos(1, 0.9, 0, 0, 0, 0);
    expect(Math.abs(p.r - 0.1)).toBeLessThan(1e-12);
  });
});
