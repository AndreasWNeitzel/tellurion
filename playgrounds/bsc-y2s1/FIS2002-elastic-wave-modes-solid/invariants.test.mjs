// Elastic waves: the analytic speeds, a P front faster than an S
// front, both matching v_P and v_S, the shear front vanishing as
// mu -> 0, the seismograph P-then-S delay, and CFL stability.

import { describe, it, expect } from 'vitest';
import {
  speeds, cflDt, makeSolid, ricker, step,
  divergence, curlZ, frontRadius, totalEnergy,
} from './sim.js';

// Launch a directed point-force pulse at the centre, then propagate.
function shoot(N, lambda, mu, rho, nWarm, nFree) {
  const s = makeSolid(N), dt = cflDt(lambda, mu, rho);
  const ci = N >> 1, t0 = 14 * dt, f0 = 1 / (26 * dt);
  const src = (i, j) => (i === ci && j === ci ? [0, 60 * ricker(s.t, t0, f0)] : null);
  for (let n = 0; n < nWarm; n += 1) step(s, lambda, mu, rho, dt, src, 12);
  for (let n = 0; n < nFree; n += 1) step(s, lambda, mu, rho, dt, null, 12);
  return { s, dt, ci };
}

describe('elastic-wave-modes-solid invariants', () => {
  it('analytic speeds: v_P/v_S = sqrt((lambda+2mu)/mu), v_P > v_S', () => {
    const { vP, vS } = speeds(2, 1, 1);
    expect(vP).toBeCloseTo(2, 12);
    expect(vS).toBeCloseTo(1, 12);
    expect(vP / vS).toBeCloseTo(Math.sqrt((2 + 2 * 1) / 1), 12);
    expect(vP).toBeGreaterThan(vS);
  });

  it('the P (divergence) front outruns the S (curl) front', () => {
    const { s, ci } = shoot(161, 2, 1, 1, 60, 70);
    const rP = frontRadius(s, 'P', ci, ci);
    const rS = frontRadius(s, 'S', ci, ci);
    expect(rP).toBeGreaterThan(rS * 1.4);
  });

  it('measured front speeds match v_P and v_S within 10%', () => {
    const lambda = 2, mu = 1, rho = 1;
    const { vP, vS } = speeds(lambda, mu, rho);
    const a = shoot(181, lambda, mu, rho, 60, 40);
    const rP1 = frontRadius(a.s, 'P', a.ci, a.ci), rS1 = frontRadius(a.s, 'S', a.ci, a.ci), t1 = a.s.t;
    for (let n = 0; n < 40; n += 1) step(a.s, lambda, mu, rho, a.dt, null, 12);
    const rP2 = frontRadius(a.s, 'P', a.ci, a.ci), rS2 = frontRadius(a.s, 'S', a.ci, a.ci), t2 = a.s.t;
    const vPm = (rP2 - rP1) / (t2 - t1), vSm = (rS2 - rS1) / (t2 - t1);
    expect(Math.abs(vPm - vP) / vP).toBeLessThan(0.10);
    expect(Math.abs(vSm - vS) / vS).toBeLessThan(0.10);
  });

  it('as mu -> 0 the shear front does not propagate (no S wave)', () => {
    const big = shoot(161, 2, 1, 1, 60, 70);
    const sBig = frontRadius(big.s, 'S', big.ci, big.ci);
    const small = shoot(161, 2, 0.01, 1, 60, 70);
    const sSmall = frontRadius(small.s, 'S', small.ci, small.ci);
    expect(sSmall).toBeLessThan(sBig * 0.45);
  });

  it('seismograph: S arrival lags P by d (1/v_S - 1/v_P)', () => {
    const lambda = 3, mu = 1, rho = 1, N = 221;
    const { vP, vS } = speeds(lambda, mu, rho);
    const s = makeSolid(N), dt = cflDt(lambda, mu, rho), ci = N >> 1;
    const t0 = 14 * dt, f0 = 1 / (26 * dt);
    // a y-directed point force has a P-radiation node along the axes,
    // so record at a 45 deg station where both P and S radiate
    const src = (i, j) => (i === ci && j === ci ? [0, 60 * ricker(s.t, t0, f0)] : null);
    const off = 52, xi = ci + off, yj = ci + off, d = Math.hypot(off, off);
    const dvT = [], cvT = [], tArr = [];
    for (let n = 0; n < 1000; n += 1) {
      step(s, lambda, mu, rho, dt, n < 70 ? src : null, 16);
      dvT.push(Math.abs(divergence(s, xi, yj)));
      cvT.push(Math.abs(curlZ(s, xi, yj)));
      tArr.push(s.t);
    }
    const dMax = Math.max(...dvT), cMax = Math.max(...cvT);
    let nP = dvT.findIndex(v => v > 0.15 * dMax);
    let nS = cvT.findIndex((v, n) => v > 0.15 * cMax && tArr[n] > tArr[nP]);
    expect(nP).toBeGreaterThanOrEqual(0);
    expect(nS).toBeGreaterThan(nP);
    const tP = tArr[nP], tS = tArr[nS];
    const predicted = d * (1 / vS - 1 / vP);
    expect(Math.abs((tS - tP) - predicted) / predicted).toBeLessThan(0.2);
  });

  it('stable at the CFL dt, divergent well above it', () => {
    const lambda = 2, mu = 1, rho = 1;
    const ok = makeSolid(81), dt = cflDt(lambda, mu, rho);
    const t0 = 14 * dt, f0 = 1 / (26 * dt);
    for (let n = 0; n < 600; n += 1) step(ok, lambda, mu, rho, dt, (i, j) => (i === 40 && j === 40 ? [0, 40 * ricker(ok.t, t0, f0)] : null), 8);
    let okFinite = true; for (const v of ok.ux) if (!Number.isFinite(v) || Math.abs(v) > 1e3) okFinite = false;
    expect(okFinite).toBe(true);
    expect(totalEnergy(ok)).toBeLessThan(1e6);
    const bad = makeSolid(81);
    for (let n = 0; n < 200; n += 1) step(bad, lambda, mu, rho, dt * 2.2, (i, j) => (i === 40 && j === 40 ? [0, 40] : null), 0);
    let blew = false; for (const v of bad.ux) if (!Number.isFinite(v) || Math.abs(v) > 1e8) blew = true;
    expect(blew).toBe(true);
  });
});
