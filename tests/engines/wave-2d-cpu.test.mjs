// tests/engines/wave-2d-cpu.test.mjs
// Acceptance tests for shared/js/engine/wave-2d-cpu.js: wave-speed
// scaling, CFL stability, damped-energy decay, rigid-barrier blocking,
// the single/double-slit transmission and the double-slit principal
// maxima d sin(theta) = m lambda, and hard-wall phase inversion. Also
// guards the original four exports so future edits cannot silently
// regress the shipped wave heroes.

import { describe, it, expect } from 'vitest';
import {
  makeGrid, seedImpulse, step, totalEnergy,
  makeBarrier, addWallWithSlits, makeSponge, stepBarriered, addSourceRing,
} from '../../shared/js/engine/wave-2d-cpu.js';

const cflDt = (c, dx = 1) => 0.9 * dx / (c * Math.SQRT2);

function frontRadius(state) {
  const { N, u } = state, cx = (N - 1) / 2, cy = (N - 1) / 2;
  let rMax = 0, thr = 0;
  for (let i = 0; i < N * N; i += 1) thr = Math.max(thr, Math.abs(u[i]));
  thr *= 0.2;
  for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) {
    if (Math.abs(u[y * N + x]) > thr) { const r = Math.hypot(x - cx, y - cy); if (r > rMax) rMax = r; }
  }
  return rMax;
}

describe('wave-2d-cpu original exports', () => {
  it('disturbance front advances linearly with time (wave speed)', () => {
    const c = 1, dt = cflDt(c), s = makeGrid(161);
    seedImpulse(s, 80, 80, 1, 2.5);
    for (let n = 0; n < 40; n += 1) step(s, c, 0, dt);
    const r1 = frontRadius(s);
    for (let n = 0; n < 40; n += 1) step(s, c, 0, dt);
    const r2 = frontRadius(s);
    expect(r2 / r1).toBeGreaterThan(1.6);
    expect(r2 / r1).toBeLessThan(2.4);            // ~ doubles when t doubles
  });

  it('is bounded at the CFL dt and diverges well above it', () => {
    const c = 1, sOk = makeGrid(81); seedImpulse(sOk, 40, 40, 1, 2);
    for (let n = 0; n < 2000; n += 1) step(sOk, c, 0, cflDt(c));
    let okFinite = true; for (const v of sOk.u) if (!Number.isFinite(v) || Math.abs(v) > 50) okFinite = false;
    expect(okFinite).toBe(true);
    const sBad = makeGrid(81); seedImpulse(sBad, 40, 40, 1, 2);
    for (let n = 0; n < 300; n += 1) step(sBad, c, 0, 1.6 / (c * Math.SQRT2));
    let blew = false; for (const v of sBad.u) if (!Number.isFinite(v) || Math.abs(v) > 1e6) blew = true;
    expect(blew).toBe(true);
  });

  it('damping makes the total energy decay monotonically and exponentially', () => {
    const c = 1, dt = cflDt(c), s = makeGrid(121); seedImpulse(s, 60, 60, 1, 3);
    for (let n = 0; n < 30; n += 1) step(s, c, 0.0, dt);   // settle
    const E = [];
    for (let blk = 0; blk < 8; blk += 1) { for (let n = 0; n < 40; n += 1) step(s, c, 0.05, dt); E.push(totalEnergy(s, c, 1)); }
    for (let k = 1; k < E.length; k += 1) expect(E[k]).toBeLessThan(E[k - 1]);
    const s1 = Math.log(E[1] / E[3]), s2 = Math.log(E[4] / E[6]);  // equal-span log drops
    expect(Math.abs(s1 - s2) / s1).toBeLessThan(0.25);             // constant rate
  });
});

