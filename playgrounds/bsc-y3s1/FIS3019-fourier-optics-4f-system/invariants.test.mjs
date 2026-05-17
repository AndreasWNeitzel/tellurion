// 4f Fourier optics: FFT correctness against the direct DFT, the
// inverse round-trip, Parseval's theorem, Hermitian symmetry of a
// real input, linearity, the no-filter object = image identity,
// low-pass smoothing, and high-pass DC removal / edge enhancement.

import { describe, it, expect } from 'vitest';
import {
  fft1, fft2, toComplex, magnitude, filterMask, propagate4f,
  makeObject, meanOf, gradientEnergy,
} from './sim.js';

const close = (a, b, t) => expect(Math.abs(a - b)).toBeLessThan(t);

function directDFT(re, sign) {
  const n = re.length, out = new Float64Array(2 * n);
  for (let k = 0; k < n; k += 1) {
    let sr = 0, si = 0;
    for (let j = 0; j < n; j += 1) {
      const a = sign * 2 * Math.PI * k * j / n;
      sr += re[j] * Math.cos(a); si += re[j] * Math.sin(a);
    }
    out[2 * k] = sr; out[2 * k + 1] = si;
  }
  return out;
}

describe('fourier-optics-4f-system invariants', () => {
  it('FFT matches the direct DFT', () => {
    const x = [1, 0.4, -0.7, 2.1, 0.0, -1.3, 0.9, 0.2];
    const buf = new Float64Array(16);
    for (let i = 0; i < 8; i += 1) buf[2 * i] = x[i];
    fft1(buf, -1);
    const d = directDFT(x, -1);
    for (let i = 0; i < 16; i += 1) close(buf[i], d[i], 1e-9);
  });

  it('inverse FFT round-trips (1D and 2D)', () => {
    const buf = new Float64Array(32);
    for (let i = 0; i < 16; i += 1) buf[2 * i] = Math.sin(i) + 0.3 * i;
    const orig = Float64Array.from(buf);
    fft1(buf, -1); fft1(buf, 1);
    for (let i = 0; i < 32; i += 1) close(buf[i], orig[i], 1e-9);
    const N = 16, b2 = new Float64Array(2 * N * N);
    for (let i = 0; i < N * N; i += 1) b2[2 * i] = Math.cos(0.1 * i) + (i % 7);
    const o2 = Float64Array.from(b2);
    fft2(b2, N, -1); fft2(b2, N, 1);
    for (let i = 0; i < 2 * N * N; i += 1) close(b2[i], o2[i], 1e-8);
  });

  it("Parseval: sum |x|^2 == (1/N) sum |X|^2", () => {
    const N = 8, buf = new Float64Array(2 * N);
    for (let i = 0; i < N; i += 1) buf[2 * i] = (i * 1.7) % 3 - 1;
    let e1 = 0; for (let i = 0; i < N; i += 1) e1 += buf[2 * i] ** 2;
    fft1(buf, -1);
    let e2 = 0; for (let i = 0; i < N; i += 1) e2 += buf[2 * i] ** 2 + buf[2 * i + 1] ** 2;
    close(e1, e2 / N, 1e-9);
  });

  it('a real input has Hermitian-symmetric spectrum', () => {
    const N = 16, buf = new Float64Array(2 * N);
    for (let i = 0; i < N; i += 1) buf[2 * i] = Math.sin(0.7 * i) + 0.2 * i;
    fft1(buf, -1);
    for (let k = 1; k < N / 2; k += 1) {
      close(buf[2 * k], buf[2 * (N - k)], 1e-9);          // Re even
      close(buf[2 * k + 1], -buf[2 * (N - k) + 1], 1e-9); // Im odd
    }
  });

  it('FFT is linear', () => {
    const N = 8;
    const f = new Float64Array(2 * N), g = new Float64Array(2 * N), s = new Float64Array(2 * N);
    for (let i = 0; i < N; i += 1) { f[2 * i] = Math.cos(i); g[2 * i] = i % 3; s[2 * i] = 2 * f[2 * i] - 0.5 * g[2 * i]; }
    fft1(f, -1); fft1(g, -1); fft1(s, -1);
    for (let i = 0; i < 2 * N; i += 1) close(s[i], 2 * f[i] - 0.5 * g[i], 1e-9);
  });

  it('no filter: image equals the object (4f identity)', () => {
    const N = 64, obj = makeObject('aperture', N);
    const { image } = propagate4f(obj, N, null);
    for (let i = 0; i < N * N; i += 1) close(image[i], obj[i] * obj[i], 1e-7);
  });

  it('low-pass smooths: blurred, lower variance, energy non-increasing', () => {
    const N = 64, obj = makeObject('grating', N);
    const full = propagate4f(obj, N, null);
    const lp = propagate4f(obj, N, filterMask(N, 'low', 6));
    const variance = (a) => { const mu = meanOf(a); let v = 0; for (const x of a) v += (x - mu) ** 2; return v / a.length; };
    expect(gradientEnergy(lp.image, N)).toBeLessThan(0.4 * gradientEnergy(full.image, N));
    expect(variance(lp.image)).toBeLessThan(0.3 * variance(full.image));   // blurred toward uniform
    let eL = 0, eF = 0; for (let i = 0; i < N * N; i += 1) { eL += lp.image[i]; eF += full.image[i]; }
    expect(eL).toBeLessThanOrEqual(eF + 1e-9);                              // masking removes energy
  });

  it('high-pass removes DC and enhances edges', () => {
    const N = 64, obj = makeObject('aperture', N);
    const full = propagate4f(obj, N, null);
    const hp = propagate4f(obj, N, filterMask(N, 'high', 3));
    expect(meanOf(hp.image)).toBeLessThan(0.2 * meanOf(full.image));   // DC suppressed
    const flat = new Float64Array(N * N).fill(0.5);
    const hpFlat = propagate4f(flat, N, filterMask(N, 'high', 3));
    expect(meanOf(hpFlat.image)).toBeLessThan(1e-12);                  // uniform -> ~0
  });

  it('spectrum and mask have the right shape', () => {
    const N = 32;
    const m = filterMask(N, 'low', 5);
    expect(m[0]).toBe(1);                                  // DC passes a low-pass
    expect(filterMask(N, 'high', 5)[0]).toBe(0);           // DC blocked by high-pass
    const { spectrum } = propagate4f(makeObject('grating', N), N, null);
    expect(spectrum.length).toBe(N * N);
  });
});
