import { describe, it, expect } from 'vitest';
import {
  C_RIGID, matmul, matpow, trace, det, driftM, thinLens, fodoCell, oneTurn,
  isStable, phaseAdvance, tune, twiss, csInvariant, trackTurns,
  ellipsePoints, tuneScan, resonanceAmp, nearestResonance,
  rigidity, bendRadius, bendAngle, lorentzIdentity,
} from './sim.js';

describe('particle-accelerator-betatron invariants', () => {
  it('every transfer matrix is symplectic: det = 1', () => {
    for (const L of [4, 10, 20]) for (const f of [3, 5, 12]) {
      expect(det(fodoCell(L, f))).toBeCloseTo(1, 12);
      expect(det(oneTurn(L, f, 6))).toBeCloseTo(1, 9);
    }
    expect(det(driftM(7.3))).toBeCloseTo(1, 14);
    expect(det(thinLens(2.1))).toBeCloseTo(1, 14);
  });

  it('the FODO stability stop band is exactly |trace/2| < 1, edge at f = L/4', () => {
    const L = 10;
    expect(trace(fodoCell(L, L / 4)) / 2).toBeCloseTo(-1, 9);   // edge
    expect(isStable(fodoCell(L, L / 4 + 0.05))).toBe(true);     // just stable
    expect(isStable(fodoCell(L, L / 4 - 0.05))).toBe(false);    // past the edge
    expect(isStable(fodoCell(L, L))).toBe(true);                // weak focusing
    expect(Number.isNaN(tune(L, L / 4 - 0.1, 8))).toBe(true);   // no real tune when unstable
  });

  it('the tune satisfies cos(2 pi Q_cell) = trace/2 with 0 < Q_cell < 1/2', () => {
    const L = 10, nCell = 8;
    for (const f of [12, 6, 4, 3]) {
      const M = fodoCell(L, f);
      const qCell = tune(L, f, nCell) / nCell;
      expect(qCell).toBeGreaterThan(0);
      expect(qCell).toBeLessThan(0.5);
      expect(Math.cos(2 * Math.PI * qCell)).toBeCloseTo(trace(M) / 2, 10);
      expect(phaseAdvance(M)).toBeCloseTo(2 * Math.PI * qCell, 10);
    }
  });

  it('the Twiss parameters reconstruct M and obey beta*gamma - alpha^2 = 1', () => {
    const L = 10;
    for (const f of [12, 5, 3]) {
      const M = fodoCell(L, f), tw = twiss(M);
      expect(tw.beta * tw.gamma - tw.alpha * tw.alpha).toBeCloseTo(1, 9);
      const c = Math.cos(tw.mu), s = Math.sin(tw.mu) * Math.sign(M[1]);
      const Mr = [c + tw.alpha * s, tw.beta * s, -tw.gamma * s, c - tw.alpha * s];
      for (let i = 0; i < 4; i += 1) expect(Mr[i]).toBeCloseTo(M[i], 9);
    }
  });

  it('the single-particle emittance is conserved over many turns (Liouville)', () => {
    const { eps } = trackTurns(10, 5, 8, 2e-3, 5e-4, 500);
    const e0 = eps[0];
    let maxRel = 0;
    for (const e of eps) maxRel = Math.max(maxRel, Math.abs(e / e0 - 1));
    expect(e0).toBeGreaterThan(0);
    expect(maxRel).toBeLessThan(1e-9);                          // symplectic, machine level
  });

  it('points on the Twiss ellipse have the stated invariant and enclose area pi*eps', () => {
    const tw = twiss(fodoCell(10, 5)), eps = 3.7e-6;
    const { xs, xps } = ellipsePoints(tw, eps, 400);
    for (let i = 0; i < xs.length; i += 1) {
      expect(csInvariant(xs[i], xps[i], tw)).toBeCloseTo(eps, 12);
    }
    let area = 0;                                                // shoelace
    for (let i = 0; i < xs.length - 1; i += 1) {
      area += xs[i] * xps[i + 1] - xs[i + 1] * xps[i];
    }
    expect(Math.abs(area) / 2).toBeCloseTo(Math.PI * eps, 6);
  });

  it('the dipole obeys d p / d t = q v B with B*rho = p / (0.299792458 q)', () => {
    expect(rigidity(7000, 1)).toBeCloseTo(7000 / C_RIGID, 6);
    for (const [p, B] of [[10, 1.2], [450, 5.0], [7000, 8.33]]) {
      const rho = bendRadius(p, B, 1);
      expect(rho).toBeCloseTo(p / (C_RIGID * B), 6);
      const id = lorentzIdentity(p, B, 1, 0.99);
      expect(id.ratio).toBeCloseTo(1, 12);                       // q v B == p v / rho
    }
    expect(bendAngle(6.0, 450, 5.0, 1)).toBeCloseTo(6.0 / bendRadius(450, 5.0, 1), 12);
    expect(bendRadius(20, 2, 1) / bendRadius(10, 2, 1)).toBeCloseTo(2, 12); // rho ~ p
    expect(bendRadius(10, 4, 1) / bendRadius(10, 2, 1)).toBeCloseTo(0.5, 12); // rho ~ 1/B
  });

  it('a tune resonance amplifies without bound at integer / half-integer Q', () => {
    expect(resonanceAmp(0.25)).toBeCloseTo(1, 9);                // safely off resonance
    expect(resonanceAmp(0.49)).toBeGreaterThan(15);
    expect(resonanceAmp(0.5)).toBe(Infinity);                    // half-integer
    expect(resonanceAmp(1.0)).toBe(Infinity);                    // integer
    expect(resonanceAmp(0.499) > resonanceAmp(0.45)).toBe(true); // grows toward it
    expect(nearestResonance(2.73).value).toBeCloseTo(2.5, 12);
    expect(nearestResonance(2.73).distance).toBeCloseTo(0.23, 12);
  });

  it('the focal-length scan is consistent and brackets the stop band', () => {
    const sc = tuneScan(10, 8, 2.0, 12.0, 240);
    let sawStable = false, sawUnstable = false;
    for (let i = 0; i < sc.f.length; i += 1) {
      expect(Math.abs(sc.half[i]) < 1).toBe(sc.stab[i] === 1); // strict: edge |trace/2|=1 is marginal
      if (sc.stab[i]) { sawStable = true; expect(sc.bmax[i]).toBeGreaterThan(0); }
      else { sawUnstable = true; expect(Number.isNaN(sc.Q[i])).toBe(true); }
    }
    expect(sawStable && sawUnstable).toBe(true);
  });

  it('deterministic: identical inputs reproduce matrices, tune and tracking', () => {
    expect(fodoCell(10, 5)).toEqual(fodoCell(10, 5));
    expect(tune(10, 5, 8)).toBe(tune(10, 5, 8));
    const a = trackTurns(10, 5, 8, 1e-3, 0, 50);
    const b = trackTurns(10, 5, 8, 1e-3, 0, 50);
    expect(a.xs[50]).toBe(b.xs[50]);
    expect(a.eps[25]).toBe(b.eps[25]);
  });
});
