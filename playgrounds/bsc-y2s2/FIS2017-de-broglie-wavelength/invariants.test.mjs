// de Broglie wavelength invariants.
// (a) Photon: lambda = h c / E exactly.
// (b) Non-relativistic limit: lambda = h / sqrt(2 m T) within 1e-4 for T much less than mc^2.
// (c) Relativistic and non-rel agree at low T; diverge at high T.
// (d) 100-eV electron gives the canonical 0.123 nm wavelength (electron diffraction).
// (e) Thermal neutron at 0.025 eV gives 0.18 nm (neutron crystallography).

import { describe, it, expect } from 'vitest';
import {
  deBroglieNm, deBroglieNonRelNm, thermalDeBroglieNm,
  HC_EV_NM, M_E_EV, M_P_EV, M_N_EV, PARTICLES,
} from './sim.js';

describe('de-broglie-wavelength', () => {
  it('photon: lambda = h c / E exactly', () => {
    const E = 2.0;
    expect(Math.abs(deBroglieNm(E, 0) - HC_EV_NM / E)).toBeLessThan(1e-12);
  });

  it('non-relativistic and relativistic agree at low T (electron, 1 eV)', () => {
    const T = 1.0;
    const a = deBroglieNm(T, M_E_EV);
    const b = deBroglieNonRelNm(T, M_E_EV);
    expect(Math.abs(a - b) / a).toBeLessThan(1e-4);
  });

  it('100-eV electron gives ~0.123 nm', () => {
    const lam = deBroglieNm(100, M_E_EV);
    expect(Math.abs(lam - 0.1227)).toBeLessThan(0.001);
  });

  it('thermal neutron at 0.025 eV gives ~0.18 nm', () => {
    const lam = deBroglieNm(0.025, M_N_EV);
    expect(Math.abs(lam - 0.1808)).toBeLessThan(0.001);
  });

  it('relativistic differs from non-rel at high T (electron, 1 MeV)', () => {
    const T = 1e6;
    const a = deBroglieNm(T, M_E_EV);
    const b = deBroglieNonRelNm(T, M_E_EV);
    expect(Math.abs(a - b) / a).toBeGreaterThan(0.1);
  });

  it('proton de Broglie at 1 MeV is much shorter than electron at same T', () => {
    const lamE = deBroglieNm(1e6, M_E_EV);
    const lamP = deBroglieNm(1e6, M_P_EV);
    expect(lamP).toBeLessThan(lamE);
  });

  it('thermal de Broglie of electron at 300 K is ~6 nm scale', () => {
    const lam = thermalDeBroglieNm(300, M_E_EV);
    expect(lam).toBeGreaterThan(3);
    expect(lam).toBeLessThan(12);
  });

  it('PARTICLES list contains photon, electron, proton, neutron, C-12', () => {
    const names = PARTICLES.map(p => p.name);
    for (const n of ['photon', 'electron', 'proton', 'neutron', 'C-12']) {
      expect(names).toContain(n);
    }
  });
});
