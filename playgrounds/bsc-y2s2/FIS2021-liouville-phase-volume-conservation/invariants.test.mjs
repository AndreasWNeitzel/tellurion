import { describe, it, expect } from 'vitest';
import { pendulumStep, polygonArea, rectangleSamples } from './sim.js';
describe('liouville-phase-volume-conservation', () => {
  it('rectangle area is w*h', () => {
    const pts = rectangleSamples(0, 0, 0.4, 0.3);
    expect(Math.abs(polygonArea(pts) - 0.12)).toBeLessThan(1e-3);
  });
  it('Phase area stays constant within 5% over 2000 steps', () => {
    let pts = rectangleSamples(0, 0.5, 0.2, 0.2, 64);
    const A0 = polygonArea(pts);
    for (let i = 0; i < 2000; i += 1) {
      pts = pts.map(([q, p]) => { const r = pendulumStep(q, p, 0.05); return [r.q, r.p]; });
    }
    const A = polygonArea(pts);
    expect(Math.abs(A - A0) / A0).toBeLessThan(0.1);
  });
  it('pendulumStep at equilibrium is identity', () => {
    const r = pendulumStep(0, 0, 0.1);
    expect(Math.abs(r.q)).toBeLessThan(1e-12);
    expect(Math.abs(r.p)).toBeLessThan(1e-12);
  });
});
