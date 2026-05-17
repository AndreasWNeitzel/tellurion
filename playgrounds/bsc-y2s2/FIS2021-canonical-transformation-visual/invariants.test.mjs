// Canonical transformations: {Q,P} = 1 for the canonical maps and
// != 1 for the contrast map, phase-area preservation, the HO
// ellipse mapping to a circle of the same area, the symplectic
// condition M^T J M = J for the linear maps, composition/inverse
// closure, and the canonical-but-not-symmetry distinction.

import { describe, it, expect } from 'vitest';
import {
  MAPS, mapApply, poissonBracket, linMatrix, symplecticForm,
  polyArea, hoEllipse, isCircle, hamiltonianHO,
} from './sim.js';

const close = (a, b, t = 1e-10) => expect(Math.abs(a - b)).toBeLessThan(t);

describe('canonical-transformation-visual invariants', () => {
  it('{Q,P} = 1 for the canonical maps, != 1 for p-doubling', () => {
    const pts = [[0.3, -0.7], [1.2, 0.4], [-0.8, 1.1], [2.0, -1.5]];
    for (const [q, p] of pts) {
      close(poissonBracket('identity', q, p), 1, 1e-12);
      close(poissonBracket('hoScale', q, p, { w: 1.7 }), 1, 1e-10);
      close(poissonBracket('rotation', q, p, { a: 0.9 }), 1, 1e-12);
      close(poissonBracket('squeeze', q, p, { lam: 1.6 }), 1, 1e-12);
      close(poissonBracket('point', q, p), 1, 1e-10);
    }
    close(poissonBracket('pDouble', 1, 1), 2, 1e-12);     // not canonical
    expect(MAPS.pDouble.canonical).toBe(false);
  });

  it('canonical maps preserve phase-space area', () => {
    const shape = hoEllipse(1.0, 1.3, 240);
    const A0 = Math.abs(polyArea(shape));
    for (const [name, par] of [['identity', {}], ['hoScale', { w: 1.7 }],
      ['rotation', { a: 0.7 }], ['squeeze', { lam: 1.9 }], ['point', {}]]) {
      const img = shape.map(([q, p]) => mapApply(name, q, p, par));
      expect(Math.abs(Math.abs(polyArea(img)) - A0) / A0).toBeLessThan(2e-3);
    }
    // p-doubling doubles the area
    const dbl = shape.map(([q, p]) => mapApply('pDouble', q, p));
    expect(Math.abs(polyArea(dbl)) / A0).toBeCloseTo(2, 2);
  });

  it('the HO ellipse maps to a circle of the same area', () => {
    const E = 1.2, w = 1.8;
    const ell = hoEllipse(E, w, 360);
    expect(isCircle(ell, 1e-6)).toBe(false);              // it is an ellipse
    const img = ell.map(([q, p]) => mapApply('hoScale', q, p, { w }));
    expect(isCircle(img, 1e-6)).toBe(true);               // becomes a circle
    close(Math.abs(polyArea(img)), Math.abs(polyArea(ell)), 1e-6);
    // the circle radius is sqrt(2E/w) = sqrt(2J), area pi*2E/w = 2 pi J
    let cmax = 0; for (const [x, y] of img) cmax = Math.max(cmax, Math.hypot(x, y));
    expect(Math.abs(cmax - Math.sqrt(2 * E / w))).toBeLessThan(1e-6);
  });

  it('linear canonical maps satisfy M^T J M = J', () => {
    for (const [name, par] of [['identity', {}], ['rotation', { a: 1.2 }],
      ['squeeze', { lam: 1.4 }], ['hoScale', { w: 0.6 }]]) {
      const s = symplecticForm(linMatrix(name, par));
      close(s[0][0], 0, 1e-12); close(s[0][1], 1, 1e-12);
      close(s[1][0], -1, 1e-12); close(s[1][1], 0, 1e-12);
    }
    // p-doubling fails it (M^T J M = 2 J)
    const bad = symplecticForm(linMatrix('pDouble'));
    close(bad[0][1], 2, 1e-12);
  });

  it('composition and inverse of canonical maps stay canonical', () => {
    // rotation(a) then squeeze(lam): det of product Jacobians = 1
    const A = linMatrix('rotation', { a: 0.5 }), B = linMatrix('squeeze', { lam: 1.7 });
    const C = [[B[0][0] * A[0][0] + B[0][1] * A[1][0], B[0][0] * A[0][1] + B[0][1] * A[1][1]],
      [B[1][0] * A[0][0] + B[1][1] * A[1][0], B[1][0] * A[0][1] + B[1][1] * A[1][1]]];
    close(C[0][0] * C[1][1] - C[0][1] * C[1][0], 1, 1e-12);
    // inverse rotation is rotation(-a) -> det 1
    const inv = linMatrix('rotation', { a: -0.5 });
    close(inv[0][0] * inv[1][1] - inv[0][1] * inv[1][0], 1, 1e-12);
  });

  it('canonical is not the same as a symmetry: rotation keeps H, squeeze does not', () => {
    const q = 1.0, p = 0.4, H0 = hamiltonianHO(q, p);     // isotropic HO
    const [Qr, Pr] = mapApply('rotation', q, p, { a: 0.8 });
    close(hamiltonianHO(Qr, Pr), H0, 1e-12);              // rotation is a symmetry of H
    const [Qs, Ps] = mapApply('squeeze', q, p, { lam: 1.6 });
    expect(Math.abs(hamiltonianHO(Qs, Ps) - H0)).toBeGreaterThan(0.1);
    close(poissonBracket('squeeze', q, p, { lam: 1.6 }), 1, 1e-12);   // yet still canonical
  });

  it('shoelace area is exact for a known ellipse', () => {
    const E = 2, w = 1.5;
    // area of p^2 + w^2 q^2 = 2E is pi * (sqrt(2E)/w) * sqrt(2E)
    const want = Math.PI * (Math.sqrt(2 * E) / w) * Math.sqrt(2 * E);
    expect(Math.abs(Math.abs(polyArea(hoEllipse(E, w, 2000))) - want) / want).toBeLessThan(1e-4);
  });

  it('determinism: identical image from identical input', () => {
    const a = mapApply('point', 0.7, -0.3);
    const b = mapApply('point', 0.7, -0.3);
    expect(a).toEqual(b);
  });
});
