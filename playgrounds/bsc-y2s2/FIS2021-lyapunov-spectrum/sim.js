// sim.js
// Pure, DOM-free numerical core for the lyapunov-spectrum playground.
// Imported by playground.js (UI) and invariants.test.mjs (tests).
//
// System: Henon map x_{n+1} = 1 - a x_n^2 + y_n, y_{n+1} = b x_n.
// Spectrum: Benettin QR on a 2x2 orthonormal frame Q with modified Gram-Schmidt.
// Reference: Benettin, Galgani, Giorgilli, Strelcyn 1980 (Meccanica 15, 9-20).

export const BURN_IN_DEFAULT = 1000;
export const ACCUM_DEFAULT   = 100_000;
export const OVERFLOW_LIMIT  = 10;
export const SINGULAR_EPS    = 1e-15;

// One Henon step. Allocates nothing.
export function henonStep(state, a, b) {
  const x = state[0], y = state[1];
  state[0] = 1 - a * x * x + y;
  state[1] = b * x;
}

// Result of a Lyapunov-spectrum run.
//   lambda1, lambda2: the two exponent estimates.
//   sum, sumTarget:   lambda1+lambda2 and ln|b| respectively.
//   n:                number of accumulated terms (after skips).
//   skipped:          number of singular-frame skips.
//   bounded:          false if the orbit overflowed.
//   lowConfidence:    true if skipped > 1 percent of n.
export function lyapunovSpectrum(a, b, opts = {}) {
  const burnIn = opts.burnIn ?? BURN_IN_DEFAULT;
  const accum  = opts.accum  ?? ACCUM_DEFAULT;
  const x0     = opts.x0     ?? 0.1;
  const y0     = opts.y0     ?? 0.1;

  const state = new Float64Array([x0, y0]);
  // Burn-in (no QR accumulation).
  for (let i = 0; i < burnIn; i += 1) {
    henonStep(state, a, b);
    if (!Number.isFinite(state[0]) || Math.abs(state[0]) > OVERFLOW_LIMIT
        || Math.abs(state[1]) > OVERFLOW_LIMIT) {
      return {
        lambda1: NaN, lambda2: NaN, sum: NaN, sumTarget: Math.log(Math.abs(b)),
        n: 0, skipped: 0, bounded: false, lowConfidence: true,
      };
    }
  }

  // Q = I_{2x2} as Float64Array column-major: Q = [q1_x, q1_y, q2_x, q2_y].
  const Q = new Float64Array([1, 0, 0, 1]);
  let L1 = 0, L2 = 0;
  let kept = 0;
  let skipped = 0;
  let bounded = true;

  for (let i = 0; i < accum; i += 1) {
    const x = state[0];
    // J = [[-2 a x, 1], [b, 0]]; Q' = J Q.
    // Q' columns: c1 = (-2 a x * q1_x + q1_y, b * q1_x); c2 = (-2 a x * q2_x + q2_y, b * q2_x)
    const tax = -2 * a * x;
    const q1x = Q[0], q1y = Q[1];
    const q2x = Q[2], q2y = Q[3];
    let c1x = tax * q1x + q1y;
    let c1y = b * q1x;
    const c2x = tax * q2x + q2y;
    const c2y = b * q2x;
    // Modified Gram-Schmidt: r1 = ||c1||, q1 = c1/r1.
    const r1 = Math.hypot(c1x, c1y);
    if (r1 < SINGULAR_EPS) {
      skipped += 1;
    } else {
      L1 += Math.log(r1);
      c1x /= r1; c1y /= r1;
    }
    // r12 = q1 dot c2.
    const r12 = c1x * c2x + c1y * c2y;
    let u2x = c2x - r12 * c1x;
    let u2y = c2y - r12 * c1y;
    const r2 = Math.hypot(u2x, u2y);
    if (r2 < SINGULAR_EPS) {
      skipped += 1;
    } else {
      L2 += Math.log(r2);
      u2x /= r2; u2y /= r2;
    }
    Q[0] = c1x; Q[1] = c1y; Q[2] = u2x; Q[3] = u2y;
    kept += 1;
    // Advance the orbit.
    henonStep(state, a, b);
    if (!Number.isFinite(state[0]) || Math.abs(state[0]) > OVERFLOW_LIMIT
        || Math.abs(state[1]) > OVERFLOW_LIMIT) {
      bounded = false;
      break;
    }
  }

  const lambda1 = L1 / Math.max(kept, 1);
  const lambda2 = L2 / Math.max(kept, 1);
  const sum     = lambda1 + lambda2;
  const sumTarget = Math.log(Math.abs(b));
  const lowConfidence = !bounded || skipped > 0.01 * Math.max(kept, 1);
  return { lambda1, lambda2, sum, sumTarget, n: kept, skipped, bounded, lowConfidence };
}

// Iterate the Henon map and collect attractor points after a burn-in.
// Returns a Float64Array of length 2 * count interleaved as [x_0, y_0, x_1, y_1, ...].
export function attractorPoints(a, b, opts = {}) {
  const burnIn = opts.burnIn ?? 200;
  const count  = opts.count  ?? 5000;
  const x0     = opts.x0     ?? 0.1;
  const y0     = opts.y0     ?? 0.1;
  const out = new Float64Array(2 * count);
  const state = new Float64Array([x0, y0]);
  for (let i = 0; i < burnIn; i += 1) {
    henonStep(state, a, b);
    if (!Number.isFinite(state[0]) || Math.abs(state[0]) > OVERFLOW_LIMIT
        || Math.abs(state[1]) > OVERFLOW_LIMIT) {
      return out.slice(0, 0);
    }
  }
  for (let i = 0; i < count; i += 1) {
    henonStep(state, a, b);
    if (!Number.isFinite(state[0]) || Math.abs(state[0]) > OVERFLOW_LIMIT
        || Math.abs(state[1]) > OVERFLOW_LIMIT) {
      return out.slice(0, 2 * i);
    }
    out[2 * i]     = state[0];
    out[2 * i + 1] = state[1];
  }
  return out;
}
