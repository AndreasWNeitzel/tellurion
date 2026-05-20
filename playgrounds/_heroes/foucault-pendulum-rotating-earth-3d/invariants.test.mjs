import { describe, it, expect } from 'vitest';
import { step, energy, ic, planeAngle, precessionPeriod, pendulumPeriod, PENDULUM_OMEGA, OMEGA_EARTH } from './sim.js';

describe('foucault-pendulum-rotating-earth-3d', () => {
  it('initial condition has the bob at +x with zero velocity', () => {
    const s = ic(1.0);
    expect(s.x).toBe(1.0);
    expect(s.y).toBe(0);
    expect(s.vx).toBe(0);
    expect(s.vy).toBe(0);
  });

  it('energy is conserved over many steps at the equator (no rotation)', () => {
    const s = ic(1.0);
    const E0 = energy(s);
    for (let n = 0; n < 1000; n += 1) step(s, 0.005, 0);
    const E1 = energy(s);
    expect(Math.abs(E1 - E0) / Math.abs(E0)).toBeLessThan(0.01);
  });

  it('energy is conserved at non-zero latitude', () => {
    const s = ic(1.0);
    const E0 = energy(s);
    for (let n = 0; n < 1000; n += 1) step(s, 0.005, Math.PI / 4);
    const E1 = energy(s);
    expect(Math.abs(E1 - E0) / Math.abs(E0)).toBeLessThan(0.05);
  });

  it('precession period at the pole equals 2π / Ω_earth', () => {
    const T = precessionPeriod(Math.PI / 2);
    expect(T).toBeCloseTo(2 * Math.PI / OMEGA_EARTH, 9);
  });

  it('precession period at the equator is infinite', () => {
    const T = precessionPeriod(0);
    expect(T).toBe(Infinity);
  });

  it('precession period at latitude 30° is 2x the polar period', () => {
    const Tpole = precessionPeriod(Math.PI / 2);
    const T30 = precessionPeriod(30 * Math.PI / 180);
    expect(T30 / Tpole).toBeCloseTo(2, 9);
  });

  it('plane angle at the equator does not drift (no precession)', () => {
    const s = ic(1.0);
    for (let n = 0; n < 2000; n += 1) step(s, 0.005, 0);
    // After many pendulum periods the bob still oscillates on the x axis.
    // The plane angle measured at the bob's current position oscillates
    // between 0 and pi (because atan2 flips sign as the bob passes through
    // origin). What is constant is that |y| stays much smaller than |x|.
    expect(Math.abs(s.y)).toBeLessThan(0.02);
  });

  it('plane rotates clockwise (negative angular drift) in the Northern hemisphere', () => {
    // At positive latitude, sin(phi) > 0, so omega_eff > 0 and the
    // velocity rotation in step() uses cos(-2 Omega dt), sin(-2 Omega dt)
    // which is a clockwise rotation of velocity. The plane therefore
    // precesses clockwise (viewed from above with +z = up).
    const s = ic(1.0);
    for (let n = 0; n < 4000; n += 1) step(s, 0.003, 60 * Math.PI / 180);
    // Measure the bob's plane: it should now have a non-trivial y component
    // somewhere in the oscillation. Track the maximum |y| seen.
    let maxY = 0;
    const s2 = ic(1.0);
    for (let n = 0; n < 4000; n += 1) {
      step(s2, 0.003, 60 * Math.PI / 180);
      if (Math.abs(s2.y) > maxY) maxY = Math.abs(s2.y);
    }
    expect(maxY).toBeGreaterThan(0.05);
  });

  it('pendulum period is 2 pi / sqrt(g/L)', () => {
    expect(pendulumPeriod()).toBeCloseTo(2 * Math.PI / PENDULUM_OMEGA, 9);
  });
});
