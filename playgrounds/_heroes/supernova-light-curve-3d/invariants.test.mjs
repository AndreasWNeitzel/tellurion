import { describe, it, expect } from 'vitest';
import {
  TAU_NI_D, TAU_CO_D, EPS_NI, EPS_CO, M_SUN_G,
  massPartition, decayPower_ergS, bolometricLuminosity_ergS,
  absoluteBolMag, trappingFactor, fireballRadius_cm, SN_PRESETS,
} from './sim.js';

describe('supernova-light-curve-3d', () => {
  it('Ni decay e-folding time = 8.8 d (= 6.1 d / ln 2)', () => {
    expect(TAU_NI_D).toBeCloseTo(8.8, 1);
    expect(6.1 / Math.log(2)).toBeCloseTo(TAU_NI_D, 1);
  });

  it('Co decay e-folding time = 111.3 d (= 77.7 d / ln 2)', () => {
    expect(TAU_CO_D).toBeCloseTo(111.3, 1);
  });

  it('mass conservation: Ni + Co + Fe = m0 always', () => {
    for (const t of [0, 10, 30, 100, 500]) {
      const p = massPartition(t, 0.6);
      expect(p.mNi + p.mCo + p.mFe).toBeCloseTo(0.6, 9);
    }
  });

  it('At t = 0: all mass is Ni', () => {
    const p = massPartition(0, 0.6);
    expect(p.mNi).toBeCloseTo(0.6, 9);
    expect(p.mCo).toBeCloseTo(0, 9);
    expect(p.mFe).toBeCloseTo(0, 9);
  });

  it('At t >> tau_Co: all mass is Fe', () => {
    const p = massPartition(1000, 0.6);
    expect(p.mNi).toBeLessThan(1e-9);
    expect(p.mCo).toBeLessThan(0.01);
    expect(p.mFe).toBeCloseTo(0.6, 1);
  });

  it('Ni mass at t = TAU_NI_D is m0 / e', () => {
    const p = massPartition(TAU_NI_D, 0.6);
    expect(p.mNi).toBeCloseTo(0.6 / Math.E, 4);
  });

  it('decay power scales linearly in Ni mass', () => {
    const P1 = decayPower_ergS(20, 0.5);
    const P2 = decayPower_ergS(20, 1.0);
    expect(P2 / P1).toBeCloseTo(2, 4);
  });

  it('Trapping factor: t -> 0 gives 0, t -> infty gives 1', () => {
    expect(trappingFactor(0)).toBe(0);
    expect(trappingFactor(100)).toBeCloseTo(1, 6);
  });

  it('Bolometric luminosity at peak (~14 d) is ~ 10^43 erg/s for SN Ia (0.6 Msun Ni)', () => {
    let Lmax = 0;
    for (let t = 5; t <= 30; t += 0.5) {
      const L = bolometricLuminosity_ergS(t, 0.6, 14);
      if (L > Lmax) Lmax = L;
    }
    // Arnett-rule expectation: ~ 10^43 erg/s.
    expect(Lmax).toBeGreaterThan(5e42);
    expect(Lmax).toBeLessThan(3e43);
  });

  it('Absolute bolometric magnitude of L = 1.5e43 erg/s is ~ -19.3 (SN Ia peak)', () => {
    const M = absoluteBolMag(1.5e43);
    // M = -2.5 log10(1.5e43) + 88.7 = -19.2 to -19.3.
    expect(M).toBeGreaterThan(-19.5);
    expect(M).toBeLessThan(-19.0);
  });

  it('SN 2011fe preset has M_Ni ~ 0.6 Msun', () => {
    expect(SN_PRESETS.ia_2011fe.m0_Ni).toBeCloseTo(0.6, 2);
  });

  it('SN 1987A preset has M_Ni ~ 0.075 Msun (~ 0.07 typical)', () => {
    expect(SN_PRESETS.ii_1987a.m0_Ni).toBeCloseTo(0.075, 2);
  });

  it('Fireball radius: homologous expansion r = v_ej * t', () => {
    // 1 day at 10000 km/s = 10^4 km/s * 86400 s = 8.64e8 km = 8.64e13 cm.
    const r = fireballRadius_cm(1, 10000);
    expect(r).toBeCloseTo(8.64e13, -10);
  });

  it('Late-time tail luminosity matches Co decay (decay-limited)', () => {
    const L = bolometricLuminosity_ergS(150, 0.6, 14);
    // After diffusion phase, L ~ instantaneous decay power.
    const P = decayPower_ergS(150, 0.6);
    expect(L / P).toBeCloseTo(1, 1);
  });
});
