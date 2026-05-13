#!/usr/bin/env node
// scripts/bench-engines.mjs
// Benchmark every engine in shared/js/engine/. Measures time per step at
// three problem sizes per engine. Writes bench/<iso8601>.json and compares
// against bench/baseline.json. Warns (but does not fail) when the new run
// is more than 20 percent slower per step than baseline.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  create as symCreate, step as symStep,
} from '../shared/js/engine/symplectic.js';
import {
  createRWM, createMALA, createHMC,
  gaussian2dTarget, bananaTarget,
} from '../shared/js/engine/mcmc-harness.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const BENCH_DIR = path.join(ROOT, 'bench');
const BASELINE  = path.join(BENCH_DIR, 'baseline.json');

const REGRESSION_THRESHOLD = 0.20;    // warn over 20 percent slower

function now() {
  return (typeof performance !== 'undefined') ? performance.now() : Date.now();
}

// ==== symplectic harmonic oscillator ====================================

function symHarmonicAccel(q, _qdot, _m, _t, out) {
  for (let i = 0; i < q.length; i += 1) out[i] = -q[i];
}
function symHarmonicEnergy(q, qdot, m) {
  let E = 0;
  for (let i = 0; i < q.length; i += 1) {
    E += 0.5 * m[i] * (qdot[i] * qdot[i] + q[i] * q[i]);
  }
  return E;
}

function benchSymplectic(integrator, dim, nSteps) {
  const positions  = new Float64Array(dim);
  const velocities = new Float64Array(dim);
  for (let i = 0; i < dim; i += 1) {
    positions[i] = 1;
    velocities[i] = 0;
  }
  const inst = symCreate({
    positions, velocities, masses: 1,
    accelerationFn: symHarmonicAccel,
    energyFn: symHarmonicEnergy,
    integrator,
  });
  // warm-up
  for (let i = 0; i < 1000; i += 1) symStep(inst, 0.01);
  // measure
  const t0 = now();
  for (let i = 0; i < nSteps; i += 1) symStep(inst, 0.01);
  const t1 = now();
  return (t1 - t0) / nSteps;          // ms per step
}

// ==== mcmc-harness ======================================================

function benchMCMC(method, target, nSteps) {
  const params = {
    rwm: { sigma: 1.2 },
    mala: { stepSize: 0.5 },
    hmc: { stepSize: 0.15, nLeapfrog: 20 },
  }[method];
  const chain = method === 'rwm'  ? createRWM ({ target, x0: [0, 0], ...params, seed: 1 })
              : method === 'mala' ? createMALA({ target, x0: [0, 0], ...params, seed: 1 })
              : createHMC ({ target, x0: [0, 0], ...params, seed: 1 });
  for (let i = 0; i < 200; i += 1) chain.step();
  const t0 = now();
  for (let i = 0; i < nSteps; i += 1) chain.step();
  const t1 = now();
  return (t1 - t0) / nSteps;
}

// ==== main ==============================================================

async function main() {
  const results = {
    timestamp: new Date().toISOString(),
    node: process.version,
    engines: {},
  };

  // symplectic
  results.engines.symplectic = {
    verlet_dim2_nsteps1e5:   benchSymplectic('verlet',   2,   100_000),
    verlet_dim10_nsteps1e5:  benchSymplectic('verlet',   10,  100_000),
    verlet_dim100_nsteps1e4: benchSymplectic('verlet',   100, 10_000),
    yoshida4_dim2_nsteps1e5: benchSymplectic('yoshida4', 2,   100_000),
  };

  // mcmc-harness
  const gauss = gaussian2dTarget();
  const banana = bananaTarget();
  results.engines.mcmc_harness = {
    rwm_gauss_1e5:   benchMCMC('rwm',  gauss,  100_000),
    mala_gauss_1e5:  benchMCMC('mala', gauss,  100_000),
    hmc_banana_5e4:  benchMCMC('hmc',  banana, 50_000),
  };

  // Save
  await fs.mkdir(BENCH_DIR, { recursive: true });
  const safeTs = results.timestamp.replace(/[:.]/g, '-');
  const outPath = path.join(BENCH_DIR, `${safeTs}.json`);
  await fs.writeFile(outPath, JSON.stringify(results, null, 2));
  console.log(`Wrote ${outPath}`);

  // Compare against baseline if present
  let baseline = null;
  try {
    baseline = JSON.parse(await fs.readFile(BASELINE, 'utf-8'));
  } catch {
    // First run: copy current as the baseline.
    await fs.writeFile(BASELINE, JSON.stringify(results, null, 2));
    console.log('No baseline found; wrote current run as bench/baseline.json');
    return;
  }
  console.log('\nComparison vs bench/baseline.json:');
  let regressed = false;
  for (const [eng, cur] of Object.entries(results.engines)) {
    const base = baseline.engines?.[eng] ?? {};
    for (const [bench, v] of Object.entries(cur)) {
      const baseV = base[bench];
      if (baseV == null) {
        console.log(`  ${eng}.${bench}: ${v.toFixed(4)} ms/step (new)`);
        continue;
      }
      const delta = (v - baseV) / baseV;
      const tag = delta > REGRESSION_THRESHOLD ? ' WARN-REGRESSED'
                : delta < -0.10                ? ' (faster)'
                : '';
      console.log(`  ${eng}.${bench}: ${v.toFixed(4)} ms/step vs ${baseV.toFixed(4)} (${(100 * delta).toFixed(1)}%)${tag}`);
      if (delta > REGRESSION_THRESHOLD) regressed = true;
    }
  }
  if (regressed) {
    console.log('\nWARN: at least one benchmark is more than 20 percent slower than baseline.');
  } else {
    console.log('\nNo regressions over 20 percent.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(2);
});
