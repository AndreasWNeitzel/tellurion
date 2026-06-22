// Invariants for the coherent state: normalization, the non-spreading width (the
// defining property), the classical centre-of-mass orbit, the Ehrenfest relation
// d<x>/dt = <p>, and the energy of the Glauber state.

import { describe, it, expect } from 'vitest';
import { density, meanX, meanP, sigma0, positionVariance, energyTotal, energyClassical, alphaMag } from './sim.js';

function norm(x0, omega, t) { let s = 0; const lo = -14, hi = 14, n = 4000, h = (hi - lo) / n; for (let i = 0; i <= n; i += 1) { const w = (i === 0 || i === n) ? 0.5 : 1; s += density(lo + i * h, x0, omega, t) * w * h; } return s; }

describe('Normalization', () => {
  it('the density integrates to 1 at every time', () => {
    for (const t of [0, 0.7, 1.9, 3.3]) expect(norm(2, 1, t)).toBeCloseTo(1, 4);
    expect(norm(1.5, 1.6, 0.5)).toBeCloseTo(1, 4);
  });
});

describe('The packet never spreads', () => {
  it('the position variance stays at sigma_0^2 for all t', () => {
    for (const [x0, om] of [[2, 1], [1.5, 1.6], [2.5, 0.7]]) {
      const s2 = sigma0(om) ** 2;
      for (const t of [0, 0.6, 1.5, 2.4, 3.1]) expect(positionVariance(x0, om, t)).toBeCloseTo(s2, 4);
    }
  });
});

describe('Classical orbit', () => {
  it('<x>(t) = x0 cos(omega t) and stays within the turning points', () => {
    const x0 = 2.2, om = 1.3;
    for (const t of [0, 0.5, 1.7, 2.9]) { expect(meanX(x0, om, t)).toBeCloseTo(x0 * Math.cos(om * t), 9); expect(Math.abs(meanX(x0, om, t))).toBeLessThanOrEqual(x0 + 1e-9); }
  });
  it('Ehrenfest: d<x>/dt = <p>', () => {
    const x0 = 2.2, om = 1.3, h = 1e-5;
    for (const t of [0.3, 1.1, 2.0]) { const d = (meanX(x0, om, t + h) - meanX(x0, om, t - h)) / (2 * h); expect(d).toBeCloseTo(meanP(x0, om, t), 5); }
  });
  it('the phase-space orbit lies on its energy ellipse', () => {
    const x0 = 2.2, om = 1.3;
    for (const t of [0.2, 1.4, 2.7]) { const x = meanX(x0, om, t), p = meanP(x0, om, t); expect((x * x) / (x0 * x0) + (p * p) / (om * om * x0 * x0)).toBeCloseTo(1, 9); }
  });
});

describe('Energy', () => {
  it('E = classical + zero-point = omega(|alpha|^2 + 1/2)', () => {
    for (const [x0, om] of [[2, 1], [1.5, 1.6], [2.5, 0.7]]) {
      expect(energyTotal(x0, om)).toBeCloseTo(energyClassical(x0, om) + 0.5 * om, 12);
      expect(energyTotal(x0, om)).toBeCloseTo(om * (alphaMag(x0, om) ** 2 + 0.5), 9);
    }
  });
});
