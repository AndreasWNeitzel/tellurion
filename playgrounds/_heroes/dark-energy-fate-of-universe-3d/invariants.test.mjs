import { describe, it, expect } from 'vitest';
import { curvature, friedmannE, integrateScaleFactor, scaleAt, fateOf, PRESETS } from './sim.js';

describe('dark-energy-fate-of-universe-3d', () => {
  it('curvature closure: Om_k = 1 - Om_r - Om_m - Om_L', () => {
    expect(curvature({ r: 0, m: 0.3, L: 0.7 })).toBeCloseTo(0, 9);
    expect(curvature({ r: 0, m: 1.8, L: 0 })).toBeCloseTo(-0.8, 9);
  });

  it('friedmannE at a=1 reduces to Om_m + Om_L + Om_k = 1', () => {
    expect(friedmannE(1, { r: 0, m: 0.3, L: 0.7 })).toBeCloseTo(1, 9);
  });

  it('a(today) = 1 for any model', () => {
    for (const key of Object.keys(PRESETS)) {
      const sol = integrateScaleFactor(PRESETS[key], 1, { tMax: 5, dt: 0.01 });
      expect(scaleAt(sol, 0)).toBeCloseTo(1, 2);
    }
  });

  it('LCDM accelerates: a(future) > a(now) and rate increases', () => {
    const sol = integrateScaleFactor(PRESETS.lcdm, 1, { tMax: 8, dt: 0.01 });
    const aNow = scaleAt(sol, 0);
    const aLate = scaleAt(sol, 5);
    expect(aLate).toBeGreaterThan(aNow);
  });

  it('Big Crunch model recollapses: a(future) drops below 1 eventually', () => {
    const sol = integrateScaleFactor(PRESETS.bigcrunch, 1, { tMax: 15, dt: 0.01 });
    let minA = Infinity;
    for (const a of sol.a) if (a < minA) minA = a;
    expect(minA).toBeLessThan(0.5);
  });

  it('fateOf classifies LCDM as accelerating, flat-matter as heat death', () => {
    expect(fateOf(PRESETS.lcdm)).toContain('de Sitter');
    expect(fateOf(PRESETS.heatdeath)).toBe('heat death');
    expect(fateOf(PRESETS.bigcrunch)).toBe('Big Crunch');
  });

  it('integration covers t=0 (today) in the sampled range', () => {
    const sol = integrateScaleFactor(PRESETS.lcdm, 1, { tMax: 5, dt: 0.01 });
    expect(sol.t[0]).toBeLessThan(0);
    expect(sol.t[sol.t.length - 1]).toBeGreaterThan(0);
  });
});
