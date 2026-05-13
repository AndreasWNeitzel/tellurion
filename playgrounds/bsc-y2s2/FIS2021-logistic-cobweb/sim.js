// sim.js
// Pure, DOM-free numerical core for the logistic-cobweb playground.
// Imported by playground.js (UI binding) and invariants.test.mjs (headless tests).
//
// The logistic map x_{n+1} = r x_n (1 - x_n) and three derived quantities:
//   1. Lyapunov exponent estimator at a fixed r.
//   2. Period detection from the orbit tail.
//   3. Superstable cascade R_n via bisection on g_n(r) = f^{2^n}(1/2; r) - 1/2.
//
// References:
//   Strogatz, Nonlinear Dynamics and Chaos, 2e, Chapter 10.
//   Newman, Computational Physics, 2013, Ch. 3 Ex. 3.6 (bifurcation diagram).

export const LN2 = Math.log(2);

// Feigenbaum constants (CODATA-style: tabulated to ~15 digits where available).
export const FEIGENBAUM_DELTA = 4.669201609102990;
export const FEIGENBAUM_ALPHA = 2.502907875095892;
export const R_INF            = 3.569945672;             // accumulation point r_inf

// One step of the logistic map. Inlined elsewhere for hot loops.
export function step(r, x) { return r * x * (1 - x); }

// Iterate from x0 for k steps and return the final x (no allocation).
export function advance(r, x0, k) {
  let x = x0;
  for (let i = 0; i < k; i += 1) x = r * x * (1 - x);
  return x;
}

// Iterate and return the full orbit as a Float64Array.
// length includes x0 at index 0, so out[0] = x0, out[1] = f(x0), ..., out[length-1] = f^{length-1}(x0).
export function iterateOrbit(r, x0, length) {
  if (length < 1) return new Float64Array(0);
  const out = new Float64Array(length);
  let x = x0;
  out[0] = x;
  for (let i = 1; i < length; i += 1) {
    x = r * x * (1 - x);
    out[i] = x;
  }
  return out;
}

// Lyapunov exponent estimator.
//   lambda ~ (1 / N_kept) sum_{n=0}^{N-1} ln |f'(x_n)|,  f'(x) = r (1 - 2x)
// Skips terms where |f'(x_n)| < epsZero to avoid ln(0). The skip count is
// negligible under the natural invariant density rho(x) = 1 / (pi sqrt(x(1-x)))
// at r = 4. Returns NaN if no term is kept.
export function lyapunovExponent(r, x0, N, burnIn = 1000, epsZero = 1e-12) {
  let x = x0;
  for (let i = 0; i < burnIn; i += 1) x = r * x * (1 - x);
  let sum = 0;
  let kept = 0;
  for (let i = 0; i < N; i += 1) {
    const fp = Math.abs(r * (1 - 2 * x));
    if (fp >= epsZero) {
      sum += Math.log(fp);
      kept += 1;
    }
    x = r * x * (1 - x);
  }
  return kept > 0 ? sum / kept : Number.NaN;
}

// Detect the period of the attractor at parameter r by tail folding.
//
// After burnIn iterations from x0, collect sampleLen + maxPeriod points.
// For each candidate T from 1 up to maxPeriod, check whether |x_i - x_{i+T}| < tol
// for sampleLen consecutive i. Return the smallest such T, or 0 ("chaotic / no period
// detected within cap") if none qualifies.
//
// Note: detecting non-power-of-two periods (3, 5, 6, ...) is intentional. The logistic
// map has odd-period windows in the chaotic regime (Sharkovskii ordering); the well-known
// period-3 window starts near r = 1 + sqrt(8) ~ 3.828.
//
// At r approaching r_inf the period doubles repeatedly, transients decay slowly, and a
// 4096-iteration burn-in may be insufficient to settle a period-64 orbit; in that regime
// the detector returns 0 and the renderer falls through to "chaotic".
export function detectPeriod(r, x0, opts = {}) {
  const burnIn      = opts.burnIn      ?? 4096;
  const sampleLen   = opts.sampleLen   ?? 64;
  const maxPeriod   = opts.maxPeriod   ?? 64;
  const tol         = opts.tol         ?? 1e-8;

  let x = x0;
  for (let i = 0; i < burnIn; i += 1) x = r * x * (1 - x);

  const need = sampleLen + maxPeriod;
  const tail = new Float64Array(need);
  for (let i = 0; i < need; i += 1) {
    tail[i] = x;
    x = r * x * (1 - x);
  }

  for (let T = 1; T <= maxPeriod; T += 1) {
    let ok = true;
    for (let i = 0; i < sampleLen; i += 1) {
      if (Math.abs(tail[i] - tail[i + T]) > tol) { ok = false; break; }
    }
    if (ok) return T;
  }
  return 0;
}

