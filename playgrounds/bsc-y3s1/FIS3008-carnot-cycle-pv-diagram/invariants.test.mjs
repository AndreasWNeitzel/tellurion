// Invariants for the Carnot cycle: the Carnot volume condition V3/V4 = V2/V1, the
// continuity of pressure and temperature at the corners, the first law W = Q_h - Q_c,
// and the efficiency identity W/Q_h = 1 - T_c/T_h.

import { describe, it, expect } from 'vitest';
import { cycleStates, pressureAt, temperatureAt, heatHot, heatCold, netWork, efficiency } from './sim.js';

const cases = [
  [2, 1, 2, 5 / 3], [2.5, 0.8, 2.2, 7 / 5], [3, 1.5, 1.6, 5 / 3], [1.8, 0.9, 2.4, 7 / 5],
];

describe('Carnot volume condition', () => {
  it('V3/V4 = V2/V1 (the isothermal ratios are equal)', () => {
    for (const [Th, Tc, r, g] of cases) { const s = cycleStates(Th, Tc, r, g); expect(s.V3 / s.V4).toBeCloseTo(s.V2 / s.V1, 9); }
  });
});

describe('Corner continuity', () => {
  it('pressure matches where legs meet', () => {
    for (const [Th, Tc, r, g] of cases) {
      const s = cycleStates(Th, Tc, r, g);
      expect(pressureAt(s, 0, s.V2)).toBeCloseTo(pressureAt(s, 1, s.V2), 9);
      expect(pressureAt(s, 1, s.V3)).toBeCloseTo(pressureAt(s, 2, s.V3), 9);
      expect(pressureAt(s, 2, s.V4)).toBeCloseTo(pressureAt(s, 3, s.V4), 9);
      expect(pressureAt(s, 3, s.V1)).toBeCloseTo(pressureAt(s, 0, s.V1), 9);
    }
  });
  it('the adiabats connect T_h to T_c', () => {
    for (const [Th, Tc, r, g] of cases) {
      const s = cycleStates(Th, Tc, r, g);
      expect(temperatureAt(s, 1, s.V3)).toBeCloseTo(Tc, 9);
      expect(temperatureAt(s, 3, s.V1)).toBeCloseTo(Th, 9);
    }
  });
});

describe('First law and efficiency', () => {
  it('W = Q_h - Q_c and W > 0', () => {
    for (const [Th, Tc, r, g] of cases) { const s = cycleStates(Th, Tc, r, g); expect(netWork(s)).toBeCloseTo(heatHot(s) - heatCold(s), 12); expect(netWork(s)).toBeGreaterThan(0); }
  });
  it('W/Q_h = eta = 1 - T_c/T_h', () => {
    for (const [Th, Tc, r, g] of cases) { const s = cycleStates(Th, Tc, r, g); expect(netWork(s) / heatHot(s)).toBeCloseTo(efficiency(s), 9); expect(efficiency(s)).toBeCloseTo(1 - Tc / Th, 12); }
  });
});
