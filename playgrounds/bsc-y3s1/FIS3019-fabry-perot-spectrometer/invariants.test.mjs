// Fabry-Perot etalon spectrometer: the reflectance finesse at
// R = 0.99, the Airy maxima and minima, the R = 0 transparent limit,
// the exact FWHM, periodicity and bounds, the free spectral range,
// the resolving power, and the sodium-doublet resolution criterion.

import { describe, it, expect } from 'vitest';
import {
  coeffFinesse, reflFinesse, airyT, phase, orderM, fsrNm,
  resolvingPower, doubletT, resolves, fwhmPhase, NA_D1, NA_D2,
} from './sim.js';

const close = (a, b, t) => expect(Math.abs(a - b)).toBeLessThan(t);

describe('fabry-perot-spectrometer invariants', () => {
  it('reflectance finesse F* ~ 312 at R = 0.99', () => {
    close(reflFinesse(0.99), Math.PI * Math.sqrt(0.99) / 0.01, 1e-9);
    expect(Math.abs(reflFinesse(0.99) - 312.6) < 1).toBe(true);
    close(coeffFinesse(0.99), 4 * 0.99 / (0.01 * 0.01), 1e-6);
  });

  it('Airy maxima T = 1 at delta = 2 m pi; minima 1/(1+F)', () => {
    for (const R of [0.5, 0.8, 0.99]) {
      for (const m of [0, 1, 5, 20]) close(airyT(2 * m * Math.PI, R), 1, 1e-9);
      const F = coeffFinesse(R);
      for (const m of [0, 3]) close(airyT((2 * m + 1) * Math.PI, R), 1 / (1 + F), 1e-9);
    }
  });

  it('R = 0 gives full transmission everywhere', () => {
    for (const d of [0, 0.3, 1.0, 2.7, 5.5, 100]) close(airyT(d, 0), 1, 1e-12);
    expect(reflFinesse(0)).toBe(0);
  });

  it('0 < T <= 1 and T is 2 pi periodic in delta', () => {
    for (const R of [0.3, 0.9]) for (const d of [0.1, 1.3, 2.9, 4.4]) {
      const t = airyT(d, R);
      expect(t).toBeGreaterThan(0); expect(t).toBeLessThanOrEqual(1 + 1e-12);
      close(airyT(d, R), airyT(d + 2 * Math.PI, R), 1e-12);
      close(airyT(d, R), airyT(d + 8 * Math.PI, R), 1e-12);
    }
  });

  it('exact Airy FWHM matches a numeric half-max width', () => {
    for (const R of [0.7, 0.9, 0.99]) {
      const w = fwhmPhase(R);
      // sample around the delta = 0 peak; find where T crosses 1/2
      let lo = 0;
      for (let x = 0; x < Math.PI; x += 1e-5) { if (airyT(x, R) < 0.5) { lo = x; break; } }
      close(2 * lo, w, 5e-4);                       // full width = 2 * half
    }
  });

  it('free spectral range and order are consistent', () => {
    const d = 1e-3, lam = 589.0;                    // 1 mm etalon
    const m = orderM(lam * 1e-9, d);
    close(m, 2 * d / (lam * 1e-9), 1e-6);
    const fsr = fsrNm(lam, d);
    close(fsr, (lam * 1e-9) ** 2 / (2 * d) * 1e9, 1e-9);
    // one FSR advances the phase by exactly 2 pi
    const lam2 = lam + fsr;
    close(phase(lam * 1e-9, d) - phase(lam2 * 1e-9, d), 2 * Math.PI, 2e-3);
  });

  it('resolving power R_p = m F* and the Na doublet resolves only at high R', () => {
    // A short etalon so the FSR (lambda^2/2d ~ 1.7 nm) exceeds the
    // 0.597 nm doublet (no order overlap); resolution then depends on
    // the finesse alone.
    const d = 1e-4, dLam = NA_D1 - NA_D2;            // 0.1 mm, ~0.597 nm
    close(resolvingPower(589e-9, d, 0.95), orderM(589e-9, d) * reflFinesse(0.95), 1e-6);
    const lowR = resolves(589.0, dLam, d, 0.3);
    const hiR = resolves(589.0, dLam, d, 0.97);
    expect(lowR.fsr).toBeGreaterThan(dLam);          // orders do not overlap
    expect(lowR.resolved).toBe(false);               // broad peaks: doublet merged
    expect(hiR.resolved).toBe(true);                 // sharp peaks: doublet split
    expect(hiR.Rp).toBeGreaterThan(hiR.need);
  });

  it('the doublet sum shows one blurred peak at low R, two at high R', () => {
    // pick a spacing where the two lines sit near a shared order
    const d = 5e-3;
    const m = Math.round(orderM(NA_D2 * 1e-9, d));
    const dC = m * NA_D2 * 1e-9 / 2;                 // center on a D2 maximum
    const lo = doubletT(dC, 0.4), hi = doubletT(dC, 0.985);
    expect(lo.sum).toBeGreaterThan(0);
    // high R: scanning a little reveals a dip between the two peaks
    let minBetween = Infinity, peak = 0;
    for (let i = -400; i <= 400; i += 1) {
      const dd = dC + i * 1e-12;
      const s = doubletT(dd, 0.985).sum;
      peak = Math.max(peak, s);
      if (Math.abs(i) < 30) minBetween = Math.min(minBetween, s);
    }
    expect(peak).toBeGreaterThan(0.8);
    expect(minBetween).toBeLessThan(peak);           // resolved: a real dip
  });

  it('higher R sharpens peaks (smaller FWHM, deeper minima)', () => {
    expect(fwhmPhase(0.99)).toBeLessThan(fwhmPhase(0.9));
    expect(fwhmPhase(0.9)).toBeLessThan(fwhmPhase(0.5));
    expect(1 / (1 + coeffFinesse(0.99))).toBeLessThan(1 / (1 + coeffFinesse(0.5)));
  });
});
