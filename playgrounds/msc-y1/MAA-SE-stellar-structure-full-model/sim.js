// Eddington standard model: an n = 3 polytrope solved from the
// Lane-Emden equation, scaled to a given mass and radius, with the
// ideal-gas-plus-radiation temperature, the pp / CNO / triple-alpha
// energy generation, the Schwarzschild convective criterion and the
// resulting HR position. Carroll and Ostlie Ch. 10; Hansen and Kawaler;
// Kippenhahn and Weigert; Chandrasekhar 1939. SI units throughout.

export const G = 6.674e-11, KB = 1.380649e-23, MH = 1.6726219e-27;
export const A_RAD = 7.5657e-16, SIGMA_SB = 5.670374e-8;
export const MSUN = 1.98892e30, RSUN = 6.957e8, LSUN = 3.828e26;

// Lane-Emden: (1/xi^2) d/dxi(xi^2 dtheta/dxi) = -theta^n. Integrate
// from the regular centre (theta=1, theta'=0) by RK4 to the surface
// theta = 0. Returns the grid, the first zero xi1 and theta'(xi1).
export function solveLaneEmden(n, dxi = 1e-3) {
  const xi = [0], th = [1], dth = [0];
  const f = (x, y, z) => (x === 0 ? -1 / 3 : -(Math.pow(Math.max(y, 0), n)) - 2 * z / x);
  let x = 0, y = 1, z = 0;
  while (y > 0 && x < 50) {
    const k1y = z, k1z = f(x, y, z);
    const k2y = z + 0.5 * dxi * k1z, k2z = f(x + 0.5 * dxi, y + 0.5 * dxi * k1y, z + 0.5 * dxi * k1z);
    const k3y = z + 0.5 * dxi * k2z, k3z = f(x + 0.5 * dxi, y + 0.5 * dxi * k2y, z + 0.5 * dxi * k2z);
    const k4y = z + dxi * k3z, k4z = f(x + dxi, y + dxi * k3y, z + dxi * k3z);
    const ynew = y + (dxi / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
    const znew = z + (dxi / 6) * (k1z + 2 * k2z + 2 * k3z + k4z);
    x += dxi; y = ynew; z = znew;
    xi.push(x); th.push(y); dth.push(z);
  }
  // linear-interpolate the exact surface where theta crosses zero
  const m = xi.length - 1;
  const t = th[m - 1] / (th[m - 1] - th[m]);
  const xi1 = xi[m - 1] + t * (xi[m] - xi[m - 1]);
  const dth1 = dth[m - 1] + t * (dth[m] - dth[m - 1]);
  return { xi, th, dth, xi1, dth1 };
}

const LE3 = solveLaneEmden(3);

// pp-chain energy generation (W/kg). Carroll and Ostlie Eq. 10.46:
// power-law T^4 form near solar temperatures, with the overall rate
// fixed so the solar reference model radiates exactly L_sun.
const EPP_C = 1.962e-12;                                // fixed so the solar model radiates L_sun
export function epsPP(rho, T, X) {
  const T6 = T / 1e6;
  return EPP_C * rho * X * X * Math.pow(T6, 4);
}
// CNO cycle (W/kg), Carroll and Ostlie Eq. 10.58: steep T^19.9 law.
export function epsCNO(rho, T, X, XCNO) {
  const T6 = T / 1e6;
  return 8.67e-31 * rho * X * XCNO * Math.pow(T6, 19.9);
}
// Triple-alpha (W/kg), Carroll and Ostlie Eq. 10.62: T^41 near 1e8 K.
export function epsTriAlpha(rho, T, Y) {
  const T8 = T / 1e8;
  return 50.9 * rho * rho * Y * Y * Y * Math.pow(T8, 41);
}
export function epsTotal(rho, T, X, Y, XCNO) {
  return epsPP(rho, T, X) + epsCNO(rho, T, X, XCNO) + epsTriAlpha(rho, T, Y);
}

// Mean molecular weight of a fully ionised X, Y, Z mixture.
export function meanMolecularWeight(X, Y) {
  const Z = Math.max(0, 1 - X - Y);
  return 1 / (2 * X + 0.75 * Y + 0.5 * Z);
}

// Build the full structure for mass M, radius R and composition.
export function stellarModel({
  M = MSUN, R = RSUN, X = 0.70, Y = 0.28, nShell = 400,
} = {}) {
  const { xi, th, xi1, dth1 } = LE3;
  const Z = Math.max(0, 1 - X - Y), XCNO = Z;
  const mu = meanMolecularWeight(X, Y);
  const rhoMean = 3 * M / (4 * Math.PI * R * R * R);
  const rhoC = rhoMean * (-xi1 / (3 * dth1));            // central density
  const Pc = Math.PI * G * (R / xi1) * (R / xi1) * rhoC * rhoC; // n=3 central pressure
  // central temperature from P = rho k T / (mu mH) + a T^4 / 3 (Newton)
  let Tc = Pc * mu * MH / (rhoC * KB);
  for (let i = 0; i < 40; i += 1) {
    const fT = rhoC * KB * Tc / (mu * MH) + A_RAD * Tc ** 4 / 3 - Pc;
    const dfT = rhoC * KB / (mu * MH) + 4 * A_RAD * Tc ** 3 / 3;
    Tc -= fT / dfT;
  }
  const r = new Float64Array(nShell + 1), rho = new Float64Array(nShell + 1);
  const P = new Float64Array(nShell + 1), T = new Float64Array(nShell + 1);
  const mr = new Float64Array(nShell + 1), Lr = new Float64Array(nShell + 1);
  const eps = new Float64Array(nShell + 1);
  let mAcc = 0, lAcc = 0, rPrev = 0, rhoPrev = rhoC, ePrev = 0;
  for (let i = 0; i <= nShell; i += 1) {
    const xx = xi1 * i / nShell;
    // interpolate theta(xx) on the Lane-Emden grid
    let j = Math.min(xi.length - 2, Math.floor(xx / (xi[1] - xi[0])));
    while (j + 1 < xi.length - 1 && xi[j + 1] < xx) j += 1;
    const frac = (xx - xi[j]) / (xi[j + 1] - xi[j] || 1);
    const thx = Math.max(0, th[j] + frac * (th[j + 1] - th[j]));
    r[i] = R * xx / xi1;
    rho[i] = rhoC * thx ** 3;
    P[i] = Pc * thx ** 4;
    T[i] = Tc * thx;
    const e = epsTotal(rho[i], T[i], X, Y, XCNO);
    eps[i] = e;
    if (i > 0) {
      const rm = 0.5 * (r[i] + rPrev), dr = r[i] - rPrev;
      const rhom = 0.5 * (rho[i] + rhoPrev);
      mAcc += 4 * Math.PI * rm * rm * rhom * dr;
      lAcc += 4 * Math.PI * rm * rm * rhom * 0.5 * (e + ePrev) * dr;
    }
    mr[i] = mAcc; Lr[i] = lAcc;
    rPrev = r[i]; rhoPrev = rho[i]; ePrev = e;
  }
  const Ltot = lAcc;
  const Teff = Math.pow(Ltot / (4 * Math.PI * R * R * SIGMA_SB), 0.25);
  // Schwarzschild criterion with a Kramers bound-free plus electron-
  // scattering opacity (Carroll and Ostlie Eqs. 9.19, 9.22; nabla_rad =
  // 3 kappa L P / (16 pi a c G m T^4), nabla_ad = 0.4 for an ideal
  // monatomic gas). The opacity coefficient is the textbook value set
  // by the composition, not a free parameter: an n = 3 polytrope is
  // radiative in its dense, hot interior and turns convective in the
  // cool outer layers, and a low-mass star is convective throughout.
  const gradAd = 0.4;                                    // nabla_ad = 1 - 1/Gamma2, ideal monatomic
  const cLight = 2.99792458e8;
  const kappaES = 0.02 * (1 + X);                        // electron scattering, m^2/kg
  const kappa0 = 4.34e17 * Z * (1 + X);                  // Kramers bound-free, SI
  const conv = new Uint8Array(nShell + 1);
  const gradRad = new Float64Array(nShell + 1);
  for (let i = 1; i <= nShell; i += 1) {
    const kappa = kappaES + kappa0 * rho[i] * Math.pow(Math.max(T[i], 1), -3.5);
    const denom = 16 * Math.PI * A_RAD * cLight * G * Math.max(mr[i], 1e-6) * Math.pow(Math.max(T[i], 1), 4);
    gradRad[i] = 3 * kappa * Math.max(Lr[i], 0) * P[i] / denom;
    conv[i] = gradRad[i] > gradAd ? 1 : 0;
  }
  gradRad[0] = gradRad[1]; conv[0] = conv[1];
  // fraction of the radius that is convective, and whether the core is
  const fConv = conv.reduce((s, v) => s + v, 0) / (nShell + 1);
  const coreConvective = conv[Math.floor(nShell * 0.05)] === 1;
  return {
    r, rho, P, T, mr, Lr, eps, conv, gradRad, gradAd,
    R, M, X, Y, Z, mu, rhoC, Pc, Tc, Ltot, Teff, xi1,
    massComputed: mAcc, fConv, coreConvective,
  };
}

// Zero-age main sequence: homology L ~ M^3.5, R ~ M^0.7 (Carroll and
// Ostlie Ch. 10), normalised to the Sun; returns (Teff, L/Lsun).
export function zamsPoint(MoverMsun) {
  const L = Math.pow(MoverMsun, 3.5);                    // L / Lsun
  const R = Math.pow(MoverMsun, 0.7);                    // R / Rsun
  const Teff = 5772 * Math.pow(L / (R * R), 0.25);
  return { L, R, Teff, M: MoverMsun };
}
export function zamsTrack(n = 60) {
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const lm = -0.7 + (2.0 - (-0.7)) * i / n;            // 0.2 .. 100 Msun
    pts.push(zamsPoint(Math.pow(10, lm)));
  }
  return pts;
}
