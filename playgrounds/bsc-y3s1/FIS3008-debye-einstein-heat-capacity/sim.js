// Lattice specific heat of a solid, in units of the Dulong-Petit value 3Nk.
//
// Einstein model: every atom is an independent oscillator of frequency omega_E,
//   C/3Nk = (TE/T)^2 e^{TE/T} / (e^{TE/T} - 1)^2.
// Debye model: a continuum of acoustic modes up to the Debye frequency,
//   C/3Nk = 3 (T/TD)^3 integral_0^{TD/T} x^4 e^x / (e^x - 1)^2 dx.
// Both approach 1 (Dulong-Petit) at high T; at low T the Debye heat capacity follows
// the universal T^3 law (4/5) pi^4 (T/TD)^3, while the Einstein heat capacity dies off
// exponentially. Reference: Ashcroft and Mermin, Solid State Physics, Ch. 23.

// Einstein heat capacity over 3Nk, written in an underflow-safe form.
export function einsteinC(T, TE) {
  if (T <= 0) return 0;
  const u = TE / T;
  if (u > 60) return u * u * Math.exp(-u);
  const em = Math.exp(-u);
  return (u * u * em) / ((1 - em) * (1 - em));
}

// Debye integrand x^4 e^x/(e^x-1)^2, with the x -> 0 limit x^2 handled explicitly.
export function debyeIntegrand(x) {
  if (x < 1e-6) return x * x;
  const em = Math.exp(-x);
  return (x * x * x * x * em) / ((1 - em) * (1 - em));
}

// Debye heat capacity over 3Nk by Simpson quadrature of the Debye integral.
export function debyeC(T, TD) {
  if (T <= 0) return 0;
  const hi = Math.min(TD / T, 60);
  const n = 400, h = hi / n;
  let s = 0;
  for (let i = 0; i <= n; i += 1) { const w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2); s += w * debyeIntegrand(i * h); }
  s *= h / 3;
  return 3 * Math.pow(T / TD, 3) * s;
}

// The low-temperature Debye T^3 law (asymptote of debyeC for T << TD).
export function debyeT3(T, TD) { return 0.8 * Math.pow(Math.PI, 4) * Math.pow(T / TD, 3); }
