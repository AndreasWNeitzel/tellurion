import { describe, it, expect } from 'vitest';
import {
  legendreP, sphericalJ, sphericalN, hardSphereDeltas, amplitude,
  diffCrossSection, sigmaTotPartial, sigmaTotOptical, sigmaElasticIntegral,
  bornAmplitude, yukawaBornExact, squareWellBornExact,
} from './sim.js';

const PI = Math.PI;

describe('scattering-theory-differential-cross-section invariants', () => {
  it('special functions: Legendre and spherical Bessel match known values', () => {
    expect(legendreP(0, 0.3)).toBe(1);
    expect(legendreP(1, 0.3)).toBeCloseTo(0.3, 12);
    expect(legendreP(2, 0.5)).toBeCloseTo(0.5 * (3 * 0.25 - 1), 12);   // (3x^2-1)/2
    expect(legendreP(3, 1)).toBeCloseTo(1, 10);                        // P_l(1) = 1
    expect(sphericalJ(0, 1.5)).toBeCloseTo(Math.sin(1.5) / 1.5, 10);
    expect(sphericalN(0, 1.5)).toBeCloseTo(-Math.cos(1.5) / 1.5, 10);
  });

  it('the optical theorem holds: sigma_tot = (4 pi / k) Im f(0) to 0.1%', () => {
    for (const ka of [0.2, 1, 5, 20]) {
      const k = ka, d = hardSphereDeltas(ka);
      const sp = sigmaTotPartial(d, k);
      const so = sigmaTotOptical(d, k);
      const si = sigmaElasticIntegral(d, k);
      expect(Math.abs(sp - so) / sp).toBeLessThan(1e-3);                // optical theorem
      expect(Math.abs(sp - si) / sp).toBeLessThan(1e-3);                // = integral |f|^2 dOmega
    }
  });

  it('hard sphere: sigma_tot -> 4 pi a^2 at low energy and -> 2 pi a^2 at high energy', () => {
    const a = 1;
    const low = sigmaTotPartial(hardSphereDeltas(0.05), 0.05 / a);
    expect(low / (PI * a * a)).toBeGreaterThan(3.8);
    expect(low / (PI * a * a)).toBeLessThan(4.05);                      // 4 pi a^2
    const high = sigmaTotPartial(hardSphereDeltas(40), 40 / a);
    expect(high / (PI * a * a)).toBeGreaterThan(2.0);
    expect(high / (PI * a * a)).toBeLessThan(2.45);                     // -> 2 pi a^2
    expect(high).toBeLessThan(low);                                     // shrinks with energy
  });

  it('the Born amplitude is the Fourier transform of the potential', () => {
    const V0 = 2, mu = 1.5;
    const Vy = (r) => (r === 0 ? 0 : V0 * Math.exp(-mu * r) / r);       // Yukawa
    for (const q of [0.3, 1, 2.5, 4]) {
      expect(bornAmplitude(q, Vy)).toBeCloseTo(yukawaBornExact(q, V0, mu), 4); // smooth: tight
    }
    const Vsw = (r) => (r < 1 ? -3 : 0);                                // square well
    for (const q of [0.5, 1.5, 3]) {
      const num = bornAmplitude(q, Vsw), ex = squareWellBornExact(q, 3, 1);
      expect(Math.abs(num - ex) / Math.abs(ex)).toBeLessThan(0.03);     // step potential: 3%
    }
  });

  it('unitarity: every partial cross section obeys sigma_l <= (4 pi / k^2)(2l+1)', () => {
    for (const ka of [0.5, 3, 12]) {
      const k = ka, d = hardSphereDeltas(ka);
      for (let l = 0; l < d.length; l += 1) {
        const s2 = Math.sin(d[l]) ** 2;
        expect(s2).toBeLessThanOrEqual(1 + 1e-12);                      // sin^2 delta <= 1
        const sigl = (4 * PI / (k * k)) * (2 * l + 1) * s2;
        expect(sigl).toBeLessThanOrEqual((4 * PI / (k * k)) * (2 * l + 1) + 1e-9);
      }
    }
  });

  it('a pure s-wave gives an isotropic differential cross section', () => {
    const d = new Float64Array([0.7]);                                  // only delta_0
    const k = 1;
    const ref = diffCrossSection(0, d, k);
    for (const th of [0.5, 1.2, 2.0, PI]) {
      expect(diffCrossSection(th, d, k)).toBeCloseTo(ref, 12);          // no theta dependence
    }
    expect(ref).toBeGreaterThan(0);                                     // |f|^2 >= 0
  });

  it('deterministic: identical inputs reproduce amplitude and cross sections', () => {
    const d = hardSphereDeltas(3);
    const a = amplitude(0.9, d, 3), b = amplitude(0.9, d, 3);
    expect(a.re).toBe(b.re); expect(a.im).toBe(b.im);
    expect(sigmaTotPartial(d, 3)).toBe(sigmaTotPartial(d, 3));
    expect(bornAmplitude(1.3, (r) => Math.exp(-r))).toBe(bornAmplitude(1.3, (r) => Math.exp(-r)));
  });
});
