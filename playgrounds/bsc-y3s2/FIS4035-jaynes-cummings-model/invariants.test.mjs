import { describe, it, expect } from 'vitest';
import {
  rabiFreq, collapseTime, revivalTime, photonDist, inversionAt,
  excitedProb, groundProb, inversionSeries, distMoments,
} from './sim.js';

const g = 1;

function envelopeMax(nbar, t0, t1, steps) {
  const P = photonDist(nbar);
  let m = 0;
  for (let i = 0; i <= steps; i += 1) {
    const t = t0 + (t1 - t0) * i / steps;
    m = Math.max(m, Math.abs(inversionAt(t, nbar, g, P)));
  }
  return m;
}

describe('jaynes-cummings-model invariants', () => {
  it('atomic probability is conserved: P_e + P_g = 1 for all t and nbar', () => {
    for (const nbar of [0, 0.5, 5, 25, 80]) {
      for (let k = 0; k < 40; k += 1) {
        const t = 0.37 * k;
        expect(excitedProb(t, nbar, g) + groundProb(t, nbar, g)).toBeCloseTo(1, 12);
      }
    }
  });

  it('a number state |e,n> gives a pure Rabi oscillation at Omega_n = 2 g sqrt(n+1)', () => {
    for (const n of [0, 3, 12]) {
      const P = new Float64Array(n + 1); P[n] = 1;          // pure |n>
      const Om = rabiFreq(n, g);
      expect(Om).toBeCloseTo(2 * g * Math.sqrt(n + 1), 12);
      for (let k = 1; k < 20; k += 1) {
        const t = 0.13 * k;
        expect(inversionAt(t, 0, g, P)).toBeCloseTo(Math.cos(Om * t), 10);
      }
    }
  });

  it('vacuum field (nbar -> 0) is a single undamped Rabi oscillation cos(2 g t), no collapse', () => {
    const P = photonDist(0);
    expect(P[0]).toBeCloseTo(1, 15);
    for (let k = 0; k < 30; k += 1) {
      const t = 0.21 * k;
      expect(inversionAt(t, 0, g, P)).toBeCloseTo(Math.cos(2 * g * t), 12);
    }
    // it keeps returning to +-1: no collapse for a single frequency
    expect(envelopeMax(0, 50, 60, 4000)).toBeGreaterThan(0.999);
  });

  it('collapse then revival: the Rabi envelope dies after t_c and rebuilds near t_r (Eberly 1980)', () => {
    const nbar = 25;
    const tc = collapseTime(g), tr = revivalTime(nbar, g);
    expect(tc).toBeCloseTo(Math.SQRT2, 12);
    expect(tr).toBeCloseTo(2 * Math.PI * 5, 12);                 // 2 pi sqrt(25)
    const collapsed = envelopeMax(nbar, 4 * tc, 0.55 * tr, 6000); // dead zone
    const revival = envelopeMax(nbar, 0.85 * tr, 1.15 * tr, 6000);
    expect(collapsed).toBeLessThan(0.2);                          // genuinely collapsed
    expect(revival).toBeGreaterThan(0.4);                         // genuine revival
    expect(revival / collapsed).toBeGreaterThan(3);
    // the revival peak sits within 10% of t_r = 2 pi sqrt(nbar)/g
    const P = photonDist(nbar);
    let tPeak = tr, best = 0;
    for (let i = 0; i <= 8000; i += 1) {
      const t = 0.7 * tr + 0.6 * tr * i / 8000;
      const a = Math.abs(inversionAt(t, nbar, g, P));
      if (a > best) { best = a; tPeak = t; }
    }
    expect(Math.abs(tPeak - tr) / tr).toBeLessThan(0.1);
  });

  it('the Rabi-envelope collapse time is O(sqrt2/g) and independent of nbar', () => {
    expect(collapseTime(2) * 2).toBeCloseTo(Math.SQRT2, 12);
    // Collapse acts on the envelope of the fast Rabi oscillation, not
    // on the raw signal (whose first zero is the Rabi period ~ 1/sqrt
    // nbar). Track the peak of |W| in successive windows and take the
    // 1/e time of that upper envelope: it must be the same for every
    // nbar (the collapse is set by the frequency spread, ~ g, alone).
    const envDecay = (nbar) => {
      const P = photonDist(nbar);
      const env = [];
      let curMax = 0, acc = 0;
      for (let t = 0; t < 8; t += 0.002) {
        curMax = Math.max(curMax, Math.abs(inversionAt(t, nbar, g, P)));
        acc += 0.002;
        if (acc >= 0.25) { env.push([t, curMax]); curMax = 0; acc = 0; }
      }
      const e0 = env[0][1];
      for (const [tt, vv] of env) if (vv < 0.368 * e0) return tt;
      return 8;
    };
    const ds = [10, 20, 30, 40, 60].map(envDecay);
    for (const d of ds) {
      expect(d).toBeGreaterThan(collapseTime(g));                   // O(sqrt2/g)
      expect(d).toBeLessThan(2 * collapseTime(g));
      expect(Math.abs(d - ds[0]) / ds[0]).toBeLessThan(0.01);       // nbar-independent
    }
  });

  it('the coherent-field photon distribution is Poissonian: norm 1, mean = variance = nbar', () => {
    for (const nbar of [4, 25, 64]) {
      const m = distMoments(photonDist(nbar));
      expect(m.norm).toBeCloseTo(1, 9);
      expect(m.mean / nbar).toBeCloseTo(1, 4);
      expect(m.variance / nbar).toBeCloseTo(1, 2);                 // Poisson: var = mean
    }
  });

  it('deterministic: identical inputs reproduce the series bit-for-bit', () => {
    const a = inversionSeries(40, 600, 25, g);
    const b = inversionSeries(40, 600, 25, g);
    for (let i = 0; i <= 600; i += 1) { expect(a.w[i]).toBe(b.w[i]); expect(a.t[i]).toBe(b.t[i]); }
  });
});
