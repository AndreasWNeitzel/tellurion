import { describe, it, expect } from 'vitest';
import { transmission, reflection, resonanceEnergy, psiReal } from './sim.js';

describe('tunneling-rectangular-barrier: limiting cases', () => {
  it('T(E -> 0) = 0 (no transmission at zero energy)', () => {
    expect(transmission(0, 5, 1)).toBe(0);
  });

  it('T + R = 1 over a wide energy sweep', () => {
    for (const E of [0.1, 0.5, 1, 2, 5, 10, 20]) {
      const sum = transmission(E, 5, 1) + reflection(E, 5, 1);
      expect(Math.abs(sum - 1)).toBeLessThan(1e-12);
    }
  });

  it('T at resonance E = V0 + n^2 pi^2 / (2 a^2) equals 1 within 1e-10', () => {
    const V0 = 4, a = 1;
    for (let n = 1; n <= 4; n += 1) {
      const Eres = resonanceEnergy(n, V0, a);
      const T = transmission(Eres, V0, a);
      expect(Math.abs(T - 1)).toBeLessThan(1e-10);
    }
  });

  it('thick wide barrier: T decays exponentially with sqrt(V0 - E)', () => {
    // T ~ exp(-2 kappa a) for kappa a >> 1
    const V0 = 10, a = 5;
    const E = 1;
    const kappa = Math.sqrt(2 * (V0 - E));
    const T = transmission(E, V0, a);
    // T should be roughly 16 E (V0-E)/V0^2 * exp(-2 kappa a)
    const Tasymp = 16 * E * (V0 - E) / (V0 * V0) * Math.exp(-2 * kappa * a);
    expect(T).toBeGreaterThan(0.1 * Tasymp);
    expect(T).toBeLessThan(10 * Tasymp);
    expect(T).toBeLessThan(1e-8);
  });

  it('V0 = 0 (no barrier) gives T = 1 at all positive E', () => {
    for (const E of [0.1, 1, 5, 10]) {
      // V0 = 0 means kappa = sqrt(2 E) = k; T = 4 E * E / (4 E^2 + 0) = 1.
      expect(Math.abs(transmission(E, 0, 1) - 1)).toBeLessThan(1e-12);
    }
  });
});

describe('tunneling-rectangular-barrier: reproducibility', () => {
  it('transmission is bit-identical for repeated calls', () => {
    const a = transmission(2.5, 5, 1.3);
    const b = transmission(2.5, 5, 1.3);
    expect(a).toBe(b);
  });
});

describe('tunneling-rectangular-barrier: wavefunction continuity at the walls', () => {
  it('psi is continuous at x = 0 and x = a (E < V0)', () => {
    // Approach from both sides with very small offset and compare.
    const params = { E: 2.5, V0: 6.0, a: 1.4, t: 0.3 };
    const eps = 1e-7;
    const left0 = psiReal(-eps, params.t, params.E, params.V0, params.a);
    const right0 = psiReal(+eps, params.t, params.E, params.V0, params.a);
    expect(Math.abs(left0 - right0)).toBeLessThan(1e-4);

    const lefta = psiReal(params.a - eps, params.t, params.E, params.V0, params.a);
    const righta = psiReal(params.a + eps, params.t, params.E, params.V0, params.a);
    expect(Math.abs(lefta - righta)).toBeLessThan(1e-4);
  });

  it('psi is continuous at x = 0 and x = a (E > V0, above-barrier)', () => {
    const params = { E: 8.0, V0: 4.0, a: 1.2, t: 0.0 };
    const eps = 1e-7;
    const left0 = psiReal(-eps, params.t, params.E, params.V0, params.a);
    const right0 = psiReal(+eps, params.t, params.E, params.V0, params.a);
    expect(Math.abs(left0 - right0)).toBeLessThan(1e-4);
    const lefta = psiReal(params.a - eps, params.t, params.E, params.V0, params.a);
    const righta = psiReal(params.a + eps, params.t, params.E, params.V0, params.a);
    expect(Math.abs(lefta - righta)).toBeLessThan(1e-4);
  });

  it('psi inside the barrier is bounded (does not diverge as we move through)', () => {
    // Even for a thick barrier, the matched A,B solution stays bounded.
    const E = 1.0, V0 = 10, a = 2.0;
    for (let i = 0; i <= 20; i += 1) {
      const x = (a * i) / 20;
      const val = psiReal(x, 0, E, V0, a);
      expect(Number.isFinite(val)).toBe(true);
      expect(Math.abs(val)).toBeLessThan(5);
    }
  });
});
