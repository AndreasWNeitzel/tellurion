// Invariants for the Drude model: Ohm's law linearity, the conductivity proportional to
// the scattering time, the drift velocity opposite to the field, the AC rolloff, and the
// Monte Carlo drift converging to the predicted v_d = -E tau.

import { describe, it, expect } from 'vitest';
import { conductivity, currentDensity, driftVelocity, acConductivityMag, simulateDrift } from './sim.js';
import { makeRng } from '../../../shared/js/render/rng.js';

describe('Ohm law and conductivity', () => {
  it('the conductivity scales with the scattering time', () => {
    expect(conductivity(0.5)).toBeCloseTo(0.5, 12);
    expect(conductivity(1.0)).toBeCloseTo(2 * conductivity(0.5), 12);
  });
  it('the current is linear in the field', () => {
    expect(currentDensity(2, 0.4)).toBeCloseTo(2 * currentDensity(1, 0.4), 12);
    expect(currentDensity(1, 0.4)).toBeCloseTo(conductivity(0.4) * 1, 12);
  });
});

describe('Drift velocity', () => {
  it('is opposite to the field and proportional to E and tau', () => {
    expect(driftVelocity(1, 0.5)).toBeCloseTo(-0.5, 12);
    expect(driftVelocity(2, 0.5)).toBeCloseTo(2 * driftVelocity(1, 0.5), 12);
    expect(driftVelocity(1, 1.0)).toBeCloseTo(2 * driftVelocity(1, 0.5), 12);
  });
});

describe('AC conductivity', () => {
  it('starts at sigma_0 and rolls off above 1/tau', () => {
    expect(acConductivityMag(0, 0.5, 3)).toBeCloseTo(3, 12);
    expect(acConductivityMag(1 / 0.5, 0.5, 3)).toBeCloseTo(3 / Math.SQRT2, 9);
    expect(acConductivityMag(20, 0.5, 3)).toBeLessThan(acConductivityMag(2, 0.5, 3));
  });
});

describe('Monte Carlo drift', () => {
  it('converges to -E tau', () => {
    const rng = makeRng(0xC0FFEE);
    const d = simulateDrift(1, 0.5, 3, 400000, 0.004, rng);
    expect(d).toBeCloseTo(driftVelocity(1, 0.5), 1);
  });
});
