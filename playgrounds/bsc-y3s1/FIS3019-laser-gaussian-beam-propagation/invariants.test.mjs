// Gaussian-beam ABCD law: free-space q = q0 + z, the spot-size law,
// thin-lens focusing to lambda f / (pi w0), ABCD composition and
// reversibility, the Rayleigh-range landmarks, the Gouy phase, and
// two-mirror resonator stability with a self-consistent mode only
// when stable. Pinned to the Siegman closed forms.

import { describe, it, expect } from 'vitest';
import {
  rayleighRange, divergence, qAtWaist, abcdApply, abcdMul,
  M_free, M_lens, beamRadius, wavefrontR, spotZ, gouy, lensImage,
  gFactors, resonatorStable, traceHalf, roundTrip, resonatorMode,
} from './sim.js';

const close = (a, b, t) => expect(Math.abs(a - b)).toBeLessThan(t);
const rel = (a, b, t) => expect(Math.abs(a - b) / Math.abs(b)).toBeLessThan(t);

const LAM = 1.064e-6;          // Nd:YAG, metres
const W0 = 0.5e-3;             // 0.5 mm waist

describe('laser-gaussian-beam-propagation invariants', () => {
  it('free space: q = q0 + z and the spot-size law', () => {
    const q0 = qAtWaist(W0, LAM), zR = rayleighRange(W0, LAM);
    for (const z of [0, 0.05, 0.2, 1.0, 3.3]) {
      const q = abcdApply(M_free(z), q0);
      close(q.re, z, 1e-12); close(q.im, zR, 1e-12);    // q = i zR + z
      close(beamRadius(q, LAM), W0 * Math.sqrt(1 + (z / zR) ** 2), 1e-12);
      close(beamRadius(q, LAM), spotZ(z, W0, LAM), 1e-12);
    }
  });

  it('Rayleigh-range landmarks', () => {
    const zR = rayleighRange(W0, LAM);
    close(zR, Math.PI * W0 * W0 / LAM, 1e-15);
    close(divergence(W0, LAM), LAM / (Math.PI * W0), 1e-15);
    const q = abcdApply(M_free(zR), qAtWaist(W0, LAM));
    close(beamRadius(q, LAM), W0 * Math.SQRT2, 1e-12);  // w(zR) = sqrt2 w0
    close(wavefrontR(q), 2 * zR, 1e-6);                 // R(zR) = 2 zR (minimum)
  });

  it('thin lens focuses a collimated beam to lambda f / (pi w0)', () => {
    const win = 2e-3, f = 0.1;                          // zR_in >> f (collimated)
    const { w0Out, distance } = lensImage(win, LAM, f, 0);
    rel(w0Out, LAM * f / (Math.PI * win), 5e-3);        // 0.5 percent
    rel(distance, f, 5e-3);                             // waist ~ f beyond lens
  });

  it('ABCD composition equals sequential application', () => {
    const q0 = qAtWaist(W0, LAM);
    const M1 = M_free(0.3), M2 = M_lens(0.15), M3 = M_free(0.2);
    const seq = abcdApply(M3, abcdApply(M2, abcdApply(M1, q0)));
    const comp = abcdApply(abcdMul(M3, abcdMul(M2, M1)), q0);
    close(seq.re, comp.re, 1e-10); close(seq.im, comp.im, 1e-10);
  });

  it('free-space propagation is reversible', () => {
    const q0 = qAtWaist(W0, LAM);
    const q = abcdApply(M_free(-1.7), abcdApply(M_free(1.7), q0));
    close(q.re, q0.re, 1e-9); close(q.im, q0.im, 1e-9);
  });

  it('Gouy phase: 0 at the waist, pi/4 at zR, pi across a focus', () => {
    close(gouy(0, W0, LAM), 0, 1e-15);
    close(gouy(rayleighRange(W0, LAM), W0, LAM), Math.PI / 4, 1e-12);
    const total = gouy(1e6 * rayleighRange(W0, LAM), W0, LAM)
                - gouy(-1e6 * rayleighRange(W0, LAM), W0, LAM);
    close(total, Math.PI, 1e-5);
  });

  it('resonator stability matches |(A+D)/2| <= 1', () => {
    const cases = [
      [1.0, 2.0, 2.0],   // g1 g2 = 0.25 in (0,1): stable
      [1.0, 0.6, 0.6],   // g1 g2 = (1 - 1/0.6)^2 = 0.444: stable
      [1.0, 1e9, 1e9],   // plane-parallel: g1 g2 -> 1 (marginal)
      [1.0, 1.0, 1.0],   // confocal: g1 g2 = 0 (marginal)
      [3.0, 1.2, 1.2],   // g1 g2 = (1 - 2.5)^2 = 2.25 > 1: unstable
    ];
    for (const [L, R1, R2] of cases) {
      const { g1, g2 } = gFactors(L, R1, R2);
      const stableG = g1 * g2 >= -1e-9 && g1 * g2 <= 1 + 1e-9;
      expect(resonatorStable(L, R1, R2)).toBe(stableG);
      expect(Math.abs(traceHalf(L, R1, R2)) <= 1 + 1e-6).toBe(stableG);
    }
  });

  it('a stable resonator has a self-consistent Gaussian mode', () => {
    const mode = resonatorMode(1.0, 2.0, 2.0, LAM);     // stable
    expect(mode).not.toBeNull();
    expect(mode.q.im).toBeGreaterThan(0);               // physical (Im q > 0)
    // q reproduces itself under the round trip
    const [A, B, C, D] = roundTrip(1.0, 2.0, 2.0);
    const num = { re: A * mode.q.re + B, im: A * mode.q.im };
    const den = { re: C * mode.q.re + D, im: C * mode.q.im };
    const dd = den.re * den.re + den.im * den.im;
    const qp = { re: (num.re * den.re + num.im * den.im) / dd, im: (num.im * den.re - num.re * den.im) / dd };
    close(qp.re, mode.q.re, 1e-7); close(qp.im, mode.q.im, 1e-7);
    expect(resonatorMode(3.0, 1.2, 1.2, LAM)).toBeNull(); // unstable: no mode
  });

  it('imaging: a waist at the front focus images to the back focus', () => {
    const f = 0.2;
    const { distance } = lensImage(W0, LAM, f, f);       // s = f
    rel(distance, f, 1e-2);                              // output waist at s' = f
  });
});
