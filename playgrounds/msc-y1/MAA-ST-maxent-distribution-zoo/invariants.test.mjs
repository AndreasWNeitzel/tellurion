// Max-entropy zoo invariant tests.
// Each family has an analytic entropy formula and a constraint summary;
// we verify the analytic formula on a few points and that the numerical
// integration matches it to a few percent.

import { describe, it, expect } from 'vitest';
import { pdf, analyticEntropy, numericEntropy, gridX, structuredPdf, sampleFamily } from './sim.js';

describe('Maxent: Gaussian', () => {
  it('h(N(0,1)) = 0.5 ln(2 pi e)', () => {
    expect(analyticEntropy('gaussian', { mu: 0, sigma: 1 })).toBeCloseTo(0.5 * Math.log(2 * Math.PI * Math.E), 12);
  });
  it('numerical h matches analytic within 1 percent', () => {
    const xs = gridX('gaussian');
    const p = pdf('gaussian', { mu: 0, sigma: 1 }, xs);
    const hAnalytic = analyticEntropy('gaussian', { mu: 0, sigma: 1 });
    const hNumeric = numericEntropy(p, xs);
    expect(Math.abs(hAnalytic - hNumeric) / hAnalytic).toBeLessThan(0.01);
  });
});

describe('Maxent: Uniform', () => {
  it('h(U(a, b)) = ln(b - a)', () => {
    expect(analyticEntropy('uniform', { a: -1, b: 1 })).toBeCloseTo(Math.log(2), 12);
    expect(analyticEntropy('uniform', { a: 0, b: 4 })).toBeCloseTo(Math.log(4), 12);
  });
  it('numerical h matches within 1 percent for support [-2, 2]', () => {
    const xs = gridX('uniform');
    const p = pdf('uniform', { a: -2, b: 2 }, xs);
    const hAnalytic = analyticEntropy('uniform', { a: -2, b: 2 });
    const hNumeric = numericEntropy(p, xs);
    expect(Math.abs(hAnalytic - hNumeric) / hAnalytic).toBeLessThan(0.01);
  });
});

describe('Maxent: Exponential', () => {
  it('h(Exp(lambda)) = 1 + ln(mean)', () => {
    expect(analyticEntropy('exponential', { mean: 1 })).toBeCloseTo(1, 12);
    expect(analyticEntropy('exponential', { mean: Math.E })).toBeCloseTo(2, 12);
  });
  it('numerical h matches within 5 percent (long tail truncation)', () => {
    const xs = gridX('exponential');
    const p = pdf('exponential', { mean: 1 }, xs);
    const hAnalytic = analyticEntropy('exponential', { mean: 1 });
    const hNumeric = numericEntropy(p, xs);
    expect(Math.abs(hAnalytic - hNumeric)).toBeLessThan(0.05);
  });
});

describe('Maxent: Laplace', () => {
  it('h(Laplace(mu, b)) = 1 + ln(2b)', () => {
    expect(analyticEntropy('laplace', { mu: 0, b: 1 })).toBeCloseTo(1 + Math.log(2), 12);
  });
  it('numerical h matches within 2 percent (cusp at mu makes Riemann sum slow)', () => {
    const xs = gridX('laplace');
    const p = pdf('laplace', { mu: 0, b: 1 }, xs);
    const hAnalytic = analyticEntropy('laplace', { mu: 0, b: 1 });
    const hNumeric = numericEntropy(p, xs);
    expect(Math.abs(hAnalytic - hNumeric) / hAnalytic).toBeLessThan(0.02);
  });
});

describe('Maxent: the principle (structure lowers entropy)', () => {
  const cfg = {
    gaussian: { mu: 0, sigma: 1 }, uniform: { a: -2, b: 2 },
    exponential: { mean: 1 }, laplace: { mu: 0, b: 1 },
  };
  for (const fam of ['gaussian', 'uniform', 'exponential', 'laplace']) {
    it(`${fam}: any imposed structure has strictly lower entropy`, () => {
      const xs = gridX(fam), pm = cfg[fam];
      const hMax = numericEntropy(pdf(fam, pm, xs), xs);
      let prev = hMax;
      for (const s of [0.3, 0.6, 0.9]) {
        const h = numericEntropy(structuredPdf(fam, pm, xs, s), xs);
        expect(h).toBeLessThan(hMax);
        expect(h).toBeLessThan(prev + 1e-9);   // monotone non-increasing in s
        prev = h;
      }
    });
    it(`${fam}: structuredPdf stays a normalised density`, () => {
      const xs = gridX(fam), dx = xs[1] - xs[0];
      const q = structuredPdf(fam, cfg[fam], xs, 0.7);
      let s = 0; for (let i = 0; i < q.length; i += 1) { expect(q[i]).toBeGreaterThanOrEqual(0); s += q[i] * dx; }
      expect(Math.abs(s - 1)).toBeLessThan(0.02);
    });
  }
  it('sampleFamily reproduces the constraint mean (seeded)', () => {
    const g = sampleFamily('gaussian', { mu: 0.5, sigma: 1 }, 20000, 0xC0FFEE);
    let m = 0; for (const v of g) m += v; m /= g.length;
    expect(Math.abs(m - 0.5)).toBeLessThan(0.05);
    const e = sampleFamily('exponential', { mean: 2 }, 20000, 0xBEEF);
    let me = 0; for (const v of e) me += v; me /= e.length;
    expect(Math.abs(me - 2)).toBeLessThan(0.1);
  });
});

describe('Maxent: pdf integrates to 1', () => {
  for (const fam of ['gaussian', 'uniform', 'exponential', 'laplace']) {
    it(`${fam} pdf integrates to 1 within 2 percent`, () => {
      const xs = gridX(fam);
      const params = fam === 'gaussian' ? { mu: 0, sigma: 1 }
                   : fam === 'uniform' ? { a: -2, b: 2 }
                   : fam === 'exponential' ? { mean: 1 }
                   : { mu: 0, b: 1 };
      const p = pdf(fam, params, xs);
      const dx = xs[1] - xs[0];
      let s = 0;
      for (let i = 0; i < p.length; i += 1) s += p[i] * dx;
      expect(Math.abs(s - 1)).toBeLessThan(0.02);
    });
  }
});
