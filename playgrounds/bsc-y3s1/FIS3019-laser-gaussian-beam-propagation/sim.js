// Gaussian-beam propagation by the ABCD law. A Gaussian beam is
// carried by the complex parameter q with
//   1/q = 1/R - i lambda / (pi w^2),
// and any paraxial element with ray-transfer matrix [[A,B],[C,D]]
// maps q -> (A q + B) / (C q + D). Free space of length z is
// [[1,z],[0,1]] so q -> q + z; a thin lens of focal length f is
// [[1,0],[-1/f,1]]. At a waist q = i zR with zR = pi w0^2 / lambda.
// Two-mirror resonator: stable iff 0 <= g1 g2 <= 1, equivalently
// |(A+D)/2| <= 1 for the round-trip matrix. Headless, deterministic.
// Reference: Siegman, Lasers (1986), Ch. 17 and 19 (`siegman1986`);
// Hecht, Optics (5th ed.), Ch. 13 (`hecht2017`).

// Complex arithmetic on {re, im}.
const cadd = (a, b) => ({ re: a.re + b.re, im: a.im + b.im });
const cmul = (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
function cdiv(a, b) {
  const den = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / den, im: (a.im * b.re - a.re * b.im) / den };
}

export function rayleighRange(w0, lambda) { return Math.PI * w0 * w0 / lambda; }
export function divergence(w0, lambda) { return lambda / (Math.PI * w0); }

// q at a waist of radius w0.
export function qAtWaist(w0, lambda) { return { re: 0, im: rayleighRange(w0, lambda) }; }

// Apply an ABCD matrix [A,B,C,D] to q.
export function abcdApply([A, B, C, D], q) {
  return cdiv(cadd(cmul({ re: A, im: 0 }, q), { re: B, im: 0 }),
              cadd(cmul({ re: C, im: 0 }, q), { re: D, im: 0 }));
}
export const M_free = (z) => [1, z, 0, 1];
export const M_lens = (f) => [1, 0, -1 / f, 1];
export const M_mirror = (R) => [1, 0, -2 / R, 1];   // curved mirror, focal R/2
// Matrix product M = M2 . M1 (apply M1 first).
export function abcdMul([a2, b2, c2, d2], [a1, b1, c1, d1]) {
  return [a2 * a1 + b2 * c1, a2 * b1 + b2 * d1, c2 * a1 + d2 * c1, c2 * b1 + d2 * d1];
}

// Beam radius and wavefront radius from q (lambda in same units).
export function beamRadius(q, lambda) {
  const inv = cdiv({ re: 1, im: 0 }, q);              // 1/q = 1/R - i lam/pi w^2
  return Math.sqrt(-lambda / (Math.PI * inv.im));
}
export function wavefrontR(q) {
  const inv = cdiv({ re: 1, im: 0 }, q);
  return inv.re === 0 ? Infinity : 1 / inv.re;
}

// Free-space waist radius and Gouy phase about a waist at z = 0.
export function spotZ(z, w0, lambda) {
  const zR = rayleighRange(w0, lambda);
  return w0 * Math.sqrt(1 + (z / zR) ** 2);
}
export function gouy(z, w0, lambda) { return Math.atan(z / rayleighRange(w0, lambda)); }

// Thin-lens imaging of a Gaussian beam: input waist w0 a distance s
// before a lens f. Returns the output waist and its distance after
// the lens (Siegman 17.13). Collimated limit (zR >> f, s = 0) gives
// w0_out -> lambda f / (pi w0).
export function lensImage(w0, lambda, f, s) {
  let q = qAtWaist(w0, lambda);
  q = abcdApply(M_free(s), q);
  q = abcdApply(M_lens(f), q);
  // propagate to the new waist: where Re(1/q) = 0, i.e. q purely
  // imaginary -> advance by -Re(q).
  const dWaist = -q.re;
  const qw = abcdApply(M_free(dWaist), q);
  return { w0Out: beamRadius(qw, lambda), distance: dWaist, zROut: qw.im };
}

// Two-mirror resonator stability. g_i = 1 - L/R_i.
export function gFactors(L, R1, R2) { return { g1: 1 - L / R1, g2: 1 - L / R2 }; }
export function resonatorStable(L, R1, R2) {
  const { g1, g2 } = gFactors(L, R1, R2);
  return g1 * g2 >= 0 && g1 * g2 <= 1;
}
// Round-trip ABCD starting just after mirror 1: free L, mirror 2,
// free L, mirror 1.
export function roundTrip(L, R1, R2) {
  let M = M_free(L);
  M = abcdMul(M_mirror(R2), M);
  M = abcdMul(M_free(L), M);
  M = abcdMul(M_mirror(R1), M);
  return M;
}
export function traceHalf(L, R1, R2) { const [A, , , D] = roundTrip(L, R1, R2); return (A + D) / 2; }

// Self-consistent resonator mode: q reproduced by the round trip,
// solving C q^2 + (D - A) q - B = 0 for the root with Im(q) > 0.
export function resonatorMode(L, R1, R2, lambda) {
  const [A, B, C, D] = roundTrip(L, R1, R2);
  const disc = (D - A) * (D - A) + 4 * B * C;          // = (A+D)^2 - 4 (AD - BC); det=1
  if (disc >= 0) return null;                          // unstable: no Gaussian mode
  const sq = Math.sqrt(-disc);
  const q = { re: (A - D) / (2 * C), im: sq / (2 * Math.abs(C)) };
  return { q, w0: beamRadius(q, lambda) };
}
