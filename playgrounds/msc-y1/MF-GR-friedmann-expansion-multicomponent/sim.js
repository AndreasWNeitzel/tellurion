// Multicomponent flat FLRW cosmology (Friedmann 1922; Ryden,
// Introduction to Cosmology, 2nd ed.; Planck 2018 parameters).
//   H(a)^2 = H0^2 ( Or/a^4 + Om/a^3 + OL ),  flat: Or + Om + OL = 1.
// H0 is converted from km/s/Mpc to 1/Gyr so ages come out in Gyr.

export const KMS_MPC_TO_INVGYR = 1.022694e-3;          // (km/s/Mpc) -> 1/Gyr

export function h0InvGyr(H0kms) { return H0kms * KMS_MPC_TO_INVGYR; }

// Hubble parameter at scale factor a (1/Gyr).
export function hubble(a, { Om, OL, Or = 0, H0kms = 67.4 }) {
  return h0InvGyr(H0kms) * Math.sqrt(Or / (a * a * a * a) + Om / (a * a * a) + OL);
}
// E(a) = H(a)/H0 (dimensionless).
export function Efunc(a, { Om, OL, Or = 0 }) {
  return Math.sqrt(Or / (a * a * a * a) + Om / (a * a * a) + OL);
}

// Fractional energy densities (sum to 1 at every a).
export function densityFractions(a, { Om, OL, Or = 0 }) {
  const rr = Or / (a * a * a * a), rm = Om / (a * a * a), rL = OL;
  const tot = rr + rm + rL;
  return { fr: rr / tot, fm: rm / tot, fL: rL / tot, tot };
}

// Cosmic time elapsed up to scale factor a:
//   t(a) = (1/H0) integral_0^a da' / (a' E(a'))  [Gyr].
export function ageAt(a, p, N = 20000) {
  const H0 = h0InvGyr(p.H0kms ?? 67.4);
  const aMin = 1e-8;
  let s = 0;
  for (let i = 0; i <= N; i += 1) {
    const aa = aMin + (a - aMin) * i / N;
    const f = 1 / (aa * Efunc(aa, p));
    const w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    s += w * f;
  }
  return (s * ((a - aMin) / N) / 3) / H0;
}
export function ageNow(p) { return ageAt(1, p); }

// Scale-factor history a(t): integrate da/dt = a H(a) (RK4) from a
// tiny a; returns {t (Gyr), a} up to aMax.
export function scaleHistory(p, aMax = 4, steps = 6000) {
  const t = [], a = [];
  let aa = 1e-5, tt = 0;
  const tEnd = 2.2 * ageNow(p);
  const dt = tEnd / steps;
  const f = (av) => av * hubble(av, p);
  for (let i = 0; i < steps && aa < aMax; i += 1) {
    t.push(tt); a.push(aa);
    const k1 = f(aa), k2 = f(aa + 0.5 * dt * k1), k3 = f(aa + 0.5 * dt * k2), k4 = f(aa + dt * k3);
    aa += dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); tt += dt;
  }
  t.push(tt); a.push(aa);
  return { t, a };
}

// Equality epochs.
export function aEqMatterRadiation({ Om, Or }) { return Or / Om; }
export function aEqMatterLambda({ Om, OL }) { return Math.cbrt(Om / OL); }
// Acceleration onset: q = 0 at a = (Om/(2 OL))^{1/3}.
export function aAccelOnset({ Om, OL }) { return Math.cbrt(Om / (2 * OL)); }

// Deceleration parameter q(a) = (1/2) sum Omega_i(a)(1 + 3 w_i),
// w_r = 1/3, w_m = 0, w_L = -1.
export function deceleration(a, p) {
  const { fr, fm, fL } = densityFractions(a, p);
  return fr + 0.5 * fm - fL;
}

// Comoving particle horizon in units of the Hubble length c/H0:
//   d_p(a) / (c/H0) = integral_0^a da' / (a'^2 E(a')).
export function particleHorizon(a, p, N = 8000) {
  const aMin = 1e-7;
  let s = 0;
  for (let i = 0; i <= N; i += 1) {
    const aa = aMin + (a - aMin) * i / N;
    const f = 1 / (aa * aa * Efunc(aa, p));
    const w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    s += w * f;
  }
  return s * ((a - aMin) / N) / 3;
}
// Hubble radius in units of c/H0: 1/E(a).
export function hubbleRadius(a, p) { return 1 / Efunc(a, p); }

// Flat closure: OL fixed so Or + Om + OL = 1 exactly (so H(1) = H0).
export function flatParams(Om, Or, H0kms) {
  return { Om, Or, OL: 1 - Om - Or, H0kms };
}
export const PLANCK = Object.freeze(flatParams(0.315, 9.2e-5, 67.4));
