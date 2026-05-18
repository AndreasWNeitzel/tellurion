import { describe, it, expect } from 'vitest';
import {
  PLANCK, flatParams, Efunc, hubble, h0InvGyr, ageNow, ageAt,
  densityFractions, aEqMatterRadiation, aEqMatterLambda, aAccelOnset,
  deceleration, particleHorizon, hubbleRadius, scaleHistory,
} from './sim.js';

describe('friedmann-expansion-multicomponent invariants', () => {
  it('at a = 1 the flat universe has H = H0 to 0.01%', () => {
    expect(Efunc(1, PLANCK)).toBeCloseTo(1, 6);
    expect(Math.abs(Efunc(1, PLANCK) - 1)).toBeLessThan(1e-4);
    expect(hubble(1, PLANCK)).toBeCloseTo(h0InvGyr(PLANCK.H0kms), 9);
    // flat closure holds for any inputs
    const p = flatParams(0.27, 5e-5, 70);
    expect(p.Om + p.Or + p.OL).toBeCloseTo(1, 12);
    expect(Efunc(1, p)).toBeCloseTo(1, 9);
  });

  it('the age of the universe is 13.8 Gyr for Planck LCDM (1%)', () => {
    const age = ageNow(PLANCK);
    expect(age).toBeGreaterThan(13.66);
    expect(age).toBeLessThan(13.94);                      // 13.8 +- 1%
    expect(age).toBeCloseTo(0.951 / h0InvGyr(PLANCK.H0kms), 0); // ~0.95/H0 for LCDM
  });

  it('the density fractions sum to 1 and the three eras dominate in order', () => {
    for (const a of [1e-6, 1e-4, 1e-2, 0.3, 1, 3]) {
      const d = densityFractions(a, PLANCK);
      expect(d.fr + d.fm + d.fL).toBeCloseTo(1, 10);
    }
    expect(densityFractions(1e-6, PLANCK).fr).toBeGreaterThan(0.9);   // radiation early
    expect(densityFractions(0.05, PLANCK).fm).toBeGreaterThan(0.9);   // matter mid
    expect(densityFractions(4, PLANCK).fL).toBeGreaterThan(0.9);      // Lambda late
  });

  it('the equality epochs are a_eq = Or/Om and (Om/OL)^{1/3}', () => {
    const aMR = aEqMatterRadiation(PLANCK);
    expect(aMR).toBeCloseTo(PLANCK.Or / PLANCK.Om, 12);
    const dMR = densityFractions(aMR, PLANCK);
    expect(dMR.fr / dMR.fm).toBeCloseTo(1, 6);                        // radiation = matter
    expect(1 / aMR - 1).toBeGreaterThan(3000);                        // z_eq ~ 3400
    const aML = aEqMatterLambda(PLANCK);
    expect(aML).toBeCloseTo(Math.cbrt(PLANCK.Om / PLANCK.OL), 12);
    const dML = densityFractions(aML, PLANCK);
    expect(dML.fm / dML.fL).toBeCloseTo(1, 6);                        // matter = Lambda
  });

  it('the expansion decelerates then accelerates; q0 < 0 and q -> -1', () => {
    expect(deceleration(0.05, PLANCK)).toBeGreaterThan(0);            // matter era: q > 0
    expect(deceleration(1, PLANCK)).toBeLessThan(0);                  // today: accelerating
    expect(deceleration(1, PLANCK)).toBeCloseTo(-0.53, 1);            // Planck q0 ~ -0.53
    expect(deceleration(50, PLANCK)).toBeCloseTo(-1, 1);              // de Sitter
    const aAcc = aAccelOnset(PLANCK);
    expect(Math.abs(deceleration(aAcc, PLANCK))).toBeLessThan(1e-2);  // q = 0 at the onset
  });

  it('H(a) decreases toward the de Sitter floor H0 sqrt(OL)', () => {
    expect(hubble(0.5, PLANCK)).toBeGreaterThan(hubble(1, PLANCK));
    expect(hubble(1, PLANCK)).toBeGreaterThan(hubble(2, PLANCK));
    const floor = h0InvGyr(PLANCK.H0kms) * Math.sqrt(PLANCK.OL);
    expect(hubble(1000, PLANCK)).toBeCloseTo(floor, 6);               // H -> H0 sqrt(OL)
    expect(hubble(1000, PLANCK)).toBeGreaterThan(floor - 1e-9);
  });

  it('the comoving particle horizon and Hubble radius are order c/H0; a(t) is monotone', () => {
    expect(particleHorizon(1, PLANCK)).toBeGreaterThan(2.5);          // ~3.2 c/H0
    expect(particleHorizon(1, PLANCK)).toBeLessThan(4);
    expect(hubbleRadius(1, PLANCK)).toBeCloseTo(1, 9);                 // 1/E(1) = 1
    expect(hubbleRadius(0.1, PLANCK)).toBeLessThan(1);                 // smaller in the past
    const { a } = scaleHistory(PLANCK);
    for (let i = 1; i < a.length; i += 1) expect(a[i]).toBeGreaterThan(a[i - 1]);
  });

  it('deterministic: identical inputs reproduce the age and history', () => {
    expect(ageNow(PLANCK)).toBe(ageNow(PLANCK));
    expect(ageAt(0.5, PLANCK)).toBe(ageAt(0.5, PLANCK));
    const a = scaleHistory(PLANCK).a, b = scaleHistory(PLANCK).a;
    expect(a[a.length - 1]).toBe(b[b.length - 1]);
  });
});
