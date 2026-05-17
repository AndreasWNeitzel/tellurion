// Thermodynamic cycles: the first law around a closed loop, the
// Carnot and Otto efficiency formulas, the Carnot bound, and the
// adiabatic relation.

import { describe, it, expect } from 'vitest';
import { cycleStates, analysis, carnotEff, ottoEff, sampleSeg } from './sim.js';

describe('thermodynamic-engine-simulator invariants', () => {
  it('first law: internal energy returns over a closed cycle (dU ~ 0)', () => {
    for (const type of ['carnot', 'otto', 'diesel', 'stirling']) {
      const a = analysis(cycleStates({ type, Th: 600, Tc: 300, r: 5 }));
      expect(Math.abs(a.dU) / Math.max(Math.abs(a.W), 1)).toBeLessThan(1e-9);
    }
  });

  it('net work equals net heat (sum Q = sum W) for the loop', () => {
    const segs = cycleStates({ type: 'otto', Th: 700, Tc: 300, r: 6 });
    let Q = 0, W = 0; for (const s of segs) { Q += s.Q; W += s.W; }
    expect(Math.abs(Q - W) / Math.max(Math.abs(W), 1)).toBeLessThan(1e-9);
  });

  it('Carnot efficiency equals 1 - Tc/Th within 0.5%', () => {
    const a = analysis(cycleStates({ type: 'carnot', Th: 600, Tc: 300, r: 4 }));
    expect(Math.abs(a.eff - carnotEff(600, 300)) / carnotEff(600, 300)).toBeLessThan(5e-3);
  });

  it('Otto efficiency equals 1 - r^(1-gamma) within 0.5%', () => {
    const r = 8;
    const a = analysis(cycleStates({ type: 'otto', Th: 800, Tc: 300, r }));
    expect(Math.abs(a.eff - ottoEff(r)) / ottoEff(r)).toBeLessThan(5e-3);
  });

  it('efficiency vanishes as Tc -> Th (Carnot)', () => {
    const a = analysis(cycleStates({ type: 'carnot', Th: 500, Tc: 499.5, r: 4 }));
    expect(a.eff).toBeLessThan(0.01);
  });

  it('no cycle beats Carnot between its own temperature extremes', () => {
    for (const type of ['carnot', 'otto', 'diesel', 'stirling']) {
      const segs = cycleStates({ type, Th: 700, Tc: 300, r: 6 });
      let Tmin = Infinity, Tmax = -Infinity;
      for (const s of segs) { Tmin = Math.min(Tmin, s.s.T, s.e.T); Tmax = Math.max(Tmax, s.s.T, s.e.T); }
      const a = analysis(segs);
      expect(a.eff).toBeLessThanOrEqual(carnotEff(Tmax, Tmin) + 1e-6);
    }
  });

  it('engine loop has positive net work (clockwise, area > 0)', () => {
    const a = analysis(cycleStates({ type: 'carnot', Th: 600, Tc: 300, r: 4 }));
    expect(a.W).toBeGreaterThan(0);
    expect(a.Qin).toBeGreaterThan(a.Qout);
  });

  it('adiabatic segments keep pV^gamma constant within 1e-6', () => {
    const segs = cycleStates({ type: 'otto', Th: 700, Tc: 300, r: 6 });
    const ad = segs.find(s => s.proc === 'adiabatic');
    const pts = sampleSeg(ad, 5 / 3, 30);
    const c0 = pts[0][1] * Math.pow(pts[0][0], 5 / 3);
    for (const [V, P] of pts) expect(Math.abs(P * Math.pow(V, 5 / 3) - c0) / c0).toBeLessThan(1e-6);
  });
});
