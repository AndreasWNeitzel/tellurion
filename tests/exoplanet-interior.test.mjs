// Shared-engine tests for shared/js/engine/exoplanet-interior-cpu.js
// (built before the exoplanet-interior-3d hero). Mass conservation,
// the mass-radius ordering iron < silicate < water < gas, an
// Earth-composition Earth-mass planet matches Earth to within the
// constant-density approximation, and the central pressure is
// positive and grows with mass.

import { describe, it, expect } from 'vitest';
import {
  RHO, massEarth, radiusEarth, normaliseFractions, solvePlanet,
  massRadiusCurve, pressureProfile, densityAt,
} from '../shared/js/engine/exoplanet-interior-cpu.js';

describe('layer building', () => {
  it('fractions normalise to 1 and missing keys default to 0', () => {
    const f = normaliseFractions({ iron: 1, silicate: 1 });
    expect(f.iron + f.silicate + f.water + f.gas).toBeCloseTo(1, 12);
    expect(f.water).toBe(0);
  });
  it('all-iron model uses iron density', () => {
    const s = solvePlanet({ massEarth: 1, frac: { iron: 1 } });
    expect(s.layers.length).toBe(1);
    expect(s.layers[0].rho).toBe(RHO.iron);
  });
});

describe('mass conservation and ordering', () => {
  it('integrated mass equals the input mass to 1e-9', () => {
    for (const f of [{ iron: 1 }, { iron: 0.3, silicate: 0.7 }, { silicate: 0.7, water: 0.3 }, { silicate: 0.5, water: 0.3, gas: 0.2 }]) {
      const s = solvePlanet({ massEarth: 2, frac: f });
      const total = s.layers.reduce((a, L) => a + L.M, 0);
      expect(Math.abs(total - s.Mtot) / s.Mtot).toBeLessThan(1e-9);
    }
  });

  it('mass-radius ordering: iron < silicate < water < gas (at fixed mass)', () => {
    const M = 1;
    const rFe = solvePlanet({ massEarth: M, frac: { iron: 1 } }).R_earth;
    const rSi = solvePlanet({ massEarth: M, frac: { silicate: 1 } }).R_earth;
    const rH2O = solvePlanet({ massEarth: M, frac: { water: 1 } }).R_earth;
    const rGas = solvePlanet({ massEarth: M, frac: { silicate: 0.3, gas: 0.7 } }).R_earth;
    expect(rFe).toBeLessThan(rSi);
    expect(rSi).toBeLessThan(rH2O);
    expect(rH2O).toBeLessThan(rGas);
  });

  it('M-R curve grows: more mass -> bigger planet (uncompressed)', () => {
    const c = massRadiusCurve({ silicate: 1 }, [0.2, 0.5, 1, 2, 5, 10]);
    for (let i = 1; i < c.length; i += 1) expect(c[i].R_earth).toBeGreaterThan(c[i - 1].R_earth);
  });
});

describe('Earth-composition Earth-mass roughly matches Earth', () => {
  it('Earth at (0.32 iron, 0.68 silicate) gives R/R_earth within 5 percent', () => {
    const s = solvePlanet({ massEarth: 1, frac: { iron: 0.32, silicate: 0.68 } });
    expect(Math.abs(s.R_earth - 1)).toBeLessThan(0.05);    // ~ 4 % high without compression
  });
});

describe('central pressure and hydrostatic profile', () => {
  it('central pressure is positive and increases with mass', () => {
    const a = solvePlanet({ massEarth: 0.5, frac: { silicate: 1 } });
    const b = solvePlanet({ massEarth: 2.0, frac: { silicate: 1 } });
    expect(a.centralPressure).toBeGreaterThan(0);
    expect(b.centralPressure).toBeGreaterThan(a.centralPressure);
  });

  it('pressure profile is monotone non-increasing from centre to surface', () => {
    const s = solvePlanet({ massEarth: 1, frac: { iron: 0.32, silicate: 0.68 } });
    const prof = pressureProfile(s, 200);
    for (let i = 1; i < prof.length; i += 1) expect(prof[i].P).toBeLessThanOrEqual(prof[i - 1].P + 1e-3);
    expect(prof[0].P).toBeCloseTo(s.centralPressure, 0);    // P(0) ~ central pressure
    expect(prof[prof.length - 1].P).toBeLessThan(1e3);      // ~ 0 at the surface
  });

  it('density is step-piecewise across interfaces', () => {
    const s = solvePlanet({ massEarth: 1, frac: { iron: 0.32, silicate: 0.68 } });
    expect(densityAt(s, 0)).toBe(RHO.iron);
    expect(densityAt(s, s.R_total * 0.99)).toBe(RHO.silicate);
    expect(densityAt(s, s.R_total * 1.5)).toBe(0);          // outside the planet
  });

  it('deterministic: pure functions reproduce outputs exactly', () => {
    const a = solvePlanet({ massEarth: 1.7, frac: { iron: 0.4, silicate: 0.5, water: 0.1 } });
    const b = solvePlanet({ massEarth: 1.7, frac: { iron: 0.4, silicate: 0.5, water: 0.1 } });
    expect(a.centralPressure).toBe(b.centralPressure);
    expect(a.R_total).toBe(b.R_total);
  });
});
