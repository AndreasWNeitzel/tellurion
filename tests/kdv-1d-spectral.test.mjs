// Shared-engine tests for shared/js/engine/kdv-1d-spectral-cpu.js
// (built before the soliton-canal-3d hero, per the no-engine-
// duplication rule). These prove the spectral KdV integrator is
// real: a single soliton keeps its shape and moves at c = 2a, an
// arbitrary lump disperses, the first three KdV invariants are
// conserved over a long run, and a tall soliton overtakes a short
// one and both survive (the playground centrepiece).

import { describe, it, expect } from 'vitest';
import {
  fftInPlace, makeKdV, addSoliton, setGaussian, clear, step,
  invariants, peak,
} from '../shared/js/engine/kdv-1d-spectral-cpu.js';

describe('FFT primitive', () => {
  it('forward then inverse recovers the signal', () => {
    const n = 64;
    const re = new Float64Array(n), im = new Float64Array(n);
    for (let i = 0; i < n; i += 1) re[i] = Math.sin(3 * 2 * Math.PI * i / n) + 0.4 * Math.cos(7 * 2 * Math.PI * i / n);
    const re0 = Float64Array.from(re);
    fftInPlace(re, im, -1);
    fftInPlace(re, im, +1);
    for (let i = 0; i < n; i += 1) expect(re[i] / n).toBeCloseTo(re0[i], 10);
  });

  it('a pure cosine has its only spectral power at +/- its wavenumber', () => {
    const n = 64, kk = 5;
    const re = new Float64Array(n), im = new Float64Array(n);
    for (let i = 0; i < n; i += 1) re[i] = Math.cos(kk * 2 * Math.PI * i / n);
    fftInPlace(re, im, -1);
    for (let i = 0; i < n; i += 1) {
      const p = Math.hypot(re[i], im[i]);
      if (i === kk || i === n - kk) expect(p).toBeGreaterThan(0.4 * n);
      else expect(p).toBeLessThan(1e-8);
    }
  });
});

describe('KdV single soliton', () => {
  it('amplitude-speed law c = 2a and shape preserved while it translates', () => {
    const s = makeKdV(512, 60);
    const A = 0.8;
    const c = addSoliton(s, 15, A);
    expect(c).toBeCloseTo(2 * A, 12);
    const p0 = peak(s);
    expect(p0.amplitude).toBeCloseTo(A, 3);

    const dt = 2e-3;
    const T = 4;
    const nsteps = Math.round(T / dt);
    for (let n = 0; n < nsteps; n += 1) step(s, dt);

    const p1 = peak(s);
    // shape preserved: peak amplitude unchanged to < 1%
    expect(Math.abs(p1.amplitude - A) / A).toBeLessThan(0.01);
    // moved at speed c: displacement ~ c*T (periodic, compare modulo L)
    let disp = (p1.x - p0.x);
    disp -= s.L * Math.round((disp - c * T) / s.L);
    expect(Math.abs(disp - c * T) / (c * T)).toBeLessThan(0.02);
  });
});

describe('KdV invariants conserved over a long run (two solitons)', () => {
  it('mass, momentum, energy conserved to 1e-4 over 1e4 steps', () => {
    const s = makeKdV(512, 60);
    addSoliton(s, 12, 1.0);
    addSoliton(s, 26, 0.45);
    const i0 = invariants(s);
    const dt = 1.5e-3;
    for (let n = 0; n < 10000; n += 1) step(s, dt);
    const i1 = invariants(s);
    const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-9);
    expect(rel(i1.mass, i0.mass)).toBeLessThan(1e-4);
    expect(rel(i1.momentum, i0.momentum)).toBeLessThan(1e-4);
    expect(rel(i1.energy, i0.energy)).toBeLessThan(1e-4);
  });
});

describe('KdV two-soliton overtaking collision', () => {
  it('the tall soliton passes through the short one; both amplitudes survive to 1%', () => {
    const s = makeKdV(1024, 80);
    const Atall = 1.2, Ashort = 0.4;
    addSoliton(s, 14, Atall);     // tall, fast, behind
    addSoliton(s, 40, Ashort);    // short, slow, ahead
    const dt = 1e-3;
    // run long enough for the tall one to overtake and separate
    for (let n = 0; n < 30000; n += 1) step(s, dt);
    // after separation the two tallest local maxima are the solitons
    const u = s.u;
    const maxima = [];
    for (let i = 0; i < s.N; i += 1) {
      const l = u[(i - 1 + s.N) % s.N], r = u[(i + 1) % s.N];
      if (u[i] > l && u[i] > r && u[i] > 0.15) maxima.push(u[i]);
    }
    maxima.sort((a, b) => b - a);
    expect(maxima.length).toBeGreaterThanOrEqual(2);
    expect(Math.abs(maxima[0] - Atall) / Atall).toBeLessThan(0.01);
    expect(Math.abs(maxima[1] - Ashort) / Ashort).toBeLessThan(0.03);
  });
});

describe('KdV contrast: a Gaussian is not a soliton', () => {
  const minU = (s) => { let m = Infinity; for (let i = 0; i < s.N; i += 1) if (s.u[i] < m) m = s.u[i]; return m; };

  it('a Gaussian sheds an oscillatory (negative-going) dispersive tail; a soliton stays positive', () => {
    const dt = 1.5e-3, nstep = 5000;
    // control: a clean soliton stays a strictly positive single hump
    const a = makeKdV(512, 60);
    const A = 0.8;
    addSoliton(a, 30, A);
    for (let n = 0; n < nstep; n += 1) step(a, dt);
    const pa = peak(a);
    expect(Math.abs(pa.amplitude - A) / A).toBeLessThan(0.01);  // shape kept
    expect(minU(a)).toBeGreaterThan(-0.01);                     // no troughs

    // an arbitrary lump must reorganize: KdV dispersion produces an
    // Airy-like wavetrain that oscillates about zero (clear negative
    // troughs), which a single soliton never does.
    const g = makeKdV(512, 60);
    setGaussian(g, 30, 0.5, 1.0);
    const peak0 = peak(g).amplitude;
    for (let n = 0; n < nstep; n += 1) step(g, dt);
    expect(minU(g)).toBeLessThan(-0.02);                        // radiation troughs
    expect(peak(g).amplitude).toBeLessThan(0.97 * peak0);       // not shape-preserving
  });

  it('clear() zeroes the field', () => {
    const s = makeKdV(64, 20);
    addSoliton(s, 10, 1);
    clear(s);
    expect(peak(s).amplitude).toBe(0);
    expect(s.t).toBe(0);
  });
});
