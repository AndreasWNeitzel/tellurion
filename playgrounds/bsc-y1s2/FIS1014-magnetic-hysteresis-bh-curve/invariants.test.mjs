// Jiles-Atherton hysteresis: saturation bound, the existence of a
// hysteresis loop with remanence and coercivity, energy dissipation,
// and the anhysteretic Langevin limits.

import { describe, it, expect } from 'vitest';
import { langevin, anhysteretic, sweepLoop, PRESETS } from './sim.js';

describe('magnetic-hysteresis-bh-curve invariants', () => {
  it('Langevin is odd and saturates to +-1', () => {
    expect(langevin(0)).toBeCloseTo(0, 9);
    expect(langevin(-2)).toBeCloseTo(-langevin(2), 9);
    expect(langevin(40)).toBeGreaterThan(0.97);
    expect(langevin(40)).toBeLessThan(1.0);
  });

  it('|M| never exceeds the saturation magnetisation', () => {
    const r = sweepLoop(PRESETS['hard steel'], 3, 1000);
    for (const [, M] of r.pts) expect(Math.abs(M)).toBeLessThanOrEqual(PRESETS['hard steel'].Ms * 1.06);
  });

  it('the loop is open: ascending and descending branches differ', () => {
    const r = sweepLoop(PRESETS['hard steel'], 3, 1200);
    const half = r.pts.length / 2;
    // M at H ~ 0 on the descending branch vs the ascending branch.
    const desc = r.pts.slice(0, half).reduce((b, p) => Math.abs(p[0]) < Math.abs(b[0]) ? p : b)[1];
    const asc = r.pts.slice(half).reduce((b, p) => Math.abs(p[0]) < Math.abs(b[0]) ? p : b)[1];
    expect(Math.abs(desc - asc)).toBeGreaterThan(0.2);
  });

  it('positive remanence and a real coercive field', () => {
    const r = sweepLoop(PRESETS['hard steel'], 3, 1400);
    expect(r.Mr).toBeGreaterThan(0.1);
    expect(r.Hc).toBeGreaterThan(0.02);
  });

  it('hard material has a larger loop area and coercivity than soft', () => {
    const soft = sweepLoop(PRESETS['soft iron'], 3, 1400);
    const hard = sweepLoop(PRESETS['hard steel'], 3, 1400);
    expect(hard.area).toBeGreaterThan(soft.area);
    expect(hard.Hc).toBeGreaterThan(soft.Hc);
  });

  it('loop area (energy/cycle) is strictly positive for a lossy material', () => {
    expect(sweepLoop(PRESETS.ferrite, 3, 1200).area).toBeGreaterThan(0);
  });

  it('anhysteretic curve passes through the origin and saturates', () => {
    const p = PRESETS.ferrite;
    expect(anhysteretic(0, 0, p)).toBeCloseTo(0, 6);
    expect(anhysteretic(50, p.Ms, p)).toBeGreaterThan(0.9 * p.Ms);
    expect(anhysteretic(-50, -p.Ms, p)).toBeLessThan(-0.9 * p.Ms);
  });
});
