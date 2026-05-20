import { describe, it, expect } from 'vitest';
import {
  mJValues, deflection, quantumDensity, classicalDensity,
  sequentialProbabilityUp, sequentialProbabilityDown, bField, J_OPTIONS,
} from './sim.js';

describe('stern-gerlach-spin-quantization-3d', () => {
  it('spin-1/2 has 2 allowed m_J values', () => {
    expect(mJValues(0.5)).toEqual([-0.5, 0.5]);
  });

  it('spin-1 has 3 allowed m_J values: -1, 0, +1', () => {
    expect(mJValues(1)).toEqual([-1, 0, 1]);
  });

  it('spin-3/2 has 4 allowed m_J values', () => {
    expect(mJValues(1.5)).toEqual([-1.5, -0.5, 0.5, 1.5]);
  });

  it('total m_J count is 2J+1', () => {
    for (const { J } of J_OPTIONS) {
      expect(mJValues(J).length).toBe(Math.round(2 * J + 1));
    }
  });

  it('m_J values are symmetric about zero', () => {
    for (const J of [0.5, 1, 1.5, 2]) {
      const ms = mJValues(J);
      let sum = 0;
      for (const m of ms) sum += m;
      expect(Math.abs(sum)).toBeLessThan(1e-9);
    }
  });

  it('deflection is linear in m_J at fixed gradient', () => {
    expect(deflection(2, 0.1)).toBeCloseTo(2 * deflection(1, 0.1), 9);
  });

  it('deflection is linear in gradient at fixed m_J', () => {
    expect(deflection(0.5, 0.2)).toBeCloseTo(2 * deflection(0.5, 0.1), 9);
  });

  it('classical density is uniform on [-J*dBdz, +J*dBdz]', () => {
    const J = 1, g = 0.2;
    expect(classicalDensity(0, g, J)).toBeCloseTo(classicalDensity(0.1, g, J), 9);
    expect(classicalDensity(J * g + 0.01, g, J)).toBe(0);
    expect(classicalDensity(-J * g - 0.01, g, J)).toBe(0);
  });

  it('classical density integrates to ~1', () => {
    const J = 1, g = 0.2;
    let integ = 0;
    const dz = 0.001;
    for (let z = -1; z < 1; z += dz) integ += classicalDensity(z, g, J) * dz;
    expect(integ).toBeCloseTo(1, 2);
  });

  it('quantum density peaks at z = m_J * dBdz for each m_J', () => {
    const J = 1, g = 0.3, sigma = 0.01;
    for (const m of mJValues(J)) {
      const z = m * g;
      // dense peak at z
      const peak = quantumDensity(z, g, J, sigma);
      const off = quantumDensity(z + 5 * sigma, g, J, sigma);
      expect(peak).toBeGreaterThan(off * 10);
    }
  });

  it('sequential measurement: P(up | rotated by 0) = 1', () => {
    expect(sequentialProbabilityUp(0)).toBeCloseTo(1, 9);
    expect(sequentialProbabilityDown(0)).toBeCloseTo(0, 9);
  });

  it('sequential measurement: P(up | rotated by pi) = 0', () => {
    expect(sequentialProbabilityUp(Math.PI)).toBeCloseTo(0, 9);
    expect(sequentialProbabilityDown(Math.PI)).toBeCloseTo(1, 9);
  });

  it('sequential probabilities sum to 1', () => {
    for (const th of [0, 0.3, 1.0, 1.57, 2.5, Math.PI]) {
      expect(sequentialProbabilityUp(th) + sequentialProbabilityDown(th)).toBeCloseTo(1, 9);
    }
  });

  it('B field divergence is zero', () => {
    // div B = dBx/dx + 0 + dBz/dz = -dBdz + dBdz = 0 (exact)
    const dBdz = 0.4;
    const h = 1e-5;
    const { Bx: bxp } = bField(0.2 + h, 0, 0, 1, dBdz);
    const { Bx: bxm } = bField(0.2 - h, 0, 0, 1, dBdz);
    const { Bz: bzp } = bField(0.2, 0, 0 + h, 1, dBdz);
    const { Bz: bzm } = bField(0.2, 0, 0 - h, 1, dBdz);
    const div = (bxp - bxm) / (2 * h) + (bzp - bzm) / (2 * h);
    expect(Math.abs(div)).toBeLessThan(1e-9);
  });
});
