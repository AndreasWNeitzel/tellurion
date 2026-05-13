// Kapitza pendulum invariants.
// (a) Stability criterion a^2 omega^2 > 2 g l.
// (b) Ratio formula.
// (c) Above stability: small perturbation stays bounded.
// (d) Below stability: perturbation grows.
// (e) Effective-potential minimum at theta = 0 when stable.

import { describe, it, expect } from 'vitest';
import {
  createKapitza, stepKapitza, isStable, stabilityRatio,
  effectivePotential, G_GRAV, L_PEN,
} from './sim.js';

describe('Kapitza: stability criterion', () => {
  it('a^2 omega^2 > 2 g l => stable', () => {
    const threshold = Math.sqrt(2 * G_GRAV * L_PEN);
    expect(isStable(0.1, threshold / 0.1 * 1.5)).toBe(true);
    expect(isStable(0.1, threshold / 0.1 * 0.5)).toBe(false);
  });
});

describe('Kapitza: ratio formula', () => {
  it('stabilityRatio = a^2 omega^2 / (2 g l)', () => {
    for (const [a, w] of [[0.1, 30], [0.05, 50]]) {
      expect(stabilityRatio(a, w)).toBeCloseTo(a * a * w * w / (2 * G_GRAV * L_PEN), 12);
    }
  });
});

describe('Kapitza: above stability bounded', () => {
  it('a = 0.1, omega = 60: max |theta| < 0.3 over 5 s', () => {
    const s = createKapitza({ theta: 0.05, a: 0.1, omega: 60 });
    const dt = 0.0005;
    const N = Math.round(5 / dt);
    let maxTh = 0;
    for (let i = 0; i < N; i += 1) {
      stepKapitza(s, dt);
      if (Math.abs(s.theta) > maxTh) maxTh = Math.abs(s.theta);
    }
    expect(maxTh).toBeLessThan(0.3);
  }, 30_000);
});

describe('Kapitza: below stability falls', () => {
  it('a = 0.05, omega = 20: max |theta| > 1', () => {
    const s = createKapitza({ theta: 0.05, a: 0.05, omega: 20 });
    const dt = 0.0005;
    let maxTh = 0;
    for (let i = 0; i < 10_000; i += 1) {
      stepKapitza(s, dt);
      if (Math.abs(s.theta) > maxTh) maxTh = Math.abs(s.theta);
    }
    expect(maxTh).toBeGreaterThan(1);
  }, 30_000);
});

describe('Kapitza: effective potential min at theta = 0', () => {
  it('when stable, U_eff(0) < U_eff(0.1)', () => {
    const a = 0.15, omega = 30;
    expect(stabilityRatio(a, omega)).toBeGreaterThan(1);
    expect(effectivePotential(0, a, omega)).toBeLessThan(effectivePotential(0.1, a, omega));
  });
});
