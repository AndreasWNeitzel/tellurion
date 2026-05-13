// Foucault pendulum invariants.
// (a) Energy bounded (Coriolis force does no work).
// (b) Precession period = T_reference / sin(latitude).
// (c) Equator: no precession.
// (d) Pole: precession period equals T_reference.
// (e) Hemisphere sign flip.
// (f) Swing plane actually precesses (y oscillation appears from x-only IC).

import { describe, it, expect } from 'vitest';
import {
  createFoucault, stepFoucault, omegaZ, precessionPeriod,
  OMEGA_0, T_PRECESS_REFERENCE,
} from './sim.js';

describe('Foucault: energy bounded', () => {
  it('|delta E / E_0| < 1e-3 over 5000 RK4 steps', () => {
    const s = createFoucault({ latDeg: 45 });
    function E(s) { return 0.5 * (s.vx * s.vx + s.vy * s.vy) + 0.5 * OMEGA_0 * OMEGA_0 * (s.x * s.x + s.y * s.y); }
    const E0 = E(s);
    for (let i = 0; i < 5000; i += 1) stepFoucault(s, 0.005);
    expect(Math.abs((E(s) - E0) / E0)).toBeLessThan(1e-3);
  });
});

describe('Foucault: precession-period formula', () => {
  it('T_precess = T_reference / sin(lat) exact', () => {
    for (const lat of [10, 30, 45, 60, 80, 90]) {
      const phi = (lat * Math.PI) / 180;
      expect(precessionPeriod(lat)).toBeCloseTo(T_PRECESS_REFERENCE / Math.sin(phi), 9);
    }
  });
});

describe('Foucault: equator has no precession', () => {
  it('omegaZ(0) = 0 exactly', () => {
    expect(omegaZ(0)).toBe(0);
  });
});

describe('Foucault: pole precesses at T_reference', () => {
  it('precessionPeriod(90) = T_reference within 1e-9', () => {
    expect(precessionPeriod(90)).toBeCloseTo(T_PRECESS_REFERENCE, 9);
  });
});

describe('Foucault: hemisphere sign flip', () => {
  it('omegaZ(lat) = -omegaZ(-lat)', () => {
    for (const lat of [10, 45, 75]) {
      expect(omegaZ(lat)).toBeCloseTo(-omegaZ(-lat), 12);
    }
  });
});

describe('Foucault: swing plane precesses', () => {
  it('at the pole, starting from x = 1, y = 0: max(|y|) > 0.5 within a quarter precession period', () => {
    const lat = 90;
    const s = createFoucault({ latDeg: lat, x0: 1.0, y0: 0, vx0: 0, vy0: 0 });
    const t_quarter = precessionPeriod(lat) / 4;
    const dt = 0.005;
    const N = Math.round(t_quarter / dt);
    let maxY = 0;
    for (let i = 0; i < N; i += 1) {
      stepFoucault(s, dt);
      if (Math.abs(s.y) > maxY) maxY = Math.abs(s.y);
    }
    expect(maxY).toBeGreaterThan(0.5);
  });
});
