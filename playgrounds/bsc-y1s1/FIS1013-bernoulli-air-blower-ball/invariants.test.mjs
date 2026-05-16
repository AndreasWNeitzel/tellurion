// Bernoulli air-blower ball invariant tests. The drag/jet model in
// sim.js must levitate the ball, self-centre it, drop it when the
// blower is off, and raise the equilibrium height with blower power.

import { describe, it, expect } from 'vitest';
import {
  createBlower, step, airVelocityAt, equilibriumHeight, diagnostics,
} from './sim.js';

const DT = 1 / 240;
function run(s, n) { for (let i = 0; i < n; i += 1) step(s, DT); return s; }

describe('air-blower ball: levitation', () => {
  it('a ball released on-axis settles to a bounded height (does not fall or escape)', () => {
    const s = createBlower({ U0: 18, x0: 0, y0: 1.1 });
    run(s, 6000);
    expect(s.y).toBeGreaterThan(s.ballR + 0.02);
    expect(s.y).toBeLessThan(1.3);
    expect(Math.abs(s.vy)).toBeLessThan(0.5);
  });

  it('equilibrium height exists and increases with blower power', () => {
    const lo = equilibriumHeight(createBlower({ U0: 12 }));
    const hi = equilibriumHeight(createBlower({ U0: 26 }));
    expect(lo).toBeGreaterThan(0);
    expect(hi).toBeGreaterThan(lo);
  });

  it('power too low: no equilibrium and the ball drops to the floor', () => {
    const s = createBlower({ U0: 6, x0: 0, y0: 0.9 });
    expect(equilibriumHeight(s)).toBeNull();
    run(s, 6000);
    expect(s.y).toBeLessThan(0.05);
  });
});

describe('air-blower ball: stability and blower switch', () => {
  it('an off-axis ball feels a net restoring (inward) horizontal force', () => {
    const s = createBlower({ U0: 18, x0: 0.05, y0: 0.55 });
    step(s, DT);
    expect(s.vx).toBeLessThan(0);
  });

  it('off-axis ball converges toward the jet axis over time', () => {
    const s = createBlower({ U0: 18, x0: 0.06, y0: 0.55 });
    const x0 = s.x;
    run(s, 8000);
    expect(Math.abs(s.x)).toBeLessThan(Math.abs(x0));
  });

  it('blower off: the ball falls to the floor', () => {
    const s = createBlower({ U0: 18, x0: 0, y0: 0.9, on: false });
    expect(airVelocityAt(s, 0, 0.3).speed).toBe(0);
    run(s, 4000);
    expect(s.y).toBeLessThan(0.05);
  });

  it('diagnostics reports finite height and off-axis offset', () => {
    const s = createBlower({ U0: 18, x0: 0.02, y0: 0.7 });
    const d = diagnostics(s);
    expect(Number.isFinite(d.height)).toBe(true);
    expect(Number.isFinite(d.offAxis)).toBe(true);
  });
});
