import { describe, it, expect } from 'vitest';
import {
  ALPHA, ME, MMU, beta, mandelstam, sigmaEEtoMuMu, sigmaPoint,
  dSigmadOmega, sigmaFromAngular, amplitudeAlphaExponent,
  matrixElementAlphaPower, sigmaCurve,
} from './sim.js';

describe('feynman-diagram-builder-qed invariants', () => {
  it('the Mandelstam identity s + t + u = sum of external masses^2 holds exactly', () => {
    const want = 2 * ME * ME + 2 * MMU * MMU;
    for (const E of [0.25, 1, 10, 91.2]) for (const c of [-0.9, -0.2, 0.3, 0.8]) {
      const m = mandelstam(E, c);
      expect(m.s + m.t + m.u).toBeCloseTo(want, 9);
      expect(m.sumMasses).toBeCloseTo(want, 12);
    }
  });

  it('the cross section vanishes at threshold sqrt(s) = 2 m_mu and is positive above', () => {
    expect(sigmaEEtoMuMu(2 * MMU)).toBe(0);
    expect(sigmaEEtoMuMu(2 * MMU - 0.01)).toBe(0);                    // below threshold
    expect(beta(2 * MMU)).toBeCloseTo(0, 9);
    expect(sigmaEEtoMuMu(2 * MMU + 1e-4)).toBeGreaterThan(0);
    expect(sigmaEEtoMuMu(0.25)).toBeGreaterThan(0);
    // continuity: sigma -> 0 as sqrt(s) -> threshold from above
    expect(sigmaEEtoMuMu(2 * MMU + 1e-4)).toBeLessThan(sigmaEEtoMuMu(0.3));
  });

  it('the cross section falls as 1/s well above threshold (point cross section)', () => {
    for (const E of [5, 20, 80]) {
      expect(sigmaEEtoMuMu(E) * E * E).toBeCloseTo(4 * Math.PI * ALPHA * ALPHA / 3, 6);
      expect(sigmaEEtoMuMu(E)).toBeCloseTo(sigmaPoint(E), 6);          // beta -> 1
    }
    expect(sigmaEEtoMuMu(20) / sigmaEEtoMuMu(10)).toBeCloseTo(0.25, 3); // sigma ~ 1/s
  });

  it('the amplitude scales as alpha^{V/2}; |M|^2 and sigma as alpha^V (V vertices)', () => {
    expect(amplitudeAlphaExponent(2)).toBe(1);                        // tree: 2 vertices
    expect(matrixElementAlphaPower(2)).toBe(2);
    expect(amplitudeAlphaExponent(4)).toBe(2);                        // one-loop order
    expect(matrixElementAlphaPower(4)).toBe(4);
    expect(sigmaEEtoMuMu(10, 2 * ALPHA) / sigmaEEtoMuMu(10, ALPHA)).toBeCloseTo(4, 6); // ~ alpha^2
    expect(sigmaEEtoMuMu(10, 3 * ALPHA) / sigmaEEtoMuMu(10, ALPHA)).toBeCloseTo(9, 6);
  });

  it('the angular distribution is forward-backward symmetric and integrates to sigma', () => {
    for (const E of [3, 10, 50]) {
      for (const c of [0.2, 0.6, 0.95]) {
        expect(dSigmadOmega(E, c)).toBeCloseTo(dSigmadOmega(E, -c), 12); // even in cos
      }
      expect(sigmaFromAngular(E)).toBeCloseTo(sigmaEEtoMuMu(E), 9);     // consistency
    }
    // ultrarelativistic shape ~ 1 + cos^2: ratio at cos=1 vs cos=0 is 2
    expect(dSigmadOmega(90, 1) / dSigmadOmega(90, 0)).toBeCloseTo(2, 2);
  });

  it('the muon velocity beta is in [0,1) and approaches 1 at high energy', () => {
    expect(beta(2 * MMU)).toBe(0);
    for (const E of [0.3, 1, 5, 50]) {
      expect(beta(E)).toBeGreaterThan(0);
      expect(beta(E)).toBeLessThan(1);
    }
    expect(beta(1000)).toBeGreaterThan(0.9999);
  });

  it('the cross-section curve is positive and monotonically decreasing above the peak', () => {
    const c = sigmaCurve(0.5, 20, 200);
    let started = false, prev = 0;
    for (let i = 0; i < c.e.length; i += 1) {
      expect(c.sig[i]).toBeGreaterThanOrEqual(0);
      if (c.e[i] > 1) {                                                // past the rise, falling
        if (started) expect(c.sig[i]).toBeLessThan(prev + 1e-12);
        started = true; prev = c.sig[i];
      }
    }
  });

  it('deterministic: identical inputs reproduce the cross section', () => {
    expect(sigmaEEtoMuMu(7.3)).toBe(sigmaEEtoMuMu(7.3));
    expect(sigmaFromAngular(7.3)).toBe(sigmaFromAngular(7.3));
    const a = mandelstam(12, 0.4), b = mandelstam(12, 0.4);
    expect(a.t).toBe(b.t); expect(a.u).toBe(b.u);
  });
});
