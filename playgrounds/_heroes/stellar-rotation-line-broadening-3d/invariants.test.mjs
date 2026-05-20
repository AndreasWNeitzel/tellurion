import { describe, it, expect } from 'vitest';
import { limbDarkening, gaussianLine, broadenedLine, halfWidthHalfDepth, vsiniMS } from './sim.js';

const N = 121;
const wavelengths = new Float64Array(N);
for (let i = 0; i < N; i += 1) wavelengths[i] = -0.10 + (i / (N - 1)) * 0.20;

describe('stellar-rotation-line-broadening-3d', () => {
  it('limb darkening: mu=1 -> intensity 1', () => {
    expect(Math.abs(limbDarkening(1, 0.42, 0.25) - 1)).toBeLessThan(1e-12);
  });

  it('limb darkening: mu=0 -> intensity 1 - u1 - u2 (= 0.33 here)', () => {
    const v = limbDarkening(0, 0.42, 0.25);
    expect(Math.abs(v - (1 - 0.42 - 0.25))).toBeLessThan(1e-12);
  });

  it('gaussianLine: depth = 0.7 at center', () => {
    expect(Math.abs(gaussianLine(0, 0, 0.012, 0.7) - 0.3)).toBeLessThan(1e-12);
  });

  it('non-rotating broadenedLine reproduces input depth at center', () => {
    const out = broadenedLine(wavelengths, 0, { sigma: 0.012, depth: 0.7, nx: 32 });
    const mid = Math.floor(N / 2);
    expect(Math.abs(out[mid] - 0.3)).toBeLessThan(0.01);
  });

  it('rotating broadenedLine: line is shallower than non-rotating', () => {
    const out0 = broadenedLine(wavelengths, 0, { sigma: 0.012, depth: 0.7, nx: 32 });
    const out1 = broadenedLine(wavelengths, 0.003, { sigma: 0.012, depth: 0.7, nx: 32 });
    const mid = Math.floor(N / 2);
    expect(out1[mid]).toBeGreaterThan(out0[mid]);   // depth of line is reduced (closer to 1)
  });

  it('rotating profile: HWHD grows with v sin i', () => {
    const hw0 = halfWidthHalfDepth(wavelengths, broadenedLine(wavelengths, 0, { nx: 32 }), 0.7);
    const hw1 = halfWidthHalfDepth(wavelengths, broadenedLine(wavelengths, 0.003, { nx: 32 }), 0.7);
    expect(hw1).toBeGreaterThan(hw0);
  });

  it('broadened profile is normalized (continuum at edges ~ 1)', () => {
    const out = broadenedLine(wavelengths, 0.003, { sigma: 0.005, depth: 0.7, nx: 32 });
    expect(out[0]).toBeGreaterThan(0.97);
    expect(out[N - 1]).toBeGreaterThan(0.97);
  });

  it('vsiniMS: 1e-4 -> ~ 30 km/s', () => {
    const v = vsiniMS(1e-4);
    expect(Math.abs(v / 1000 - 30)).toBeLessThan(0.5);
  });

  it('broadened profile is symmetric about line center', () => {
    const out = broadenedLine(wavelengths, 0.003, { nx: 32 });
    for (let k = 0; k < Math.floor(N / 2); k += 1) {
      const left = out[k];
      const right = out[N - 1 - k];
      expect(Math.abs(left - right)).toBeLessThan(2e-3);
    }
  });
});
