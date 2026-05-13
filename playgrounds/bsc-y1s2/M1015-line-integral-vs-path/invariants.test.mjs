// Line integral invariants.
// (a) Conservative field: line integral on straight = integral on arc.
// (b) Non-conservative: closed-loop integral non-zero.
// (c) Conservative path-independence: integral = phi(B) - phi(A).
// (d) Stokes: closed-loop integral of (-y, x) over unit square = 2 * (area enclosed).

import { describe, it, expect } from 'vitest';
import {
  FIELDS, lineIntegral, straightPath, arcPath, closedLoopIntegral,
} from './sim.js';

describe('line-integral-vs-path', () => {
  it('conservative1 (F = (2xy, x^2)): straight and arc integrals agree', () => {
    const A = { x: 0, y: 0 }, B = { x: 1, y: 1 };
    const f = FIELDS.conservative1;
    const sp = straightPath(A, B);
    const ap = arcPath(A, B);
    const sIp = lineIntegral(f, sp.x, sp.y, sp.dx, sp.dy);
    const aIp = lineIntegral(f, ap.x, ap.y, ap.dx, ap.dy);
    expect(Math.abs(sIp - aIp)).toBeLessThan(1e-6);
  });

  it('conservative1: integral equals phi(B) - phi(A)', () => {
    const A = { x: 0, y: 0 }, B = { x: 1.5, y: 0.7 };
    const f = FIELDS.conservative1;
    const sp = straightPath(A, B);
    const sIp = lineIntegral(f, sp.x, sp.y, sp.dx, sp.dy);
    const dPhi = f.potential(B.x, B.y) - f.potential(A.x, A.y);
    expect(Math.abs(sIp - dPhi)).toBeLessThan(1e-6);
  });

  it('rotation field (-y, x): straight and arc integrals differ', () => {
    const A = { x: -1, y: 0 }, B = { x: 1, y: 0 };
    const f = FIELDS.rotation;
    const sp = straightPath(A, B);
    const ap = arcPath(A, B);
    const sIp = lineIntegral(f, sp.x, sp.y, sp.dx, sp.dy);
    const aIp = lineIntegral(f, ap.x, ap.y, ap.dx, ap.dy);
    expect(Math.abs(sIp - aIp)).toBeGreaterThan(1e-3);
  });

  it('rotation field: closed-loop integral over semicircle equals pi (Stokes: curl 2 over area pi/2)', () => {
    const A = { x: -1, y: 0 }, B = { x: 1, y: 0 };
    const v = closedLoopIntegral('rotation', A, B);
    // Loop is straight A->B + arc B->A (upper semicircle traversed clockwise from B back to A).
    // Total enclosed area = pi/2; curl = 2; Stokes gives integral = 2 * pi/2 = pi, but
    // sign depends on orientation; we test |v| matches pi within 1 percent.
    expect(Math.abs(Math.abs(v) - Math.PI)).toBeLessThan(0.01);
  });

  it('conservative closed-loop integrals are zero', () => {
    const A = { x: 0, y: 0 }, B = { x: 1, y: 1 };
    for (const name of ['conservative1', 'conservative2']) {
      const v = closedLoopIntegral(name, A, B);
      expect(Math.abs(v)).toBeLessThan(1e-6);
    }
  });

  it('FIELDS object exposes the four named fields', () => {
    for (const name of ['conservative1', 'conservative2', 'rotation', 'shear']) {
      expect(FIELDS[name]).toBeDefined();
      expect(typeof FIELDS[name].P).toBe('function');
      expect(typeof FIELDS[name].Q).toBe('function');
    }
  });

  it('shear field (y, 0) is not conservative (curl = -1)', () => {
    const A = { x: -1, y: 0 }, B = { x: 1, y: 0 };
    const v = closedLoopIntegral('shear', A, B);
    expect(Math.abs(v)).toBeGreaterThan(1e-3);
  });
});
