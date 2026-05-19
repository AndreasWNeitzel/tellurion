// blackhole-geodesics-3d invariants. The sharp photon capture
// threshold, the conserved orbit invariant, the photon sphere and the
// ISCO prove the geodesic engine (shared, via ./sim.js) is real GR.

import { describe, it, expect } from 'vitest';
import {
  schwarzschildRadius, photonSphere, bCrit, iscoSchwarzschild,
  nullInvariant, integrateGeodesic, wNull,
} from './sim.js';

describe('blackhole-geodesics-3d', () => {
  it('horizon 2M, photon sphere 3M, b_crit 3 sqrt3 M, ISCO 6M', () => {
    expect(schwarzschildRadius(1)).toBe(2);
    expect(photonSphere(1)).toBe(3);
    expect(bCrit(1)).toBeCloseTo(3 * Math.sqrt(3), 12);
    expect(iscoSchwarzschild(1)).toBe(6);
  });

  it('photon capture is sharp at b_crit (located to < 0.1 percent)', () => {
    const bc = bCrit(1);
    expect(integrateGeodesic({ type: 'null', M: 1, r0: 80, b: bc * 0.99, dphi: 0.003, maxPhi: 90 }).outcome).toBe('capture');
    expect(integrateGeodesic({ type: 'null', M: 1, r0: 80, b: bc * 1.01, dphi: 0.003, maxPhi: 90 }).outcome).toBe('escape');
    let lo = bc * 0.9, hi = bc * 1.1;
    for (let i = 0; i < 26; i += 1) {
      const m = 0.5 * (lo + hi);
      if (integrateGeodesic({ type: 'null', M: 1, r0: 80, b: m, dphi: 0.003, maxPhi: 90 }).outcome === 'capture') lo = m; else hi = m;
    }
    expect(Math.abs(0.5 * (lo + hi) - bc) / bc).toBeLessThan(1e-3);
  });

  it('null orbit invariant (du/dphi)^2 + u^2 - 2M u^3 conserved to 1e-4', () => {
    const g = integrateGeodesic({ type: 'null', M: 1, r0: 60, b: 7, dphi: 0.002, maxPhi: 40 });
    expect(g.outcome).toBe('escape');
    expect(g.maxDrift).toBeLessThan(1e-4);
  });

  it('the null effective potential peaks exactly at the photon sphere', () => {
    let rmax = 0, wmax = -Infinity;
    for (let r = 2.05; r < 12; r += 0.005) { const w = wNull(r, 1); if (w > wmax) { wmax = w; rmax = r; } }
    expect(rmax).toBeCloseTo(3, 1);
  });

  it('a timelike orbit outside the ISCO never crosses the horizon', () => {
    const r = 9, L = Math.sqrt((r * r) / (r - 3));
    const g = integrateGeodesic({ type: 'timelike', M: 1, r0: r, L, E: Math.sqrt((r - 2) ** 2 / (r * (r - 3))), dphi: 0.004, maxPhi: 40 });
    expect(g.periapsis).toBeGreaterThan(2.0);
  });

  it('deterministic: identical launch reproduces the path', () => {
    const a = integrateGeodesic({ type: 'null', M: 1, r0: 50, b: 6.5, dphi: 0.004, maxPhi: 30 });
    const b = integrateGeodesic({ type: 'null', M: 1, r0: 50, b: 6.5, dphi: 0.004, maxPhi: 30 });
    expect(a.xs.length).toBe(b.xs.length);
    expect(a.xs[a.xs.length - 1]).toBe(b.xs[b.xs.length - 1]);
  });
});
