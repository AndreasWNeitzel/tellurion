// Mode trapping in evolved stars, from a self-consistent g-mode eigenvalue
// solve. A sharp glitch in the buoyancy (Brunt-Vaisala) frequency N partially
// reflects gravity modes; the result is that some modes are trapped near the
// glitch and the asymptotically uniform period spacing develops dips.
//
// Both effects come out of ONE model, not three hand-tuned curves. For
// high-order g-modes the radial part obeys (Cowling, asymptotic) the
// Schrodinger-like equation
//   psi'' + [ L^2 N(x)^2 / (omega^2 x^2) ] psi = 0,   L^2 = l(l+1),
// on the radiative cavity x in [x_in, x_env] with psi = 0 at both ends. This is
// a Sturm-Liouville eigenvalue problem; it is solved here by shooting. The
// eigenfrequencies give the periods P_n = 2 pi / omega_n and the spacing
// Delta P = P_{n+1} - P_n; the eigenfunctions psi_n(x) show where each mode
// lives. A glitch in N(x) makes Delta P oscillate and concentrates the trapped
// modes near the glitch, both emerging from the same solve.
//
// Periods are scaled so the mean spacing matches a realistic red-giant
// Delta Pi_1 = 80 s; only the overall scale is set this way.
//
// Reference: Aerts, Christensen-Dalsgaard and Kurtz, Asteroseismology (2010),
// Ch. 3.4; Cunha et al., ApJ 805 (2015) 127 (glitch-induced period-spacing
// modulation); Mosser et al., A&A 618 (2018) A109.

export const X_IN = 0.04;          // inner edge of the radiative g-mode cavity (r/R)
export const X_ENV = 0.62;         // base of the convective envelope (r/R)
export const DPI1_SECONDS = 80;    // scale the mean spacing to a red-giant Delta Pi_1

// Representative buoyancy profile of an evolved star: high in the radiative
// core, a sharp Gaussian glitch at the composition gradient (amplitude A,
// position xg), tapering to the convective boundary.
export function bruntProfile(x, A, xg) {
  if (x <= 0 || x >= X_ENV) return 0;
  const core = 0.35 + 0.55 * (1 - x / X_ENV);
  const glitch = A * Math.exp(-((x - xg) ** 2) / (2 * 0.018 ** 2));
  return Math.min(1.5, core + glitch);
}

// Integrate psi'' + Q(x) psi = 0 from X_IN (psi=0, psi'=1) to X_ENV by the
// Numerov method (4th order, one evaluation per step), where
// Q = L^2 N^2 / (omega^2 x^2). The oscillatory, node-rich g-modes need the
// accuracy; RK4 at the same cost smears the eigenvalues. Returns the end value
// and, optionally, the eigenfunction samples.
function shoot(omega, l, A, xg, steps = 1500, keep = false) {
  const L2 = l * (l + 1);
  const h = (X_ENV - X_IN) / steps, h2 = h * h / 12;
  const Q = (x) => { const N = bruntProfile(x, A, xg); return L2 * N * N / (omega * omega * x * x); };
  const xs = keep ? new Float64Array(steps + 1) : null;
  const ps = keep ? new Float64Array(steps + 1) : null;
  let qPrev = Q(X_IN), qCur = Q(X_IN + h);
  let pPrev = 0, pCur = h;                          // psi(0)=0, psi'(0)=1 -> psi_1 ~ h
  if (keep) { xs[0] = X_IN; ps[0] = 0; xs[1] = X_IN + h; ps[1] = pCur; }
  for (let i = 1; i < steps; i += 1) {
    const x = X_IN + i * h, xn = x + h;
    const qNext = Q(xn);
    const pNext = (2 * pCur * (1 - 5 * h2 * qCur) - pPrev * (1 + h2 * qPrev)) / (1 + h2 * qNext);
    if (keep) { xs[i + 1] = xn; ps[i + 1] = pNext; }
    pPrev = pCur; pCur = pNext; qPrev = qCur; qCur = qNext;
  }
  return { end: pCur, xs, ps };
}

const CACHE = new Map();
// Solve the lowest nWant g-modes for (A, xg, l). Returns periods (seconds),
// eigenfunctions (normalised to unit peak), deltaP, trapping in [0,1], and the
// mean spacing Pi_1.
export function solveGModes(A, xg, l, nWant = 22) {
  const key = `${A.toFixed(3)}:${xg.toFixed(3)}:${l}`;
  if (CACHE.has(key)) return CACHE.get(key);
  // Consecutive eigenvalues are spaced by Delta omega ~ omega^2 (since P_n ~ n),
  // so the scan step shrinks with omega to avoid stepping over crowded
  // high-order modes.
  const omegas = [];
  let w = 2.2, ePrev = shoot(w, l, A, xg).end;
  while (w > 0.05 && omegas.length < nWant) {
    const dW = Math.max(0.0004, Math.min(0.02, 0.08 * w * w));
    const wNext = w - dW;
    const e = shoot(wNext, l, A, xg).end;
    if (ePrev * e < 0) {
      let lo = wNext, hi = w, fl = e;
      for (let it = 0; it < 40; it += 1) { const mid = 0.5 * (lo + hi); const fm = shoot(mid, l, A, xg).end; if (fl * fm <= 0) { hi = mid; } else { lo = mid; fl = fm; } }
      omegas.push(0.5 * (lo + hi));
    }
    w = wNext; ePrev = e;
  }
  // dimensionless periods, then scale so the mean spacing is DPI1_SECONDS.
  const Pd = omegas.map((w) => 2 * Math.PI / w);
  let meanD = 0; for (let i = 1; i < Pd.length; i += 1) meanD += Pd[i] - Pd[i - 1];
  meanD /= Math.max(1, Pd.length - 1);
  const scale = DPI1_SECONDS / meanD;
  const periods = Pd.map((p) => p * scale);

  // eigenfunctions (normalised to unit peak).
  const eigfns = [];
  for (const w of omegas) {
    const { xs, ps } = shoot(w, l, A, xg, 600, true);
    let peak = 1e-9; for (let i = 0; i < ps.length; i += 1) peak = Math.max(peak, Math.abs(ps[i]));
    const psi = new Float64Array(ps.length); for (let i = 0; i < ps.length; i += 1) psi[i] = ps[i] / peak;
    eigfns.push({ x: xs, psi });
  }

  const deltaP = []; for (let i = 1; i < periods.length; i += 1) deltaP.push(periods[i] - periods[i - 1]);

  // trapping: a mode sitting in a Delta P dip is trapped (the observational
  // signature, e.g. Mosser et al. 2018). 0 at the asymptotic Pi_1, 1 in a deep
  // dip, so it is ~0 everywhere when there is no glitch.
  const MOD = 0.18 * DPI1_SECONDS;
  const trapping = periods.map((_, i) => {
    const a = i > 0 ? periods[i] - periods[i - 1] : null;
    const b = i < periods.length - 1 ? periods[i + 1] - periods[i] : null;
    const vals = [a, b].filter((v) => v != null);
    const localDP = vals.reduce((s, v) => s + v, 0) / vals.length;
    return Math.max(0, Math.min(1, (DPI1_SECONDS - localDP) / MOD));
  });
  const out = { periods, eigfns, deltaP, trapping, Pi1: DPI1_SECONDS, count: periods.length };
  CACHE.set(key, out);
  return out;
}