// f^k(0.5; r) - 0.5, the bisection target whose roots are the superstable parameters R_n with k = 2^n.
function gn(k, r) {
  let x = 0.5;
  for (let i = 0; i < k; i += 1) x = r * x * (1 - x);
  return x - 0.5;
}

// Locate the n-th superstable parameter R_n, defined by g_n(R_n) = 0 where g_n(r) = f^{2^n}(1/2; r) - 1/2.
// Uses bisection inside an adaptive bracket centered on the Feigenbaum extrapolation
//   R_n ~ R_{n-1} + (R_{n-1} - R_{n-2}) / delta.
// Anchors are baked in: R_0 = 2 (period-1 superstable: f(0.5; 2) = 0.5), R_1 = 1 + sqrt(5)
// (period-2 superstable; the closed form comes from solving f(f(0.5; r)) = 0.5 in r).
//
// The bisection runs for ~80 iterations, which is more than enough; double-precision
// limits resolution to ~2^{-52} relative ~ 1e-15 absolute well before then.
export function findSuperstable(n, prev, prevPrev, opts = {}) {
  if (n === 0) return 2;
  if (n === 1) return 1 + Math.sqrt(5);
  if (prev === undefined || prevPrev === undefined) {
    throw new Error(`findSuperstable(n=${n}) needs R_{n-1} and R_{n-2}`);
  }
  const tol  = opts.tol  ?? 1e-12;
  const k    = 1 << n;
  const gap  = prev - prevPrev;
  const predicted = prev + gap / FEIGENBAUM_DELTA;
  // Half-width of the bracket, expanded geometrically until a sign change is found.
  let width = gap / FEIGENBAUM_DELTA * 0.6;
  let lo = predicted, hi = predicted;
  let gLo = 0, gHi = 0;
  let bracketed = false;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    lo = Math.max(prev + 1e-9, predicted - width);
    hi = Math.min(R_INF, predicted + width);
    gLo = gn(k, lo);
    gHi = gn(k, hi);
    if (gLo * gHi < 0 && Number.isFinite(gLo) && Number.isFinite(gHi)) {
      bracketed = true;
      break;
    }
    width *= 1.5;
  }
  if (!bracketed) {
    throw new Error(`findSuperstable: no bracket for R_${n} around r = ${predicted}`);
  }
  for (let i = 0; i < 80 && hi - lo > tol; i += 1) {
    const mid = 0.5 * (lo + hi);
    const gM = gn(k, mid);
    if (gM === 0) return mid;
    if (gM * gLo < 0) { hi = mid; gHi = gM; } else { lo = mid; gLo = gM; }
  }
  return 0.5 * (lo + hi);
}

// Locate R_0 through R_n inclusive. Returns Float64Array of length n+1.
export function locateSuperstableCascade(nMax) {
  const R = new Float64Array(nMax + 1);
  R[0] = 2;
  if (nMax >= 1) R[1] = 1 + Math.sqrt(5);
  for (let n = 2; n <= nMax; n += 1) {
    R[n] = findSuperstable(n, R[n - 1], R[n - 2]);
  }
  return R;
}

// Feigenbaum delta estimate at level n from the superstable cascade:
//   delta_n = (R_{n-1} - R_{n-2}) / (R_n - R_{n-1}).
// Valid for n >= 2.
export function deltaFromCascade(R, n) {
  if (n < 2 || n >= R.length) {
    throw new Error(`deltaFromCascade: n=${n} out of range for cascade length ${R.length}`);
  }
  return (R[n - 1] - R[n - 2]) / (R[n] - R[n - 1]);
}
