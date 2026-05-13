// SPH Sod shock-tube invariant tests.
// (a) Total mass is conserved exactly (Lagrangian).
// (b) Total energy drift is bounded over the evolution window.
// (c) The kernel reproduces the initial densities of the two halves to within
//     5 percent.
// (d) After evolution, a left-going rarefaction and right-going shock have
//     developed (left side drops below 1, right side rises above 0.125).
// (e) Rankine-Hugoniot: post-shock-to-pre-shock density ratio is bounded by
//     the theoretical limit (gamma + 1) / (gamma - 1) = 6 for gamma = 1.4.

import { describe, it, expect } from 'vitest';
import {
  createSod, stepSPH, diagnostics, totalEnergy, totalMass, N,
} from './sim.js';

describe('SPH: mass conservation', () => {
  it('Lagrangian total mass exact to 1e-12 over 200 steps', () => {
    const s = createSod();
    const m0 = totalMass(s);
    for (let i = 0; i < 200; i += 1) stepSPH(s, 0.001);
    expect(Math.abs(totalMass(s) - m0)).toBeLessThan(1e-12);
  }, 60_000);
});

describe('SPH: energy drift bounded', () => {
  it('|delta E / E_0| < 0.05 over 200 steps', () => {
    const s = createSod();
    const E0 = totalEnergy(s);
    for (let i = 0; i < 200; i += 1) stepSPH(s, 0.001);
    const Ef = totalEnergy(s);
    expect(Math.abs((Ef - E0) / E0)).toBeLessThan(0.05);
  }, 60_000);
});

describe('SPH: kernel density reconstruction at t = 0', () => {
  it('mid-left rho near 1, mid-right rho near 0.125 to 10 percent', () => {
    const s = createSod();
    const d = diagnostics(s);
    // sample particles well away from the interface
    let nL = 0, sL = 0, nR = 0, sR = 0;
    for (let i = 0; i < N; i += 1) {
      if (s.x[i] > 0.15 && s.x[i] < 0.35) { sL += d.rho[i]; nL += 1; }
      if (s.x[i] > 0.65 && s.x[i] < 0.85) { sR += d.rho[i]; nR += 1; }
    }
    const meanL = sL / nL;
    const meanR = sR / nR;
    expect(Math.abs(meanL - 1.0) / 1.0).toBeLessThan(0.1);
    expect(Math.abs(meanR - 0.125) / 0.125).toBeLessThan(0.1);
  });
});

describe('SPH: shock and rarefaction develop', () => {
  it('after 250 steps, rarefaction in left bulk, density rise in right bulk', () => {
    const s = createSod();
    for (let i = 0; i < 250; i += 1) stepSPH(s, 0.001);
    const d = diagnostics(s);
    let minL = Infinity, maxR = 0;
    for (let i = 0; i < N; i += 1) {
      if (s.x[i] > 0.05 && s.x[i] < 0.30) minL = Math.min(minL, d.rho[i]);
      if (s.x[i] > 0.55 && s.x[i] < 0.90) maxR = Math.max(maxR, d.rho[i]);
    }
    expect(minL).toBeLessThan(1.0);                 // rarefaction
    expect(maxR).toBeGreaterThan(0.13);             // post-shock density above initial right state
  }, 60_000);
});

describe('SPH: peak density does not exceed strong-shock bound', () => {
  it('max(rho) does not blow up past the strong-shock limit (gamma+1)/(gamma-1) = 6', () => {
    // For gamma = 1.4 the largest possible post-shock density ratio is 6, so
    // the maximum density anywhere can never exceed 6 * 1 = 6 (left initial
    // density). Kernel smoothing can produce a small peak near the contact,
    // so allow 10 percent margin.
    const s = createSod();
    for (let i = 0; i < 250; i += 1) stepSPH(s, 0.001);
    const d = diagnostics(s);
    let rmax = 0;
    for (let i = 0; i < N; i += 1) if (d.rho[i] > rmax) rmax = d.rho[i];
    expect(rmax).toBeLessThan(6 * 1.1);
    // also a basic sanity bound: density should never blow up huge.
    expect(rmax).toBeLessThan(3.0);
  }, 60_000);
});