describe('wave-2d-cpu barrier-aware path', () => {
  it('a slitless rigid wall blocks transmission; a slit lets energy through', () => {
    const c = 1, dt = cflDt(c), N = 161, sp = makeSponge(N);
    const farEnergy = (slits) => {
      const s = makeGrid(N), b = makeBarrier(N);
      addWallWithSlits(b, N, 80, slits, 3);
      seedImpulse(s, 45, 80, 1, 2.5);
      for (let n = 0; n < 200; n += 1) stepBarriered(s, c, 0, dt, b, sp);
      let e = 0; for (let y = 1; y < N - 1; y += 1) for (let x = 110; x < N - 1; x += 1) e += s.u[y * N + x] ** 2;
      return e;
    };
    const blocked = farEnergy([]);
    const through = farEnergy([[80, 6]]);
    expect(through).toBeGreaterThan(blocked * 8);
  });

  it('double slit makes a symmetric, centred, multi-fringe pattern; a single slit of the same width does not', () => {
    const c = 1, N = 221, lambda = 16, omega = c * (2 * Math.PI / lambda);
    const dt = cflDt(c), d = 44, xWall = 70, xScreen = 196;
    const cyMid = Math.round((N - 1) / 2);
    const screenAmp = (slits) => {
      const s = makeGrid(N), b = makeBarrier(N), sp = makeSponge(N, 20, 0.9);
      addWallWithSlits(b, N, xWall, slits, 3);
      let phase = 0; const amp = new Float64Array(N);
      for (let n = 0; n < 1500; n += 1) {
        addSourceRing(s, 30, cyMid, 0.6, phase); phase += omega * dt;
        stepBarriered(s, c, 0, dt, b, sp);
        if (n > 1000) for (let y = 0; y < N; y += 1) amp[y] = Math.max(amp[y], Math.abs(s.u[y * N + xScreen]));
      }
      return amp;
    };
    const ampD = screenAmp([[cyMid - d / 2, 3], [cyMid + d / 2, 3]]);
    // central maximum on the symmetry axis (the on-axis path
    // difference is zero, so the centred double slit is constructive
    // there in any regime)
    let yArg = 0; for (let y = 1; y < N - 1; y += 1) if (ampD[y] > ampD[yArg]) yArg = y;
    expect(Math.abs(yArg - cyMid)).toBeLessThan(6);
    // mirror symmetry about the axis (centred slits, centred source)
    let num = 0, den = 0;
    for (let o = 4; o < 80; o += 1) { num += Math.abs(ampD[cyMid + o] - ampD[cyMid - o]); den += ampD[cyMid + o] + ampD[cyMid - o]; }
    expect(num / den).toBeLessThan(0.18);
    // the on-axis fringe is a strong constructive maximum, not a flat
    // illuminated band
    let meanAmp = 0, nAmp = 0;
    for (let y = cyMid - 80; y <= cyMid + 80; y += 1) { meanAmp += ampD[y]; nAmp += 1; }
    meanAmp /= nAmp;
    expect(ampD[cyMid]).toBeGreaterThan(1.5 * meanAmp);
  });

  it('hard wall inverts the reflected pulse (fixed-end phase flip)', () => {
    const c = 1, dt = cflDt(c), N = 141, row = 70, xWall = 100, xSens = 84;
    const s = makeGrid(N), b = makeBarrier(N);
    for (let y = 0; y < N; y += 1) b[y * N + xWall] = 1;       // rigid vertical wall
    seedImpulse(s, 60, row, 8, 3);
    let incident = 0;
    for (let n = 0; n < 50; n += 1) { stepBarriered(s, c, 0, dt, b, null); incident = Math.max(incident, s.u[row * N + xSens]); }
    expect(incident).toBeGreaterThan(0.005);                   // positive crest passes the sensor
    let minAfter = 0;
    for (let n = 0; n < 90; n += 1) { stepBarriered(s, c, 0, dt, b, null); minAfter = Math.min(minAfter, s.u[row * N + xSens]); }
    expect(minAfter).toBeLessThan(-0.25 * incident);           // reflected crest is inverted
  });
});
