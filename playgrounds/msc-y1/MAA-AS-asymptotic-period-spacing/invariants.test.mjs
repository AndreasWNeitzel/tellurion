import { describe, it, expect } from 'vitest';
import { Pi_l, evolutionStage, PROFILES, brunt, phaseIntegral, pi1FromProfile, modeProfileArray } from './sim.js';

describe('asymptotic-period-spacing', () => {
  it('Pi_l = Pi_0 / sqrt(l(l+1))', () => {
    expect(Math.abs(Pi_l(100, 1) - 100 / Math.sqrt(2))).toBeLessThan(1e-12);
    expect(Math.abs(Pi_l(100, 2) - 100 / Math.sqrt(6))).toBeLessThan(1e-12);
  });

  it('classifier monotone in Pi_1', () => {
    expect(evolutionStage(80)).toBe('RGB');
    expect(evolutionStage(140)).toBe('transition');
    expect(evolutionStage(250)).toBe('RC');
  });

  it('BV profile zero inside convective core and outside envelope', () => {
    const p = PROFILES.rc;
    expect(brunt(0.0, p)).toBe(0);
    expect(brunt(p.r_cc - 1e-6, p)).toBe(0);
    expect(brunt(p.r_env + 1e-6, p)).toBe(0);
    expect(brunt(0.95, p)).toBe(0);
  });

  it('phase integral is monotone non-decreasing', () => {
    const { phase } = phaseIntegral(PROFILES.rgb, 200);
    for (let i = 1; i < phase.length; i += 1) expect(phase[i]).toBeGreaterThanOrEqual(phase[i - 1] - 1e-12);
  });

  it('RGB Pi_1 in 50 to 110 s window', () => {
    const v = pi1FromProfile(PROFILES.rgb);
    expect(v).toBeGreaterThan(50);
    expect(v).toBeLessThan(110);
  });

  it('RC Pi_1 in 180 to 320 s window', () => {
    const v = pi1FromProfile(PROFILES.rc);
    expect(v).toBeGreaterThan(180);
    expect(v).toBeLessThan(320);
  });

  it('RC Pi_1 strictly larger than RGB Pi_1', () => {
    expect(pi1FromProfile(PROFILES.rc)).toBeGreaterThan(pi1FromProfile(PROFILES.rgb));
  });

  it('mode profile has approximately n nodes for n>=8', () => {
    for (const n of [8, 14, 22]) {
      const arr = modeProfileArray(PROFILES.rgb, n, 400);
      let nodes = 0;
      for (let i = 1; i < arr.length; i += 1) if (arr[i - 1] * arr[i] < 0) nodes += 1;
      // WKB count is exact only in the asymptotic limit; allow +/-2 wiggle.
      expect(nodes).toBeGreaterThanOrEqual(n - 2);
      expect(nodes).toBeLessThanOrEqual(n + 2);
    }
  });

  it('mode profile normalized to peak 1', () => {
    const arr = modeProfileArray(PROFILES.rgb, 12, 200);
    let mx = 0;
    for (const v of arr) if (Math.abs(v) > mx) mx = Math.abs(v);
    expect(Math.abs(mx - 1)).toBeLessThan(1e-9);
  });
});
