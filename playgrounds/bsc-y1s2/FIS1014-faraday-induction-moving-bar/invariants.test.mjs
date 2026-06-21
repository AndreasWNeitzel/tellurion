// Faraday sliding-bar invariant tests. The physics is closed form, so these are
// exact relations plus the long-time terminal limit and energy balance.

import { describe, it, expect } from 'vitest';
import {
  createBar, stepBar, diagnostics, emf, terminalVelocity, dragCoeff, MASS,
} from './sim.js';

describe('Faraday motional EMF', () => {
  it('EMF equals B L v exactly', () => {
    for (const [B, L, v] of [[0.5, 0.4, 1.2], [1.0, 1.0, 2.0], [2.0, 1.5, 0.3]]) {
      expect(emf(B, L, v)).toBeCloseTo(B * L * v, 12);
    }
  });
  it('the current is the EMF over the resistance', () => {
    const s = createBar({ B: 0.8, L: 0.6, R: 3, v0: 1.5 });
    const d = diagnostics(s);
    expect(d.current).toBeCloseTo(emf(0.8, 0.6, 1.5) / 3, 12);
  });
});

describe('Lenz drag and terminal velocity', () => {
  it('the magnetic force opposes the motion (positive drag coefficient)', () => {
    expect(dragCoeff(1, 1, 2)).toBeGreaterThan(0);
    const s = createBar({ v0: 1 });
    expect(diagnostics(s).Fmag).toBeGreaterThan(0);
  });
  it('a constant force drives the bar to the analytic terminal velocity', () => {
    const s = createBar({ B: 1, L: 1, R: 2, Fapp: 1 });
    const vt = terminalVelocity(1, 1, 1, 2);
    for (let i = 0; i < 40000; i += 1) stepBar(s, 0.002);   // many time constants
    expect(s.v).toBeCloseTo(vt, 4);
    expect(vt).toBeCloseTo(1 * 2 / (1 * 1 * 1 * 1), 12);    // F R / (B^2 L^2) = 2
  });
  it('with no applied force the bar coasts to rest (free decay)', () => {
    const s = createBar({ B: 1, L: 1, R: 2, Fapp: 0, v0: 3 });
    const v0 = s.v;
    for (let i = 0; i < 20000; i += 1) stepBar(s, 0.002);
    expect(s.v).toBeLessThan(0.01 * v0);
    expect(s.v).toBeGreaterThanOrEqual(0);
  });
});

describe('Energy conservation', () => {
  it('mechanical input minus Ohmic dissipation equals the kinetic-energy rate', () => {
    const s = createBar({ B: 0.9, L: 0.7, R: 2.5, Fapp: 0.8 });
    for (let n = 0; n < 30; n += 1) {
      const before = 0.5 * s.m * s.v * s.v;
      const d = diagnostics(s);
      const dt = 1e-4;
      stepBar(s, dt);
      const after = 0.5 * s.m * s.v * s.v;
      // numerical d(KE)/dt over the step matches Pin - Pdiss to first order.
      expect((after - before) / dt).toBeCloseTo(d.dKE, 1);
    }
  });
  it('at terminal velocity the input power equals the dissipated power', () => {
    const s = createBar({ B: 1.1, L: 0.8, R: 4, Fapp: 0.6 });
    for (let i = 0; i < 60000; i += 1) stepBar(s, 0.002);
    const d = diagnostics(s);
    expect(d.Pin).toBeCloseTo(d.Pdiss, 3);
    expect(Math.abs(d.dKE)).toBeLessThan(1e-3);
  });
});
