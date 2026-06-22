// sim.js
// Quantum tunneling through a rectangular barrier of height V0 and width L (V = V0
// for 0 < x < L, zero outside). A wave of energy E incident from the left is partly
// reflected and partly transmitted; even for E < V0, where a classical particle
// would always bounce back, the wave leaks through with transmission
//   T = [1 + V0^2 sinh^2(kappa L) / (4 E (V0 - E))]^-1,  kappa = sqrt(2m(V0-E))/hbar,
// while for E > V0 the barrier is a partial mirror with resonances (T = 1) when
// k2 L = n pi. Probability current is conserved, T + R = 1.
//
// Reference: Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 2.6 and
// Prob. 2.33; Cohen-Tannoudji, Quantum Mechanics, Vol. I, Ch. 1.
//
// Units hbar = m = 1.

export function transmission(E, V0, L) {
  if (E <= 0) return 0;
  if (Math.abs(E - V0) < 1e-9) return 1 / (1 + V0 * L * L / 2);
  if (E < V0) { const kap = Math.sqrt(2 * (V0 - E)), s = Math.sinh(kap * L); return 1 / (1 + (V0 * V0 * s * s) / (4 * E * (V0 - E))); }
  const k2 = Math.sqrt(2 * (E - V0)), s = Math.sin(k2 * L); return 1 / (1 + (V0 * V0 * s * s) / (4 * E * (E - V0)));
}
export function reflection(E, V0, L) { return 1 - transmission(E, V0, L); }

// energies of perfect transmission above the barrier: k2 L = n pi -> E = V0 + (n pi / L)^2 / 2.
export function resonanceEnergies(V0, L, Emax) { const out = []; for (let n = 1; ; n += 1) { const E = V0 + (n * Math.PI / L) ** 2 / 2; if (E > Emax) break; out.push(E); } return out; }

// complex helpers on [re, im] pairs.
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];

// the stationary wavefunction across the barrier, normalised to unit incident
// amplitude, by integrating the Schrodinger equation from the transmitted side.
// Returns sampled x, |psi|^2 and Re(psi), plus T and R.
export function waveProfile(E, V0, L, n = 900) {
  const k = Math.sqrt(2 * E), lam = 2 * Math.PI / k, side = Math.min(11, Math.max(3, 2.6 * lam));
  const x0 = -side, x1 = L + side, dx = (x1 - x0) / n;
  const Vof = (x) => (x >= 0 && x <= L) ? V0 : 0;
  const deriv = (x, y) => { const c = -2 * (E - Vof(x)); return [y[2], y[3], c * y[0], c * y[1]]; };
  // integrate leftward from x = L (psi = 1, psi' = i k) to x0, storing samples.
  let y = [1, 0, 0, k]; const xs = [], raw = []; const h = -dx;
  let xN = L; const left = [];
  for (let x = L; x > x0 - dx / 2; x -= dx) {
    left.push({ x, y: y.slice() });
    const k1 = deriv(x, y), k2 = deriv(x + h / 2, y.map((v, i) => v + h / 2 * k1[i])), k3 = deriv(x + h / 2, y.map((v, i) => v + h / 2 * k2[i])), k4 = deriv(x + h, y.map((v, i) => v + h * k3[i]));
    y = y.map((v, i) => v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    xN = x + h;
  }
  // match deep in the field-free left region (last stored sample) to I e^{ikx} + R e^{-ikx}.
  const last = left[left.length - 1]; const xm = last.x, p = [last.y[0], last.y[1]], dp = [last.y[2], last.y[3]];
  // I e^{ik xm} = 0.5 (p - i dp / k)  ->  I = e^{-ik xm} * 0.5 (p + (-i/k) dp)
  const negiOverK = [0, -1 / k]; const term = cmul(negiOverK, dp);
  const half = [0.5 * (p[0] + term[0]), 0.5 * (p[1] + term[1])];
  const eMinus = [Math.cos(-k * xm), Math.sin(-k * xm)];
  const I = cmul(eMinus, half); const absI2 = I[0] * I[0] + I[1] * I[1];
  const T = 1 / absI2, R = 1 - T;
  // build ascending samples, normalised by I (incident amplitude = 1).
  const out = { xs: [], psi2: [], re: [], im: [], T, R, t2: T };
  const pushNorm = (x, yy) => { const psiN = cdiv([yy[0], yy[1]], I); out.xs.push(x); out.psi2.push(psiN[0] * psiN[0] + psiN[1] * psiN[1]); out.re.push(psiN[0]); out.im.push(psiN[1]); };
  for (let i = left.length - 1; i >= 0; i -= 1) pushNorm(left[i].x, left[i].y);
  // transmitted region x in (L, x1]: psi = e^{ik(x-L)} / I.
  for (let x = L + dx; x <= x1 + 1e-9; x += dx) { const e = [Math.cos(k * (x - L)), Math.sin(k * (x - L))]; const psiN = cdiv(e, I); out.xs.push(x); out.psi2.push(psiN[0] * psiN[0] + psiN[1] * psiN[1]); out.re.push(psiN[0]); out.im.push(psiN[1]); }
  out.domain = [x0, x1];
  return out;
}
