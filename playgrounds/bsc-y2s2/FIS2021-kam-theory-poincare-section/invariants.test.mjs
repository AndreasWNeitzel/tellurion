// Chirikov standard map: the area-preserving Jacobian (det = 1),
// K = 0 integrability (p conserved, straight lines), exact
// invertibility, the golden-torus KAM transition near K_c ~ 0.9716
// (bounded below, diffusive above), the (pi,0) elliptic island,
// quasilinear diffusion scaling, and determinism.

import { describe, it, expect } from 'vitest';
import {
  KC_GOLDEN, TWO_PI, stdMap, stdMapInverse, jacobianDet, orbit,
  pSpread, diffusionCoeff, quasilinearD, fixedPointTrace, residue,
  rotationNumberK0,
} from './sim.js';

const close = (a, b, t) => expect(Math.abs(a - b)).toBeLessThan(t);

describe('kam-theory-poincare-section invariants', () => {
  it('the map is area-preserving: det J = 1 everywhere', () => {
    for (const K of [0, 0.5, 0.97, 2, 5]) for (const th of [0, 1, 2.5, 4, 6]) {
      close(jacobianDet(th, K), 1, 1e-12);
    }
  });

  it('K = 0: p is conserved and theta advances by p (straight lines)', () => {
    const p0 = 1.3;
    let th = 0.4, p = p0;
    for (let i = 0; i < 500; i += 1) {
      const [t2, p2] = stdMap(th, p, 0);
      close(p2, ((p0 % TWO_PI) + TWO_PI) % TWO_PI, 1e-12);   // p unchanged
      const expTh = ((th + p0) % TWO_PI + TWO_PI) % TWO_PI;
      close(t2, expTh, 1e-12);
      th = t2; p = p2;
    }
    close(rotationNumberK0(1.3), 1.3 / TWO_PI, 1e-12);
  });

  it('the map is exactly invertible', () => {
    for (const K of [0.3, 0.97, 2.4]) {
      for (const [th, p] of [[0.7, 1.1], [2.0, 5.5], [4.3, 0.2]]) {
        const [t2, p2] = stdMap(th, p, K);
        const [tb, pb] = stdMapInverse(t2, p2, K);
        close(tb, ((th % TWO_PI) + TWO_PI) % TWO_PI, 1e-9);
        close(pb, ((p % TWO_PI) + TWO_PI) % TWO_PI, 1e-9);
      }
    }
  });

  it('Greene K_c ~ 0.9716; golden torus bounded below, diffuses above', () => {
    expect(Math.abs(KC_GOLDEN - 0.9716)).toBeLessThan(1e-3);
    // a "golden" rotation-number orbit p0 = 2 pi * (golden mean)
    const golden = (Math.sqrt(5) - 1) / 2;
    const p0 = TWO_PI * golden;
    const below = pSpread(0.1, p0, 0.6, 4000);             // K < K_c
    const above = pSpread(0.1, p0, 2.0, 4000);             // K > K_c
    expect(below).toBeLessThan(2.5);                       // confined to a torus band
    expect(above).toBeGreaterThan(2 * Math.PI);            // diffuses across the cylinder
    expect(above).toBeGreaterThan(below * 3);
  });

  it('K = 0 orbits do not spread (perfect tori)', () => {
    expect(pSpread(0.3, 1.7, 0, 5000)).toBeLessThan(1e-9);
    expect(pSpread(1.0, 4.0, 0, 5000)).toBeLessThan(1e-9);
  });

  it('the (pi, 0) fixed point is an elliptic island for 0 < K < 4', () => {
    // at theta* = pi, cos = -1: tr = 2 - K, residue = K/4
    for (const K of [0.5, 1, 3.5]) {
      close(fixedPointTrace(-1, K), 2 - K, 1e-12);
      close(residue(-1, K), K / 4, 1e-12);
      expect(Math.abs(fixedPointTrace(-1, K))).toBeLessThan(2);   // |tr|<2 elliptic
    }
    expect(Math.abs(fixedPointTrace(-1, 5))).toBeGreaterThan(2);  // K>4 hyperbolic
    // the (0,0) point (cos = +1) is hyperbolic for any K > 0
    expect(fixedPointTrace(1, 0.5)).toBeGreaterThan(2);
  });

  it('diffusion is blocked below K_c and grows at large K', () => {
    // Below K_c invariant tori block global transport: almost no
    // p-diffusion. (Avoid K=3,6 where the Rechester-White Bessel
    // corrections to D(K) are strongly non-monotone.)
    expect(diffusionCoeff(0.3)).toBeLessThan(diffusionCoeff(8));
    expect(diffusionCoeff(0.3)).toBeLessThan(2);           // tori confine p
    const d4 = diffusionCoeff(4), d8 = diffusionCoeff(8);
    expect(d8).toBeGreaterThan(d4);                        // grows at large K
    expect(d4).toBeGreaterThan(5);                         // strongly chaotic
    // the quasilinear leading estimate is exactly K^2/2
    expect(quasilinearD(4)).toBeCloseTo(8, 9);
    expect(quasilinearD(6)).toBeCloseTo(18, 9);
  });

  it('orbit length and wrapping are consistent', () => {
    const o = orbit(0.5, 1.0, 0.9, 300);
    expect(o.length).toBe(301);
    for (const [th, p] of o) { expect(th).toBeGreaterThanOrEqual(0); expect(th).toBeLessThan(TWO_PI + 1e-9); }
  });

  it('determinism: identical orbit from identical seed point', () => {
    const a = orbit(0.7, 2.1, 1.3, 200);
    const b = orbit(0.7, 2.1, 1.3, 200);
    expect(a).toEqual(b);
  });
});
