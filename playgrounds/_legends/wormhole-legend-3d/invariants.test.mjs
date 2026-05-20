import { describe, it, expect } from 'vitest';
import {
  circumferentialR, embedZ, flareOut, criticalImpact, properDistance,
  exoticDensity, anecIntegral, exoticEnergyDensity_SI, traversalEll,
} from './sim.js';

describe('wormhole-legend-3d', () => {
  it('circumferential radius at the throat l = 0 equals b_0', () => {
    expect(circumferentialR(0, 2.5)).toBe(2.5);
  });

  it('circumferential radius is minimised at l = 0', () => {
    const r0 = circumferentialR(0, 1.0);
    for (const l of [-3, -1, 0.5, 1, 3]) {
      expect(circumferentialR(l, 1.0)).toBeGreaterThanOrEqual(r0);
    }
  });

  it('circumferential radius asymptotes to |l| at large |l|', () => {
    const l = 100;
    const r = circumferentialR(l, 1.0);
    expect(r / l).toBeCloseTo(1, 3);
  });

  it('embedding z(l) is zero at the throat and odd in l', () => {
    expect(embedZ(0, 1.0)).toBe(0);
    expect(embedZ(2, 1.0)).toBeCloseTo(-embedZ(-2, 1.0), 9);
  });

  it('embedding z(l) for l = b_0 is b_0 asinh(1) ~ 0.881 b_0', () => {
    const b0 = 1.5;
    const z = embedZ(b0, b0);
    expect(z / b0).toBeCloseTo(Math.asinh(1), 6);
  });

  it('critical impact parameter is exactly b_0', () => {
    expect(criticalImpact(2.3)).toBe(2.3);
  });

  it('proper distance is |l|', () => {
    expect(properDistance(-3.7)).toBe(3.7);
  });

  it('exotic density at throat is negative and scales as 1/b_0^2', () => {
    const rho1 = exoticDensity(0, 1.0);
    const rho2 = exoticDensity(0, 2.0);
    expect(rho1).toBeLessThan(0);
    expect(rho2).toBeLessThan(0);
    expect(rho1 / rho2).toBeCloseTo(4, 4);     // 1/b^2 ratio
  });

  it('exotic density at the throat matches Morris-Thorne formula', () => {
    // rho_throat = -1 / (8 pi b_0^2) in geometric (G = c = 1) units.
    const b0 = 1.5;
    const rho = exoticDensity(0, b0);
    expect(rho).toBeCloseTo(-1 / (8 * Math.PI * b0 * b0), 6);
  });

  it('ANEC integral is negative (NEC violation)', () => {
    const I = anecIntegral(5, 1.0, 200);
    expect(I).toBeLessThan(0);
  });

  it('Exotic energy density SI: 1 m throat ~ -7e9 J/m^3', () => {
    const rho = exoticEnergyDensity_SI(1);
    // -1/(8 pi G) with G = 6.67e-11 gives ~ -6e8 J/m^3.
    expect(rho).toBeLessThan(-1e8);
    expect(rho).toBeGreaterThan(-1e10);
  });

  it('Traversal animation: t_norm = 0 gives l = +L b_0', () => {
    expect(traversalEll(0, 1.0, 3.0)).toBeCloseTo(3.0, 6);
  });

  it('Traversal animation: t_norm = 1 gives l = -L b_0', () => {
    expect(traversalEll(1, 1.0, 3.0)).toBeCloseTo(-3.0, 6);
  });

  it('Traversal animation: t_norm = 0.5 gives l = 0 (at throat)', () => {
    expect(traversalEll(0.5, 1.0, 3.0)).toBeCloseTo(0, 6);
  });

  it('Flare-out condition holds at the throat (r flares as l moves away)', () => {
    // dr/dl|_{l=0} = 0 and d^2 r/dl^2|_{l=0} = 1/b_0 > 0 (flares out).
    const b0 = 1.0;
    const r_eps = circumferentialR(0.001, b0);
    const r_0 = circumferentialR(0, b0);
    expect(r_eps).toBeGreaterThan(r_0);
  });
});
