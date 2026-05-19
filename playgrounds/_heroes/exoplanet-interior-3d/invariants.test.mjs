import { describe, it, expect } from 'vitest';
import { solvePlanet, pressureProfile, RHO, normaliseFractions } from '../../../shared/js/engine/exoplanet-interior-cpu.js';

describe('exoplanet-interior-3d invariants', () => {
  it('Earth-like (32 % iron / 68 % silicate) recovers ~1 Re at 1 Me to within 10 %', () => {
    const s = solvePlanet({ massEarth: 1, frac: { iron: 0.32, silicate: 0.68 } });
    expect(s.R_earth).toBeGreaterThan(0.9);
    expect(s.R_earth).toBeLessThan(1.1);
  });

  it('central pressure is strictly positive for every preset', () => {
    for (const f of [
      { iron: 1 }, { silicate: 1 }, { iron: 0.5, silicate: 0.5 },
      { silicate: 0.5, water: 0.5 }, { silicate: 0.5, gas: 0.5 },
    ]) {
      const s = solvePlanet({ massEarth: 1, frac: f });
      expect(s.centralPressure).toBeGreaterThan(0);
    }
  });

  it('pressure profile monotone non-increasing from centre outward; P(R) -> 0', () => {
    const s = solvePlanet({ massEarth: 1.5, frac: { iron: 0.3, silicate: 0.7 } });
    const prof = pressureProfile(s, 200);
    for (let i = 1; i < prof.length; i += 1) {
      expect(prof[i].P).toBeLessThanOrEqual(prof[i - 1].P + 1e-3);
    }
    expect(prof[prof.length - 1].P).toBeLessThan(1e3);
  });

  it('mass-radius monotone in mass at fixed composition', () => {
    const f = { iron: 0.32, silicate: 0.68 };
    let prev = 0;
    for (const m of [0.5, 1.0, 2.0, 4.0, 8.0]) {
      const s = solvePlanet({ massEarth: m, frac: f });
      expect(s.R_earth).toBeGreaterThan(prev);
      prev = s.R_earth;
    }
  });

  it('pure iron has smaller radius than silicate at the same mass', () => {
    const a = solvePlanet({ massEarth: 1, frac: { iron: 1 } });
    const b = solvePlanet({ massEarth: 1, frac: { silicate: 1 } });
    expect(a.R_earth).toBeLessThan(b.R_earth);
  });

  it('water-rich at the same mass has a larger radius than silicate', () => {
    const a = solvePlanet({ massEarth: 1, frac: { silicate: 1 } });
    const b = solvePlanet({ massEarth: 1, frac: { silicate: 0.3, water: 0.7 } });
    expect(b.R_earth).toBeGreaterThan(a.R_earth);
  });

  it('layer-mass fractions match the (normalised) input within round-off', () => {
    const f = normaliseFractions({ iron: 0.2, silicate: 0.5, water: 0.3 });
    const s = solvePlanet({ massEarth: 2, frac: f });
    const total = s.layers.reduce((acc, L) => acc + L.M, 0);
    for (const L of s.layers) {
      const got = L.M / total;
      expect(Math.abs(got - f[L.name])).toBeLessThan(1e-9);
    }
  });
});
