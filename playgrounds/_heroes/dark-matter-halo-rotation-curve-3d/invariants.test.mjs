import { describe, it, expect } from 'vitest';
import { massBulge, massDisk, massDM, massTotal, vCirc, vCircVisible, MW_PARAMS, G } from './sim.js';

describe('dark-matter-halo-rotation-curve-3d', () => {
  it('Hernquist mass: M(r=0) = 0', () => {
    expect(massBulge(0, 1, 0.7)).toBeCloseTo(0, 12);
  });

  it('Hernquist mass: M(r->inf) -> M_b', () => {
    expect(massBulge(1e6, 1, 0.7)).toBeCloseTo(1, 5);
  });

  it('Exponential disk mass: M(r=0) = 0', () => {
    expect(massDisk(0, 5, 3)).toBeCloseTo(0, 12);
  });

  it('Exponential disk mass: M(r->inf) -> M_d', () => {
    expect(massDisk(1e6, 5, 3)).toBeCloseTo(5, 5);
  });

  it('NFW dark mass: M(r=0) = 0', () => {
    expect(massDM(0, 80, 20, 12)).toBeCloseTo(0, 9);
  });

  it('NFW dark mass at r = c * r_s equals M_DM (by construction)', () => {
    expect(massDM(12 * 20, 80, 20, 12)).toBeCloseTo(80, 5);
  });

  it('NFW dark mass is monotonic increasing in r', () => {
    let prev = 0;
    for (let r = 1; r <= 100; r += 1) {
      const m = massDM(r, 80, 20, 12);
      expect(m).toBeGreaterThanOrEqual(prev);
      prev = m;
    }
  });

  it('vCirc(r=0) = 0', () => {
    expect(vCirc(0, MW_PARAMS)).toBe(0);
  });

  it('visible-only rotation curve falls beyond the disk', () => {
    const p = { ...MW_PARAMS, includeDM: false };
    const v_inside = vCircVisible(10, p);
    const v_outside = vCircVisible(80, p);
    expect(v_outside).toBeLessThan(v_inside);
  });

  it('with NFW halo, rotation curve stays plateaued at large r', () => {
    const p = { ...MW_PARAMS, includeDM: true };
    const v_30 = vCirc(30, p);
    const v_80 = vCirc(80, p);
    // The total v_c should not drop below 70% of the inner value at r=80.
    expect(v_80 / v_30).toBeGreaterThan(0.7);
  });

  it('disabling DM makes v_c outside the disk smaller', () => {
    const pOff = { ...MW_PARAMS, includeDM: false };
    const pOn = { ...MW_PARAMS, includeDM: true };
    expect(vCirc(80, pOn)).toBeGreaterThan(vCirc(80, pOff));
  });

  it('at fixed r_s, lower c packs the fixed M_DM into a smaller virial volume, so inner v_c is higher', () => {
    // With M_DM and r_s fixed, c varies the virial radius R_vir = c * r_s.
    // Lower c -> smaller virial volume -> same M_DM in a smaller box -> more
    // mass inside any fixed inner radius.
    const pLowC = { ...MW_PARAMS, c: 5 };
    const pHiC = { ...MW_PARAMS, c: 18 };
    expect(vCirc(5, pLowC)).toBeGreaterThan(vCirc(5, pHiC));
  });

  it('massTotal = bulge + disk + (DM if included)', () => {
    const p = { ...MW_PARAMS, includeDM: true };
    const r = 25;
    const expected = massBulge(r, p.M_b, p.a_b) + massDisk(r, p.M_d, p.h_d) + massDM(r, p.M_DM, p.r_s, p.c);
    expect(massTotal(r, p)).toBeCloseTo(expected, 12);
  });
});
