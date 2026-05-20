import { describe, it, expect } from 'vitest';
import {
  snellAngle, brewsterAngle, criticalAngle, fresnel_rs, fresnel_rp,
  fresnel_unpol, regime,
} from './sim.js';

const DEG = Math.PI / 180;

describe('brewster-fresnel-reflection-3d', () => {
  it('Snell: theta_t at normal incidence is 0', () => {
    expect(snellAngle(0, 1, 1.5)).toBeCloseTo(0, 9);
  });

  it('Snell: n1 sin theta_i = n2 sin theta_t', () => {
    const th_i = 30 * DEG;
    const th_t = snellAngle(th_i, 1, 1.5);
    expect(1 * Math.sin(th_i)).toBeCloseTo(1.5 * Math.sin(th_t), 9);
  });

  it('Snell returns null for TIR case', () => {
    expect(snellAngle(60 * DEG, 1.5, 1)).toBeNull();
  });

  it('Brewster: air-to-water tan(theta_B) = 1.333', () => {
    const tB = brewsterAngle(1, 1.333);
    expect(Math.tan(tB)).toBeCloseTo(1.333, 6);
  });

  it('Brewster: air-to-water gives theta_B ~ 53.1 deg', () => {
    expect(brewsterAngle(1, 1.333) / DEG).toBeCloseTo(53.13, 1);
  });

  it('Critical angle: water-to-air gives theta_c ~ 48.6 deg', () => {
    expect(criticalAngle(1.333, 1) / DEG).toBeCloseTo(48.61, 2);
  });

  it('Critical angle: no TIR when n1 < n2', () => {
    expect(criticalAngle(1, 1.5)).toBeNull();
  });

  it('Critical angle: diamond-to-air gives theta_c ~ 24.4 deg', () => {
    expect(criticalAngle(2.417, 1) / DEG).toBeCloseTo(24.44, 1);
  });

  it('R_p = 0 at Brewster angle', () => {
    const n1 = 1, n2 = 1.5;
    const tB = brewsterAngle(n1, n2);
    expect(fresnel_rp(tB, n1, n2).R).toBeLessThan(1e-9);
  });

  it('R_s != 0 at Brewster angle (s polarization not perfectly transmitted)', () => {
    const n1 = 1, n2 = 1.5;
    const tB = brewsterAngle(n1, n2);
    expect(fresnel_rs(tB, n1, n2).R).toBeGreaterThan(0.05);
  });

  it('TIR: R_s = R_p = 1 above critical angle', () => {
    const n1 = 1.5, n2 = 1;
    const tC = criticalAngle(n1, n2);
    const th = tC + 1 * DEG;
    expect(fresnel_rs(th, n1, n2).R).toBeCloseTo(1, 9);
    expect(fresnel_rp(th, n1, n2).R).toBeCloseTo(1, 9);
  });

  it('Normal incidence: R_s = R_p = ((n1-n2)/(n1+n2))^2', () => {
    const n1 = 1, n2 = 1.5;
    const expected = Math.pow((n1 - n2) / (n1 + n2), 2);
    expect(fresnel_rs(0, n1, n2).R).toBeCloseTo(expected, 9);
    expect(fresnel_rp(0, n1, n2).R).toBeCloseTo(expected, 9);
  });

  it('Glazing incidence: R -> 1', () => {
    const th = 89.5 * DEG;
    expect(fresnel_unpol(th, 1, 1.5)).toBeGreaterThan(0.9);
  });

  it('Unpolarized reflectance is average of R_s and R_p', () => {
    const n1 = 1, n2 = 1.5;
    const th = 45 * DEG;
    const expected = 0.5 * (fresnel_rs(th, n1, n2).R + fresnel_rp(th, n1, n2).R);
    expect(fresnel_unpol(th, n1, n2)).toBeCloseTo(expected, 9);
  });

  it('regime classifier: brewster + tir + normal-incidence', () => {
    expect(regime(0.1 * DEG, 1, 1.5)).toBe('normal-incidence');
    const tB = brewsterAngle(1, 1.5);
    expect(regime(tB, 1, 1.5)).toBe('brewster');
    const tC = criticalAngle(1.5, 1);
    expect(regime(tC + 1 * DEG, 1.5, 1)).toBe('tir');
  });
});
