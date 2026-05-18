import { describe, it, expect } from 'vitest';
import {
  W_AIR, W_OVER_E, QE, doseGas, braggGray, nIonPairs, chargeFromEnergy,
  collectionEfficiency, comptonRecoil, runChamber, saturationCurve,
} from './sim.js';
import { makeRng } from '../../../shared/js/render/rng.js';

describe('radiation-dosimetry-detector invariants', () => {
  it('the W value for air is the ICRU 90 value within 1 percent', () => {
    expect(Math.abs(W_AIR / 33.97 - 1)).toBeLessThan(0.01);
    expect(W_OVER_E).toBeCloseTo(33.97, 6);                    // J / C
    expect(QE).toBeCloseTo(1.602176634e-19, 25);
  });

  it('the cavity dose is linear in charge and W and inverse in mass', () => {
    expect(doseGas(2e-9, 1.3e-6) / doseGas(1e-9, 1.3e-6)).toBeCloseTo(2, 9);
    expect(doseGas(1e-9, 2.6e-6) / doseGas(1e-9, 1.3e-6)).toBeCloseTo(0.5, 9);
    expect(doseGas(1e-9, 1.3e-6)).toBeCloseTo((1e-9 / 1.3e-6) * W_OVER_E, 12);
    expect(doseGas(3e-9, 2e-6)).toBeGreaterThan(0);
  });

  it('Bragg-Gray converts gas dose to medium dose by the stopping-power ratio', () => {
    expect(braggGray(0.5, 1.13)).toBeCloseTo(0.565, 9);
    const r = runChamber({ E0: 100, nPhot: 2000, sRatio: 1.13, seed: 0xC0FFEE });
    expect(r.Dmed / r.Dgas).toBeCloseTo(1.13, 9);
    expect(braggGray(2, 1)).toBeCloseTo(2, 12);
  });

  it('ionization conserves energy: n_pairs * W = E_deposited', () => {
    expect(nIonPairs(1e6) * W_AIR).toBeCloseTo(1e6, 3);
    expect(chargeFromEnergy(W_AIR)).toBeCloseTo(QE, 25);       // one pair per W
    expect(chargeFromEnergy(2e6) / chargeFromEnergy(1e6)).toBeCloseTo(2, 9);
  });

  it('the collection efficiency saturates to 1 at high voltage (Boag)', () => {
    expect(collectionEfficiency(2000, 1, 1)).toBeGreaterThan(0.999); // saturation
    expect(collectionEfficiency(10, 1, 1)).toBeLessThan(0.7);       // recombination
    let prev = 0;
    for (const V of [10, 25, 50, 100, 300, 1000, 3000]) {
      const f = collectionEfficiency(V, 1, 1);
      expect(f).toBeGreaterThan(0);
      expect(f).toBeLessThanOrEqual(1.0000001);
      expect(f).toBeGreaterThan(prev);                              // monotone in V
      prev = f;
    }
    // higher dose rate -> more recombination at fixed V
    expect(collectionEfficiency(100, 4, 1)).toBeLessThan(collectionEfficiency(100, 1, 1));
  });

  it('the chamber bookkeeping is consistent: Q = (E/W) e f, D = (Q/m)(W/e) s', () => {
    const r = runChamber({ E0: 150, nPhot: 4000, V: 200, m: 1.3e-6, sRatio: 1.13, seed: 0xC0FFEE });
    expect(r.Qcreated).toBeCloseTo(r.Edep / W_AIR * QE, 28);
    expect(r.Qcollected).toBeCloseTo(r.Qcreated * r.f, 28);
    expect(r.Dgas).toBeCloseTo((r.Qcollected / r.m) * W_OVER_E, 12);
    expect(r.Dmed).toBeCloseTo(r.Dgas * 1.13, 12);
    expect(r.recombinationLoss).toBeCloseTo(1 - r.f, 12);
    // a higher voltage collects a larger fraction and more dose
    const hi = runChamber({ E0: 150, nPhot: 4000, V: 2000, m: 1.3e-6, seed: 0xC0FFEE });
    expect(hi.f).toBeGreaterThan(r.f);
    expect(hi.Dmed).toBeGreaterThan(r.Dmed);
  });

  it('the Compton recoil energy is within the kinematic range', () => {
    const rng = makeRng(0xC0FFEE), E = 200;
    let mn = 1e9, mx = -1;
    const Tmax = E * (2 * (E / 510.999)) / (1 + 2 * (E / 510.999)); // max recoil
    for (let i = 0; i < 5000; i += 1) {
      const T = comptonRecoil(E, rng);
      expect(T).toBeGreaterThanOrEqual(-1e-9);
      expect(T).toBeLessThanOrEqual(Tmax + 1e-6);
      mn = Math.min(mn, T); mx = Math.max(mx, T);
    }
    expect(mn).toBeLessThan(0.1 * E);                              // forward photon: tiny recoil
    expect(mx).toBeGreaterThan(0.5 * Tmax);                        // backscatter: large recoil
  });

  it('the saturation curve spans recombination to full collection, monotone', () => {
    const s = saturationCurve(10, 2000, 50, 1, 1);
    expect(s.f[0]).toBeLessThan(0.7);
    expect(s.f[s.f.length - 1]).toBeGreaterThan(0.999);
    for (let i = 1; i < s.f.length; i += 1) expect(s.f[i]).toBeGreaterThan(s.f[i - 1] - 1e-12);
  });

  it('deterministic given the seed; a different seed differs', () => {
    const a = runChamber({ E0: 100, nPhot: 3000, seed: 0xC0FFEE });
    const b = runChamber({ E0: 100, nPhot: 3000, seed: 0xC0FFEE });
    const c = runChamber({ E0: 100, nPhot: 3000, seed: 99 });
    expect(a.Edep).toBe(b.Edep);
    expect(a.Qcollected).toBe(b.Qcollected);
    expect(a.Edep === c.Edep).toBe(false);
  });
});
