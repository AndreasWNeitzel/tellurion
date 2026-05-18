import { describe, it, expect } from 'vitest';
import {
  chirpMass, frequencyOfTau, chirpRate, recoverChirpMass,
  strainAmplitude, waveform, armResponse, matchedFilter,
  MSUN, MPC,
} from './sim.js';

const m30 = 30 * MSUN, D400 = 400 * MPC;

describe('gravitational-wave-detector invariants', () => {
  it('the chirp mass is (m1 m2)^{3/5}/(m1+m2)^{1/5}, symmetric, ~26.1 Msun for 30+30', () => {
    expect(chirpMass(m30, m30) / MSUN).toBeCloseTo(26.117, 1);
    expect(chirpMass(36 * MSUN, 29 * MSUN)).toBe(chirpMass(29 * MSUN, 36 * MSUN)); // symmetric
    // equal mass: Mc = m * 2^{-1/5}
    expect(chirpMass(m30, m30) / (m30 * Math.pow(2, -0.2))).toBeCloseTo(1, 12);
  });

  it('the chirp mass is recovered from (f, df/dt) to better than 0.1%', () => {
    for (const [a, b] of [[30, 30], [36, 29], [10, 1.4]]) {
      const Mc = chirpMass(a * MSUN, b * MSUN);
      for (const f of [40, 150, 300]) {
        const rec = recoverChirpMass(f, chirpRate(f, Mc));
        expect(Math.abs(rec - Mc) / Mc).toBeLessThan(1e-3);
      }
    }
  });

  it('the strain amplitude for 30+30 Msun at 400 Mpc is of order 1e-21', () => {
    const Mc = chirpMass(m30, m30);
    const h150 = strainAmplitude(150, Mc, D400);
    expect(h150).toBeGreaterThan(3e-22);
    expect(h150).toBeLessThan(5e-21);
    // amplitude grows with frequency (~ f^{2/3}) and falls as 1/D
    expect(strainAmplitude(300, Mc, D400)).toBeGreaterThan(h150);
    expect(strainAmplitude(150, Mc, 2 * D400) / (h150 / 2)).toBeCloseTo(1, 9); // h ~ 1/D
  });

  it('the frequency chirps: monotone increasing, f ~ tau^{-3/8}, diverging at merger', () => {
    const Mc = chirpMass(m30, m30);
    let prev = 0;
    for (const tau of [2, 1, 0.5, 0.1, 0.02, 0.005]) {
      const f = frequencyOfTau(tau, Mc);
      expect(f).toBeGreaterThan(prev);                   // increasing as tau shrinks
      prev = f;
    }
    // power-law slope -3/8: f(tau)/f(4 tau) = 4^{3/8}
    const r = frequencyOfTau(0.05, Mc) / frequencyOfTau(0.2, Mc);
    expect(r).toBeCloseTo(Math.pow(4, 3 / 8), 3);
  });

  it('the interferometer arms respond with opposite sign and sub-proton displacement', () => {
    const r = armResponse(1e-21, 4000);
    expect(r.dLx / 2e-18).toBeCloseTo(1, 9);              // +h L/2
    expect(r.dLy / -2e-18).toBeCloseTo(1, 9);             // -h L/2 (opposite)
    expect(r.dLx).toBe(-r.dLy);
    expect(r.dLdiff / (1e-21 * 4000)).toBeCloseTo(1, 9);  // differential = h L
    expect(Math.abs(r.dLx)).toBeLessThan(1e-15);          // << a proton (~1e-15 m)
  });

  it('the matched filter peaks at zero lag for the correct template and beats a mismatch', () => {
    const Mc = chirpMass(m30, m30);
    const good = matchedFilter(m30, m30, D400, Mc);
    const bad = matchedFilter(m30, m30, D400, Mc * 1.25);
    expect(good.peakLag).toBe(0);                          // aligned at coalescence
    expect(good.peak).toBeGreaterThan(bad.peak);           // correct template wins
    expect(good.peak).toBeGreaterThan(0);
  });

  it('the waveform chirps in frequency and amplitude up to merger', () => {
    const w = waveform(m30, m30, D400);
    expect(w.f[w.f.length - 1]).toBeGreaterThan(w.f[0]);   // frequency rises
    expect(w.amp[w.amp.length - 1]).toBeGreaterThan(w.amp[0]); // amplitude rises
    expect(w.Mc).toBeCloseTo(chirpMass(m30, m30), 6);
  });

  it('deterministic: identical inputs reproduce the waveform and matched filter', () => {
    const a = waveform(m30, m30, D400), b = waveform(m30, m30, D400);
    for (let i = 0; i < a.h.length; i += 1) expect(a.h[i]).toBe(b.h[i]);
    const mfa = matchedFilter(m30, m30, D400, a.Mc);
    const mfb = matchedFilter(m30, m30, D400, a.Mc);
    expect(mfa.peak).toBe(mfb.peak);
    expect(mfa.peakLag).toBe(mfb.peakLag);
  });
});
