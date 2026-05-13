// Div / curl visualizer invariants.
// (a) source: div = 2 a, curl = 0.
// (b) rotation: div = 0, curl = 2 a.
// (c) shear: div = 0, curl = -a.
// (d) saddle: div = 0, curl = 0.
// (e) Analytic and FD div/curl agree within 1e-8.

import { describe, it, expect } from 'vitest';
import { FAMILIES, divFD, curlFD } from './sim.js';

describe('vector-field-div-curl-visualizer', () => {
  it('source: div = 2 a, curl = 0', () => {
    const f = FAMILIES.source;
    expect(f.div(0.5, 0.5, 1.5)).toBeCloseTo(3.0, 12);
    expect(f.curl(0.5, 0.5, 1.5)).toBe(0);
  });

  it('rotation: div = 0, curl = 2 a', () => {
    const f = FAMILIES.rotation;
    expect(f.div(0.5, 0.5, 1.5)).toBe(0);
    expect(f.curl(0.5, 0.5, 1.5)).toBeCloseTo(3.0, 12);
  });

  it('shear: div = 0, curl = -a', () => {
    const f = FAMILIES.shear;
    expect(f.div(0.5, 0.5, 1.5)).toBe(0);
    expect(f.curl(0.5, 0.5, 1.5)).toBeCloseTo(-1.5, 12);
  });

  it('saddle: div = 0, curl = 0', () => {
    const f = FAMILIES.saddle;
    expect(f.div(0.5, 0.5, 1.5)).toBe(0);
    expect(f.curl(0.5, 0.5, 1.5)).toBe(0);
  });

  it('analytic and FD div agree', () => {
    for (const [name, f] of Object.entries(FAMILIES)) {
      const x = 0.7, y = -0.3, a = 1.2;
      const fdv = divFD(f.P, f.Q, x, y, a);
      expect(Math.abs(fdv - f.div(x, y, a))).toBeLessThan(1e-8);
    }
  });

  it('analytic and FD curl agree', () => {
    for (const [name, f] of Object.entries(FAMILIES)) {
      const x = 0.7, y = -0.3, a = 1.2;
      const fdc = curlFD(f.P, f.Q, x, y, a);
      expect(Math.abs(fdc - f.curl(x, y, a))).toBeLessThan(1e-8);
    }
  });

  it('FAMILIES exposes four named families', () => {
    for (const n of ['source', 'rotation', 'shear', 'saddle']) {
      expect(FAMILIES[n]).toBeDefined();
    }
  });

  it('source div is constant across the field', () => {
    const f = FAMILIES.source;
    expect(f.div(0, 0, 1)).toBe(f.div(1, 1, 1));
    expect(f.div(-2, 0.3, 1)).toBe(2);
  });
});
