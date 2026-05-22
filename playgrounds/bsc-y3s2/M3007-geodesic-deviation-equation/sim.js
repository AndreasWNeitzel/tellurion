// sim.js -- geodesic deviation on a surface of constant Gaussian curvature.
//
// A one-parameter family of geodesics, each labelled by arc length s, has a
// normal separation xi(s) between neighbours that obeys the Jacobi equation
//   xi''(s) + K xi(s) = 0
// where K is the Gaussian curvature (Carroll, Spacetime and Geometry, Ch 3,
// eq 3.107). With xi(0) = xi0 and xi'(0) = 0 (geodesics that start parallel):
//   K > 0   xi = xi0 cos(sqrt(K) s)     they refocus at s = pi / (2 sqrt K)
//   K = 0   xi = xi0                    parallel geodesics stay parallel
//   K < 0   xi = xi0 cosh(sqrt(-K) s)   they diverge exponentially

export const SURFACES = {
  sphere:     { K: 1,  label: 'Sphere (K = +1)' },
  flat:       { K: 0,  label: 'Flat plane (K = 0)' },
  hyperbolic: { K: -1, label: 'Hyperbolic (K = -1)' },
};

// Normalised Jacobi solution f(s) = xi(s) / xi0, with f(0) = 1, f'(0) = 0.
export function jacobiFactor(s, K) {
  if (K > 0) return Math.cos(Math.sqrt(K) * s);
  if (K < 0) return Math.cosh(Math.sqrt(-K) * s);
  return 1;
}

// Arc length of the first conjugate point, where neighbouring geodesics
// refocus to a point. Finite only for positive curvature.
export function conjugateDistance(K) {
  return K > 0 ? Math.PI / (2 * Math.sqrt(K)) : Infinity;
}

// Residual of the Jacobi equation, f''(s) + K f(s), evaluated with a
// centred finite difference. A correct Jacobi solution drives this to zero.
export function jacobiResidual(s, K, h = 1e-3) {
  const fpp = (jacobiFactor(s + h, K) - 2 * jacobiFactor(s, K) + jacobiFactor(s - h, K)) / (h * h);
  return fpp + K * jacobiFactor(s, K);
}
