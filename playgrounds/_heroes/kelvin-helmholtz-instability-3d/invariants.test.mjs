import { describe, it, expect } from 'vitest';
import {
  streamFunction, velocity, vorticity, rk4Step, makeTracers,
  BOX_X, BOX_Y_HALF, dispersion_sigma, makeRng,
} from './sim.js';

describe('kelvin-helmholtz-instability-3d', () => {
  it('Stuart streamfunction at A = 0 reduces to plain shear (psi = -ln cosh y)', () => {
    const y = 0.5;
    expect(streamFunction(1, y, 0)).toBeCloseTo(-Math.log(Math.cosh(y)), 9);
  });

  it('Velocity at y = 0, A = 0: u = 0', () => {
    const v = velocity(1, 0, 0);
    expect(v.u).toBeCloseTo(0, 9);
  });

  it('Velocity at A = 0 has v = 0 everywhere (plain shear)', () => {
    for (const x of [0, Math.PI / 2, Math.PI]) {
      for (const y of [-1, -0.5, 0, 0.5, 1]) {
        expect(velocity(x, y, 0).v).toBeCloseTo(0, 9);
      }
    }
  });

  it('Velocity sign: positive y has u < 0 (upper layer flows left)', () => {
    expect(velocity(0, 1, 0).u).toBeLessThan(0);
  });

  it('Velocity sign: negative y has u > 0 (lower layer flows right)', () => {
    expect(velocity(0, -1, 0).u).toBeGreaterThan(0);
  });

  it('Vorticity at A = 0 is sech^2 y', () => {
    const y = 0.7;
    expect(vorticity(0, y, 0)).toBeCloseTo(1 / Math.cosh(y) ** 2, 9);
  });

  it('Vorticity at A approaching 1: peaks become singular near vortex centers', () => {
    // At (pi, 0) and A = 0.95: D = cosh(0) + 0.95 cos(pi) = 1 - 0.95 = 0.05.
    // omega = (1 - 0.95^2) / 0.05^2 = 0.0975 / 0.0025 = 39.
    expect(vorticity(Math.PI, 0, 0.95)).toBeGreaterThan(30);
  });

  it('Vorticity at A = 1, x = pi, y = 0 is unbounded', () => {
    // D = 0, so omega = (1-1)/0 = 0/0; in our numerics it would be 0 / 0; we
    // check below A = 1 (A = 0.999): D = 0.001, omega = 0.001999 / 1e-6 = ~ 2000.
    expect(vorticity(Math.PI, 0, 0.999)).toBeGreaterThan(1000);
  });

  it('RK4 step at A = 0, x = 0, y = 1: drifts in -x direction', () => {
    const r = rk4Step(0, 1, 0, 0.1);
    expect(r.x).toBeGreaterThan(BOX_X - 0.5);   // wrapped from 0 going negative
  });

  it('RK4 step is periodic in x', () => {
    const r = rk4Step(BOX_X - 0.001, -1, 0.3, 0.01);
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.x).toBeLessThan(BOX_X);
  });

  it('Tracers stay in y in [-pi, pi]', () => {
    const rng = makeRng(1);
    const tracers = makeTracers(50, 0.3, rng);
    for (const p of tracers) {
      expect(Math.abs(p.y)).toBeLessThanOrEqual(BOX_Y_HALF);
    }
  });

  it('Tracers split 50/50 between bands', () => {
    const rng = makeRng(1);
    const tracers = makeTracers(40, 0.3, rng);
    const upper = tracers.filter(p => p.band > 0).length;
    expect(upper).toBe(20);
  });

  it('KH dispersion: equal density, no gravity, no surface tension -> sigma = k U sqrt(rho^2 / (1+rho)^2) = k U / 2', () => {
    const sigma = dispersion_sigma(1, 1, 1, 0, 0);
    expect(sigma).toBeCloseTo(0.5, 9);
  });

  it('KH growth rate scales linearly with k', () => {
    const s1 = dispersion_sigma(1, 1);
    const s4 = dispersion_sigma(4, 1);
    expect(s4 / s1).toBeCloseTo(4, 6);
  });

  it('KH growth rate scales linearly with U', () => {
    const s1 = dispersion_sigma(1, 1);
    const s2 = dispersion_sigma(1, 2);
    expect(s2 / s1).toBeCloseTo(2, 6);
  });
});
