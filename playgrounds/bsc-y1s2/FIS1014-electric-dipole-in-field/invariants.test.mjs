// Invariants for the dipole in a field: the sinusoidal restoring torque, the
// cosine orientation energy, energy conservation without damping, the small-angle
// libration period, and monotone energy loss with damping.

import { describe, it, expect } from 'vitest';
import { torque, energyU, totalEnergy, smallAnglePeriod, step } from './sim.js';

const p = 1.4, E = 1.7, I = 1.0;

describe('Torque tau = -p E sin(theta)', () => {
  it('vanishes at alignment and anti-alignment, peaks at pi/2', () => {
    expect(torque(p, E, 0)).toBeCloseTo(0, 12);
    expect(torque(p, E, Math.PI)).toBeCloseTo(0, 12);
    expect(Math.abs(torque(p, E, Math.PI / 2))).toBeCloseTo(p * E, 12);
  });
  it('restores: the torque opposes a small positive displacement', () => {
    expect(torque(p, E, 0.2)).toBeLessThan(0);
    expect(torque(p, E, -0.2)).toBeGreaterThan(0);
  });
});

describe('Orientation energy U = -p E cos(theta)', () => {
  it('is minimum aligned and maximum anti-aligned', () => {
    expect(energyU(p, E, 0)).toBeCloseTo(-p * E, 12);
    expect(energyU(p, E, Math.PI)).toBeCloseTo(p * E, 12);
    expect(energyU(p, E, 0)).toBeLessThan(energyU(p, E, 1));
  });
});

describe('Energy is conserved without damping (symplectic integrator)', () => {
  it('total energy stays within a tight band over a full libration', () => {
    let s = { theta: 2.0, omega: 0 }; const params = { I, p, E, gamma: 0 };
    const E0 = totalEnergy(I, s.omega, p, E, s.theta); let maxDev = 0;
    for (let n = 0; n < 4000; n += 1) { s = step(s, 0.01, params); maxDev = Math.max(maxDev, Math.abs(totalEnergy(I, s.omega, p, E, s.theta) - E0)); }
    expect(maxDev).toBeLessThan(1e-3);
  });
});

describe('Small-angle libration period', () => {
  it('matches T = 2 pi sqrt(I / p E)', () => {
    let s = { theta: 0.03, omega: 0 }; const params = { I, p, E, gamma: 0 }; const dt = 0.002;
    let t = 0, prev = s.theta;
    // integrate to the first zero crossing (a quarter period).
    while (s.theta > 0 && t < 100) { prev = s.theta; s = step(s, dt, params); t += dt; }
    const tc = t - dt * s.theta / (s.theta - prev); // linear interpolation to theta = 0
    expect(4 * tc).toBeCloseTo(smallAnglePeriod(I, p, E), 1);
  });
});

describe('Damping removes energy', () => {
  it('total energy decreases monotonically toward the aligned minimum', () => {
    let s = { theta: 2.4, omega: 0 }; const params = { I, p, E, gamma: 0.5 };
    let prev = totalEnergy(I, s.omega, p, E, s.theta);
    for (let n = 0; n < 2000; n += 1) { s = step(s, 0.01, params); const e = totalEnergy(I, s.omega, p, E, s.theta); expect(e).toBeLessThanOrEqual(prev + 1e-9); prev = e; }
    expect(prev).toBeLessThan(-p * E + 0.05); // settled near U_min = -pE
  });
});
