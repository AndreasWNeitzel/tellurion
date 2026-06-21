// Invariants for the divergence theorem: flux through the circle equals the
// area integral of the divergence (smooth fields), plus the known closed forms
// and the point-source Gauss behaviour.

import { describe, it, expect } from 'vitest';
import { FIELDS, fluxCircle, divIntegralCircle, enclosesOrigin } from './sim.js';

describe('The divergence theorem holds for smooth fields', () => {
  for (const key of ['source', 'varying', 'rotation', 'saddle']) {
    it(`${key}: flux equals the area integral of div for several circles`, () => {
      const f = FIELDS[key];
      for (const [cx, cy, R] of [[0, 0, 1], [0.7, -0.3, 0.6], [-0.5, 0.4, 1.2]]) {
        const flux = fluxCircle(f, cx, cy, R);
        const area = divIntegralCircle(f, cx, cy, R);
        expect(flux).toBeCloseTo(area, 1);
      }
    });
  }
});

describe('Known closed forms', () => {
  it('radial source: flux = 2 * area = 2 pi R^2', () => {
    expect(fluxCircle(FIELDS.source, 0, 0, 1.3)).toBeCloseTo(2 * Math.PI * 1.3 * 1.3, 3);
  });
  it('rotation has zero flux through any circle', () => {
    expect(fluxCircle(FIELDS.rotation, 0.4, -0.2, 0.9)).toBeCloseTo(0, 6);
  });
  it('source-and-sink (x,-y) has zero net flux (divergence is zero)', () => {
    expect(fluxCircle(FIELDS.saddle, 0.3, 0.5, 0.8)).toBeCloseTo(0, 6);
  });
});

describe('Point source: the Gauss analogy', () => {
  it('flux is 2 pi when the origin is enclosed, regardless of radius', () => {
    expect(enclosesOrigin(0, 0, 1)).toBe(true);
    expect(fluxCircle(FIELDS.point, 0, 0, 0.5)).toBeCloseTo(2 * Math.PI, 4);
    expect(fluxCircle(FIELDS.point, 0, 0, 2.0)).toBeCloseTo(2 * Math.PI, 4);
    expect(fluxCircle(FIELDS.point, 0.3, 0.2, 1.5)).toBeCloseTo(2 * Math.PI, 3);   // origin inside
  });
  it('flux is 0 when the origin is outside the circle', () => {
    expect(enclosesOrigin(3, 0, 1)).toBe(false);
    expect(fluxCircle(FIELDS.point, 3, 0, 1)).toBeCloseTo(0, 4);
  });
});
