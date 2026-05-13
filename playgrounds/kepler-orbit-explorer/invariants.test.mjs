// Kepler Solar System invariant tests at seed 0xC0FFEE.

import { describe, it, expect } from 'vitest';
import {
  PLANETS, createSwarm, stepSwarm, bodyPosition,
  periastronIC, keplerThirdLaw,
  eccentricityFromState, semiMajorFromState,
  DEFAULT_DT,
} from './sim.js';

describe('kepler-solar-system: per-body Kepler invariants', () => {
  it('initial conditions at periastron match analytic targets', () => {
    for (const p of PLANETS) {
      const ic = periastronIC(p.a, p.e, 0);
      const r = Math.hypot(ic.x, ic.y);
      expect(r).toBeCloseTo(p.a * (1 - p.e), 12);
      const v = Math.hypot(ic.vx, ic.vy);
      expect(v).toBeCloseTo(Math.sqrt((1 + p.e) / (p.a * (1 - p.e))), 8);
    }
  });

  it("Kepler's III law: T = 2 pi a^(3/2) for all planets", () => {
    for (const p of PLANETS) {
      const T = keplerThirdLaw(p.a);
      expect(T).toBeCloseTo(2 * Math.PI * Math.pow(p.a, 1.5), 12);
    }
  });

  it('eccentricityFromState recovers e at periastron', () => {
    for (const p of PLANETS) {
      const ic = periastronIC(p.a, p.e, 0);
      const eRec = eccentricityFromState(ic.x, ic.y, ic.vx, ic.vy);
      expect(eRec).toBeCloseTo(p.e, 8);
    }
  });

  it('semiMajorFromState recovers a at periastron', () => {
    for (const p of PLANETS) {
      const ic = periastronIC(p.a, p.e, 0);
      const aRec = semiMajorFromState(ic.x, ic.y, ic.vx, ic.vy);
      expect(aRec).toBeCloseTo(p.a, 8);
    }
  });
});

describe('kepler-solar-system: long-term integration', () => {
  it('Earth orbit returns near its IC after exactly one period', () => {
    const earth = PLANETS[2];
    const swarm = createSwarm([earth]);
    const T = keplerThirdLaw(earth.a);
    const steps = Math.round(T / DEFAULT_DT);
    const x0 = swarm.inst.q[0], y0 = swarm.inst.q[1];
    for (let i = 0; i < steps; i += 1) stepSwarm(swarm, DEFAULT_DT);
    const r = Math.hypot(swarm.inst.q[0] - x0, swarm.inst.q[1] - y0);
    expect(r).toBeLessThan(0.02);                        // within 2 percent of a
  });

  it('all five bodies stay bound over 1 yr', () => {
    const bodies = [
      ...PLANETS,
      { a: 1.8, e: 0.45, omega: 0.5 },
    ];
    const swarm = createSwarm(bodies);
    const T = 2 * Math.PI;                              // 1 yr in GM=1 units
    const steps = Math.round(T / DEFAULT_DT);
    for (let i = 0; i < steps; i += 1) stepSwarm(swarm, DEFAULT_DT);
    for (let b = 0; b < bodies.length; b += 1) {
      const { x, y } = bodyPosition(swarm, b);
      expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
      // bound: r < 2 a_apastron = 2 * a * (1 + e)
      const rMax = 2 * bodies[b].a * (1 + bodies[b].e);
      expect(Math.hypot(x, y)).toBeLessThan(rMax);
    }
  }, 30_000);
});

describe('kepler-solar-system: reproducibility', () => {
  it('bit-identical positions after 1000 steps', () => {
    function run() {
      const swarm = createSwarm(PLANETS);
      for (let i = 0; i < 1000; i += 1) stepSwarm(swarm, DEFAULT_DT);
      return Array.from(swarm.inst.q);
    }
    const a = run();
    const b = run();
    for (let i = 0; i < a.length; i += 1) expect(a[i]).toBe(b[i]);
  });
});
