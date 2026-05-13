// 2D Gauss's law invariants.
// (a) Flux through any ellipse enclosing the charge equals q / epsilon_0.
// (b) Flux through any ellipse NOT enclosing the charge is zero.
// (c) Flux is invariant under shape deformation as long as the charge stays inside.
// (d) Flux scales linearly with charge magnitude.

import { describe, it, expect } from 'vitest';
import {
  field, ellipse, blob, flux, insideEllipse,
  EPS0, Q_C,
} from './sim.js';

const Q_TEST = 1e-9;
const Q_OVER_EPS = Q_TEST / EPS0;

describe('gauss-law-flux-through-surface', () => {
  it('flux through unit circle around point charge equals q / eps_0', () => {
    const c = ellipse(0, 0, 1, 1);
    const f = flux(c, 0, 0, Q_TEST);
    expect(Math.abs(f - Q_OVER_EPS) / Q_OVER_EPS).toBeLessThan(1e-6);
  });

  it('flux invariant under ellipse aspect ratio (charge inside)', () => {
    const c1 = ellipse(0, 0, 1, 1);
    const c2 = ellipse(0, 0, 2, 0.5);
    const c3 = ellipse(0, 0, 0.5, 1.5);
    const f1 = flux(c1, 0, 0, Q_TEST);
    const f2 = flux(c2, 0, 0, Q_TEST);
    const f3 = flux(c3, 0, 0, Q_TEST);
    expect(Math.abs(f1 - f2) / f1).toBeLessThan(1e-6);
    expect(Math.abs(f1 - f3) / f1).toBeLessThan(1e-6);
  });

  it('flux is zero when charge is outside the curve', () => {
    // Charge at (3, 0), circle around origin radius 1.
    const c = ellipse(0, 0, 1, 1);
    const f = flux(c, 3, 0, Q_TEST);
    expect(Math.abs(f) / Q_OVER_EPS).toBeLessThan(1e-6);
  });

  it('flux invariant under blob deformation when charge is inside', () => {
    const c1 = ellipse(0, 0, 1, 1);
    const c2 = blob(0, 0, 1, 1, 0.3, 3);
    const f1 = flux(c1, 0, 0, Q_TEST);
    const f2 = flux(c2, 0, 0, Q_TEST);
    expect(Math.abs(f1 - f2) / f1).toBeLessThan(1e-6);
  });

  it('flux scales linearly with charge', () => {
    const c = ellipse(0, 0, 1, 1);
    const f1 = flux(c, 0, 0, Q_TEST);
    const f2 = flux(c, 0, 0, 3 * Q_TEST);
    expect(Math.abs(f2 - 3 * f1) / f1).toBeLessThan(1e-6);
  });

  it('insideEllipse correctly identifies enclosed charges', () => {
    expect(insideEllipse(0, 0, 0, 0, 1, 1)).toBe(true);
    expect(insideEllipse(2, 0, 0, 0, 1, 1)).toBe(false);
    expect(insideEllipse(0.5, 0, 0, 0, 1, 1)).toBe(true);
  });

  it('field is repulsive (E_x > 0 to the right of positive charge)', () => {
    const { Ex } = field(1, 0, 0, 0, 1);
    expect(Ex).toBeGreaterThan(0);
  });
});
