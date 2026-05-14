// sim.js
// Sturm-Liouville eigenfunctions. The simplest example:
//   -y'' = lambda y on [0, pi], with y(0) = y(pi) = 0.
// Eigenvalues lambda_n = n^2, eigenfunctions phi_n(x) = sqrt(2/pi) sin(n x)
// (orthonormal on [0, pi]).
//
// Inner product: <phi_n, phi_m> = integral_0^pi phi_n phi_m dx = delta_nm.
//
// Reference: Arfken-Weber, Mathematical Methods for Physicists 7e Ch. 8
// (`arfken-weber`).

export const L = Math.PI;

export function eigenvalue(n) {
  return n * n;
}

export function eigenfunction(n, x) {
  return Math.sqrt(2 / L) * Math.sin(n * x);
}

// Inner product via Simpson 1/3 on N + 1 nodes.
export function innerProduct(phi1, phi2, N = 2000) {
  const h = L / N;
  let s = phi1(0) * phi2(0) + phi1(L) * phi2(L);
  for (let i = 1; i < N; i += 1) {
    const x = i * h;
    s += (i % 2 === 0 ? 2 : 4) * phi1(x) * phi2(x);
  }
  return s * h / 3;
}

// Project a function f(x) onto eigenfunction basis: c_n = <phi_n, f>.
export function projectCoefficients(f, nMax = 10) {
  const c = new Float64Array(nMax + 1);
  for (let n = 1; n <= nMax; n += 1) {
    c[n] = innerProduct((x) => eigenfunction(n, x), f);
  }
  return c;
}

// Reconstruct f from N coefficients.
export function reconstruct(c, x, nMax = c.length - 1) {
  let s = 0;
  for (let n = 1; n <= nMax; n += 1) s += c[n] * eigenfunction(n, x);
  return s;
}
