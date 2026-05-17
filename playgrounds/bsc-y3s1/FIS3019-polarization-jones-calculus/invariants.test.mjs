// Jones calculus: Malus's law and polarizer idempotency, the
// quarter-wave plate turning 45-deg linear light circular, half-wave
// reflection, wave-plate/rotator unitarity, rotator composition,
// the Stokes sphere relation S0^2 = S1^2 + S2^2 + S3^2, chain
// associativity, and the full-wave-plate identity.

import { describe, it, expect } from 'vitest';
import {
  jLinear, jCircular, normalize, matApply, matMul, linearPolarizer,
  retarder, quarterWave, halfWave, rotatorMatrix, identityM,
  intensity, stokes, degreeOfPolarization, ellipse, applyChain,
} from './sim.js';

const close = (a, b, t = 1e-9) => expect(Math.abs(a - b)).toBeLessThan(t);

describe('polarization-jones-calculus invariants', () => {
  it("Malus's law and polarizer idempotency", () => {
    for (const dth of [0, Math.PI / 6, Math.PI / 4, Math.PI / 3, Math.PI / 2]) {
      const inp = jLinear(0);
      const out = matApply(linearPolarizer(dth), inp);
      close(intensity(out), Math.cos(dth) ** 2, 1e-9);
    }
    const P = linearPolarizer(0.7);
    const PP = matMul(P, P);
    for (let i = 0; i < 2; i += 1) for (let j = 0; j < 2; j += 1) {
      close(PP[i][j].re, P[i][j].re, 1e-9); close(PP[i][j].im, P[i][j].im, 1e-9);
    }
  });

  it('QWP at 45 deg turns linear light circular', () => {
    const out = matApply(quarterWave(Math.PI / 4), jLinear(0));
    close(Math.abs(out[0].re ** 2 + out[0].im ** 2) - (out[1].re ** 2 + out[1].im ** 2), 0, 1e-9);
    const e = ellipse(out);
    close(Math.abs(e.chi), Math.PI / 4, 1e-6);          // circular
    close(e.axialRatio, 1, 1e-6);
    expect(Math.abs(stokes(out).S3)).toBeGreaterThan(0.999);
  });

  it('half-wave plate reflects linear polarization about its axis', () => {
    const alpha = 0.3, beta = 0.8;
    const out = matApply(halfWave(beta), jLinear(alpha));
    const e = ellipse(out);
    close(Math.abs(e.chi), 0, 1e-7);                    // stays linear
    let want = (2 * beta - alpha) % Math.PI; if (want < 0) want += Math.PI;
    close(e.psi, want, 1e-6);
    close(intensity(out), 1, 1e-9);
  });

  it('wave plates and rotators are unitary (M^dagger M = I)', () => {
    for (const M of [quarterWave(0.6), halfWave(1.1), retarder(0.9, 0.4), rotatorMatrix(0.7)]) {
      // (M^dagger M)_ij = sum_k conj(M_ki) M_kj
      for (let i = 0; i < 2; i += 1) for (let j = 0; j < 2; j += 1) {
        let re = 0, im = 0;
        for (let k = 0; k < 2; k += 1) {
          const a = M[k][i], b = M[k][j];               // conj(a) * b
          re += a.re * b.re + a.im * b.im;
          im += a.re * b.im - a.im * b.re;
        }
        close(re, i === j ? 1 : 0, 1e-9); close(im, 0, 1e-9);
      }
      close(intensity(matApply(M, jLinear(0.45))), 1, 1e-9);
    }
  });

  it('rotator composition R(a)R(b) = R(a+b); R(2pi) = I', () => {
    const A = matMul(rotatorMatrix(0.5), rotatorMatrix(0.9));
    const B = rotatorMatrix(1.4);
    for (let i = 0; i < 2; i += 1) for (let j = 0; j < 2; j += 1) close(A[i][j].re, B[i][j].re, 1e-9);
    const full = rotatorMatrix(2 * Math.PI);
    close(full[0][0].re, 1, 1e-9); close(full[1][1].re, 1, 1e-9);
    close(full[0][1].re, 0, 1e-9); close(full[1][0].re, 0, 1e-9);
  });

  it('Stokes sphere: S0^2 = S1^2 + S2^2 + S3^2, DOP = 1', () => {
    for (const v of [jLinear(0.3), jCircular(true), jCircular(false),
      normalize(matApply(quarterWave(0.6), jLinear(0.7)))]) {
      const { S0, S1, S2, S3 } = stokes(v);
      close(S0 * S0, S1 * S1 + S2 * S2 + S3 * S3, 1e-9);
      close(degreeOfPolarization(v), 1, 1e-9);
    }
  });

  it('chain product equals sequential application', () => {
    const v = jLinear(0.2);
    const els = [quarterWave(0.4), linearPolarizer(1.0), halfWave(0.25)];
    const seq = applyChain(els, v);
    const prod = matApply(matMul(els[2], matMul(els[1], els[0])), v);
    close(seq[0].re, prod[0].re, 1e-9); close(seq[0].im, prod[0].im, 1e-9);
    close(seq[1].re, prod[1].re, 1e-9); close(seq[1].im, prod[1].im, 1e-9);
  });

  it('two QWPs make a HWP; a full-wave plate is the identity state', () => {
    const v = jLinear(0.35);
    const twoQ = applyChain([quarterWave(0.5), quarterWave(0.5)], v);
    const hw = matApply(halfWave(0.5), v);
    close(twoQ[0].re, hw[0].re, 1e-9); close(twoQ[1].im, hw[1].im, 1e-9);
    const fw = matApply(retarder(2 * Math.PI, 0.6), v);   // delta = 2pi
    const s0 = stokes(v), s1 = stokes(fw);
    close(s0.S1, s1.S1, 1e-9); close(s0.S2, s1.S2, 1e-9); close(s0.S3, s1.S3, 1e-9);
  });

  it('ellipse classification: linear chi=0, circular chi=+-pi/4', () => {
    close(ellipse(jLinear(0.6)).chi, 0, 1e-9);
    close(ellipse(jLinear(0.6)).psi, 0.6, 1e-6);
    expect(ellipse(jCircular(true)).handed).toBe('right');
    expect(ellipse(jCircular(false)).handed).toBe('left');
    close(Math.abs(ellipse(jCircular(true)).chi), Math.PI / 4, 1e-9);
  });
});
