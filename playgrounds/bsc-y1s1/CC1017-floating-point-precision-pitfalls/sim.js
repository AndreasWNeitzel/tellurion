// sim.js
// Catastrophic cancellation in floating-point arithmetic. The "naive"
// formula 1 - cos(x) loses precision for small x because cos(x) is
// computed to full precision but then subtracted from 1, leaving only
// the leading low-order digits. The reformulation
//
//   1 - cos(x) = 2 sin(x/2)^2
//
// avoids the cancellation entirely and stays accurate down to the
// smallest normal floats.
//
// We also show the famous quadratic-formula cancellation:
//
//   x = (-b +/- sqrt(b^2 - 4 a c)) / (2 a)
//
// When b > 0 and 4 a c is small, the "+" branch suffers cancellation;
// fix is x_+ = -2 c / (b + sqrt(b^2 - 4 a c)) using Vieta's relation.
//
// Reference: Newman, Computational Physics Ch. 4 (`newman2013`).

export function oneMinusCosNaive(x) {
  return 1 - Math.cos(x);
}

export function oneMinusCosStable(x) {
  const s = Math.sin(x / 2);
  return 2 * s * s;
}

// Quadratic roots: ill-conditioned form (direct).
export function quadraticNaive(a, b, c) {
  const disc = Math.sqrt(b * b - 4 * a * c);
  return {
    rootPlus:  (-b + disc) / (2 * a),
    rootMinus: (-b - disc) / (2 * a),
  };
}

// Quadratic roots: stable form (Vieta-fix when sign matters).
export function quadraticStable(a, b, c) {
  const disc = Math.sqrt(b * b - 4 * a * c);
  let rootMinus, rootPlus;
  if (b >= 0) {
    rootMinus = (-b - disc) / (2 * a);
    rootPlus  = c / (a * rootMinus);
  } else {
    rootPlus  = (-b + disc) / (2 * a);
    rootMinus = c / (a * rootPlus);
  }
  return { rootPlus, rootMinus };
}

// Relative error between two non-zero values.
export function relErr(approx, exact) {
  if (exact === 0) return Math.abs(approx);
  return Math.abs(approx - exact) / Math.abs(exact);
}

// Generate sample x values logarithmically spaced from 1e-16 to 1e0.
export function logspace(logFrom, logTo, count) {
  const out = new Float64Array(count);
  for (let i = 0; i < count; i += 1) {
    out[i] = Math.pow(10, logFrom + (logTo - logFrom) * i / (count - 1));
  }
  return out;
}

// === Accumulating clock-drift from a truncated 0.1 ===
//
// A long-running real-time tracker keeps system time as an integer count
// of 0.1 s ticks and multiplies by a 24-bit fixed-point copy of 0.1 to get
// seconds. 0.1 is not exact in binary; chopped to 24 bits it is
// 209715 / 2097152 = 0.0999999046..., so every tick is short by ~9.54e-8 s.
// The error is never reset while the system stays powered, so it grows
// linearly with uptime; after ~100 h the clock is off by ~0.34 s. The
// tracker uses that clock to place a prediction gate (the window where it
// expects a fast moving object next), so the gate is displaced from the
// true position by the clock error times the object's speed: hundreds of
// metres at high speed, and once that exceeds the gate the object is
// missed. The canonical lesson that a tiny rounding error in a repeated
// constant can accumulate into a gross failure. Reference: Goldberg, ACM
// Comput. Surv. 23(1), 1991 (`goldberg1991`).

export const TICK_S = 0.1;
// 0.1 chopped into a 24-bit fixed-point register (0.1 * 2^21 truncated).
const CHOPPED_TENTH = 209715 / 2097152;
export const ERR_PER_TICK_S = TICK_S - CHOPPED_TENTH;
export const DEFAULT_SPEED_MS = 1676;          // a fast tracked object

export function clockTicks(hoursUp) {
  return hoursUp * 3600 / TICK_S;
}

// Accumulated clock error (s) after `hoursUp` of continuous uptime.
// `patched` models the corrected software (exact time): no drift.
export function clockError(hoursUp, patched = false) {
  if (patched) return 0;
  return clockTicks(hoursUp) * ERR_PER_TICK_S;
}

// Prediction-gate displacement (m): how far the gate the tracker opens is
// from the object's true position, given the clock error and object speed.
export function gateDisplacementMeters(hoursUp, speed = DEFAULT_SPEED_MS, patched = false) {
  return clockError(hoursUp, patched) * speed;
}
