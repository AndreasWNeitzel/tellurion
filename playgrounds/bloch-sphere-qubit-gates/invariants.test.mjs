import { describe, it, expect } from 'vitest';
import { GATES, Rx, Ry, Rz, applyGate, ampsToBloch, blochToAmps, unitarityNorm } from './sim.js';

describe('bloch-sphere: gate unitarity', () => {
  it('every standard gate has unitarity-norm below 1e-12', () => {
    for (const name of Object.keys(GATES)) {
      const U = GATES[name];
      expect(unitarityNorm(U)).toBeLessThan(1e-12);
    }
  });

  it('continuous rotation gates Rx, Ry, Rz are unitary for arbitrary angles', () => {
    for (const angle of [0, 0.123, Math.PI / 3, Math.PI, 2 * Math.PI, 7]) {
      expect(unitarityNorm(Rx(angle))).toBeLessThan(1e-12);
      expect(unitarityNorm(Ry(angle))).toBeLessThan(1e-12);
      expect(unitarityNorm(Rz(angle))).toBeLessThan(1e-12);
    }
  });
});

describe('bloch-sphere: gate action correctness', () => {
  it('H |0> sends Bloch vector to +x axis', () => {
    const r = applyGate(GATES.H, [1, 0], [0, 0]);
    const b = ampsToBloch(r.a, r.b);
    expect(Math.abs(b.theta - Math.PI / 2)).toBeLessThan(1e-9);
    expect(Math.abs(b.phi)).toBeLessThan(1e-9);
  });

  it('X X = I (involution)', () => {
    let s = { a: [0.6, 0.2], b: [0.7, 0.1] };
    s = applyGate(GATES.X, s.a, s.b);
    s = applyGate(GATES.X, s.a, s.b);
    expect(Math.abs(s.a[0] - 0.6)).toBeLessThan(1e-12);
    expect(Math.abs(s.a[1] - 0.2)).toBeLessThan(1e-12);
    expect(Math.abs(s.b[0] - 0.7)).toBeLessThan(1e-12);
    expect(Math.abs(s.b[1] - 0.1)).toBeLessThan(1e-12);
  });

  it('Z flips the phase of the |1> component', () => {
    const psi0 = [1 / Math.SQRT2, 0];
    const psi1 = [1 / Math.SQRT2, 0];
    const r = applyGate(GATES.Z, psi0, psi1);
    expect(Math.abs(r.a[0] - 1 / Math.SQRT2)).toBeLessThan(1e-12);
    expect(Math.abs(r.b[0] + 1 / Math.SQRT2)).toBeLessThan(1e-12);
  });

  it('Rz(2 pi) leaves the Bloch vector unchanged (global -1 phase)', () => {
    const s0 = { a: [0.6, 0.2], b: [0.7, 0.1] };
    const s1 = applyGate(Rz(2 * Math.PI), s0.a, s0.b);
    const b0 = ampsToBloch(s0.a, s0.b);
    const b1 = ampsToBloch(s1.a, s1.b);
    expect(Math.abs(b1.theta - b0.theta)).toBeLessThan(1e-10);
    expect(Math.abs(b1.phi   - b0.phi  )).toBeLessThan(1e-10);
  });
});

describe('bloch-sphere: roundtripping', () => {
  it('blochToAmps then ampsToBloch returns the same angles', () => {
    for (const [theta, phi] of [[0.1, 0.0], [Math.PI / 3, Math.PI / 4], [0.7, -1.2]]) {
      const { a, b } = blochToAmps(theta, phi);
      const r = ampsToBloch(a, b);
      expect(Math.abs(r.theta - theta)).toBeLessThan(1e-10);
      if (theta > 0.05 && theta < Math.PI - 0.05) {
        expect(Math.abs(r.phi - phi)).toBeLessThan(1e-10);
      }
    }
  });
});
