// Displacement-current invariant tests: the displacement current in the gap
// equals the conduction current in the wire, so the total current is continuous
// and Ampere's law gives the same B at the wire and at the gap.

import { describe, it, expect } from 'vitest';
import { tauOf, current, charge, displacementCurrent, bField } from './sim.js';

const V = 5, R = 2, C = 1.5, tau = tauOf(R, C);

describe('Displacement current equals conduction current', () => {
  it('I_disp = eps0 dPhi_E/dt matches I_cond at every instant', () => {
    for (const t of [0.05, 0.5, 1.0, 2.0, 4.0]) {
      expect(displacementCurrent(V, C, t, tau)).toBeCloseTo(current(V, R, t, tau), 4);
    }
  });
  it('the charging current decays exponentially with time constant RC', () => {
    expect(current(V, R, 0, tau)).toBeCloseTo(V / R, 9);
    expect(current(V, R, tau, tau) / current(V, R, 0, tau)).toBeCloseTo(1 / Math.E, 6);
  });
  it('the charge saturates at C V and the current is its derivative', () => {
    expect(charge(V, C, 100, tau)).toBeCloseTo(C * V, 6);
    const h = 1e-5, t = 0.7;
    const dQ = (charge(V, C, t + h, tau) - charge(V, C, t - h, tau)) / (2 * h);
    expect(dQ).toBeCloseTo(current(V, R, t, tau), 4);
  });
});

describe('Ampere law continuity', () => {
  it('B is the same whether the loop encloses the wire current or the gap displacement current', () => {
    for (const t of [0.2, 1.3, 3.0]) {
      const r = 0.5;
      const Bwire = bField(current(V, R, t, tau), r);
      const Bgap = bField(displacementCurrent(V, C, t, tau), r);
      expect(Bwire).toBeCloseTo(Bgap, 4);
    }
  });
});
