// Addition of two angular momenta j1, j2. The total J ranges over
// |j1 - j2| <= J <= j1 + j2 (the triangle inequality), and the
// Clebsch-Gordan coefficients <j1 m1 j2 m2 | J M> form a unitary
// (orthogonal) change of basis between the uncoupled and coupled
// representations. The vector model pictures J1 and J2 precessing on
// cones about the resultant J. Computed by the Racah closed form on
// the doubled-integer (2j) scale so half-integers are exact. Headless
// and deterministic. Reference: Sakurai and Napolitano, Modern
// Quantum Mechanics (2nd ed.), Sec. 3.8.

const _fact = [1];
function fact(n) {
  if (n < 0) return NaN;
  for (let i = _fact.length; i <= n; i += 1) _fact[i] = _fact[i - 1] * i;
  return _fact[n];
}

// Allowed total-J values (ascending), step 1.
export function allowedJ(j1, j2) {
  const lo = Math.abs(j1 - j2), hi = j1 + j2, out = [];
  for (let J = lo; J <= hi + 1e-9; J += 1) out.push(Math.round(J * 2) / 2);
  return out;
}

export function triangleHolds(j1, j2, J) {
  if (J < Math.abs(j1 - j2) - 1e-9 || J > j1 + j2 + 1e-9) return false;
  return Math.abs((j1 + j2 + J) - Math.round(j1 + j2 + J)) < 1e-9;   // integer perimeter
}

// Clebsch-Gordan coefficient <j1 m1 j2 m2 | J M> (Racah formula).
export function clebschGordan(j1, m1, j2, m2, J, M) {
  if (Math.abs(m1) > j1 + 1e-9 || Math.abs(m2) > j2 + 1e-9 || Math.abs(M) > J + 1e-9) return 0;
  if (Math.abs(m1 + m2 - M) > 1e-9) return 0;
  if (J < Math.abs(j1 - j2) - 1e-9 || J > j1 + j2 + 1e-9) return 0;
  // integer check on the doubled scale
  const dd = (x) => Math.round(x * 2);
  if ((dd(j1 + j2 + J)) % 1 !== 0) return 0;
  const f = fact;
  const pref = Math.sqrt(
    (2 * J + 1) * f(j1 + j2 - J) * f(j1 - j2 + J) * f(-j1 + j2 + J) / f(j1 + j2 + J + 1),
  );
  const rad = Math.sqrt(
    f(J + M) * f(J - M) * f(j1 - m1) * f(j1 + m1) * f(j2 - m2) * f(j2 + m2),
  );
  let sum = 0;
  for (let k = 0; k <= 60; k += 1) {
    const a = j1 + j2 - J - k, b = j1 - m1 - k, c = j2 + m2 - k;
    const d = J - j2 + m1 + k, e = J - j1 - m2 + k;
    if (a < -1e-9 || b < -1e-9 || c < -1e-9 || d < -1e-9 || e < -1e-9) continue;
    const ai = Math.round(a), bi = Math.round(b), ci = Math.round(c), di = Math.round(d), ei = Math.round(e), ki = k;
    if ([ai, bi, ci, di, ei].some(v => v < 0)) continue;
    sum += ((ki % 2 === 0) ? 1 : -1) / (f(ki) * f(ai) * f(bi) * f(ci) * f(di) * f(ei));
  }
  return pref * rad * sum;
}

// All uncoupled (m1, m2) basis pairs.
export function uncoupledBasis(j1, j2) {
  const out = [];
  for (let m1 = j1; m1 >= -j1 - 1e-9; m1 -= 1) for (let m2 = j2; m2 >= -j2 - 1e-9; m2 -= 1) out.push([m1, m2]);
  return out;
}
export function coupledBasis(j1, j2) {
  const out = [];
  for (const J of allowedJ(j1, j2)) for (let M = J; M >= -J - 1e-9; M -= 1) out.push([J, Math.round(M * 2) / 2]);
  return out;
}

// Vector-model geometry: |J| = sqrt(J(J+1)); the angle of J1 to the
// resultant J from the law of cosines.
export function vecLen(j) { return Math.sqrt(j * (j + 1)); }
export function cosJ1toJ(j1, j2, J) {
  const a = vecLen(j1), b = vecLen(J);
  const dot = 0.5 * (J * (J + 1) + j1 * (j1 + 1) - j2 * (j2 + 1));
  return dot / (a * b);
}
export function cosJ2toJ(j1, j2, J) {
  const a = vecLen(j2), b = vecLen(J);
  const dot = 0.5 * (J * (J + 1) + j2 * (j2 + 1) - j1 * (j1 + 1));
  return dot / (a * b);
}
