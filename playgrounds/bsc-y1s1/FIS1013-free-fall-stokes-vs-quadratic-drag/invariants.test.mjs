// Free-fall drag invariants.
// (a) Vacuum free fall reaches |v| = g t exactly.
// (b) Stokes terminal velocity v_t = m g / b, reached as t -> infinity.
// (c) Quadratic terminal velocity v_t = sqrt(m g / c), reached as t -> infinity.
// (d) Analytic Stokes v(t) = -v_t (1 - exp(-b t / m)) within 1e-6 (RK4).
// (e) Drag shortens fall time vs vacuum at same height.
// (f) Crossover velocity v_c = b / c above which quadratic dominates.

import { describe, it, expect } from 'vitest';
import {
  createFall, stepFall,
  terminalVelocityStokes, terminalVelocityQuadratic,
  analyticStokesV, analyticVacuum, crossoverV,
  G, M,
} from './sim.js';

function fall(opts, T = 50, dt = 1e-3) {
  const s = createFall(opts);
  const N = Math.round(T / dt);
  for (let i = 0; i < N; i += 1) stepFall(s, dt);
  return s;
}

describe('free-fall-stokes-vs-quadratic-drag', () => {
  it('vacuum: v(t) = -g t exactly', () => {
    const s = createFall({ mode: 'none', y0: 1e6 });
    for (let i = 0; i < 100; i += 1) stepFall(s, 0.01);
    expect(Math.abs(s.v + G * s.t) / (G * s.t)).toBeLessThan(1e-8);
  });

  it('Stokes: terminal velocity m g / b reached at large t', () => {
    const b = 0.5;
    const vt = terminalVelocityStokes(b);
    const s = fall({ mode: 'stokes', y0: 1e8, b });
    expect(Math.abs(Math.abs(s.v) - vt) / vt).toBeLessThan(1e-6);
  });

  it('quadratic: terminal velocity sqrt(m g / c) reached at large t', () => {
    const c = 0.05;
    const vt = terminalVelocityQuadratic(c);
    const s = fall({ mode: 'quadratic', y0: 1e8, c }, 100);
    expect(Math.abs(Math.abs(s.v) - vt) / vt).toBeLessThan(1e-3);
  });

  it('analytic Stokes v(t) agrees with RK4 within 1e-6', () => {
    const b = 0.5;
    const s = createFall({ mode: 'stokes', y0: 1e8, b });
    const dt = 1e-3;
    const T = 5.0;
    for (let i = 0; i < T / dt; i += 1) stepFall(s, dt);
    const va = analyticStokesV(s.t, b);
    expect(Math.abs(s.v - va) / Math.abs(va)).toBeLessThan(1e-6);
  });

  it('drag shortens fall time? No: drag SLOWS fall, longer time', () => {
    // Vacuum: y0 - g t^2 / 2 = 0 => t = sqrt(2 y0 / g) = sqrt(2*100/9.81) = 4.52 s
    const vac = createFall({ mode: 'none', y0: 100 });
    let tVac = 0;
    while (vac.y > 0 && vac.t < 20) { stepFall(vac, 1e-3); tVac = vac.t; }
    expect(Math.abs(tVac - Math.sqrt(2 * 100 / G))).toBeLessThan(0.05);

    const stokes = createFall({ mode: 'stokes', y0: 100, b: 0.5 });
    let tSt = 0;
    while (stokes.y > 0 && stokes.t < 60) { stepFall(stokes, 1e-3); tSt = stokes.t; }
    expect(tSt).toBeGreaterThan(tVac);
  });

  it('crossover velocity v_c = b / c', () => {
    const b = 0.5, c = 0.05;
    expect(crossoverV(b, c)).toBe(b / c);
  });

  it('quadratic and Stokes terminal velocities follow their formulae', () => {
    expect(terminalVelocityQuadratic(0.05)).toBeCloseTo(Math.sqrt(M * G / 0.05), 12);
    expect(terminalVelocityStokes(0.5)).toBeCloseTo(M * G / 0.5, 12);
  });
});
