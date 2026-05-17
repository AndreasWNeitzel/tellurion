// Huygens construction: a single secondary wavelet is isotropic, a
// uniform line of wavelets reproduces the Fraunhofer sinc envelope
// with first zeros at sin theta = m lambda / a, the on-axis amplitude
// is the coherent maximum, and a concave arc of equal-phase sources
// focuses.

import { describe, it, expect } from 'vitest';
import {
  sinc, sourcesLine, sourcesArc, fieldAt, farFieldAmplitude,
  apertureAmplitude, ringEnvelopeCoV,
} from './sim.js';

const TAU = 2 * Math.PI;

describe('huygens-construction-interactive invariants', () => {
  it('single secondary wavelet is isotropic (circular)', () => {
    const k = TAU / 20, omega = k;                 // c = 1
    const one = sourcesLine(1, 0, 0, 0);
    expect(ringEnvelopeCoV(one, 60, k, omega)).toBeLessThan(0.02);
  });

  it('uniform line aperture: far field follows the sinc envelope', () => {
    const lambda = 8, k = TAU / lambda, a = 120;
    const src = sourcesLine(400, a, 0, 0);          // dense => continuous aperture
    let maxErr = 0;
    for (let deg = -16; deg <= 16; deg += 1) {
      const th = (deg * Math.PI) / 180;
      const num = farFieldAmplitude(src, th, k);
      const ana = apertureAmplitude(th, a, lambda);
      maxErr = Math.max(maxErr, Math.abs(num - ana));
    }
    expect(maxErr).toBeLessThan(0.05);
  });

  it('first diffraction minimum at sin theta = lambda / a', () => {
    const lambda = 8, k = TAU / lambda, a = 140;
    const src = sourcesLine(500, a, 0, 0);
    const thMin = Math.asin(lambda / a);
    // scan for the amplitude minimum near the predicted angle
    let best = 1e9, bestTh = 0;
    for (let th = thMin * 0.6; th <= thMin * 1.4; th += thMin * 0.01) {
      const v = farFieldAmplitude(src, th, k);
      if (v < best) { best = v; bestTh = th; }
    }
    expect(Math.abs(bestTh - thMin)).toBeLessThan(0.02);   // radians
    expect(best).toBeLessThan(0.05);                        // a true null
  });

  it('on-axis is the coherent principal maximum (grows with N)', () => {
    const k = TAU / 10;
    const a = 80;
    const f8 = farFieldAmplitude(sourcesLine(8, a, 0, 0), 0, k);
    const f64 = farFieldAmplitude(sourcesLine(64, a, 0, 0), 0, k);
    // normalised far field is 1 on axis for in-phase sources
    expect(f8).toBeCloseTo(1, 6);
    expect(f64).toBeCloseTo(1, 6);
    // and the raw coherent sum on axis scales with N
    const raw = (N) => { let re = 0; for (const s of sourcesLine(N, a, 0, 0)) re += Math.cos(k * (s.x)); return Math.abs(re); };
    expect(raw(64) / raw(8)).toBeCloseTo(8, 1);
  });

  it('sinc identity and symmetry of the aperture pattern', () => {
    expect(sinc(0)).toBe(1);
    expect(Math.abs(sinc(Math.PI))).toBeLessThan(1e-12);   // zero at pi
    const a = 100, lambda = 10;
    for (const d of [3, 7, 11]) {
      const p = apertureAmplitude((d * Math.PI) / 180, a, lambda);
      const m = apertureAmplitude((-d * Math.PI) / 180, a, lambda);
      expect(Math.abs(p - m)).toBeLessThan(1e-12);          // even in theta
    }
  });

  it('a concave arc of equal-phase wavelets focuses (gain at the centre of curvature)', () => {
    const lambda = 9, k = TAU / lambda, omega = k, a = 90, R = 130;
    const arc = sourcesArc(64, a, R, 0, 0);
    const line = sourcesLine(64, a, 0, 0);
    const focusX = R, focusY = 0;
    const peak = (src) => { let p = 0; for (let m = 0; m < 60; m += 1) { const t = (m / 60) * (TAU / omega); p = Math.max(p, Math.abs(fieldAt(src, focusX, focusY, k, omega, t))); } return p; };
    expect(peak(arc)).toBeGreaterThan(1.6 * peak(line));     // real focusing gain
  });
});
