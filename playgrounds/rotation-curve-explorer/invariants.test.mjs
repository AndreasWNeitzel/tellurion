// Rotation Curve Explorer invariant tests at seed 0xC0FFEE.

import { describe, it, expect } from 'vitest';
import {
  vModel, vModel2, omegaModel, MODELS,
  syntheticObservations, chiSquared,
  DATA_RADII, DATA_SIGMA,
  buildGalaxy, galaxyAt,
  KMS_TO_KPC_GYR,
} from './sim.js';

describe('rotation-curve-explorer: model curve quality', () => {
  it('dark-matter model achieves reduced chi^2 < 2 against its own synthetic data', () => {
    const data = syntheticObservations(0xC0FFEE);
    const chi2 = chiSquared('dm', data);
    const dof = data.length;       // no free parameters in this comparison
    expect(chi2 / dof).toBeLessThan(2.0);
  });

  it('Keplerian model fits the data at least 50x worse than the DM model', () => {
    const data = syntheticObservations(0xC0FFEE);
    expect(chiSquared('kepler', data)).toBeGreaterThan(50 * chiSquared('dm', data));
  });

  it('visible-only model fits the data at least 20x worse than the DM model', () => {
    const data = syntheticObservations(0xC0FFEE);
    expect(chiSquared('visible', data)).toBeGreaterThan(20 * chiSquared('dm', data));
  });

  it('synthetic data is deterministic at seed 0xC0FFEE', () => {
    const a = syntheticObservations(0xC0FFEE);
    const b = syntheticObservations(0xC0FFEE);
    for (let i = 0; i < a.length; i += 1) {
      expect(a[i].R).toBe(b[i].R);
      expect(a[i].v).toBe(b[i].v);
    }
  });
});

