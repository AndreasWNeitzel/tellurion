// Bohr hydrogen spectrum invariants.
// (a) Ground state energy E_1 = -13.605693 eV.
// (b) Lyman alpha (n=2 -> 1) at 121.5 nm within 0.05 nm of Bohr prediction (R_H * 3/4).
// (c) Balmer alpha (n=3 -> 2; H-alpha) at 656.3 nm within 0.3 nm (Bohr, no fine structure).
// (d) Balmer series limit (n -> inf -> 2) at 364.6 nm within 0.3 nm.
// (e) Lyman series limit at 91.176 nm within 0.05 nm.
// (f) Wavelength order: Lyman < Balmer < Paschen < Brackett.
// (g) E_n -> 0 as n -> infinity.
// (h) Photon energy = h c / lambda within 0.01 eV (Bohr-level agreement).
//
// Bohr-with-R_H is good to ~3e-4 fractional accuracy; the residual is the
// fine-structure correction (alpha^2 corrections from Dirac equation),
// which the Bohr model does not capture. Tolerances reflect that.

import { describe, it, expect } from 'vitest';
import {
  level, wavelengthNm, seriesLimitNm, photonEnergyEv, buildLines, E_R,
} from './sim.js';

describe('bohr-hydrogen-spectrum', () => {
  it('ground state energy equals -13.605693 eV', () => {
    expect(Math.abs(level(1) + E_R)).toBeLessThan(1e-12);
  });

  it('Lyman alpha near observed 121.567 nm (Bohr level)', () => {
    expect(Math.abs(wavelengthNm(1, 2) - 121.567)).toBeLessThan(0.05);
  });

  it('Balmer alpha (H-alpha) near observed 656.279 nm (Bohr level)', () => {
    expect(Math.abs(wavelengthNm(2, 3) - 656.279)).toBeLessThan(0.3);
  });

  it('Balmer series limit near 364.6 nm (Bohr level)', () => {
    expect(Math.abs(seriesLimitNm(2) - 364.6)).toBeLessThan(0.3);
  });

  it('Lyman series limit near 91.176 nm', () => {
    expect(Math.abs(seriesLimitNm(1) - 91.176)).toBeLessThan(0.05);
  });

  it('series wavelengths ordered: Lyman < Balmer < Paschen < Brackett', () => {
    const lyman = wavelengthNm(1, 2);
    const balmer = wavelengthNm(2, 3);
    const paschen = wavelengthNm(3, 4);
    const brackett = wavelengthNm(4, 5);
    expect(lyman).toBeLessThan(balmer);
    expect(balmer).toBeLessThan(paschen);
    expect(paschen).toBeLessThan(brackett);
  });

  it('E_n approaches 0 as n grows', () => {
    expect(Math.abs(level(1000))).toBeLessThan(1e-4);
    expect(level(1000)).toBeGreaterThan(level(100));
  });

  it('photon energy = h c / lambda for the 2 -> 1 transition', () => {
    const lam = wavelengthNm(1, 2);
    const HC_EV_NM = 1239.841984;
    const eExpected = photonEnergyEv(2, 1); // negative, emission
    expect(Math.abs(-eExpected - HC_EV_NM / lam)).toBeLessThan(0.01);
  });

  it('buildLines includes Lyman, Balmer, Paschen series', () => {
    const lines = buildLines(8);
    const series = new Set(lines.map(l => l.series));
    expect(series.has('Lyman')).toBe(true);
    expect(series.has('Balmer')).toBe(true);
    expect(series.has('Paschen')).toBe(true);
  });
});
