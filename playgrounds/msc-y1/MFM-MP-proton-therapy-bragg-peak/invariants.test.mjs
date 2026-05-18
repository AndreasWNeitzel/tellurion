import { describe, it, expect } from 'vitest';
import {
  BK_ALPHA, BK_P, braggKleemanRange, energyForRange, stragglingSigma,
  protonDepthDose, xrayDepthDose, sobp, depthGrid, peakDepth, distalDepth,
} from './sim.js';

describe('proton-therapy-bragg-peak invariants', () => {
  const z = depthGrid(40, 1000);

  it('the Bragg-Kleeman range follows R = alpha E0^1.77', () => {
    expect(braggKleemanRange(150)).toBeCloseTo(BK_ALPHA * 150 ** BK_P, 9);
    expect(braggKleemanRange(300) / braggKleemanRange(150)).toBeCloseTo(2 ** 1.77, 2); // within ~2 percent
    expect(Math.abs(braggKleemanRange(300) / braggKleemanRange(150) / 2 ** 1.77 - 1)).toBeLessThan(0.02);
    expect(braggKleemanRange(200)).toBeGreaterThan(braggKleemanRange(100)); // monotone
    expect(energyForRange(braggKleemanRange(180))).toBeCloseTo(180, 6);     // inverse
  });

  it('the Bragg peak sits at the end of range with no dose beyond', () => {
    const p = protonDepthDose(150, z);
    const pk = peakDepth(p.dose, z);
    const r90 = distalDepth(p.dose, z, 0.9);
    // the maximum sits ~1 mm proximal of the distal 90 percent point
    // (a fraction of the straggling width); R90 ~ the CSDA range
    expect(Math.abs(pk - r90) * 10).toBeLessThan(1.6);
    expect(Math.abs(r90 - p.R) * 10).toBeLessThan(1.5);                     // R90 ~ CSDA range
    expect(pk).toBeLessThan(p.R);                                           // peak proximal to R
    const beyond = p.dose[z.findIndex((zz) => zz > p.R + 1)];
    expect(beyond).toBeLessThan(0.01);                                      // ~ no dose 1 cm past range
  });

  it('the proton beam concentrates dose at depth, unlike the photon beam', () => {
    const p = protonDepthDose(150, z);
    const x = xrayDepthDose(z);
    const i05 = z.findIndex((zz) => zz >= 0.5);
    expect(1 / p.dose[i05]).toBeGreaterThan(2.5);                           // peak >> entrance
    // photon: build-up to a shallow maximum, then it keeps going
    expect(peakDepth(x, z)).toBeLessThan(3);                                // z_max is shallow
    const iDeep = z.findIndex((zz) => zz > 2 * p.R);
    expect(x[iDeep]).toBeGreaterThan(0.1);                                  // photon exit dose
    expect(p.dose[iDeep]).toBeLessThan(1e-6);                               // proton: nothing there
  });

  it('the straggling width grows with range and broadens the peak', () => {
    expect(stragglingSigma(20)).toBeGreaterThan(stragglingSigma(5));
    const a = protonDepthDose(70, z), b = protonDepthDose(230, z);
    expect(b.sigma).toBeGreaterThan(a.sigma);                               // deeper -> wider peak
    expect(a.dose.every((v) => v >= 0 && v <= 1.0000001)).toBe(true);       // normalised
  });

  it('the SOBP is a weighted superposition that flattens the high-dose region', () => {
    const s = sobp(180, 30, 0.4, z, 0.02);                                  // as used by the playground
    // exact linear superposition of the pristine peaks
    let mx = 0; const raw = new Float64Array(z.length);
    for (let i = 0; i < z.length; i += 1) {
      let v = 0; for (let k = 0; k < s.weights.length; k += 1) v += s.weights[k] * s.peaks[k][i];
      raw[i] = v; mx = Math.max(mx, v);
    }
    for (let i = 0; i < z.length; i += 1) expect(s.dose[i]).toBeCloseTo(raw[i] / mx, 9);
    // plateau much flatter than a single pristine peak over the same span
    const sig = Math.hypot(stragglingSigma(s.Rmax), BK_P * s.Rmax * 0.02);
    const lo = s.Rmin + 0.5 * sig, hi = s.Rmax - 1.5 * sig;
    let smn = 2, smx = -1, pmn = 2, pmx = -1;
    const single = protonDepthDose(180, z).dose;
    for (let i = 0; i < z.length; i += 1) {
      if (z[i] < lo || z[i] > hi) continue;
      smn = Math.min(smn, s.dose[i]); smx = Math.max(smx, s.dose[i]);
      pmn = Math.min(pmn, single[i]); pmx = Math.max(pmx, single[i]);
    }
    expect(smx / smn).toBeLessThan(1.10);                                   // plateau ripple < 10 percent
    expect(smx / smn).toBeLessThan(pmx / Math.max(pmn, 1e-6));              // flatter than one peak
    // sharp distal falloff and nothing well beyond the deepest range
    expect(distalDepth(s.dose, z, 0.2) - distalDepth(s.dose, z, 0.9)).toBeLessThan(2.0);
    expect(s.dose[z.findIndex((zz) => zz > s.Rmax + 3)]).toBeLessThan(0.01);
  });

  it('the SOBP distal edge is set by the deepest pristine peak', () => {
    const s = sobp(160, 30, 0.3, z, 0.02);
    const r90 = distalDepth(s.dose, z, 0.9);
    expect(Math.abs(r90 - s.Rmax)).toBeLessThan(2.0);                       // R90 within ~2 cm of Rmax
    expect(s.weights.every((wv) => wv >= 0)).toBe(true);                    // non-negative weights
    expect(s.weights.reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  });

  it('deterministic: identical inputs reproduce the curves', () => {
    expect(protonDepthDose(150, z).dose[500]).toBe(protonDepthDose(150, z).dose[500]);
    expect(braggKleemanRange(123)).toBe(braggKleemanRange(123));
    expect(sobp(180, 12, 0.4, z).dose[400]).toBe(sobp(180, 12, 0.4, z).dose[400]);
  });
});