describe('rotation-curve-explorer: model physics', () => {
  it('Keplerian: v(R) ~ R^{-1/2} at large R', () => {
    // v(R)^2 * R should be approximately constant = G * M_tot.
    const v10R10 = vModel2(10, 'kepler') * 10;
    const v25R25 = vModel2(25, 'kepler') * 25;
    expect(Math.abs(v10R10 - v25R25) / v10R10).toBeLessThan(1e-6);
  });

  it('DM model: v(R) is approximately flat at large R (variation < 35 km/s over [8, 28])', () => {
    let minV = Infinity, maxV = -Infinity;
    for (let R = 8; R <= 28; R += 0.5) {
      const v = vModel(R, 'dm');
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    expect(maxV - minV).toBeLessThan(35);
  });

  it('visible-only at R = 25 kpc is at least 50 km/s below the DM curve', () => {
    const diff = vModel(25, 'dm') - vModel(25, 'visible');
    expect(diff).toBeGreaterThan(50);
  });

  it('all three models agree within 30 percent at R = 4 kpc (inner-galaxy degeneracy)', () => {
    const v_kepler  = vModel(4, 'kepler');
    const v_visible = vModel(4, 'visible');
    const v_dm      = vModel(4, 'dm');
    const refV = (v_kepler + v_visible + v_dm) / 3;
    expect(Math.abs(v_kepler  - refV) / refV).toBeLessThan(0.30);
    expect(Math.abs(v_visible - refV) / refV).toBeLessThan(0.30);
    expect(Math.abs(v_dm      - refV) / refV).toBeLessThan(0.30);
  });
});

describe('rotation-curve-explorer: rigid-body model and winding', () => {
  it('rigid-body model has omega independent of R (no winding)', () => {
    const omega5  = omegaModel(5, 'rigid');
    const omega15 = omegaModel(15, 'rigid');
    const omega25 = omegaModel(25, 'rigid');
    expect(Math.abs(omega5  - omega15)).toBeLessThan(1e-9);
    expect(Math.abs(omega15 - omega25)).toBeLessThan(1e-9);
  });

  it('rigid-body model: v(R = 8) = 220 km/s by construction', () => {
    expect(Math.abs(vModel(8, 'rigid') - 220)).toBeLessThan(1e-9);
  });

  it('rigid-body model: starting spoke stays a spoke (no winding) after one period', () => {
    const stars = [
      { R: 5,  phi0: 0, kind: 'arm' },
      { R: 10, phi0: 0, kind: 'arm' },
      { R: 20, phi0: 0, kind: 'arm' },
    ];
    // One period for any star under rigid-body rotation
    const T = 2 * Math.PI / omegaModel(8, 'rigid');
    const snap = galaxyAt(stars, T, 'rigid');
    // After exactly one period each star returns to (R, 0), confirming a rigid spoke.
    for (let i = 0; i < stars.length; i += 1) {
      expect(Math.abs(snap[i].x - stars[i].R)).toBeLessThan(1e-9);
      expect(Math.abs(snap[i].y - 0)).toBeLessThan(1e-9);
    }
  });

  it('DM model winds an initial spoke (omega differential)', () => {
    // After 0.3 Gyr, inner stars are far around the disc while outer ones lag.
    const stars = [
      { R: 5,  phi0: 0, kind: 'arm' },
      { R: 25, phi0: 0, kind: 'arm' },
    ];
    const snap = galaxyAt(stars, 0.3, 'dm');
    const phi5  = Math.atan2(snap[0].y, snap[0].x);
    const phi25 = Math.atan2(snap[1].y, snap[1].x);
    expect(Math.abs(phi5 - phi25)).toBeGreaterThan(0.5);     // > ~30 deg
  });
});

describe('rotation-curve-explorer: omega and unit conversion', () => {
  it('DM model at the solar circle gives omega ~ 28 rad/Gyr (period ~ 0.22 Gyr)', () => {
    const omega8 = omegaModel(8, 'dm');
    expect(omega8).toBeGreaterThan(24);
    expect(omega8).toBeLessThan(32);
    const period = 2 * Math.PI / omega8;
    expect(period).toBeGreaterThan(0.18);
    expect(period).toBeLessThan(0.30);
  });

  it('KMS_TO_KPC_GYR = 1.022 within 0.5 percent', () => {
    expect(Math.abs(KMS_TO_KPC_GYR - 1.022)).toBeLessThan(0.005);
  });
});

describe('rotation-curve-explorer: galaxy tracer population', () => {
  it('buildGalaxy returns 4 arms * 80 + 140 bulge stars = 460 total', () => {
    const stars = buildGalaxy(0xC0FFEE);
    expect(stars.length).toBe(4 * 80 + 140);
  });

  it('galaxyAt(t = 0) preserves radii (stars stay on their circular orbits)', () => {
    const stars = buildGalaxy(0xC0FFEE);
    const snap = galaxyAt(stars, 0, 'dm');
    for (let i = 0; i < stars.length; i += 1) {
      const Rsnap = Math.hypot(snap[i].x, snap[i].y);
      expect(Math.abs(Rsnap - stars[i].R)).toBeLessThan(1e-9);
    }
  });

  it('galaxyAt is bit-identical at the same t and model', () => {
    const stars = buildGalaxy(0xC0FFEE);
    const a = galaxyAt(stars, 0.5, 'dm');
    const b = galaxyAt(stars, 0.5, 'dm');
    for (let i = 0; i < a.length; i += 1) {
      expect(a[i].x).toBe(b[i].x);
      expect(a[i].y).toBe(b[i].y);
    }
  });

  it('a single star advanced by one period returns to its starting position', () => {
    const stars = [{ R: 8, phi0: 0, kind: 'arm' }];
    const T = 2 * Math.PI / omegaModel(8, 'dm');
    const snap = galaxyAt(stars, T, 'dm');
    expect(Math.abs(snap[0].x - 8)).toBeLessThan(1e-6);
    expect(Math.abs(snap[0].y - 0)).toBeLessThan(1e-6);
  });
});

describe('rotation-curve-explorer: data structure', () => {
  it('synthetic data has 16 points over [1, 28] kpc', () => {
    const data = syntheticObservations(0xC0FFEE);
    expect(data.length).toBe(16);
    expect(data[0].R).toBeCloseTo(1, 6);
    expect(data[data.length - 1].R).toBeCloseTo(28, 6);
    expect(DATA_RADII.length).toBe(16);
    expect(DATA_SIGMA).toBeGreaterThan(0);
  });

  it('MODELS metadata has 4 entries (rigid, kepler, visible, dm)', () => {
    expect(Object.keys(MODELS)).toEqual(['rigid', 'kepler', 'visible', 'dm']);
  });
});
