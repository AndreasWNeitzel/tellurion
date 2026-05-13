// Mutual information of a bivariate Gaussian: invariant tests.
// (a) I(X; Y) = -0.5 ln(1 - rho^2) closed form.
// (b) Numerical MI (trapezoidal on a 96x96 grid in [-3.2, 3.2]^2) matches
//     analytic to within 1.5 percent for |rho| in [0, 0.85] and unit
//     sigmas.
// (c) Marginal pdfs integrate to 1 within 1 percent.
// (d) Marginal entropies match the Gaussian formula.

import { describe, it, expect } from 'vitest';
import {
  sample2DGaussianPdf, marginalX, marginalY, miAnalytic, miNumeric, entropy1D,
} from './sim.js';

describe('MI 2D Gaussian: closed-form properties', () => {
  it('I = 0 when rho = 0', () => {
    expect(Math.abs(miAnalytic(0))).toBe(0);
  });

  it('I is symmetric in sign of rho', () => {
    expect(miAnalytic(0.5)).toBeCloseTo(miAnalytic(-0.5), 12);
  });

  it('I monotonically increases with |rho|', () => {
    const rhos = [0.0, 0.2, 0.4, 0.6, 0.8, 0.95];
    for (let i = 1; i < rhos.length; i += 1) {
      expect(miAnalytic(rhos[i])).toBeGreaterThan(miAnalytic(rhos[i - 1]));
    }
  });
});

describe('MI 2D Gaussian: numerical = analytic at grid 96, span 3.2', () => {
  for (const rho of [0.0, 0.3, 0.6, 0.85]) {
    it(`rho = ${rho}: numeric within 3 percent of -0.5 ln(1 - rho^2)`, () => {
      const joint = sample2DGaussianPdf({ rho, sigmaX: 1, sigmaY: 1, gridN: 96, span: 3.2 });
      const I_num = miNumeric(joint);
      const I_th  = miAnalytic(rho);
      if (rho === 0) {
        expect(Math.abs(I_num)).toBeLessThan(0.01);
      } else {
        expect(Math.abs(I_num - I_th) / I_th).toBeLessThan(0.03);
      }
    });
  }
});

describe('MI 2D Gaussian: marginals normalize', () => {
  it('integral of p(x) is within 1 percent of 1 for rho = 0.6', () => {
    const joint = sample2DGaussianPdf({ rho: 0.6, sigmaX: 1, sigmaY: 1, gridN: 96, span: 3.2 });
    const px = marginalX(joint);
    const dx = (2 * joint.span) / (joint.N - 1);
    let s = 0;
    for (let i = 0; i < px.length; i += 1) s += px[i] * dx;
    expect(Math.abs(s - 1)).toBeLessThan(0.01);
  });

  it('integral of p(y) is within 1 percent of 1 for rho = 0.6', () => {
    const joint = sample2DGaussianPdf({ rho: 0.6, sigmaX: 1, sigmaY: 1, gridN: 96, span: 3.2 });
    const py = marginalY(joint);
    const dy = (2 * joint.span) / (joint.N - 1);
    let s = 0;
    for (let i = 0; i < py.length; i += 1) s += py[i] * dy;
    expect(Math.abs(s - 1)).toBeLessThan(0.01);
  });
});

describe('MI 2D Gaussian: marginal entropy matches Gaussian formula', () => {
  it('H(X) within 2 percent of 0.5 ln(2 pi e sigma_x^2)', () => {
    const joint = sample2DGaussianPdf({ rho: 0.6, sigmaX: 1, sigmaY: 1.2, gridN: 96, span: 3.5 });
    const Hx = entropy1D(marginalX(joint), joint.span);
    const Hy = entropy1D(marginalY(joint), joint.span);
    const HxTrue = 0.5 * Math.log(2 * Math.PI * Math.E);
    const HyTrue = 0.5 * Math.log(2 * Math.PI * Math.E * 1.44);
    expect(Math.abs(Hx - HxTrue) / HxTrue).toBeLessThan(0.02);
    expect(Math.abs(Hy - HyTrue) / HyTrue).toBeLessThan(0.02);
  });
});
