// Matter-radiation equality invariants.
// (a) rho_m / rho_r = (a/a_eq).
// (b) z_eq = Omega_m/Omega_r - 1; close to 3410 for standard LCDM.
// (c) HoverH0(1) = 1 for any flat (Omega_m + Omega_r + Omega_lam = 1).
// (d) HoverH0(a) -> sqrt(Omega_r)/a^2 in the radiation era (a small).
// (e) HoverH0(a) -> sqrt(Omega_lam) in the late de Sitter era (a large).

import { describe, it, expect } from 'vitest';
import {
  rhoMatter, rhoRadiation, rhoLambda,
  aEq, zEq, HoverH0,
  OMEGA_M_DEFAULT, OMEGA_R_DEFAULT,
} from './sim.js';

const OL = 1 - OMEGA_M_DEFAULT - OMEGA_R_DEFAULT;

describe('matter-radiation-equality', () => {
  it('rho_m / rho_r = a / a_eq exact', () => {
    const aeq = aEq(OMEGA_M_DEFAULT, OMEGA_R_DEFAULT);
    for (const a of [1e-6, 1e-4, 1e-2, 0.5, 1]) {
      const ratio = rhoMatter(a, OMEGA_M_DEFAULT) / rhoRadiation(a, OMEGA_R_DEFAULT);
      const expected = a / aeq;
      expect(Math.abs(ratio - expected) / expected).toBeLessThan(1e-12);
    }
  });

  it('z_eq for standard LCDM is approximately 3410', () => {
    const z = zEq(OMEGA_M_DEFAULT, OMEGA_R_DEFAULT);
    expect(z).toBeGreaterThan(3300);
    expect(z).toBeLessThan(3500);
  });

  it('H/H_0 = 1 today (a = 1) for a flat universe', () => {
    expect(Math.abs(HoverH0(1, OMEGA_M_DEFAULT, OMEGA_R_DEFAULT, OL) - 1)).toBeLessThan(1e-12);
  });

  it('H/H_0 -> sqrt(Omega_r) / a^2 in radiation era (a small)', () => {
    const a = 1e-6;
    const h = HoverH0(a, OMEGA_M_DEFAULT, OMEGA_R_DEFAULT, OL);
    const expected = Math.sqrt(OMEGA_R_DEFAULT) / (a * a);
    expect(Math.abs(h - expected) / expected).toBeLessThan(0.01);
  });

  it('H/H_0 -> sqrt(Omega_lam) in late de Sitter (a large)', () => {
    const a = 1e6;
    const h = HoverH0(a, OMEGA_M_DEFAULT, OMEGA_R_DEFAULT, OL);
    const expected = Math.sqrt(OL);
    expect(Math.abs(h - expected) / expected).toBeLessThan(1e-6);
  });

  it('At a = a_eq, rho_m equals rho_r', () => {
    const aeq = aEq(OMEGA_M_DEFAULT, OMEGA_R_DEFAULT);
    const rm = rhoMatter(aeq, OMEGA_M_DEFAULT);
    const rr = rhoRadiation(aeq, OMEGA_R_DEFAULT);
    expect(Math.abs(rm - rr) / rm).toBeLessThan(1e-12);
  });

  it('Lambda dominates over matter today: rho_Lambda > rho_matter at a = 1', () => {
    const rm = rhoMatter(1, OMEGA_M_DEFAULT);
    const rl = rhoLambda(OL);
    expect(rl).toBeGreaterThan(rm);
  });
});
