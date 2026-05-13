// Schwarzschild Geodesics invariant tests at seed 0xC0FFEE.

import { describe, it, expect } from 'vitest';
import { createGeodesic, stepGeodesic, geodesicDiagnostics } from './sim.js';

describe('schwarzschild-geodesics: strong invariants', () => {
  it('|d E_rad / E_rad| < 1e-3 over 10^4 steps at canonical IC (r_ap=12, L=3.9)', () => {
    const g = createGeodesic(12, 3.9);
    let maxRel = 0;
    for (let i = 0; i < 10_000; i += 1) {
      stepGeodesic(g);
      const d = geodesicDiagnostics(g);
      const rel = Math.abs(d.radialEnergyDrift);
      if (rel > maxRel) maxRel = rel;
    }
    expect(maxRel).toBeLessThan(1e-3);
  });

  it('angular momentum L exactly preserved by the engine (no update)', () => {
    const g = createGeodesic(12, 3.9);
    const L0 = g.L;
    for (let i = 0; i < 10_000; i += 1) stepGeodesic(g);
    expect(g.L).toBe(L0);
  });

  it('perihelion stays above the event horizon (r > 2) at canonical IC over 10^4 steps', () => {
    const g = createGeodesic(12, 3.9);
    let minR = Infinity;
    for (let i = 0; i < 10_000; i += 1) {
      stepGeodesic(g);
      const r = g.inst.q[0];
      if (r < minR) minR = r;
    }
    expect(minR).toBeGreaterThan(2);
  });
});

describe('schwarzschild-geodesics: limiting cases', () => {
  it('large L weak-field limit: orbit precession per radial period decreases as L grows', () => {
    // Measure first-perihelion phi minus 2*pi*n for n = nearest integer.
    function precessionRad(L) {
      const g = createGeodesic(12, L);
      let phiAtFirstPeri = null;
      let phiAtSecondPeri = null;
      let prevPr = 0;
      let periCount = 0;
      for (let i = 0; i < 50_000; i += 1) {
        stepGeodesic(g);
        if (prevPr < 0 && g.inst.qdot[0] >= 0) {
          if (periCount === 0) phiAtFirstPeri = g.phi;
          if (periCount === 1) { phiAtSecondPeri = g.phi; break; }
          periCount += 1;
        }
        prevPr = g.inst.qdot[0];
      }
      if (phiAtFirstPeri === null || phiAtSecondPeri === null) return null;
      return phiAtSecondPeri - phiAtFirstPeri - 2 * Math.PI;
    }
    const p_low  = precessionRad(3.8);
    const p_mid  = precessionRad(3.9);
    const p_high = precessionRad(4.5);
    expect(p_low).not.toBeNull();
    expect(p_mid).not.toBeNull();
    expect(p_high).not.toBeNull();
    expect(p_low).toBeGreaterThan(p_high);
    expect(p_mid).toBeGreaterThan(p_high);
  }, 30_000);

  it('reproducibility: bit-identical state after 1000 steps at canonical IC', () => {
    function run() {
      const g = createGeodesic(12, 3.9);
      for (let i = 0; i < 1000; i += 1) stepGeodesic(g);
      return { r: g.inst.q[0], pr: g.inst.qdot[0], phi: g.phi };
    }
    const a = run();
    const b = run();
    expect(a.r).toBe(b.r);
    expect(a.pr).toBe(b.pr);
    expect(a.phi).toBe(b.phi);
  });
});
