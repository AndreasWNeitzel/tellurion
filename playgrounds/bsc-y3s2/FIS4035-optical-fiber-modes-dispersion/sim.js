// Step-index weakly guiding optical fibre: LP modes, the b-V
// dispersion curves and group-velocity-dispersion pulse broadening.
//
// LP_lm eigenvalue equation (Gloge, Appl. Opt. 10, 2252, 1971;
// Snyder and Love, Optical Waveguide Theory, 1983):
//   U J_{l-1}(U) / J_l(U) = - W K_{l-1}(W) / K_l(W),
//   V^2 = U^2 + W^2,   b = 1 - U^2 / V^2  in (0,1).
// The LP11 cutoff (single-mode limit) is the first zero of J0,
// V = 2.40483. Bessel functions use the Abramowitz and Stegun (1964)
// sections 9.4 and 9.8 polynomial approximations. A chirp-free
// Gaussian pulse broadens as T(z) = T0 sqrt(1 + (z/L_D)^2),
// L_D = T0^2 / |beta_2| (Agrawal, Nonlinear Fiber Optics, 2019).
// Closed-form / root-find, deterministic, no RNG.

// Bessel functions (Abramowitz and Stegun 9.4, 9.8).
export function besselJ0(x) {
  const ax = Math.abs(x);
  if (ax < 3) {
    const t = (x / 3) ** 2;
    return 1 + t * (-2.2499997 + t * (1.2656208 + t * (-0.3163866
      + t * (0.0444479 + t * (-0.0039444 + t * 0.0002100)))));
  }
  const z = 3 / ax;
  const f = 0.79788456 + z * (-0.00000077 + z * (-0.00552740 + z * (-0.00009512
    + z * (0.00137237 + z * (-0.00072805 + z * 0.00014476)))));
  const th = ax - 0.78539816 + z * (-0.04166397 + z * (-0.00003954 + z * (0.00262573
    + z * (-0.00054125 + z * (-0.00029333 + z * 0.00013558)))));
  return f / Math.sqrt(ax) * Math.cos(th);
}
export function besselJ1(x) {
  const ax = Math.abs(x);
  let r;
  if (ax < 3) {
    const t = (x / 3) ** 2;
    r = ax * (0.5 + t * (-0.56249985 + t * (0.21093573 + t * (-0.03954289
      + t * (0.00443319 + t * (-0.00031761 + t * 0.00001109))))));
  } else {
    const z = 3 / ax;
    const f = 0.79788456 + z * (0.00000156 + z * (0.01659667 + z * (0.00017105
      + z * (-0.00249511 + z * (0.00113653 + z * -0.00020033)))));
    const th = ax - 2.35619449 + z * (0.12499612 + z * (0.00005650 + z * (-0.00637879
      + z * (0.00074348 + z * (0.00079824 + z * -0.00029166)))));
    r = f / Math.sqrt(ax) * Math.cos(th);
  }
  return x < 0 ? -r : r;
}
function besselI0(x) {
  const ax = Math.abs(x);
  if (ax < 3.75) {
    const t = (x / 3.75) ** 2;
    return 1 + t * (3.5156229 + t * (3.0899424 + t * (1.2067492
      + t * (0.2659732 + t * (0.0360768 + t * 0.0045813)))));
  }
  const z = 3.75 / ax;
  return Math.exp(ax) / Math.sqrt(ax) * (0.39894228 + z * (0.01328592 + z * (0.00225319
    + z * (-0.00157565 + z * (0.00916281 + z * (-0.02057706 + z * (0.02635537
    + z * (-0.01647633 + z * 0.00392377))))))));
}
function besselI1(x) {
  const ax = Math.abs(x);
  let r;
  if (ax < 3.75) {
    const t = (x / 3.75) ** 2;
    r = ax * (0.5 + t * (0.87890594 + t * (0.51498869 + t * (0.15084934
      + t * (0.02658733 + t * (0.00301532 + t * 0.00032411))))));
  } else {
    const z = 3.75 / ax;
    r = Math.exp(ax) / Math.sqrt(ax) * (0.39894228 + z * (-0.03988024 + z * (-0.00362018
      + z * (0.00163801 + z * (-0.01031555 + z * (0.02282967 + z * (-0.02895312
      + z * (0.01787654 + z * -0.00420059))))))));
  }
  return x < 0 ? -r : r;
}
export function besselK0(x) {
  if (x <= 2) {
    const t = (x / 2) ** 2;
    return -Math.log(x / 2) * besselI0(x) + (-0.57721566 + t * (0.42278420
      + t * (0.23069756 + t * (0.03488590 + t * (0.00262698
      + t * (0.00010750 + t * 0.00000740))))));
  }
  const z = 2 / x;
  return Math.exp(-x) / Math.sqrt(x) * (1.25331414 + z * (-0.07832358 + z * (0.02189568
    + z * (-0.01062446 + z * (0.00587872 + z * (-0.00251540 + z * 0.00053208))))));
}
export function besselK1(x) {
  if (x <= 2) {
    const t = (x / 2) ** 2;
    return Math.log(x / 2) * besselI1(x) + (1 / x) * (1 + t * (0.15443144
      + t * (-0.67278579 + t * (-0.18156897 + t * (-0.01919402
      + t * (-0.00110404 + t * -0.00004686))))));
  }
  const z = 2 / x;
  return Math.exp(-x) / Math.sqrt(x) * (1.25331414 + z * (0.23498619 + z * (-0.03655620
    + z * (0.01504268 + z * (-0.00780353 + z * (0.00325614 + z * -0.00068245))))));
}
// J_n, K_n by stable recurrence for the small orders used (l <= 2).
export function besselJ(n, x) {
  if (n === 0) return besselJ0(x);
  if (n === 1) return besselJ1(x);
  let jm = besselJ0(x), j = besselJ1(x);
  for (let k = 1; k < n; k += 1) { const jp = (2 * k / x) * j - jm; jm = j; j = jp; }
  return j;
}
export function besselK(n, x) {
  if (n === 0) return besselK0(x);
  if (n === 1) return besselK1(x);
  let km = besselK0(x), kk = besselK1(x);
  for (let i = 1; i < n; i += 1) { const kp = km + (2 * i / x) * kk; km = kk; kk = kp; }
  return kk;
}

