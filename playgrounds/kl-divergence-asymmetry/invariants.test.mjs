// KL-divergence asymmetry invariant tests.
// (a) D(P||P) = 0 (Gibbs).
// (b) D(P||Q) >= 0 always.
// (c) Asymmetry: there exist P, Q with D(P||Q) != D(Q||P).
// (d) Forward KL minimizer (mass-covering Q) has wider sigma than reverse
//     KL minimizer (mode-seeking) for a bimodal P with separation 2.
// (e) Reverse KL minimizer mu is near +sep or -sep (one of the modes).
// (f) Two same Gaussians: D = 0 exactly.

import { describe, it, expect } from 'vitest';
import { pBimodal, qGaussian, klPQ, klQP, findArgmins } from './sim.js';

describe('KL: Gibbs inequality', () => {
  it('D(P || P) = 0 for any P', () => {
    const { p } = pBimodal({ mu1: -2, mu2: 2 });
    expect(klPQ(p, p)).toBeCloseTo(0, 6);
  });

  it('D(P || Q) >= 0 for many random Gaussian Q', () => {
    const { p } = pBimodal({ mu1: -2, mu2: 2 });
    for (const mu of [-3, -1, 0, 1, 3]) {
      for (const sigma of [0.6, 1.5, 3.0]) {
        const { q } = qGaussian({ mu, sigma });
        expect(klPQ(p, q)).toBeGreaterThanOrEqual(-1e-12);
        expect(klQP(p, q)).toBeGreaterThanOrEqual(-1e-12);
      }
    }
  });
});

describe('KL: same Gaussian', () => {
  it('D(N(0,1) || N(0,1)) = 0', () => {
    const { q: q1 } = qGaussian({ mu: 0, sigma: 1 });
    expect(klPQ(q1, q1)).toBeCloseTo(0, 8);
  });

  it('D(N(0,1) || N(1,1)) = 0.5 (analytic Gaussian KL)', () => {
    const { q: q1 } = qGaussian({ mu: 0, sigma: 1 });
    const { q: q2 } = qGaussian({ mu: 1, sigma: 1 });
    // Analytic: D = (mu1 - mu2)^2 / (2 sigma2^2) + 0.5 (sigma1^2 / sigma2^2 - 1 - log(sigma1^2/sigma2^2))
    // For (mu, sigma) = (0,1) and (1,1): D = 0.5.
    expect(klPQ(q1, q2)).toBeCloseTo(0.5, 4);
  });
});

describe('KL: asymmetry', () => {
  it('D(P||Q) != D(Q||P) for asymmetric pair', () => {
    const { p } = pBimodal({ mu1: -2.5, mu2: 2.5 });
    const { q } = qGaussian({ mu: 0, sigma: 1.0 });
    const pq = klPQ(p, q);
    const qp = klQP(p, q);
    expect(Math.abs(pq - qp)).toBeGreaterThan(0.1);
  });
});

describe('KL: mass-covering vs mode-seeking on bimodal P', () => {
  it('forward-KL argmin has larger sigma than reverse-KL argmin', () => {
    const { p } = pBimodal({ mu1: -2.0, mu2: 2.0 });
    const { argminPQ, argminQP } = findArgmins({ p });
    expect(argminPQ.sigma).toBeGreaterThan(argminQP.sigma);
  });

  it('reverse-KL argmin mu near one of the modes (|mu| in [1.5, 2.5])', () => {
    const { p } = pBimodal({ mu1: -2.0, mu2: 2.0 });
    const { argminQP } = findArgmins({ p });
    expect(Math.abs(argminQP.mu)).toBeGreaterThan(1.5);
    expect(Math.abs(argminQP.mu)).toBeLessThan(2.5);
  });

  it('forward-KL argmin mu near 0 (covers both modes)', () => {
    const { p } = pBimodal({ mu1: -2.0, mu2: 2.0 });
    const { argminPQ } = findArgmins({ p });
    expect(Math.abs(argminPQ.mu)).toBeLessThan(0.5);
  });
});
