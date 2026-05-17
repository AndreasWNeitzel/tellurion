// Two-dimensional Brownian motion of an ensemble of independent
// walkers. Each axis gets a Gaussian increment of variance 2 D dt per
// step, so the mean-squared displacement grows as <r^2> = 4 D t and the
// displacement distribution is Gaussian (the central-limit / Einstein
// result). The diffusion coefficient follows the Stokes-Einstein
// relation D = kB T / (6 pi eta r). Headless and deterministic given a
// seed. Reference: Reif, Fundamentals of Statistical and Thermal
// Physics, Ch. 1 (random walk) and Sec. 15.5-15.6 (Einstein relation).

import { makeRng } from '../../../shared/js/render/rng.js';

export const kB = 1.380649e-23;

export function stokesEinstein(T, eta, r) { return kB * T / (6 * Math.PI * eta * r); }

// Standard-normal sample from a uniform rng (Box-Muller, cached pair).
function makeGauss(rng) {
  let spare = null;
  return () => {
    if (spare !== null) { const s = spare; spare = null; return s; }
    let u = 0, v = 0;
    while (u <= 1e-12) u = rng();
    v = rng();
    const mag = Math.sqrt(-2 * Math.log(u));
    spare = mag * Math.sin(2 * Math.PI * v);
    return mag * Math.cos(2 * Math.PI * v);
  };
}

export function createEnsemble(N, seed = 0xC0FFEE) {
  const rng = makeRng(seed);
  return { N, x: new Float64Array(N), y: new Float64Array(N), t: 0, gauss: makeGauss(rng) };
}

export function step(ens, dt, D) {
  const sd = Math.sqrt(2 * D * dt), g = ens.gauss;
  for (let i = 0; i < ens.N; i += 1) { ens.x[i] += sd * g(); ens.y[i] += sd * g(); }
  ens.t += dt;
}

export function msd(ens) {
  let s = 0; for (let i = 0; i < ens.N; i += 1) s += ens.x[i] * ens.x[i] + ens.y[i] * ens.y[i];
  return s / ens.N;
}

export function moments(ens) {
  let mx = 0, my = 0, x2 = 0, y2 = 0;
  for (let i = 0; i < ens.N; i += 1) { mx += ens.x[i]; my += ens.y[i]; x2 += ens.x[i] ** 2; y2 += ens.y[i] ** 2; }
  return { mx: mx / ens.N, my: my / ens.N, x2: x2 / ens.N, y2: y2 / ens.N };
}

export function theoreticalMSD(D, t) { return 4 * D * t; }

// Abramowitz & Stegun 7.1.26 error function (max abs error ~1.5e-7).
export function erf(x) {
  const s = Math.sign(x); x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}
const normalCdf = (z) => 0.5 * (1 + erf(z / Math.SQRT2));

// Kolmogorov-Smirnov statistic of a sample against the standard normal,
// after standardising the sample to zero mean and unit variance.
export function ksNormal(samples) {
  const n = samples.length;
  let m = 0; for (const v of samples) m += v; m /= n;
  let s = 0; for (const v of samples) s += (v - m) ** 2; s = Math.sqrt(s / n);
  const z = Array.from(samples, v => (v - m) / s).sort((a, b) => a - b);
  let d = 0;
  for (let i = 0; i < n; i += 1) {
    const F = normalCdf(z[i]);
    d = Math.max(d, Math.abs(F - i / n), Math.abs((i + 1) / n - F));
  }
  return d;
}
