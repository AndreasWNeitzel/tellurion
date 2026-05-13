// sim.js
// Closed-form eigendecomposition of a 2x2 real matrix
//   M = [[a, b], [c, d]]
// Eigenvalues: lambda_{1,2} = (tr +/- sqrt(disc)) / 2, with tr = a+d,
// det = a d - b c, disc = tr^2 - 4 det.
// Eigenvectors: kernel of (M - lambda I).
// Special cases handled:
//   disc < 0: complex eigenvalues; return null pair.
//   M proportional to identity: every nonzero vector is an eigenvector;
//                                return the canonical basis.
//
// Reference: Arfken-Weber, Mathematical Methods for Physicists 7e Ch. 3
// (`arfken-weber`).

export function eigen2x2(a, b, c, d) {
  const tr = a + d;
  const det = a * d - b * c;
  const disc = tr * tr - 4 * det;

  if (disc < 0) {
    return { real: false, eigenvalues: null, eigenvectors: null, det, tr };
  }
  const root = Math.sqrt(disc);
  const lam1 = (tr + root) / 2;
  const lam2 = (tr - root) / 2;

  // Identity-proportional matrix: M = lambda I (a = d, b = c = 0).
  if (b === 0 && c === 0 && a === d) {
    return {
      real: true,
      eigenvalues: [a, a],
      eigenvectors: [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ],
      det, tr,
    };
  }

  const ev1 = eigenvectorFor(a, b, c, d, lam1);
  const ev2 = eigenvectorFor(a, b, c, d, lam2);
  return {
    real: true,
    eigenvalues: [lam1, lam2],
    eigenvectors: [ev1, ev2],
    det, tr,
  };
}

function eigenvectorFor(a, b, c, d, lam) {
  // Null vector of M - lam I.
  // Row form: (a - lam) x + b y = 0, c x + (d - lam) y = 0.
  // Pick whichever row is nonzero for stability.
  let x, y;
  if (Math.abs(b) >= Math.abs(a - lam) && Math.abs(b) >= 1e-12) {
    // (a - lam) x + b y = 0 -> y = -(a - lam) / b * x
    x = b;
    y = -(a - lam);
  } else if (Math.abs(c) >= 1e-12) {
    // c x + (d - lam) y = 0 -> x = -(d - lam) / c * y
    x = -(d - lam);
    y = c;
  } else {
    // Diagonal matrix branch: M - lam I has zeros on its first nonzero
    // row position. Use canonical basis vectors.
    if (Math.abs(a - lam) < 1e-12) { x = 1; y = 0; }
    else                            { x = 0; y = 1; }
  }
  const n = Math.hypot(x, y);
  if (n < 1e-15) return { x: 1, y: 0 };
  return { x: x / n, y: y / n };
}
