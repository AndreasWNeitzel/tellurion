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
