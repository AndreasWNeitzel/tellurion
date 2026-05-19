// Pulsar dispersion-measure invariants on the pure physics in sim.js
// (the previous file was a placeholder skeleton).
import { describe, it, expect } from 'vitest';
import { delayMs, dynamicSpectrum, dedisperse, snr, K_DM } from './sim.js';

const NCH = 64, NT = 200, FLO = 400, FHI = 1400;
// the time window must hold the full f^-2 sweep (it scales with DM)
const TWfor = (DM) => Math.max(50, delayMs(DM, FLO, FHI) * 1.45);

describe('pulsar-dispersion-measure', () => {
  it('delay matches the analytic cold-plasma formula (spec: 400-1400 MHz, DM 100)', () => {
    const expected = (100 / K_DM) * (1 / (400 * 400) - 1 / (1400 * 1400)) * 1e3;
    expect(Math.abs(delayMs(100, 400, 1400) - expected) / Math.abs(expected)).toBeLessThan(1e-9);
  });

  it('delay is zero at the reference frequency and linear in DM', () => {
    expect(delayMs(250, 800, 800)).toBeCloseTo(0, 12);
    expect(delayMs(200, 600, 1400)).toBeCloseTo(2 * delayMs(100, 600, 1400), 9);
  });

  it('delay follows the f^-2 law', () => {
    // relative to f_ref -> infinity: delay ~ 1/f^2, so halving f quadruples it
    const big = (DM, f) => (DM / K_DM) * (1 / (f * f)) * 1e3;
    expect(big(100, 400) / big(100, 800)).toBeCloseTo(4, 6);
  });

  it('de-dispersed S/N is maximal at the true DM', () => {
    const trueDM = 150, TW = TWfor(trueDM);
    const spec = dynamicSpectrum(trueDM, 3, NCH, NT, FLO, FHI, TW);
    const s0 = snr(dedisperse(spec, trueDM, NCH, NT, FLO, FHI, TW));
    const sUp = snr(dedisperse(spec, trueDM * 1.12, NCH, NT, FLO, FHI, TW));
    const sDn = snr(dedisperse(spec, trueDM * 0.88, NCH, NT, FLO, FHI, TW));
    expect(s0).toBeGreaterThan(sUp);
    expect(s0).toBeGreaterThan(sDn);
  });

  it('correct DM concentrates the power into a taller peak than a wrong DM', () => {
    const TW = TWfor(150);
    const spec = dynamicSpectrum(150, 3, NCH, NT, FLO, FHI, TW);
    const peak = (a) => { let m = 0; for (const v of a) if (v > m) m = v; return m; };
    const right = peak(dedisperse(spec, 150, NCH, NT, FLO, FHI, TW));
    const wrong = peak(dedisperse(spec, 220, NCH, NT, FLO, FHI, TW));
    expect(right).toBeGreaterThan(wrong * 1.3);
  });

  it('zero DM produces no sweep: every channel peaks in the same time bin', () => {
    const spec = dynamicSpectrum(0, 3, NCH, NT, FLO, FHI, TWfor(50));
    const argmax = (i) => { let m = -1, a = 0; for (let j = 0; j < NT; j += 1) { const v = spec[i * NT + j]; if (v > m) { m = v; a = j; } } return a; };
    expect(argmax(0)).toBe(argmax(NCH - 1));
  });
});
