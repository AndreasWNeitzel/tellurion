import { describe, it, expect } from 'vitest';
import { makeRng } from '../../../shared/js/render/rng.js';
import {
  kleinNishinaTotal, crossSections, comptonSample, electronRange,
  runMC, interactionFractions,
} from './sim.js';

describe('monte-carlo-photon-transport invariants', () => {
  it('the water attenuation coefficient is physical and equals 1/mfp', () => {
    expect(crossSections(30).mu).toBeGreaterThan(0.30);          // lit ~0.38 /cm
    expect(crossSections(30).mu).toBeLessThan(0.45);
    expect(crossSections(100).mu).toBeCloseTo(0.171, 1);         // lit ~0.17
    expect(crossSections(1000).mu).toBeCloseTo(0.0706, 2);       // lit ~0.07
    for (const E of [30, 100, 1000]) {
      const c = crossSections(E);
      expect(c.mfp).toBeCloseTo(1 / c.mu, 9);
      expect(c.pe).toBeGreaterThan(0);
      expect(c.compton).toBeGreaterThan(0);
      expect(c.rayleigh).toBeGreaterThan(0);
      expect(c.mu).toBeCloseTo(c.pe + c.compton + c.rayleigh, 9);
    }
    expect(kleinNishinaTotal(100)).toBeGreaterThan(kleinNishinaTotal(1000)); // sigma falls with E
  });

  it('the sampled first-flight free path equals 1/mu within 2 percent', () => {
    for (const E of [100, 1000]) {
      const R = runMC({ E0: E, nPhot: 20000, L: 60, nBins: 100, seed: 0xC0FFEE });
      expect(Math.abs(R.mfpFirstFlight / crossSections(E).mfp - 1)).toBeLessThan(0.02);
    }
  });

  it('photoelectric dominates at low energy, Compton at high energy', () => {
    const lo = interactionFractions(20), hi = interactionFractions(1000);
    expect(lo.pe).toBeGreaterThan(lo.compton);                   // low E: PE wins
    expect(lo.pe).toBeGreaterThan(0.5);
    expect(hi.compton).toBeGreaterThan(0.9);                     // high E: Compton wins
    expect(hi.pe).toBeLessThan(0.01);
    for (const E of [20, 60, 200, 1000]) expect(interactionFractions(E).rayleigh).toBeLessThan(0.15);
    // fractions partition unity
    const s = lo.pe + lo.compton + lo.rayleigh;
    expect(s).toBeCloseTo(1, 9);
  });

  it('Compton scattering obeys the Klein-Nishina kinematic bounds', () => {
    const rng = makeRng(0xC0FFEE);
    const E = 1000, a = E / 510.999, Emin = E / (1 + 2 * a);
    let mn = 1e9, mx = -1, mnC = 2, mxC = -2;
    for (let i = 0; i < 8000; i += 1) {
      const r = comptonSample(E, rng);
      expect(r.Eprime).toBeLessThanOrEqual(E + 1e-6);
      expect(r.Eprime).toBeGreaterThanOrEqual(Emin - 1e-6);
      mn = Math.min(mn, r.Eprime); mx = Math.max(mx, r.Eprime);
      mnC = Math.min(mnC, r.cosTheta); mxC = Math.max(mxC, r.cosTheta);
    }
    expect(mn).toBeLessThan(Emin * 1.05);                        // backscatter reached
    expect(mx).toBeGreaterThan(E * 0.95);                        // forward reached
    expect(mnC).toBeGreaterThanOrEqual(-1.0001);
    expect(mxC).toBeLessThanOrEqual(1.0001);
  });

  it('energy is conserved exactly: deposited + escaped = input', () => {
    const R = runMC({ E0: 1000, nPhot: 6000, L: 15, seed: 0xC0FFEE });
    const e = R.energy;
    expect((e.deposited + e.transmitted + e.backscattered + e.sideLeak) / e.input)
      .toBeCloseTo(1, 6);
    expect(e.deposited).toBeGreaterThan(0);
    expect(e.transmitted).toBeGreaterThan(0);
  });

  it('the depth dose shows a build-up region (peak below the surface)', () => {
    const R = runMC({ E0: 1000, nPhot: 12000, L: 15, nBins: 150, seed: 0xC0FFEE });
    const d = R.depth;
    expect(R.dmaxBin).toBeGreaterThan(2);                        // not at the entrance
    const avg = (a, b) => { let s = 0; for (let i = a; i < b; i += 1) s += d[i]; return s / (b - a); };
    const surf = avg(0, 3), peak = avg(Math.max(0, R.dmaxBin - 2), R.dmaxBin + 3), deep = avg(100, 110);
    expect(peak).toBeGreaterThan(surf);                          // builds up
    expect(peak).toBeGreaterThan(deep);                          // then attenuates
    expect(electronRange(1000)).toBeGreaterThan(electronRange(100)); // CSDA grows with E
  });

  it('a thinner slab transmits more energy (Beer-Lambert sense)', () => {
    const thin = runMC({ E0: 1000, nPhot: 6000, L: 4, seed: 0xC0FFEE });
    const thick = runMC({ E0: 1000, nPhot: 6000, L: 20, seed: 0xC0FFEE });
    expect(thin.energy.transmitted).toBeGreaterThan(thick.energy.transmitted);
    expect(thick.energy.deposited).toBeGreaterThan(thin.energy.deposited);
  });

  it('deterministic given the seed; a different seed differs', () => {
    const a = runMC({ E0: 500, nPhot: 3000, seed: 0xC0FFEE });
    const b = runMC({ E0: 500, nPhot: 3000, seed: 0xC0FFEE });
    const c = runMC({ E0: 500, nPhot: 3000, seed: 12345 });
    expect(a.depth[40]).toBe(b.depth[40]);
    expect(a.tally.compton).toBe(b.tally.compton);
    expect(a.tally.compton === c.tally.compton && a.depth[40] === c.depth[40]).toBe(false);
  });
});
