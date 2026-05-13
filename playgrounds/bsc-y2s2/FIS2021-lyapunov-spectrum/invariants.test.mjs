// Lyapunov Spectrum invariant tests.
// Headless Vitest gate at seed 0xC0FFEE (no RNG used; iteration is deterministic).

import { describe, it, expect } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { lyapunovSpectrum, attractorPoints } from './sim.js';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const FAILURES_DIR = path.join(__dirname, 'failures');
const SEED_TAG     = '0xC0FFEE';

function dumpTrace(name, header, rows) {
  mkdirSync(FAILURES_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const csvPath = path.join(FAILURES_DIR, `${name}-${ts}.csv`);
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  writeFileSync(csvPath, csv);
  return csvPath;
}

describe('lyapunov-spectrum: strong invariants', () => {
  it('trace identity lambda_1 + lambda_2 = ln|b| within 1e-10 at canonical (1.4, 0.3)', () => {
    const r = lyapunovSpectrum(1.4, 0.3);
    const err = Math.abs(r.sum - r.sumTarget);
    if (!(err < 1e-10)) {
      dumpTrace('trace-canonical', ['lambda1', 'lambda2', 'sum', 'sumTarget', 'err'],
                [[r.lambda1, r.lambda2, r.sum, r.sumTarget, err]]);
    }
    expect(err).toBeLessThan(1e-10);
  });

  it('lambda_1 at canonical (1.4, 0.3) within 2 percent of 0.42', () => {
    const r = lyapunovSpectrum(1.4, 0.3);
    const relErr = Math.abs(r.lambda1 - 0.42) / 0.42;
    if (!(relErr < 0.02)) {
      dumpTrace('lambda1-canonical', ['lambda1', 'target', 'relErr'],
                [[r.lambda1, 0.42, relErr]]);
    }
    expect(relErr).toBeLessThan(0.02);
  });

  it('trace identity holds across the (a, b) parameter region', () => {
    const samples = [
      { a: 1.15, b: 0.25 },
      { a: 1.20, b: 0.20 },
      { a: 1.30, b: 0.25 },
      { a: 1.40, b: 0.30 },
    ];
    for (const { a, b } of samples) {
      const r = lyapunovSpectrum(a, b);
      expect(r.bounded).toBe(true);
      const err = Math.abs(r.sum - r.sumTarget);
      expect(err).toBeLessThan(1e-10);
    }
  });
});

describe('lyapunov-spectrum: medium invariants', () => {
  it('lambda_2 negative at all bounded test parameters', () => {
    for (const { a, b } of [
      { a: 1.15, b: 0.25 }, { a: 1.20, b: 0.20 },
      { a: 1.30, b: 0.25 }, { a: 1.40, b: 0.30 },
    ]) {
      const r = lyapunovSpectrum(a, b);
      expect(r.lambda2).toBeLessThan(0);
    }
  });

  it('attractor scatter at canonical params has at least 1000 points inside [-2,2] x [-1,1]', () => {
    const pts = attractorPoints(1.4, 0.3, { count: 5000 });
    let inside = 0;
    for (let i = 0; i < pts.length; i += 2) {
      const x = pts[i], y = pts[i + 1];
      if (x >= -2 && x <= 2 && y >= -1 && y <= 1) inside += 1;
    }
    expect(inside).toBeGreaterThan(1000);
  });
});

describe('lyapunov-spectrum: reproducibility', () => {
  it(`bit-identical results at seed ${SEED_TAG} (deterministic iteration)`, () => {
    const a = lyapunovSpectrum(1.4, 0.3);
    const b = lyapunovSpectrum(1.4, 0.3);
    expect(a.lambda1).toBe(b.lambda1);
    expect(a.lambda2).toBe(b.lambda2);
    expect(a.n).toBe(b.n);
  });
});
