// Double Pendulum invariant tests.
// Headless Vitest gate at seed 0xC0FFEE. Imports the shared symplectic engine
// and the local sim module; no DOM, no window.

import { describe, it, expect } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  create as engineCreate,
  step as engineStep,
  diagnostics as engineDiagnostics,
} from '../../../shared/js/engine/symplectic.js';

import {
  makeAccel,
  makeEnergy,
  makeAngularMomentum,
  envelopeCap,
  G,
  PHYSICS_DT,
} from './sim.js';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const FAILURES_DIR = path.join(__dirname, 'failures');
const SEED_TAG     = '0xC0FFEE';

function buildInst(ic, params, masses) {
  return engineCreate({
    positions:  Float64Array.from([ic.theta1, ic.theta2]),
    velocities: Float64Array.from([ic.omega1 ?? 0, ic.omega2 ?? 0]),
    masses:     Float64Array.from(masses),
    accelerationFn:     makeAccel(params),
    energyFn:           makeEnergy(params),
    angularMomentumFn:  makeAngularMomentum(params),
    integrator: 'verlet',
  });
}

function dumpTrace(name, header, rows) {
  mkdirSync(FAILURES_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const csvPath = path.join(FAILURES_DIR, `${name}-${ts}.csv`);
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  writeFileSync(csvPath, csv);
  return csvPath;
}

describe('Double pendulum: strong invariants', () => {
  it('|dE/E| < 1e-3 over 10^4 steps at the default IC (theta1=0.5, theta2=-0.3, at rest)', () => {
    const inst = buildInst({ theta1: 0.5, theta2: -0.3 }, { l1: 1, l2: 1 }, [1, 1]);
    let maxAbs = 0;
    const trace = [];
    for (let i = 0; i < 10_000; i += 1) {
      engineStep(inst, PHYSICS_DT);
      const d = engineDiagnostics(inst);
      const abs = Math.abs(d.energyDrift);
      if (abs > maxAbs) maxAbs = abs;
      if (i % 200 === 0) trace.push([i, inst.q[0], inst.q[1], d.energy, d.energyDrift]);
    }
    if (!(maxAbs < 1e-3)) {
      const csv = dumpTrace('energy-default-ic', ['n', 'theta1', 'theta2', 'E', 'dE_over_E'], trace);
      throw new Error(`|dE/E| max ${maxAbs.toExponential(2)} >= 1e-3 (seed=${SEED_TAG}); trace: ${csv}`);
    }
    expect(maxAbs).toBeLessThan(1e-3);
  });

  it('default IC sits below the energy cap (E < 0.85 * E_ref)', () => {
    const inst = buildInst({ theta1: 0.5, theta2: -0.3 }, { l1: 1, l2: 1 }, [1, 1]);
    const E0 = engineDiagnostics(inst).energy;
    const cap = envelopeCap(1, 1, 1, 1);
    expect(E0).toBeLessThan(cap);
  });

  it('small-amplitude eigenfrequencies match analytic linearization within 1 percent', () => {
    // At m1=m2=1, l1=l2=1, g=9.81 the linearized double pendulum has eigenfrequencies
    //   omega_+/- = sqrt(g (2 +/- sqrt(2)))
    // i.e., omega- ~ 2.397 rad/s, omega+ ~ 5.787 rad/s.
    // Integrate the system at small amplitude theta1=0.03, theta2=0 at rest for 30 s
    // and measure the dominant frequencies via DFT.
    const inst = buildInst({ theta1: 0.03, theta2: 0 }, { l1: 1, l2: 1 }, [1, 1]);
    const T_total = 30;                                                  // s
    const N_steps = Math.round(T_total / PHYSICS_DT);
    const sample_stride = 10;
    const samples = [];
    for (let i = 0; i < N_steps; i += 1) {
      engineStep(inst, PHYSICS_DT);
      if (i % sample_stride === 0) samples.push(inst.q[0]);
    }
    const N = samples.length;
    const dt_sample = sample_stride * PHYSICS_DT;
    const fs = 1 / dt_sample;
    // Window with Hann to suppress leakage.
    const windowed = samples.map((x, i) => x * 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1))));
    // Compute power spectrum on a narrow band [0.1, 2] Hz (covers both expected peaks).
    const f_min = 0.1, f_max = 2.0;
    const df = 0.001;
    const peaks = [];
    for (let f = f_min; f <= f_max; f += df) {
      let re = 0, im = 0;
      const omega = 2 * Math.PI * f / fs;
      for (let n = 0; n < N; n += 1) {
        re += windowed[n] * Math.cos(omega * n);
        im -= windowed[n] * Math.sin(omega * n);
      }
      peaks.push({ f, p: re * re + im * im });
    }
    // Find two local maxima with the highest power.
    const localMax = [];
    for (let i = 5; i < peaks.length - 5; i += 1) {
      if (peaks[i].p > peaks[i - 1].p && peaks[i].p > peaks[i + 1].p) localMax.push(peaks[i]);
    }
    localMax.sort((a, b) => b.p - a.p);
    const top = localMax.slice(0, 2).map(p => p.f).sort((a, b) => a - b);

    const target_low_Hz  = Math.sqrt(G * (2 - Math.sqrt(2))) / (2 * Math.PI);
    const target_high_Hz = Math.sqrt(G * (2 + Math.sqrt(2))) / (2 * Math.PI);
    const relLow  = Math.abs(top[0] - target_low_Hz)  / target_low_Hz;
    const relHigh = Math.abs(top[1] - target_high_Hz) / target_high_Hz;
    if (!(relLow < 0.01 && relHigh < 0.01)) {
      const csv = dumpTrace('eigenfreq', ['f_Hz', 'power'], peaks.map(p => [p.f, p.p]));
      throw new Error(
        `eigenfrequencies off: measured ${top[0].toFixed(4)} Hz, ${top[1].toFixed(4)} Hz; ` +
        `targets ${target_low_Hz.toFixed(4)} Hz, ${target_high_Hz.toFixed(4)} Hz; trace: ${csv}`,
      );
    }
    expect(relLow).toBeLessThan(0.01);
    expect(relHigh).toBeLessThan(0.01);
  });

  it('single-mass limit (m2 -> 0) recovers simple pendulum period within 0.5 percent', () => {
    // Set m2 = 1e-3 kg, l2 = 1 m, m1 = 1 kg, l1 = 1 m. Drive theta1 to 0.1 rad at rest,
    // theta2 = 0 at rest. Period of theta1 should approach T = 2 pi sqrt(l1 / g).
    const inst = buildInst({ theta1: 0.1, theta2: 0 }, { l1: 1, l2: 1 }, [1, 1e-3]);
    const T_analytic = 2 * Math.PI * Math.sqrt(1 / G);
    // Measure period by zero-crossings (with positive omega1) of theta1.
    const N_steps   = Math.round(20 * T_analytic / PHYSICS_DT);
    let prevTheta = inst.q[0], prevOmega = inst.qdot[0];
    let firstCrossT = null, lastCrossT = null;
    let crossings = 0;
    let t = 0;
    for (let i = 0; i < N_steps; i += 1) {
      engineStep(inst, PHYSICS_DT);
      t += PHYSICS_DT;
      const th = inst.q[0], om = inst.qdot[0];
      // upward zero-crossing (-> +)
      if (prevTheta < 0 && th >= 0) {
        const alpha = -prevTheta / (th - prevTheta);
        const omAt = prevOmega + alpha * (om - prevOmega);
        if (omAt > 0) {
          const tCross = t - PHYSICS_DT * (1 - alpha);
          if (firstCrossT === null) firstCrossT = tCross;
          lastCrossT = tCross;
          crossings += 1;
        }
      }
      prevTheta = th; prevOmega = om;
    }
    expect(crossings).toBeGreaterThan(2);
    const T_measured = (lastCrossT - firstCrossT) / (crossings - 1);
    expect(Math.abs(T_measured - T_analytic) / T_analytic).toBeLessThan(0.005);
  });
});

