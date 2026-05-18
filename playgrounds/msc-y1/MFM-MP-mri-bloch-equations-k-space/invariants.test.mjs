import { describe, it, expect } from 'vitest';
import {
  fft, fft2, magnitude, blochEvolve, mag, fid, spectrum,
  seSignal, greSignal, ernstAngle, TISSUES, brainPhantom,
  mrImage, imageToK, reconFromK,
} from './sim.js';

describe('mri-bloch-equations-k-space invariants', () => {
  it('the FFT is unitary: the inverse 2D transform recovers the image', () => {
    const N = 64, ph = brainPhantom(N), img = mrImage(ph, N, 'se', 2000, 80);
    const rec = reconFromK(imageToK(img, N), N, 1);
    let maxErr = 0;
    for (let k = 0; k < N * N; k += 1) maxErr = Math.max(maxErr, Math.abs(rec[k] - Math.abs(img[k])));
    expect(maxErr).toBeLessThan(1e-9);
    // FFT of a delta is flat (|.| = 1); Parseval
    const b = new Float64Array(32); b[0] = 1; fft(b, false);
    for (let i = 0; i < 16; i += 1) expect(Math.hypot(b[2 * i], b[2 * i + 1])).toBeCloseTo(1, 9);
  });

  it('pure precession conserves |M|; relaxation drives Mz to M0 and Mxy to zero', () => {
    const m0 = { mx: 0.6, my: 0.3, mz: 0.2 };
    const r = blochEvolve(m0, 1, Infinity, Infinity, 0.27, 813);   // no relaxation
    expect(mag(r)).toBeCloseTo(mag(m0), 10);                        // |M| conserved
    expect(r.mz).toBeCloseTo(m0.mz, 12);                            // Mz untouched
    expect(Math.hypot(r.mx, r.my)).toBeCloseTo(Math.hypot(m0.mx, m0.my), 10); // |Mxy| const
    const relax = blochEvolve({ mx: 1, my: 0, mz: 0 }, 1, 600, 80, 0, 6000);
    expect(relax.mz).toBeCloseTo(1, 3);                             // Mz -> M0
    expect(relax.mx).toBeLessThan(1e-3);                            // Mxy -> 0
    // analytic decay law
    const d = blochEvolve({ mx: 1, my: 0, mz: 0 }, 1, 1e9, 100, 0, 100);
    expect(Math.hypot(d.mx, d.my)).toBeCloseTo(Math.exp(-1), 9);    // e^{-t/T2}
  });

  it('the spin-echo signal equation has the right monotonicity and limits', () => {
    expect(seSignal(1, 600, 80, 1e7, 0)).toBeCloseTo(1, 6);          // TR>>T1, TE=0 -> rho
    expect(seSignal(1, 600, 80, 1e7, 80)).toBeCloseTo(Math.exp(-1), 6); // -> rho e^{-TE/T2}
    expect(seSignal(1, 600, 80, 500, 30)).toBeLessThan(seSignal(1, 600, 80, 3000, 30)); // up in TR
    expect(seSignal(1, 600, 80, 2000, 90)).toBeLessThan(seSignal(1, 600, 80, 2000, 20)); // down in TE
    expect(seSignal(2, 600, 80, 2000, 30)).toBeCloseTo(2 * seSignal(1, 600, 80, 2000, 30), 9); // linear in rho
  });

  it('the spoiled gradient echo is maximised at the Ernst angle', () => {
    const T1 = 600, TR = 30;
    const ea = ernstAngle(T1, TR);
    let bestF = 0, bestS = -1;
    for (let d = 1; d < 90; d += 1) {
      const s = greSignal(1, T1, 50, TR, 5, d * Math.PI / 180);
      if (s > bestS) { bestS = s; bestF = d * Math.PI / 180; }
    }
    expect(bestF).toBeCloseTo(ea, 1);
    expect(ernstAngle(600, 1e7)).toBeCloseTo(Math.PI / 2, 2);        // TR>>T1 -> 90 deg
  });

  it('T1- and T2-weighting invert the tissue contrast order', () => {
    const sig = (x, TR, TE) => seSignal(TISSUES[x].rho, TISSUES[x].T1, TISSUES[x].T2, TR, TE);
    const t2w = ['csf', 'gm', 'wm'].map((x) => sig(x, 4000, 100));
    const t1w = ['csf', 'gm', 'wm'].map((x) => sig(x, 500, 15));
    expect(t2w[0]).toBe(Math.max(...t2w));                           // CSF brightest on T2w
    expect(t1w[0]).toBe(Math.min(...t1w));                           // CSF darkest on T1w
  });

  it('the FID and its spectrum are a decaying sinusoid and a peak', () => {
    const f = fid(1, 50, 0.4, 256, 0.5);
    expect(Math.hypot(f.re[0], f.im[0])).toBeCloseTo(1, 9);          // |M(0)| = A
    expect(Math.hypot(f.re[255], f.im[255])).toBeLessThan(Math.hypot(f.re[0], f.im[0]));
    const sp = spectrum(f);
    let im = 0;
    for (let k = 1; k < sp.length; k += 1) if (sp[k] > sp[im]) im = k;
    expect(sp[im]).toBeGreaterThan(0);                               // a finite peak
    expect(sp.reduce((s, v) => s + v, 0)).toBeGreaterThan(0);
  });

  it('partial k-space (low-pass) blurs the image versus the full reconstruction', () => {
    const N = 64, ph = brainPhantom(N), img = mrImage(ph, N, 'se', 3000, 90);
    const kb = imageToK(img, N);
    const full = reconFromK(kb, N, 1);
    const low = reconFromK(kb, N, 0.18);
    // total energy is reduced when high-k is discarded (Parseval)
    const en = (a) => a.reduce((s, v) => s + v * v, 0);
    expect(en(low)).toBeLessThan(en(full) + 1e-6);
    let diff = 0;
    for (let k = 0; k < N * N; k += 1) diff += Math.abs(low[k] - full[k]);
    expect(diff).toBeGreaterThan(1e-3);                              // measurably different
  });

  it('deterministic: identical inputs reproduce signals and reconstruction', () => {
    expect(seSignal(0.7, 900, 90, 2500, 40)).toBe(seSignal(0.7, 900, 90, 2500, 40));
    const N = 64, ph = brainPhantom(N);
    const a = reconFromK(imageToK(mrImage(ph, N, 'gre', 30, 5, 0.3), N), N, 1);
    const b = reconFromK(imageToK(mrImage(ph, N, 'gre', 30, 5, 0.3), N), N, 1);
    expect(a[2000]).toBe(b[2000]);
  });
});
