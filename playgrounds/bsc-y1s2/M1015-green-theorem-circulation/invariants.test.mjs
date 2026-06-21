// Invariants for Green's theorem (circulation form): circulation equals the area
// integral of the curl, plus the known closed forms and the point-vortex Stokes
// behaviour.

import { describe, it, expect } from 'vitest';
import { FIELDS, circulationCircle, curlIntegralCircle, enclosesOrigin } from './sim.js';

describe('Green theorem holds for smooth fields', () => {
  for (const key of ['vortex', 'varying', 'source', 'shear']) {
    it(`${key}: circulation equals the area integral of curl`, () => {
      const f = FIELDS[key];
      for (const [cx, cy, R] of [[0, 0, 1], [0.7, -0.3, 0.6], [-0.5, 0.4, 1.2]]) {
        expect(circulationCircle(f, cx, cy, R)).toBeCloseTo(curlIntegralCircle(f, cx, cy, R), 1);
      }
    });
  }
});

describe('Known closed forms', () => {
  it('rotation: circulation = 2 * area = 2 pi R^2', () => {
    expect(circulationCircle(FIELDS.vortex, 0, 0, 1.3)).toBeCloseTo(2 * Math.PI * 1.3 * 1.3, 3);
  });
  it('irrotational source has zero circulation', () => {
    expect(circulationCircle(FIELDS.source, 0.4, -0.2, 0.9)).toBeCloseTo(0, 6);
  });
  it('shear has circulation = -area', () => {
    expect(circulationCircle(FIELDS.shear, 0.3, 0.1, 0.8)).toBeCloseTo(-Math.PI * 0.8 * 0.8, 3);
  });
});

describe('Point vortex: the Stokes/Ampere analogy', () => {
  it('circulation is 2 pi when the vortex is enclosed, regardless of radius', () => {
    expect(enclosesOrigin(0, 0, 1)).toBe(true);
    expect(circulationCircle(FIELDS.pointvortex, 0, 0, 0.5)).toBeCloseTo(2 * Math.PI, 4);
    expect(circulationCircle(FIELDS.pointvortex, 0, 0, 2.0)).toBeCloseTo(2 * Math.PI, 4);
    expect(circulationCircle(FIELDS.pointvortex, 0.3, 0.2, 1.5)).toBeCloseTo(2 * Math.PI, 3);
  });
  it('circulation is 0 when the vortex is outside the circle', () => {
    expect(enclosesOrigin(3, 0, 1)).toBe(false);
    expect(circulationCircle(FIELDS.pointvortex, 3, 0, 1)).toBeCloseTo(0, 4);
  });
});
