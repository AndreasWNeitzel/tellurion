// XY model invariant tests.
// (a) Cold init: m = 1, e = -2 per site.
// (b) High T: m near 0.
// (c) Vortex charge conservation: n+ = n- on torus.
// (d) Vortex density grows with T.

import { describe, it, expect } from 'vitest';
import { createXY, sweep, magnetization, energyPerSite, vortexMap, T_BKT } from './sim.js';

describe('XY model: trivial limits', () => {
  it('cold init: m = 1, e = -2 per site', () => {
    const s = createXY({ L: 32, T: 0.1, init: 'cold', seed: 1 });
    expect(magnetization(s)).toBeCloseTo(1, 6);
    expect(energyPerSite(s)).toBeCloseTo(-2, 6);
  });

  it('hot init: |m| close to 0', () => {
    const s = createXY({ L: 64, T: 5.0, init: 'hot', seed: 1 });
    expect(magnetization(s)).toBeLessThan(0.1);
  });
});

describe('XY model: high-T thermalization', () => {
  it('at T = 2.5: |m| < 0.10 after 300 sweeps', () => {
    const s = createXY({ L: 48, T: 2.5, init: 'cold', seed: 1 });
    sweep(s, 300);
    expect(magnetization(s)).toBeLessThan(0.10);
  });
});

describe('XY model: vortex charge conservation', () => {
  it('total vortex charge n+ - n- = 0 on torus', () => {
    const s = createXY({ L: 48, T: 1.5, init: 'hot', seed: 1 });
    sweep(s, 200);
    const { nPlus, nMinus } = vortexMap(s);
    expect(nPlus - nMinus).toBe(0);
  });
});

describe('XY model: vortex density grows with T', () => {
  it('rho(T=2.0) > rho(T=0.5) after equilibration', () => {
    const sLow = createXY({ L: 48, T: 0.5, init: 'cold', seed: 1 });
    sweep(sLow, 300);
    const sHigh = createXY({ L: 48, T: 2.0, init: 'hot', seed: 1 });
    sweep(sHigh, 300);
    const rhoLow = vortexMap(sLow).nPlus;
    const rhoHigh = vortexMap(sHigh).nPlus;
    expect(rhoHigh).toBeGreaterThan(rhoLow);
  });
});

describe('XY model: T_BKT value', () => {
  it('T_BKT ~ 0.893 (Hasenbusch 2005)', () => {
    expect(T_BKT).toBeCloseTo(0.893, 3);
  });
});
