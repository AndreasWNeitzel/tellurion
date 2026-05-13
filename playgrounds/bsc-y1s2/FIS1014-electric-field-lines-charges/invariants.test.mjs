// Electric-field-lines invariant tests.
// (a) Monopole: |E| approaches q / r^2 within 1 percent at r = 5.
// (b) Dipole: at midpoint (0, 0), E is along the axis from +q to -q.
// (c) Two like charges: field at midpoint is zero by symmetry.
// (d) Mono +: field lines from a + charge trace outward radially.
// (e) Quadrupole far field decays faster than monopole.
// (f) E([-q]) = - E([+q]) for any same-position charge.

import { describe, it, expect } from 'vitest';
import { field, traceLine, PRESETS, emissionPoints, BOX } from './sim.js';

describe('Field lines: monopole far field', () => {
  it('|E| approaches q / r^2 within 1 percent at r = 5', () => {
    const charges = PRESETS['mono-plus'];
    const r = 5;
    const { Ex, Ey } = field(r, 0, charges);
    const mag = Math.sqrt(Ex * Ex + Ey * Ey);
    expect(Math.abs(mag - 1 / (r * r))).toBeLessThan(0.01 / (r * r));
  });
});

describe('Field lines: dipole midpoint', () => {
  it('at (0, 0): field is purely along axis +q to -q', () => {
    const charges = PRESETS['dipole'];
    const { Ex, Ey } = field(0, 0, charges);
    expect(Math.abs(Ey)).toBeLessThan(1e-12);
    expect(Ex).toBeGreaterThan(0);
  });
});

describe('Field lines: two like charges midpoint', () => {
  it('field at (0, 0) is zero by symmetry', () => {
    const charges = PRESETS['two-plus'];
    const { Ex, Ey } = field(0, 0, charges);
    expect(Math.abs(Ex)).toBeLessThan(1e-12);
    expect(Math.abs(Ey)).toBeLessThan(1e-12);
  });
});

describe('Field lines: monopole + radial outflow', () => {
  it('line traced from + charge ends at the bounding box edge', () => {
    const charges = PRESETS['mono-plus'];
    const startR = 0.1;
    const line = traceLine(startR, 0, charges, 1);
    const last = { x: line.xs[line.xs.length - 1], y: line.ys[line.ys.length - 1] };
    expect(Math.abs(last.x)).toBeGreaterThan(BOX - 0.5);
  });
});

describe('Field lines: quadrupole decays faster', () => {
  it('|E_quad| / |E_mono| decreases with r', () => {
    const monoCh = PRESETS['mono-plus'];
    const quadCh = PRESETS['quadrupole'];
    function magAt(r, charges) {
      const { Ex, Ey } = field(r, 0, charges);
      return Math.sqrt(Ex * Ex + Ey * Ey);
    }
    const r1 = 3, r2 = 10;
    const ratio1 = magAt(r1, quadCh) / magAt(r1, monoCh);
    const ratio2 = magAt(r2, quadCh) / magAt(r2, monoCh);
    expect(ratio2).toBeLessThan(ratio1);
  });
});

describe('Field lines: sign reversal', () => {
  it('E([-q at origin]) = -E([+q at origin]) for all points', () => {
    const plusCh  = [{ x: 0, y: 0, q: +1 }];
    const minusCh = [{ x: 0, y: 0, q: -1 }];
    for (let i = 0; i < 10; i += 1) {
      const x = 0.5 + i * 0.2, y = 0.3 + i * 0.1;
      const Ep = field(x, y, plusCh);
      const Em = field(x, y, minusCh);
      expect(Math.abs(Em.Ex + Ep.Ex)).toBeLessThan(1e-12);
      expect(Math.abs(Em.Ey + Ep.Ey)).toBeLessThan(1e-12);
    }
  });
});

describe('Field lines: emission geometry', () => {
  it('emissionPoints places 8 points per charge at distance 0.08', () => {
    const pts = emissionPoints(PRESETS['dipole'], 8);
    expect(pts.length).toBe(16);
    for (const c of PRESETS['dipole']) {
      const near = pts.filter(p => Math.abs((p.x - c.x) ** 2 + (p.y - c.y) ** 2 - 0.08 * 0.08) < 1e-12);
      expect(near.length).toBe(8);
    }
  });
});
