import { describe, it, expect } from 'vitest';
import { schwarzschildRadius, photonSphereSchwarzschild, bCritSchwarzschild, iscoKerr, ergosphereOuter, horizonOuter, deflectionWeakField } from './sim.js';

describe('schwarzschild-kerr-blackhole-3d', () => {
  it('Schwarzschild r_s = 2 M', () => {
    expect(schwarzschildRadius(1)).toBe(2);
    expect(schwarzschildRadius(3)).toBe(6);
  });
  it('Schwarzschild photon sphere at r = 3 M', () => {
    expect(photonSphereSchwarzschild(1)).toBe(3);
  });
  it('Schwarzschild b_crit = 3 sqrt(3) M', () => {
    expect(Math.abs(bCritSchwarzschild(1) - 3 * Math.sqrt(3))).toBeLessThan(1e-12);
  });
  it('Kerr a=0 reduces to Schwarzschild ISCO = 6 M', () => {
    expect(Math.abs(iscoKerr(0, 1) - 6)).toBeLessThan(1e-6);
  });
  it('Kerr prograde ISCO at a/M = 0.998 is ~1.2 M', () => {
    expect(iscoKerr(0.998, 1)).toBeGreaterThan(1);
    expect(iscoKerr(0.998, 1)).toBeLessThan(1.5);
  });
  it('Kerr retrograde ISCO at a = -1 is 9 M', () => {
    expect(Math.abs(iscoKerr(-1, 1) - 9)).toBeLessThan(0.01);
  });
  it('Outer horizon r+ = M + sqrt(M^2 - a^2)', () => {
    expect(Math.abs(horizonOuter(0.5, 1) - (1 + Math.sqrt(0.75)))).toBeLessThan(1e-12);
  });
  it('Ergosphere outer at equator: M + sqrt(M^2 - 0) = 2 M for any a (when cos theta = 0)', () => {
    expect(ergosphereOuter(0.7, Math.PI / 2, 1)).toBe(2);
  });
  it('Weak-field deflection 4M/b: 5.7e-6 rad for solar lensing (b ~ R_sun, M ~ R_sun/2)', () => {
    expect(Math.abs(deflectionWeakField(1, 1) - 4)).toBeLessThan(1e-9);
  });
});