describe('Double pendulum: medium invariants', () => {
  it('angular momentum L_z is NOT conserved (|L_z - L_z0| > 0.1 within 1000 steps)', () => {
    const inst = buildInst({ theta1: 0.5, theta2: -0.3 }, { l1: 1, l2: 1 }, [1, 1]);
    const L0 = engineDiagnostics(inst).angularMomentum;
    let maxDev = 0;
    for (let i = 0; i < 1000; i += 1) {
      engineStep(inst, PHYSICS_DT);
      const L = engineDiagnostics(inst).angularMomentum;
      const dev = Math.abs(L - L0);
      if (dev > maxDev) maxDev = dev;
    }
    expect(maxDev).toBeGreaterThan(0.1);
  });
});

describe('Double pendulum: capture-time reproducibility', () => {
  it('same seed and same IC produce bit-identical snapshots after 3 s', () => {
    function buildAndRun() {
      const inst = buildInst({ theta1: 0.5, theta2: -0.3 }, { l1: 1, l2: 1 }, [1, 1]);
      const N = Math.round(3 / PHYSICS_DT);
      for (let i = 0; i < N; i += 1) engineStep(inst, PHYSICS_DT);
      return { theta1: inst.q[0], theta2: inst.q[1], omega1: inst.qdot[0], omega2: inst.qdot[1] };
    }
    const a = buildAndRun();
    const b = buildAndRun();
    expect(a.theta1).toBe(b.theta1);
    expect(a.theta2).toBe(b.theta2);
    expect(a.omega1).toBe(b.omega1);
    expect(a.omega2).toBe(b.omega2);
  });
});