// First positive zero of J0 (the LP11 / single-mode cutoff).
export function firstZeroJ0() {
  let a = 2.0, b = 2.8;                                 // brackets 2.40483
  for (let i = 0; i < 80; i += 1) {
    const m = 0.5 * (a + b);
    (besselJ0(a) * besselJ0(m) <= 0) ? (b = m) : (a = m);
  }
  return 0.5 * (a + b);
}

// Ratio-form eigenvalue function F(U) = U J_{l-1}(U)/J_l(U)
// + W K_{l-1}(W)/K_l(W), W = sqrt(V^2 - U^2). Its sign changes (away
// from the J_l poles) are the LP_lm mode branches.
function eigRatio(U, V, l) {
  const W = Math.sqrt(Math.max(1e-12, V * V - U * U));
  const Jl = besselJ(l, U);
  const Jlm1 = l === 0 ? -besselJ1(U) : besselJ(l - 1, U);
  const Kl = besselK(l, W);
  const Klm1 = besselK(l === 0 ? 1 : l - 1, W);
  if (Math.abs(Jl) < 1e-9 || Math.abs(Kl) < 1e-12) return Infinity;
  return U * Jlm1 / Jl + W * Klm1 / Kl;
}

// Solve for U of the m-th LP_lm mode at normalised frequency V, or
// null if that mode is beyond cutoff (not guided). Root-finds the
// ratio eigenfunction F(U) = U J_{l-1}/J_l + W K_{l-1}/K_l, skipping
// the poles at the zeros of J_l (those are mode-branch boundaries,
// not roots). Each genuine sign change is one LP_lm branch.
export function solveLP(V, l, m) {
  const steps = 9000, lo = 1e-3, hi = V - 1e-7;
  if (hi <= lo) return null;
  const Jl = (U) => besselJ(l, U);
  let prevU = lo, prevF = eigRatio(lo, V, l), prevJ = Jl(lo), found = 0;
  for (let i = 1; i <= steps; i += 1) {
    const U = lo + (hi - lo) * i / steps;
    const F = eigRatio(U, V, l), Jc = Jl(U);
    const poleCrossed = prevJ * Jc < 0;                  // J_l changed sign: a pole, not a root
    if (!poleCrossed && Number.isFinite(prevF) && Number.isFinite(F) && prevF * F < 0) {
      let a = prevU, bU = U;
      for (let k = 0; k < 100; k += 1) {
        const mm = 0.5 * (a + bU);
        (eigRatio(a, V, l) * eigRatio(mm, V, l) <= 0) ? (bU = mm) : (a = mm);
      }
      const Us = 0.5 * (a + bU);
      const Ws = Math.sqrt(Math.max(0, V * V - Us * Us));
      const bb = 1 - (Us * Us) / (V * V);
      if (Us > 1e-3 && bb > 1e-7 && bb < 1 - 1e-9 && Math.abs(eigRatio(Us, V, l)) < 1e-3) {
        found += 1;
        if (found === m) return { U: Us, W: Ws, b: bb, l, m };
      }
    }
    prevU = U; prevF = F; prevJ = Jc;
  }
  return null;
}

// Number of guided LP modes (distinct (l,m)) up to small l; used for
// the single-mode test.
export function guidedModeCount(V) {
  let n = 0;
  for (let l = 0; l <= 6; l += 1) for (let m = 1; m <= 6; m += 1) if (solveLP(V, l, m)) n += 1;
  return n;
}

// Radial intensity profile |E(r)|^2 of LP_lm (peak normalised to 1),
// r in units of the core radius a.
export function modeIntensity(r, mode) {
  const { U, W, l } = mode;
  const amp = r <= 1 ? besselJ(l, U * r) / besselJ(l, U) : besselK(l, W * r) / besselK(l, W);
  return amp * amp;
}

// Chirp-free Gaussian RMS pulse width after distance z (Agrawal 2019).
export function dispersionLength(T0, beta2) { return (T0 * T0) / Math.abs(beta2); }
export function pulseWidth(z, T0, beta2) {
  const LD = dispersionLength(T0, beta2);
  return T0 * Math.sqrt(1 + (z / LD) ** 2);
}
