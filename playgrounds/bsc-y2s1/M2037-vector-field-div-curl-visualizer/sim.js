// sim.js
// A parameterized 2D vector field F = (P(x,y), Q(x,y)) with closed-form
// divergence and curl. The user picks one of four families and tunes a
// scalar parameter; div and curl are evaluated point-wise from the
// analytic derivatives (no finite differencing required for the
// invariants test).
//
// Reference: Riley-Hobson-Bence, Mathematical Methods Ch. 10
// (`riley-hobson`).

export const FAMILIES = {
  source: {
    label: 'F = a (x, y) (radial source)',
    P: (x, y, a) => a * x,
    Q: (x, y, a) => a * y,
    div: (x, y, a) => 2 * a,
    curl: (x, y, a) => 0,
  },
  rotation: {
    label: 'F = a (-y, x) (uniform rotation)',
    P: (x, y, a) => -a * y,
    Q: (x, y, a) => a * x,
    div: (x, y, a) => 0,
    curl: (x, y, a) => 2 * a,
  },
  shear: {
    label: 'F = a (y, 0) (shear)',
    P: (x, y, a) => a * y,
    Q: (x, y, a) => 0,
    div: (x, y, a) => 0,
    curl: (x, y, a) => -a,
  },
  saddle: {
    label: 'F = a (x, -y) (saddle, div = 0)',
    P: (x, y, a) => a * x,
    Q: (x, y, a) => -a * y,
    div: (x, y, a) => 0,
    curl: (x, y, a) => 0,
  },
};

// Numerical centered-difference div/curl for cross-checking the analytic
// formulae used above.
export function divFD(P, Q, x, y, a, h = 1e-5) {
  return (P(x + h, y, a) - P(x - h, y, a)) / (2 * h)
       + (Q(x, y + h, a) - Q(x, y - h, a)) / (2 * h);
}
export function curlFD(P, Q, x, y, a, h = 1e-5) {
  return (Q(x + h, y, a) - Q(x - h, y, a)) / (2 * h)
       - (P(x, y + h, a) - P(x, y - h, a)) / (2 * h);
}
