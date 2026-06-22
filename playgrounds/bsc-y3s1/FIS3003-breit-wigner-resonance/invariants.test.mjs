// Invariants for the Breit-Wigner resonance: the Lorentzian peak and its half-width, the
// phase shift passing through pi/2 at resonance, the identity sigma = sin^2(delta), the
// time delay as the energy derivative of the phase, and the narrow-resonance scaling.

import { describe, it, expect } from 'vitest';
import { crossSection, phaseShift, timeDelay, sin2Delta } from './sim.js';

describe('Cross-section', () => {
  it('peaks at the resonance and has full width Gamma', () => {
    const ER = 5, g = 1.2;
    expect(crossSection(ER, ER, g)).toBeCloseTo(1, 9);
    expect(crossSection(ER + g / 2, ER, g)).toBeCloseTo(0.5, 9);
    expect(crossSection(ER - g / 2, ER, g)).toBeCloseTo(0.5, 9);
  });
});

describe('Phase shift', () => {
  it('passes through pi/2 at the resonance and runs 0 to pi', () => {
    const ER = 5, g = 1;
    expect(phaseShift(ER, ER, g)).toBeCloseTo(Math.PI / 2, 9);
    expect(phaseShift(ER - 50 * g, ER, g)).toBeLessThan(0.05);
    expect(phaseShift(ER + 50 * g, ER, g)).toBeGreaterThan(Math.PI - 0.05);
  });
  it('the relative cross-section equals sin^2(delta)', () => {
    const ER = 4, g = 0.8;
    for (const E of [2, 3.5, 4, 4.6, 7]) expect(crossSection(E, ER, g)).toBeCloseTo(sin2Delta(E, ER, g), 9);
  });
});

describe('Time delay', () => {
  it('equals d(delta)/dE', () => {
    const ER = 5, g = 1.4, h = 1e-5;
    for (const E of [3.5, 5, 6.2]) { const num = (phaseShift(E + h, ER, g) - phaseShift(E - h, ER, g)) / (2 * h); expect(num).toBeCloseTo(timeDelay(E, ER, g), 5); }
  });
  it('peaks at the resonance, longer for a narrower resonance', () => {
    expect(timeDelay(5, 5, 1)).toBeCloseTo(2, 9);
    expect(timeDelay(5, 5, 0.5)).toBeGreaterThan(timeDelay(5, 5, 2));
    expect(timeDelay(7, 5, 1)).toBeLessThan(timeDelay(5, 5, 1));
  });
});
