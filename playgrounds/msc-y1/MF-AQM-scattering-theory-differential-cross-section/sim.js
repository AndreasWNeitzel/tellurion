// Quantum scattering, partial-wave theory (Sakurai and Napolitano,
// Modern Quantum Mechanics, Ch. 6; Griffiths, Introduction to Quantum
// Mechanics, Ch. 11; Taylor, Scattering Theory, 1972). Units 2m/hbar^2
// = 1, hbar = 1.
//
//   f(theta) = (1/k) sum_l (2l+1) e^{i delta_l} sin delta_l P_l(cos t)
//   dsigma/dOmega = |f|^2
//   sigma_tot = (4 pi / k^2) sum_l (2l+1) sin^2 delta_l
//             = (4 pi / k) Im f(0)              (optical theorem)
//
// Hard sphere of radius a: tan delta_l = j_l(ka) / n_l(ka). Born
// amplitude: f_B(q) = -(2m/hbar^2)(1/q) integral_0^inf r V(r)
// sin(q r) dr, the Fourier transform of the potential, with
// q = 2 k sin(theta/2). Closed-form / quadrature, deterministic.

// Legendre polynomial P_l(x) by upward recurrence.
export function legendreP(l, x) {
  if (l === 0) return 1;
  if (l === 1) return x;
  let p0 = 1, p1 = x;
  for (let n = 1; n < l; n += 1) {
    const p2 = ((2 * n + 1) * x * p1 - n * p0) / (n + 1);
    p0 = p1; p1 = p2;
  }
  return p1;
}

// Spherical Bessel functions of the first (j) and second (n) kind.
export function sphericalJ(l, x) {
  if (x === 0) return l === 0 ? 1 : 0;
  let j0 = Math.sin(x) / x;
  if (l === 0) return j0;
  let j1 = Math.sin(x) / (x * x) - Math.cos(x) / x;
  if (l === 1) return j1;
  for (let n = 1; n < l; n += 1) {
    const j2 = ((2 * n + 1) / x) * j1 - j0;
    j0 = j1; j1 = j2;
  }
  return j1;
}
export function sphericalN(l, x) {
  let n0 = -Math.cos(x) / x;
  if (l === 0) return n0;
  let n1 = -Math.cos(x) / (x * x) - Math.sin(x) / x;
  if (l === 1) return n1;
  for (let m = 1; m < l; m += 1) {
    const n2 = ((2 * m + 1) / x) * n1 - n0;
    n0 = n1; n1 = n2;
  }
  return n1;
}

// Hard-sphere phase shift: tan delta_l = j_l(ka)/n_l(ka), taken on
// the principal branch so delta_l -> 0 as l -> infinity (the physical
// convention). All observables (sigma, |f|^2, the optical theorem)
// are invariant under delta_l -> delta_l + pi, so this only fixes the
// displayed phase shift, not the physics.
export function hardSphereDelta(l, ka) {
  const nl = sphericalN(l, ka);
  return nl === 0 ? Math.PI / 2 : Math.atan(sphericalJ(l, ka) / nl);
}

// Number of partial waves that matter at wavenumber*range ka.
export function lMax(ka) { return Math.max(2, Math.ceil(ka + 8)); }

// Scattering amplitude f(theta) from a delta_l array, wavenumber k.
export function amplitude(theta, deltas, k) {
  const ct = Math.cos(theta);
  let re = 0, im = 0;
  for (let l = 0; l < deltas.length; l += 1) {
    const d = deltas[l], s = Math.sin(d);
    const w = (2 * l + 1) * s * legendreP(l, ct);
    re += w * Math.cos(d);                              // e^{i d} sin d -> (cos d + i sin d) sin d
    im += w * s;
  }
  return { re: re / k, im: im / k };
}
export function diffCrossSection(theta, deltas, k) {
  const f = amplitude(theta, deltas, k);
  return f.re * f.re + f.im * f.im;
}
// sigma_tot from the partial-wave sum.
export function sigmaTotPartial(deltas, k) {
  let s = 0;
  for (let l = 0; l < deltas.length; l += 1) s += (2 * l + 1) * Math.sin(deltas[l]) ** 2;
  return (4 * Math.PI / (k * k)) * s;
}
// sigma_tot from the optical theorem, sigma = (4 pi / k) Im f(0).
export function sigmaTotOptical(deltas, k) {
  return (4 * Math.PI / k) * amplitude(0, deltas, k).im;
}
// sigma_el by direct angular integration of |f|^2 (Simpson in theta).
export function sigmaElasticIntegral(deltas, k, N = 800) {
  let s = 0;
  for (let i = 0; i <= N; i += 1) {
    const th = Math.PI * i / N;
    const w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    s += w * diffCrossSection(th, deltas, k) * Math.sin(th);
  }
  return 2 * Math.PI * (s * (Math.PI / N) / 3);
}

// Hard-sphere delta_l array up to lMax(ka).
export function hardSphereDeltas(ka) {
  const L = lMax(ka), d = new Float64Array(L + 1);
  for (let l = 0; l <= L; l += 1) d[l] = hardSphereDelta(l, ka);
  return d;
}

// Born amplitude as the Fourier transform of a radial potential:
// f_B(q) = -(1/q) integral_0^inf r V(r) sin(q r) dr (2m/hbar^2 = 1).
export function bornAmplitude(q, Vr, rMax = 60, N = 4000) {
  if (q === 0) {
    // limit: f_B(0) = - integral_0^inf r^2 V(r) dr
    let s = 0;
    for (let i = 0; i <= N; i += 1) {
      const r = rMax * i / N;
      const w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
      s += w * r * r * Vr(r);
    }
    return -(s * (rMax / N) / 3);
  }
  let s = 0;
  for (let i = 0; i <= N; i += 1) {
    const r = rMax * i / N;
    const w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    s += w * r * Vr(r) * Math.sin(q * r);
  }
  return -(1 / q) * (s * (rMax / N) / 3);
}
export function momentumTransfer(theta, k) { return 2 * k * Math.sin(theta / 2); }

// Analytic Born amplitudes for the gate tests.
export function yukawaBornExact(q, V0, mu) { return -V0 / (mu * mu + q * q); }
export function squareWellBornExact(q, V0, a) {
  // V = -V0 for r < a:  f_B = V0 (sin(qa) - qa cos(qa)) / q^3
  if (q === 0) return V0 * a * a * a / 3;
  return V0 * (Math.sin(q * a) - q * a * Math.cos(q * a)) / (q ** 3);
}
