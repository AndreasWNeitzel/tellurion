// Bouncing-shapes-on-a-concave-surface invariants. Restitution must
// dissipate (e < 1) or conserve (e = 1) energy, balls must stay on or
// above the surface, and small parabola oscillations must match the
// harmonic period 2 pi / sqrt(2 a g).

import { describe, it, expect } from 'vitest';
import {
  createSystem, step, totalEnergy, diagnostics, parabolaPeriod, SHAPES, G,
} from './sim.js';

const DT = 1 / 480;
function run(s, n) { for (let i = 0; i < n; i += 1) step(s, DT); return s; }

describe('bouncing shapes: energy bookkeeping', () => {
  it('e = 1, mu = 0: energy is conserved to a few percent over 6000 steps', () => {
    const s = createSystem({ shape: 'parabola', a: 0.5, e: 1, mu: 0, n: 4, seed: 1 });
    s.E0 = totalEnergy(s);
    run(s, 6000);
    expect(Math.abs(diagnostics(s).energyDrift)).toBeLessThan(0.06);
  });

  it('e < 1: energy is dissipated (never injected) and the balls settle', () => {
    const s = createSystem({ shape: 'vbowl', a: 0.6, e: 0.7, mu: 0.03, n: 5, seed: 2 });
    const E0 = totalEnergy(s);
    let maxSeen = E0;
    for (let k = 0; k < 80; k += 1) {
      run(s, 200);
      maxSeen = Math.max(maxSeen, totalEnergy(s));
    }
    // No spurious energy injection beyond integrator noise...
    expect(maxSeen).toBeLessThan(E0 * 1.02);
    // ...and the restitution has clearly drained the system.
    expect(totalEnergy(s)).toBeLessThan(0.5 * E0);
    expect(diagnostics(s).maxSpeed).toBeLessThan(2.0);
  });
});

describe('bouncing shapes: containment and shapes', () => {
  it('balls never sink far below any surface', () => {
    for (const shape of Object.keys(SHAPES)) {
      const s = createSystem({ shape, a: 0.5, e: 0.9, mu: 0.02, n: 5, seed: 3 });
      run(s, 8000);
      expect(diagnostics(s).maxPen).toBeLessThan(0.05);
    }
  });

  it('SHAPES expose f and df consistently (finite difference of df)', () => {
    for (const k of Object.keys(SHAPES)) {
      const { f, df } = SHAPES[k];
      const x = 0.7, h = 1e-5;
      const num = (f(x + h, 0.5) - f(x - h, 0.5)) / (2 * h);
      expect(Math.abs(num - df(x, 0.5))).toBeLessThan(1e-2);
    }
  });
});

describe('bouncing shapes: parabola small-amplitude period', () => {
  it('a single ball started at small x returns with period 2 pi / sqrt(2 a g)', () => {
    const a = 0.5;
    const s = createSystem({ shape: 'parabola', a, e: 1, mu: 0, n: 1, seed: 9 });
    const b = s.balls[0];
    b.x = 0.12; b.y = SHAPES.parabola.f(0.12, a); b.vx = 0; b.vy = 0;  // released from rest
    const crossings = [];
    let prevx = b.x;
    for (let i = 0; i < 20000; i += 1) {
      step(s, DT);
      if (prevx < 0 && b.x >= 0) crossings.push(s.t);   // upward zero crossings
      prevx = b.x;
    }
    expect(crossings.length).toBeGreaterThanOrEqual(2);
    const measured = crossings[1] - crossings[0];       // one full period
    const expected = parabolaPeriod(a);
    expect(Math.abs(measured - expected) / expected).toBeLessThan(0.08);
  });
});
