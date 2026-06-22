// Invariants for parametric resonance: the undamped Mathieu instability tongue at a=1,
// the stable region between tongues, the stabilizing effect of damping, the parameter
// map, and the reduction of the integrator to a conservative oscillator when h = beta = 0.

import { describe, it, expect } from 'vitest';
import { mathieuStep, mathieuParams, floquetGrowth } from './sim.js';

describe('Mathieu instability tongue', () => {
  it('is unstable on the principal resonance a=1 with modulation', () => {
    expect(floquetGrowth(1, 0.3, 0)).toBeGreaterThan(1);
    expect(floquetGrowth(1, 0.1, 0)).toBeGreaterThan(1);
  });
  it('sits on the boundary at a=1 with no modulation', () => {
    expect(floquetGrowth(1, 0, 0)).toBeCloseTo(1, 4);
  });
  it('is stable between tongues', () => {
    expect(floquetGrowth(2.3, 0.2, 0)).toBeLessThan(1.001);
  });
});

describe('Damping stabilizes', () => {
  it('a tongue point that is unstable undamped becomes stable with enough damping', () => {
    expect(floquetGrowth(1, 0.08, 0)).toBeGreaterThan(1);
    expect(floquetGrowth(1, 0.08, 0.4)).toBeLessThan(1);
  });
});

describe('Parameter map', () => {
  it('the principal resonance is at drive ratio 2 (a=1)', () => {
    expect(mathieuParams(2, 0.3, 0.05).a).toBeCloseTo(1, 9);
    expect(mathieuParams(2, 0.3, 0.05).q).toBeCloseTo(0.15, 9);
    expect(mathieuParams(1, 0.3, 0.05).a).toBeCloseTo(4, 9);
  });
});

describe('Integrator limit', () => {
  it('conserves energy as a plain oscillator when h = beta = 0', () => {
    let th = 1, thd = 0, t = 0; const dt = 0.005, E0 = 0.5 * (thd * thd + th * th);
    for (let i = 0; i < 2000; i += 1) { [th, thd] = mathieuStep(th, thd, t, 1, 2, 0, 0, dt); t += dt; }
    expect(0.5 * (thd * thd + th * th)).toBeCloseTo(E0, 4);
  });
});
