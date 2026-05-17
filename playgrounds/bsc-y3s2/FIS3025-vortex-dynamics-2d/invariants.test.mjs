import { describe, it, expect } from 'vitest';
import {
  createState, step, totalCirculation, linearImpulse, angularImpulse,
  hamiltonian, dipoleSpeed, preset,
} from './sim.js';

describe('vortex-dynamics-2d invariants', () => {
  it('total circulation is conserved exactly', () => {
    const s = createState(preset('tripole'));
    const g0 = totalCirculation(s);
    for (let n = 0; n < 4000; n += 1) step(s, 5e-3);
    expect(totalCirculation(s)).toBe(g0);
  });

  it('Hamiltonian is conserved to better than 0.1% over a long run (tripole)', () => {
    const s = createState(preset('tripole'));
    const H0 = hamiltonian(s);
    for (let n = 0; n < 6000; n += 1) step(s, 5e-3);
    expect(Math.abs((hamiltonian(s) - H0) / H0)).toBeLessThan(1e-3);
  });

  it('linear and angular impulse are conserved (RK4, < 1e-6 relative)', () => {
    const s = createState(preset('quadrupole'));
    const [px0, py0] = linearImpulse(s);
    const L0 = angularImpulse(s);
    for (let n = 0; n < 3000; n += 1) step(s, 5e-3);
    const [px1, py1] = linearImpulse(s);
    const scale = Math.hypot(px0, py0) + 1;
    expect(Math.hypot(px1 - px0, py1 - py0) / scale).toBeLessThan(1e-6);
    expect(Math.abs((angularImpulse(s) - L0) / (Math.abs(L0) + 1))).toBeLessThan(1e-6);
  });

  it('a vortex pair (dipole) translates at v = Gamma/(2 pi d) in a straight line', () => {
    const s = createState(preset('dipole'));            // Gamma = +-1 at y = +-1, d = 2
    const d = 2, gamma = 1;
    const vAnalytic = dipoleSpeed(gamma, d);            // = 1/(4 pi)
    const x0 = (s.x[0] + s.x[1]) / 2, y0 = (s.y[0] + s.y[1]) / 2;
    const T = 5;
    const steps = 1000, dt = T / steps;
    for (let n = 0; n < steps; n += 1) step(s, dt);
    const xc = (s.x[0] + s.x[1]) / 2, yc = (s.y[0] + s.y[1]) / 2;
    const vMeasured = (xc - x0) / T;
    expect(Math.abs(vMeasured - vAnalytic) / vAnalytic).toBeLessThan(2e-3);
    expect(Math.abs(yc - y0)).toBeLessThan(1e-6);        // straight line (no drift in y)
    expect(Math.abs((s.y[0] - s.y[1]) - 2)).toBeLessThan(1e-6); // separation preserved
  });

  it('co-rotating equal pair rotates about its centroid at constant separation', () => {
    const s = createState(preset('corotating'));         // Gamma = +1, +1, separation 2
    const d0 = Math.hypot(s.x[0] - s.x[1], s.y[0] - s.y[1]);
    for (let n = 0; n < 4000; n += 1) step(s, 5e-3);
    const d1 = Math.hypot(s.x[0] - s.x[1], s.y[0] - s.y[1]);
    expect(Math.abs(d1 - d0) / d0).toBeLessThan(1e-3);   // rigid rotation
  });

  it('deterministic: identical inputs reproduce the trajectory exactly', () => {
    const a = createState(preset('quadrupole'));
    const b = createState(preset('quadrupole'));
    for (let n = 0; n < 1500; n += 1) { step(a, 5e-3); step(b, 5e-3); }
    let dmax = 0;
    for (let i = 0; i < a.n; i += 1) dmax = Math.max(dmax, Math.abs(a.x[i] - b.x[i]), Math.abs(a.y[i] - b.y[i]));
    expect(dmax).toBe(0);
  });
});
