// Ideal quantum gas statistics: the Fermi-level half-occupation
// identity, the T -> 0 Fermi step and Sommerfeld mu, Bose-Einstein
// condensation onset and condensate fraction, the classical
// (non-degenerate) limit, the closed-form Maxwell-Boltzmann mu and
// mean energy, particle-number conservation, and the BE > MB > FD
// occupation ordering. The numerics are pinned to closed forms.

import { describe, it, expect } from 'vitest';
import {
  occ, gDOS, numberIntegral, energyIntegral, fermiEnergy, tauC,
  solveMu, condensateFraction, sommerfeldMu, meanEnergy,
  GAMMA32, C, NTOT,
} from './sim.js';

const close = (a, b, t) => expect(Math.abs(a - b)).toBeLessThan(t);
const rel = (a, b, t) => expect(Math.abs(a - b) / Math.abs(b)).toBeLessThan(t);

describe('quantum-gas-statistics-visualizer invariants', () => {
  it('FD occupation is exactly 1/2 at eps = mu for any T', () => {
    for (const tau of [0.05, 0.3, 1.0, 4.0]) close(occ('FD', 0.7, 0.7, tau), 0.5, 1e-12);
    expect(gDOS(0)).toBe(0);
    expect(gDOS(4)).toBeCloseTo(2 * C, 12);
  });

  it('FD approaches a step at the Fermi energy as T -> 0', () => {
    const EF = fermiEnergy(), tau = 1e-3 * EF;
    const mu = solveMu('FD', tau);
    rel(mu, EF, 5e-3);                                   // mu -> E_F
    close(occ('FD', 0.5 * EF, mu, tau), 1, 1e-6);        // filled below
    close(occ('FD', 1.5 * EF, mu, tau), 0, 1e-6);        // empty above
  });

  it('FD mu follows the Sommerfeld expansion at low T', () => {
    const EF = fermiEnergy();
    for (const tau of [0.05 * EF, 0.1 * EF, 0.15 * EF]) {
      rel(solveMu('FD', tau), sommerfeldMu(tau), 6e-3);
    }
  });

  it('BE: mu -> 0 at tau_c, negative above, condensed below', () => {
    const tc = tauC();
    close(solveMu('BE', tc), 0, 2e-3);                   // onset
    expect(solveMu('BE', 1.6 * tc)).toBeLessThan(-1e-6); // normal phase
    expect(solveMu('BE', 0.5 * tc)).toBe(0);             // condensed: mu pinned
    expect(condensateFraction(1.2 * tc)).toBe(0);
    close(condensateFraction(0.5 * tc), 1 - Math.pow(0.5, 1.5), 1e-12);
  });

  it('BE conserves N including the condensate below tau_c', () => {
    const tc = tauC();
    for (const f of [0.3, 0.6, 0.9]) {
      const tau = f * tc;
      const nExc = numberIntegral('BE', 0, tau);
      const n0 = condensateFraction(tau) * NTOT;
      rel(nExc + n0, NTOT, 1e-2);
    }
  });

  it('quantum gases reduce to Maxwell-Boltzmann when non-degenerate', () => {
    const tau = 25 * tauC();                             // z ~ 0.02, non-degenerate
    const muF = solveMu('FD', tau), muB = solveMu('BE', tau), muM = solveMu('MB', tau);
    for (const e of [0.4, 1.1, 2.7]) {
      const m = occ('MB', e, muM, tau);
      rel(occ('FD', e, muF, tau), m, 2e-2);
      rel(occ('BE', e, muB, tau), m, 2e-2);
    }
  });

  it('MB mu matches the closed form and the mean energy is 3kT/2', () => {
    for (const tau of [0.2, 0.8, 2.5]) {
      const mu = solveMu('MB', tau);
      close(mu, tau * Math.log(NTOT / (C * GAMMA32 * Math.pow(tau, 1.5))), 1e-9);
      rel(numberIntegral('MB', mu, tau), NTOT, 1e-6);
      close(meanEnergy('MB', mu, tau), 1.5 * tau, 1e-3);
    }
  });

  it('every statistics conserves N at the solved mu', () => {
    for (const tau of [0.2, 0.5, 1.0, 3.0]) {
      for (const s of ['MB', 'FD']) rel(numberIntegral(s, solveMu(s, tau), tau), NTOT, 1e-2);
      const tc = tauC();
      const tHot = 1.5 * tc;
      rel(numberIntegral('BE', solveMu('BE', tHot), tHot), NTOT, 1e-2);
    }
  });

  it('occupation ordering BE > MB > FD for (eps-mu)/tau > 0', () => {
    const mu = -0.5, tau = 1.0;
    for (const e of [0.2, 1.0, 3.0]) {
      const b = occ('BE', e, mu, tau), m = occ('MB', e, mu, tau), f = occ('FD', e, mu, tau);
      expect(b).toBeGreaterThan(m);
      expect(m).toBeGreaterThan(f);
    }
  });
});
