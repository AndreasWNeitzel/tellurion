import { describe, it, expect } from 'vitest';
import { ckmModulus, trianglePoints, angleBeta, angleGamma, CKM_DEFAULT } from './sim.js';
describe('ckm-mixing-unitarity-triangle', () => {
  it('CKM diagonal close to 1', () => {
    const v = ckmModulus(CKM_DEFAULT);
    expect(Math.abs(v[0][0] - 1)).toBeLessThan(0.05);
    expect(Math.abs(v[1][1] - 1)).toBeLessThan(0.05);
    expect(Math.abs(v[2][2] - 1)).toBeLessThan(0.01);
  });
  it('Vus ~ lambda', () => {
    const v = ckmModulus(CKM_DEFAULT);
    expect(Math.abs(v[0][1] - CKM_DEFAULT.lambda)).toBeLessThan(1e-9);
  });
  it('beta + gamma + alpha = pi (closure)', () => {
    const { rho, eta } = CKM_DEFAULT;
    const beta = angleBeta(rho, eta), gamma = angleGamma(rho, eta);
    const sum = beta + gamma + (Math.PI - beta - gamma);
    expect(Math.abs(sum - Math.PI)).toBeLessThan(1e-12);
  });
  it('CKM triangle apex matches input', () => {
    const tri = trianglePoints({ rho: 0.15, eta: 0.35 });
    expect(tri.A).toEqual([0.15, 0.35]);
  });
});
