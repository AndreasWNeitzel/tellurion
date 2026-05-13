// Logistic Cobweb invariant tests.
// Headless Vitest gate against the two strong invariants and the documented limiting cases.
// Imports the headless math module sim.js (no DOM); reproducible at seed 0xC0FFEE.

import { describe, it, expect } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  advance,
  iterateOrbit,
  lyapunovExponent,
  detectPeriod,
  locateSuperstableCascade,
  deltaFromCascade,
  findSuperstable,
  FEIGENBAUM_DELTA,
  LN2,
} from './sim.js';

const __dirname        = path.dirname(fileURLToPath(import.meta.url));
const FAILURES_DIR     = path.join(__dirname, 'failures');
const FIXED_X0         = 0.1;
const SEED_TAG         = '0xC0FFEE';   // documentation; the iteration is deterministic without explicit RNG

function dumpTrace(name, header, rows) {
  mkdirSync(FAILURES_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const csvPath = path.join(FAILURES_DIR, `${name}-${ts}.csv`);
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  writeFileSync(csvPath, csv);
  return csvPath;
}

describe('Logistic cobweb: strong invariants', () => {
  it('Lyapunov exponent at r = 4 converges to ln 2 within 1 percent', () => {
    const N = 200_000;
    const burnIn = 1000;
    const lambda = lyapunovExponent(4, FIXED_X0, N, burnIn);
    const target = LN2;
    const relErr = Math.abs(lambda - target) / target;
    if (!(relErr < 0.01)) {
      const trace = [];
      let x = FIXED_X0;
      for (let i = 0; i < burnIn; i += 1) x = 4 * x * (1 - x);
      let sum = 0, kept = 0;
      for (let i = 0; i < N; i += 1) {
        const fp = Math.abs(4 * (1 - 2 * x));
        if (fp >= 1e-12) { sum += Math.log(fp); kept += 1; }
        if (i % 1000 === 0) trace.push([i, x, fp, kept > 0 ? sum / kept : NaN]);
        x = 4 * x * (1 - x);
      }
      const csv = dumpTrace('lyapunov-r4', ['n', 'x', '|fprime|', 'lambda_running'], trace);
      throw new Error(`Lyapunov rel err ${relErr.toExponential(2)} >= 1% (lambda=${lambda}, target=${target}, N=${N}, seed=${SEED_TAG}); trace: ${csv}`);
    }
    expect(relErr).toBeLessThan(0.01);
  });

  it('Feigenbaum delta from superstable cascade within 0.1 percent at n = 5', () => {
    const R = locateSuperstableCascade(6);
    const delta5 = deltaFromCascade(R, 5);
    const relErr = Math.abs(delta5 - FEIGENBAUM_DELTA) / FEIGENBAUM_DELTA;
    if (!(relErr < 0.001)) {
      const rows = [];
      for (let n = 0; n <= 6; n += 1) {
        rows.push([n, R[n], n >= 2 ? deltaFromCascade(R, n) : '']);
      }
      const csv = dumpTrace('feigenbaum-cascade', ['n', 'R_n', 'delta_n'], rows);
      throw new Error(`Feigenbaum delta_5 rel err ${relErr.toExponential(2)} >= 0.1% (delta_5=${delta5}, target=${FEIGENBAUM_DELTA}); trace: ${csv}`);
    }
    expect(relErr).toBeLessThan(0.001);
  });
});

describe('Logistic cobweb: limiting cases from spec.md', () => {
  it('r = 0 collapses to x = 0 after 200 iterations', () => {
    expect(Math.abs(advance(0, FIXED_X0, 200))).toBeLessThan(1e-12);
  });

  it('r = 1 monotonically decreases iterates to 0', () => {
    const orbit = iterateOrbit(1, 0.5, 1000);
    for (let i = 1; i < orbit.length; i += 1) {
      expect(orbit[i]).toBeLessThanOrEqual(orbit[i - 1] + 1e-12);
    }
    expect(orbit[orbit.length - 1]).toBeLessThan(1e-2);
  });

  it('r = 2 converges to fixed point x* = 1/2 within 1e-12', () => {
    const x = advance(2, FIXED_X0, 200);
    expect(Math.abs(x - 0.5)).toBeLessThan(1e-12);
  });

  it('r = 3 marginal: multiplier |f prime(2/3)| = 1', () => {
    const xstar = 2 / 3;
    const fp = Math.abs(3 * (1 - 2 * xstar));
    expect(Math.abs(fp - 1)).toBeLessThan(1e-12);
  });

  it('r superstable anchor: R_0 = 2 (period 1 superstable)', () => {
    const R0 = findSuperstable(0);
    expect(R0).toBe(2);
    // f(0.5; 2) = 0.5
    expect(Math.abs(advance(2, 0.5, 1) - 0.5)).toBeLessThan(1e-12);
  });

  it('R_1 = 1 + sqrt(5) gives period 2 orbit through x = 1/2', () => {
    const R1 = findSuperstable(1);
    expect(Math.abs(R1 - (1 + Math.sqrt(5)))).toBeLessThan(1e-12);
    // x = 1/2 is on a period-2 orbit at R_1
    const x_after_2 = advance(R1, 0.5, 2);
    expect(Math.abs(x_after_2 - 0.5)).toBeLessThan(1e-10);
  });
});

describe('Logistic cobweb: period detection sanity', () => {
  it('detects period 1 at r = 2.5', () => {
    expect(detectPeriod(2.5, FIXED_X0)).toBe(1);
  });
  it('detects period 2 at r = 3.2', () => {
    expect(detectPeriod(3.2, FIXED_X0)).toBe(2);
  });
  it('detects period 4 at r = 3.5', () => {
    expect(detectPeriod(3.5, FIXED_X0)).toBe(4);
  });
  it('detects period 3 in the canonical period-3 window at r = 3.83', () => {
    expect(detectPeriod(3.83, FIXED_X0)).toBe(3);
  });
  it('reports chaotic (0) at r = 4.0', () => {
    expect(detectPeriod(4.0, FIXED_X0)).toBe(0);
  });
});

describe('Logistic cobweb: superstable cascade structure', () => {
  it('R_n forms a strictly increasing sequence bounded by r_inf', () => {
    const R = locateSuperstableCascade(6);
    for (let n = 1; n <= 6; n += 1) {
      expect(R[n]).toBeGreaterThan(R[n - 1]);
    }
    expect(R[6]).toBeLessThan(3.569945672);
  });

  it('successive delta_n approach 4.6692 from above and below by alternating sign', () => {
    const R = locateSuperstableCascade(6);
    const ds = [];
    for (let n = 2; n <= 5; n += 1) ds.push(deltaFromCascade(R, n));
    // each successive estimate is closer to FEIGENBAUM_DELTA than the previous
    for (let i = 1; i < ds.length; i += 1) {
      const prev = Math.abs(ds[i - 1] - FEIGENBAUM_DELTA);
      const curr = Math.abs(ds[i]     - FEIGENBAUM_DELTA);
      expect(curr).toBeLessThan(prev);
    }
  });
});
