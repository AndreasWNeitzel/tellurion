// Reflection and refraction at a planar dielectric interface. Snell's
// law n1 sin(th1) = n2 sin(th2) sets the refracted angle; the Fresnel
// amplitude coefficients give the s- and p-polarised reflectance.
// p-polarisation vanishes at Brewster's angle th_B = atan(n2/n1); for
// n1 > n2 above the critical angle th_c = asin(n2/n1) the wave is
// totally internally reflected and the transmitted field is
// evanescent. Energy is conserved, R + T = 1. Headless and
// deterministic. Reference: Hecht, Optics (5th ed.), Sec. 4.6;
// Jackson, Classical Electrodynamics (3rd ed.), Sec. 7.3.

const cAdd = (a, b) => ({ re: a.re + b.re, im: a.im + b.im });
const cSub = (a, b) => ({ re: a.re - b.re, im: a.im - b.im });
const cMul = (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const cDiv = (a, b) => { const d = b.re * b.re + b.im * b.im; return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d }; };
const cAbs2 = (a) => a.re * a.re + a.im * a.im;
const R = (x) => ({ re: x, im: 0 });

export function snellSinTheta2(n1, n2, th1) { return (n1 / n2) * Math.sin(th1); }

// cos(theta2): real for refraction, pure imaginary in TIR.
export function cosTheta2(n1, n2, th1) {
  const s2 = snellSinTheta2(n1, n2, th1), c2 = 1 - s2 * s2;
  return c2 >= 0 ? { re: Math.sqrt(c2), im: 0 } : { re: 0, im: Math.sqrt(-c2) };
}

export function snellTheta2(n1, n2, th1) {
  const s2 = snellSinTheta2(n1, n2, th1);
  return Math.abs(s2) <= 1 ? Math.asin(s2) : null;             // null => TIR
}

export function brewster(n1, n2) { return Math.atan(n2 / n1); }
export function criticalAngle(n1, n2) { return n1 > n2 ? Math.asin(n2 / n1) : null; }

// Fresnel coefficients (Hecht sign convention). Returns amplitude
// r_s, r_p (complex), reflectance R_s, R_p, transmittance T_s, T_p,
// the TIR flag and the evanescent decay constant (in units of k0).
export function fresnel(n1, n2, th1) {
  const c1 = Math.cos(th1), c2 = cosTheta2(n1, n2, th1);
  const tir = c2.im !== 0;
  const N1 = R(n1), N2 = R(n2), C1 = R(c1);
  // s: r_s = (n1 c1 - n2 c2)/(n1 c1 + n2 c2)
  const n1c1 = cMul(N1, C1), n2c2 = cMul(N2, c2);
  const rs = cDiv(cSub(n1c1, n2c2), cAdd(n1c1, n2c2));
  const ts = cDiv(cMul(R(2), n1c1), cAdd(n1c1, n2c2));
  // p: r_p = (n2 c1 - n1 c2)/(n2 c1 + n1 c2)
  const n2c1 = cMul(N2, C1), n1c2 = cMul(N1, c2);
  const rp = cDiv(cSub(n2c1, n1c2), cAdd(n2c1, n1c2));
  const tp = cDiv(cMul(R(2), n1c1), cAdd(n2c1, n1c2));
  const Rs = cAbs2(rs), Rp = cAbs2(rp);
  let Ts = 0, Tp = 0;
  if (!tir) {
    const fac = (n2 * c2.re) / (n1 * c1);
    Ts = fac * cAbs2(ts);
    Tp = fac * cAbs2(tp);
  }
  // evanescent amplitude decay: exp(-kappa z), kappa/k0 = sqrt(n1^2 sin^2 - n2^2)
  const arg = n1 * n1 * Math.sin(th1) ** 2 - n2 * n2;
  const kappaK0 = arg > 0 ? Math.sqrt(arg) : 0;
  return { rs, rp, ts, tp, Rs, Rp, Ts, Tp, tir, kappaK0 };
}
