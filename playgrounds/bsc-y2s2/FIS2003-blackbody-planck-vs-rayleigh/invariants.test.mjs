// Invariants for blackbody radiation: Planck reduces to Rayleigh-Jeans at long
// wavelength, the peak follows Wien's law, the integral follows Stefan-Boltzmann,
// and Rayleigh-Jeans diverges where Planck stays finite.

import { describe, it, expect } from 'vitest';
import { planckLambda, rayleighJeansLambda, wienPeakLambda, stefanBoltzmann, integratedRadianceLambda, SIGMA, WIEN } from './sim.js';

describe('Planck reduces to Rayleigh-Jeans at long wavelength', () => {
  it('the ratio approaches 1 as the wavelength grows', () => {
    const T = 5000;
    const r1 = planckLambda(50e-6, T) / rayleighJeansLambda(50e-6, T);
    const r2 = planckLambda(500e-6, T) / rayleighJeansLambda(500e-6, T);
    expect(r2).toBeGreaterThan(r1);
    expect(r2).toBeCloseTo(1, 2);
  });
});

describe('Wien displacement law', () => {
  it('the Planck peak is at lam_max = b / T', () => {
    for (const T of [3000, 5778, 8000]) {
      // scan for the numerical maximum
      let best = 0, blam = 0; const lamMax = wienPeakLambda(T);
      for (let i = 1; i <= 4000; i += 1) { const lam = lamMax * (0.3 + 1.4 * i / 4000); const v = planckLambda(lam, T); if (v > best) { best = v; blam = lam; } }
      expect(blam * T).toBeCloseTo(WIEN, 4);
    }
  });
});

describe('Stefan-Boltzmann law', () => {
  it('pi times the integrated radiance equals sigma T^4', () => {
    for (const T of [3000, 6000]) {
      const M = Math.PI * integratedRadianceLambda(T);
      expect(M / stefanBoltzmann(T)).toBeCloseTo(1, 1);
    }
  });
  it('the total power scales as T^4 (doubling T multiplies it by 16)', () => {
    expect(stefanBoltzmann(6000) / stefanBoltzmann(3000)).toBeCloseTo(16, 6);
  });
});

describe('The ultraviolet catastrophe', () => {
  it('Rayleigh-Jeans diverges at short wavelength while Planck vanishes', () => {
    const T = 5778;
    expect(rayleighJeansLambda(20e-9, T)).toBeGreaterThan(planckLambda(20e-9, T) * 1e6);
    expect(planckLambda(20e-9, T)).toBeLessThan(planckLambda(wienPeakLambda(T), T));
  });
});
