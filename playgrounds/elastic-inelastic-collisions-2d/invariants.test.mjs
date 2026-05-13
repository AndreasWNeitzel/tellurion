// Elastic Inelastic Collisions 2d invariant tests.
// Replace placeholders. Each test imports the engine headlessly and asserts a strong-form invariant
// against the threshold in spec.md.

import { describe, it, expect, beforeAll } from 'vitest';
import { DEFAULT_SEED, makeRng } from '../../shared/js/render/rng.js';
// import * as engine from '../../shared/js/engine/<engine>.js';

describe('Elastic Inelastic Collisions 2d invariants', () => {
  let sim;
  const PHYSICS_DT = 1 / 240;
  const STEPS = 10_000;

  beforeAll(() => {
    const _rng = makeRng(DEFAULT_SEED);
    // sim = engine.create({ ... seed: DEFAULT_SEED ... });
    sim = { energy: 1.0, step(dt) { this.energy *= 1 - 1e-9 * dt; }, diagnostics() { return { energyDrift: this.energy - 1.0 }; } };
    for (let i = 0; i < STEPS; i += 1) sim.step(PHYSICS_DT);
  });

  it('energy drift below 1e-3 over 10^4 dt', () => {
    const { energyDrift } = sim.diagnostics();
    expect(Math.abs(energyDrift)).toBeLessThan(1e-3);
  });

  // Limiting-case tests go here; each one named after the limit it checks.
  // it('weak field deflection -> 4M/b within 1 percent for b > 30M', () => { ... });
});
