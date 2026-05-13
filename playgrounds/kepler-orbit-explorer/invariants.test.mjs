// Kepler Orbit Explorer invariant tests at seed 0xC0FFEE.

import { describe, it, expect } from 'vitest';
import { createOrbit, stepOrbit, orbitDiagnostics, DEFAULT_DT } from './sim.js';

describe('kepler-orbit-explorer: strong invariants', () => {
  it('initial state matches analytic targets at a=1, e=0.6', () => {
    const o = createOrbit(1, 0.6);
    const d = orbitDiagnostics(o);
    expect(d.energy).toBeCloseTo(-0.5, 12);
    expect(d.angularMomentum).toBeCloseTo(0.8, 12);
    expect(d.lrlMag).toBeCloseTo(0.6, 6);
    expect(o.period).toBeCloseTo(2 * Math.PI, 8);
  });

  it('|dE/E| < 1e-3 and |dL/L| < 1e-10 over 10^3 periods at a=1, e=0.6', () => {
    const o = createOrbit(1, 0.6);
    const T = 2 * Math.PI;
    const N_PERIODS = 1000;
    const steps = Math.round(N_PERIODS * T / DEFAULT_DT);
    const L0 = orbitDiagnostics(o).angularMomentum;
    let maxE = 0, maxL = 0;
    for (let i = 0; i < steps; i += 1) {
      stepOrbit(o);
      if ((i & 0x3FFF) === 0) {
        const d = orbitDiagnostics(o);
        const eDrift = Math.abs(d.energyDrift);
        const lDrift = Math.abs((d.angularMomentum - L0) / L0);
        if (eDrift > maxE) maxE = eDrift;
        if (lDrift > maxL) maxL = lDrift;
      }
    }
    expect(maxE).toBeLessThan(1e-3);
    expect(maxL).toBeLessThan(1e-10);
  }, 30_000);

  it('LRL magnitude bounded |dA/A| < 5e-3 over 10^3 periods', () => {
    const o = createOrbit(1, 0.6);
    const T = 2 * Math.PI;
    const steps = Math.round(1000 * T / DEFAULT_DT);
    const A0 = orbitDiagnostics(o).lrlMag;
    let maxD = 0;
    for (let i = 0; i < steps; i += 1) {
      stepOrbit(o);
      if ((i & 0x3FFF) === 0) {
        const d = orbitDiagnostics(o).lrlMag;
        const rel = Math.abs(d - A0) / A0;
        if (rel > maxD) maxD = rel;
      }
    }
    expect(A0).toBeCloseTo(0.6, 6);
    expect(maxD).toBeLessThan(5e-3);
  }, 30_000);
});

describe('kepler-orbit-explorer: limiting cases', () => {
  it('e = 0: |A| = 0 and orbit radius constant within 1e-4', () => {
    const o = createOrbit(1, 0);
    const r0 = Math.hypot(o.inst.q[0], o.inst.q[1]);
    let maxDr = 0;
    const steps = Math.round(10 * 2 * Math.PI / DEFAULT_DT);
    for (let i = 0; i < steps; i += 1) {
      stepOrbit(o);
      const r = Math.hypot(o.inst.q[0], o.inst.q[1]);
      const dr = Math.abs(r - r0);
      if (dr > maxDr) maxDr = dr;
    }
    expect(orbitDiagnostics(o).lrlMag).toBeLessThan(1e-3);
    expect(maxDr).toBeLessThan(1e-4);
  });

  it('a, e parameter sweep: closed orbits at all tested (a, e) below e = 0.6', () => {
    for (const [a, e] of [[0.5, 0.0], [0.7, 0.2], [1.0, 0.4], [1.5, 0.5], [2.0, 0.6]]) {
      const o = createOrbit(a, e);
      const T = 2 * Math.PI * Math.pow(a, 1.5);
      const steps = Math.round(T / DEFAULT_DT);
      const x0 = o.inst.q[0], y0 = o.inst.q[1];
      for (let i = 0; i < steps; i += 1) stepOrbit(o);
      const dx = o.inst.q[0] - x0;
      const dy = o.inst.q[1] - y0;
      // After one period the orbit should return close to the starting point.
      expect(Math.hypot(dx, dy)).toBeLessThan(0.05 * a);
    }
  }, 30_000);
});

describe('kepler-orbit-explorer: reproducibility', () => {
  it('bit-identical state after 1000 steps at a=1, e=0.6', () => {
    function run() {
      const o = createOrbit(1, 0.6);
      for (let i = 0; i < 1000; i += 1) stepOrbit(o);
      return { q0: o.inst.q[0], q1: o.inst.q[1], qd0: o.inst.qdot[0], qd1: o.inst.qdot[1] };
    }
    const a = run();
    const b = run();
    expect(a.q0).toBe(b.q0);
    expect(a.q1).toBe(b.q1);
    expect(a.qd0).toBe(b.qd0);
    expect(a.qd1).toBe(b.qd1);
  });
});
