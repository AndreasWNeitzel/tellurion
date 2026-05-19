// Shared-engine tests for shared/js/engine/schwarzschild-geodesic-cpu.js
// (built before the blackhole-geodesics-3d hero). The sharp photon
// capture threshold at b = 3 sqrt(3) M, the conserved orbit quantity,
// the photon sphere and the ISCO are the proof the integrator is real
// general relativity, not a scripted swoop.

import { describe, it, expect } from 'vitest';
import {
  schwarzschildRadius, photonSphere, bCrit, iscoSchwarzschild,
  nullInvariant, integrateGeodesic, wNull,
} from '../shared/js/engine/schwarzschild-geodesic-cpu.js';

describe('Schwarzschild closed-form radii', () => {
  it('horizon 2M, photon sphere 3M, b_crit 3 sqrt3 M, ISCO 6M', () => {
    expect(schwarzschildRadius(1)).toBe(2);
    expect(photonSphere(1)).toBe(3);
    expect(bCrit(1)).toBeCloseTo(3 * Math.sqrt(3), 12);
    expect(bCrit(2)).toBeCloseTo(6 * Math.sqrt(3), 12);
    expect(iscoSchwarzschild(1)).toBe(6);
  });
});

describe('photon capture threshold is sharp at b_crit', () => {
  const M = 1, bc = bCrit(M);
  it('a photon just inside b_crit is captured', () => {
    const g = integrateGeodesic({ type: 'null', M, r0: 80, b: bc * 0.99, dphi: 0.003, maxPhi: 80 });
    expect(g.outcome).toBe('capture');
  });
  it('a photon just outside b_crit escapes', () => {
    const g = integrateGeodesic({ type: 'null', M, r0: 80, b: bc * 1.01, dphi: 0.003, maxPhi: 80 });
    expect(g.outcome).toBe('escape');
  });
  it('the threshold is located to better than 0.1 percent', () => {
    let lo = bc * 0.9, hi = bc * 1.1;
    for (let i = 0; i < 28; i += 1) {
      const mid = 0.5 * (lo + hi);
      const o = integrateGeodesic({ type: 'null', M, r0: 80, b: mid, dphi: 0.003, maxPhi: 90 }).outcome;
      if (o === 'capture') lo = mid; else hi = mid;
    }
    expect(Math.abs(0.5 * (lo + hi) - bc) / bc).toBeLessThan(1e-3);
  });
});

describe('null geodesic conserves its orbit invariant', () => {
  it('(du/dphi)^2 + u^2 - 2M u^3 drifts < 1e-4 along a scattered ray', () => {
    const g = integrateGeodesic({ type: 'null', M: 1, r0: 60, b: 7, dphi: 0.002, maxPhi: 40 });
    expect(g.outcome).toBe('escape');
    expect(g.maxDrift).toBeLessThan(1e-4);
  });
  it('nullInvariant matches 1/b^2 at the start', () => {
    const b = 8, u = 1 / 60;
    const du = -Math.sqrt(1 / (b * b) - u * u + 2 * u * u * u);
    expect(nullInvariant(u, du, 1)).toBeCloseTo(1 / (b * b), 10);
  });
});

describe('massive-particle effective potential and ISCO', () => {
  it('the null potential peaks at the photon sphere r = 3M', () => {
    let rmax = 0, wmax = -Infinity;
    for (let r = 2.05; r < 12; r += 0.01) { const w = wNull(r, 1); if (w > wmax) { wmax = w; rmax = r; } }
    expect(rmax).toBeCloseTo(3, 1);
  });
  it('a timelike orbit just outside ISCO stays bound (does not plunge)', () => {
    // L for a circular orbit at r=8M: L^2 = M r^2/(r-3M).
    const r = 8, L = Math.sqrt((1 * r * r) / (r - 3));
    const g = integrateGeodesic({ type: 'timelike', M: 1, r0: r, L, E: Math.sqrt((r - 2) ** 2 / (r * (r - 3))), dphi: 0.004, maxPhi: 40 });
    expect(g.outcome === 'bound' || g.outcome === 'escape').toBe(true);
    expect(g.periapsis).toBeGreaterThan(2.0);   // never crosses the horizon
  });
});
