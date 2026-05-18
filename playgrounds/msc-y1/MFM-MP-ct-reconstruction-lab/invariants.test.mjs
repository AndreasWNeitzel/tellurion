import { describe, it, expect } from 'vitest';
import {
  makePhantom, radon, projectionAngles, ramLakKernel,
  filterProjection, backproject, fbp, mlem, rmse, snr,
} from './sim.js';

describe('ct-reconstruction-lab invariants', () => {
  const N = 44;
  const ph = makePhantom(N);

  it('the Radon transform is linear', () => {
    const f = makePhantom(N);
    const g = new Float64Array(N * N).map((_, i) => (i % 5 === 0 ? 0.7 : 0));
    const A = projectionAngles(36);
    const Rf = radon(f, N, A), Rg = radon(g, N, A);
    const Rc = radon(f.map((v, i) => 2 * v + 3 * g[i]), N, A);
    let maxErr = 0;
    for (let a = 0; a < A.length; a += 1) {
      for (let d = 0; d < Rf[a].length; d += 1) {
        maxErr = Math.max(maxErr, Math.abs(Rc[a][d] - (2 * Rf[a][d] + 3 * Rg[a][d])));
      }
    }
    expect(maxErr).toBeLessThan(1e-9);
  });

  it('each projection conserves the total attenuation (within discretisation)', () => {
    const A = projectionAngles(48);
    const R = radon(ph, N, A);
    const tot = R.map((row) => row.reduce((s, v) => s + v, 0));
    const mn = Math.min(...tot), mx = Math.max(...tot);
    expect(mx).toBeGreaterThan(0);
    expect((mx - mn) / mx).toBeLessThan(0.02);                 // angle-independent total
    const Z = radon(new Float64Array(N * N), N, A);
    expect(Z.every((r) => r.every((v) => v === 0))).toBe(true);
  });

  it('the Ram-Lak ramp kernel has the Ramachandran-Lakshminarayanan values', () => {
    const M = 10, h = ramLakKernel(M);
    expect(h[M]).toBeCloseTo(0.25, 12);                        // n = 0
    expect(h[M + 1]).toBeCloseTo(-1 / (Math.PI * Math.PI), 12); // n = 1
    expect(h[M + 3]).toBeCloseTo(-1 / (Math.PI * Math.PI * 9), 12); // n = 3
    expect(h[M + 2]).toBe(0);                                  // even
    expect(h[M + 4]).toBe(0);
    expect(h[M - 1]).toBeCloseTo(h[M + 1], 12);                // symmetric
  });

  it('filtered back-projection of a point source peaks at the source', () => {
    const pt = new Float64Array(N * N);
    const ci = Math.floor(N / 2), cj = Math.floor(N / 2);
    pt[cj * N + ci] = 1;
    const A = projectionAngles(120);
    const rec = fbp(radon(pt, N, A), N, A, N, 'ramlak');
    let mi = 0;
    for (let k = 1; k < rec.length; k += 1) if (rec[k] > rec[mi]) mi = k;
    expect(mi % N).toBe(ci);
    expect(Math.floor(mi / N)).toBe(cj);
  });

  it('more projection angles give a better reconstruction (SNR grows with N)', () => {
    const fit = (na) => {
      const A = projectionAngles(na);
      const rec = fbp(radon(ph, N, A), N, A, N, 'ramlak');
      let num = 0, den = 0;
      for (let i = 0; i < rec.length; i += 1) { num += rec[i] * ph[i]; den += rec[i] * rec[i]; }
      const sc = num / den;
      return { r: rmse(rec.map((v) => v * sc), ph), s: snr(rec.map((v) => v * sc), ph) };
    };
    const a5 = fit(5), a20 = fit(20), a60 = fit(60);
    expect(a20.r).toBeLessThan(a5.r);                          // error falls
    expect(a60.r).toBeLessThan(a20.r);
    expect(a20.s).toBeGreaterThan(a5.s);                       // SNR rises
    expect(a60.s).toBeGreaterThan(a20.s);
    expect(a20.s / a5.s).toBeLessThan(20 / 5);                 // sub-linear (sqrt-like)
  });

  it('MLEM converges: the reconstruction error decreases monotonically', () => {
    const A = projectionAngles(48);
    const m = mlem(radon(ph, N, A), N, A, N, 16, ph);
    expect(m.rmseHist.length).toBe(16);
    let mono = true;
    for (let i = 1; i < m.rmseHist.length; i += 1) {
      if (m.rmseHist[i] > m.rmseHist[i - 1] + 1e-6) mono = false;
    }
    expect(mono).toBe(true);
    expect(m.rmseHist[15]).toBeLessThan(m.rmseHist[0]);
    expect(m.image.every((v) => v >= 0)).toBe(true);            // non-negative
  });

  it('the filter selector changes the reconstruction (ramlak vs none vs shepp)', () => {
    const A = projectionAngles(60);
    const sino = radon(ph, N, A);
    const rl = fbp(sino, N, A, N, 'ramlak');
    const no = fbp(sino, N, A, N, 'none');
    const sh = fbp(sino, N, A, N, 'shepp');
    expect(rmse(rl, ph)).toBeLessThan(rmse(no, ph));            // the ramp deblurs
    expect(rl.some((v, i) => Math.abs(v - sh[i]) > 1e-6)).toBe(true);
    expect(filterProjection(sino[0], 'none')).toEqual(Float64Array.from(sino[0]));
  });

  it('deterministic: identical inputs reproduce the sinogram and reconstruction', () => {
    const A = projectionAngles(24);
    const s1 = radon(ph, N, A), s2 = radon(ph, N, A);
    expect(s1[5][10]).toBe(s2[5][10]);
    const r1 = fbp(s1, N, A, N, 'ramlak'), r2 = fbp(s2, N, A, N, 'ramlak');
    expect(r1[100]).toBe(r2[100]);
    expect(backproject(s1, N, A, N)[50]).toBe(backproject(s2, N, A, N)[50]);
  });
});
