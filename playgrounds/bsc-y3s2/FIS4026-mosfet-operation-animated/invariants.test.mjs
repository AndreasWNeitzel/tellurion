import { describe, it, expect } from 'vitest';
import {
  drainCurrent, saturationCurrent, region, vdsSat, onResistance,
  channelThickness, pinchPosition, outputCurve, transferCurve,
} from './sim.js';

const P = { vth: 1, kn: 1e-3, lambda: 0 };

describe('mosfet-operation-animated invariants', () => {
  it('below threshold the drain current is far below the on-state saturation current', () => {
    const Isat = saturationCurrent(2, P);                 // V_GS = 2, V_ov = 1
    for (const vgs of [0, 0.5, 0.8]) {
      const Ioff = drainCurrent(vgs, 2, P);               // V_GS < V_th
      expect(Ioff / Isat).toBeLessThan(1e-6);
    }
  });

  it('the triode/saturation boundary is exactly V_DS = V_GS - V_th and the model is C1 there', () => {
    for (const vgs of [1.5, 2, 3]) {
      const vov = vgs - P.vth;
      expect(vdsSat(vgs, P.vth)).toBeCloseTo(vov, 12);
      expect(Math.abs(vdsSat(vgs, P.vth) - vov) / vov).toBeLessThan(1e-3);
      const eps = 1e-6;
      const iLo = drainCurrent(vgs, vov - eps, P);         // triode side
      const iHi = drainCurrent(vgs, vov + eps, P);         // saturation side
      expect(iLo).toBeCloseTo(iHi, 9);                     // value continuous
      const dLo = (drainCurrent(vgs, vov - eps, P) - drainCurrent(vgs, vov - 3 * eps, P)) / (2 * eps);
      expect(Math.abs(dLo)).toBeLessThan(1e-4);            // slope -> 0 at pinch (C1)
      expect(region(vgs, vov - eps, P.vth)).toBe('triode');
      expect(region(vgs, vov + eps, P.vth)).toBe('saturation');
    }
  });

  it('saturation current is quadratic in the overdrive', () => {
    const i1 = saturationCurrent(2, P);                    // V_ov = 1
    const i2 = saturationCurrent(3, P);                    // V_ov = 2
    const i3 = saturationCurrent(4, P);                    // V_ov = 3
    expect(i2 / i1).toBeCloseTo(4, 9);
    expect(i3 / i1).toBeCloseTo(9, 9);
    expect(i1).toBeCloseTo(0.5 * P.kn * 1 * 1, 12);
  });

  it('deep triode is ohmic: R_on = 1 / (k_n V_ov)', () => {
    const vgs = 3, vov = vgs - P.vth;
    const Ron = onResistance(vgs, P);
    expect(Ron).toBeCloseTo(1 / (P.kn * vov), 9);
    const v = 1e-4;
    const g = drainCurrent(vgs, v, P) / v;                 // small-signal conductance
    expect(g).toBeCloseTo(1 / Ron, 2);                     // = k_n V_ov
  });

  it('drain current rises with gate voltage; saturation is flat (lambda=0) and tilts up (lambda>0)', () => {
    let prev = -1;
    for (let vgs = 1.2; vgs <= 4; vgs += 0.2) {
      const I = drainCurrent(vgs, 5, P);
      expect(I).toBeGreaterThan(prev);
      prev = I;
    }
    expect(drainCurrent(3, 4, P)).toBeCloseTo(drainCurrent(3, 9, P), 12);   // flat, lambda=0
    const Pl = { ...P, lambda: 0.05 };
    expect(drainCurrent(3, 9, Pl)).toBeGreaterThan(drainCurrent(3, 4, Pl)); // CLM tilt
  });

  it('the inversion channel tapers from source to drain and pinches off in saturation', () => {
    const vgs = 3;
    // deep triode, tiny V_DS: nearly uniform channel
    expect(channelThickness(0, vgs, 0.02, P)).toBeCloseTo(1, 2);
    expect(channelThickness(1, vgs, 0.02, P)).toBeGreaterThan(0.95);
    // saturation: full at source, pinched (zero) at the drain end
    expect(channelThickness(0, vgs, 5, P)).toBeCloseTo(1, 6);
    expect(channelThickness(0.999, vgs, 5, P)).toBeLessThan(0.1);
    expect(channelThickness(0.5, vgs, 5, P)).toBeGreaterThan(channelThickness(0.95, vgs, 5, P));
    expect(pinchPosition(vgs, 5, P)).toBeCloseTo(1, 9);    // pinch at the drain edge (level-1)
    // cutoff: no channel
    expect(channelThickness(0.5, 0.5, 5, P)).toBe(0);
  });

  it('deterministic: identical inputs reproduce the curves bit-for-bit', () => {
    const a = outputCurve(2.5, 6, 300, P), b = outputCurve(2.5, 6, 300, P);
    const c = transferCurve(4, 5, 200, P), d = transferCurve(4, 5, 200, P);
    for (let i = 0; i <= 300; i += 1) expect(a.id[i]).toBe(b.id[i]);
    for (let i = 0; i <= 200; i += 1) expect(c.id[i]).toBe(d.id[i]);
  });
});
