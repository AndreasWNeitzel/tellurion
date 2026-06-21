// Mode-trapping invariant tests. The g-mode eigenvalue solve is exercised
// headlessly; the trapping and the period-spacing dips must both come out of
// the same buoyancy profile.

import { describe, it, expect } from 'vitest';
import { solveGModes, bruntProfile, X_ENV, DPI1_SECONDS } from './sim.js';

function rms(arr) {
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length) / m;
}

describe('Buoyancy profile', () => {
  it('is positive inside the cavity and zero in the convective envelope', () => {
    for (let x = 0.05; x < X_ENV - 0.01; x += 0.05) expect(bruntProfile(x, 0.4, 0.22)).toBeGreaterThan(0);
    expect(bruntProfile(X_ENV + 0.05, 0.4, 0.22)).toBe(0);
  });
  it('the glitch raises N locally at its position', () => {
    expect(bruntProfile(0.22, 0.5, 0.22)).toBeGreaterThan(bruntProfile(0.22, 0, 0.22));
  });
});

describe('Period spacing from the eigenvalue solve', () => {
  it('with no glitch the spacing is uniform at Pi_1', () => {
    const r = solveGModes(0, 0.22, 1);
    expect(rms(r.deltaP)).toBeLessThan(0.02);
    const mean = r.deltaP.reduce((a, b) => a + b, 0) / r.deltaP.length;
    expect(mean).toBeCloseTo(DPI1_SECONDS, 0);
  });
  it('a glitch modulates the spacing but keeps the mean at Pi_1', () => {
    const r = solveGModes(0.45, 0.22, 1);
    expect(rms(r.deltaP)).toBeGreaterThan(0.03);
    const mean = r.deltaP.reduce((a, b) => a + b, 0) / r.deltaP.length;
    expect(mean).toBeCloseTo(DPI1_SECONDS, 0);
  });
  it('the mean spacing is the same scaled Pi_1 for l=1 and l=2', () => {
    const a = solveGModes(0.3, 0.25, 1), b = solveGModes(0.3, 0.25, 2);
    const ma = a.deltaP.reduce((s, v) => s + v, 0) / a.deltaP.length;
    const mb = b.deltaP.reduce((s, v) => s + v, 0) / b.deltaP.length;
    expect(ma).toBeCloseTo(DPI1_SECONDS, 0);
    expect(mb).toBeCloseTo(DPI1_SECONDS, 0);
  });
});

describe('Trapping', () => {
  it('is near zero everywhere with no glitch', () => {
    const r = solveGModes(0, 0.22, 1);
    expect(Math.max(...r.trapping)).toBeLessThan(0.25);
  });
  it('a glitch traps some modes', () => {
    const r = solveGModes(0.45, 0.22, 1);
    expect(Math.max(...r.trapping)).toBeGreaterThan(0.45);
  });
  it('the most-trapped mode has an eigenfunction concentrated on one side of the glitch', () => {
    const r = solveGModes(0.5, 0.22, 1), xg = 0.22;
    let ti = 0, tmax = 0; r.trapping.forEach((t, i) => { if (t > tmax) { tmax = t; ti = i; } });
    const ef = r.eigfns[ti];
    let inner = 0, outer = 0;
    for (let i = 0; i < ef.x.length; i += 1) { const a = Math.abs(ef.psi[i]); if (ef.x[i] < xg) inner = Math.max(inner, a); else outer = Math.max(outer, a); }
    expect(Math.abs(inner - outer)).toBeGreaterThan(0.25);   // asymmetric -> trapped
  });
});

describe('Eigenfunctions', () => {
  it('are normalised to unit peak and satisfy the boundary conditions', () => {
    const r = solveGModes(0.4, 0.25, 1);
    for (const ef of r.eigfns) {
      let peak = 0; for (const v of ef.psi) peak = Math.max(peak, Math.abs(v));
      expect(peak).toBeCloseTo(1, 6);
      expect(Math.abs(ef.psi[0])).toBeLessThan(1e-9);
      expect(Math.abs(ef.psi[ef.psi.length - 1])).toBeLessThan(0.05);   // psi -> 0 at the convective edge
    }
  });
});
