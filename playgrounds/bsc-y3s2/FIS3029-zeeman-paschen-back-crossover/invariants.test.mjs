import { describe, it, expect } from 'vitest';
import { weakFieldEnergy, strongFieldEnergy, gFactor, BOHR_MAGNETON_eV_T, zeeman2pLevels, FS_2P_eV } from './sim.js';
describe('zeeman-paschen-back-crossover', () => {
  it('g_J for 2p_{3/2} is 4/3', () => {
    expect(Math.abs(gFactor(1.5, 1, 0.5) - 4 / 3)).toBeLessThan(1e-9);
  });
  it('g_J for 2p_{1/2} is 2/3', () => {
    expect(Math.abs(gFactor(0.5, 1, 0.5) - 2 / 3)).toBeLessThan(1e-9);
  });
  it('Strong-field linear in B', () => {
    expect(strongFieldEnergy(1, 0.5, 2) / strongFieldEnergy(1, 0.5, 1)).toBeCloseTo(2, 10);
  });
  it('Weak field: m_j = 0 has no shift', () => {
    expect(weakFieldEnergy(0.5, 0, 0, 0.5, 1)).toBe(0);
  });
  it('Zero field: 2p quartet at +xi/2, doublet at -xi, gap = FS_2P_eV', () => {
    const lv = zeeman2pLevels(0).map(o => o.E).sort((a, b) => a - b);
    const xi = (2 / 3) * FS_2P_eV;
    // Two states near -xi, four near +xi/2.
    expect(Math.abs(lv[0] - (-xi))).toBeLessThan(1e-12);
    expect(Math.abs(lv[1] - (-xi))).toBeLessThan(1e-12);
    expect(Math.abs(lv[5] - 0.5 * xi)).toBeLessThan(1e-12);
    expect(Math.abs((lv[5] - lv[0]) - FS_2P_eV)).toBeLessThan(1e-12);
  });
  it('Strong field: extreme |m_J|=3/2 levels split linearly as 4 mu_B B', () => {
    const span = (B) => {
      const lv = zeeman2pLevels(B);
      return lv[0].E - lv[5].E;          // m_J=+3/2 minus m_J=-3/2
    };
    const s1 = span(40), s2 = span(80);
    expect(s2 / s1).toBeCloseTo(2, 6);
    expect(span(80)).toBeCloseTo(4 * BOHR_MAGNETON_eV_T * 80, 6);
  });
});
