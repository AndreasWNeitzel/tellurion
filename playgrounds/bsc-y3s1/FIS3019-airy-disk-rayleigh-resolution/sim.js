// Two point sources seen through a circular aperture: the Airy disk and
// the Rayleigh resolution criterion. Each source images to an Airy
// pattern I(alpha)/I0 = [2 J1(x)/x]^2 with x = pi D sin(alpha) / lambda.
// The first dark ring sits at x = 3.8317, i.e. the Rayleigh angle
//   theta_R = 1.22 lambda / D.
// Two incoherent sources add in intensity. They are "just resolved" when
// their separation equals theta_R: the peak of one falls on the first
// dark ring of the other, leaving a central dip to about 73.5 percent of
// the peak.
//
// Distances along the source-separation axis are measured in units of the
// Rayleigh angle (u = alpha / theta_R), so the scaled Airy argument is
//   x = 3.83170597 * u.
//
// References:
//   Hecht, Optics (2017), Sec. 10.2.5.
//   Born and Wolf, Principles of Optics (1999), Sec. 8.6.
//   besselJ1: Numerical Recipes 6.5; Abramowitz and Stegun 9.4.4.

const J1_SERIES_NMAX = 20;
const J1_SERIES_THRESH = 8;
export const J1_FIRST_ZERO = 3.83170597;                // first dark ring
export const RAYLEIGH_FACTOR = J1_FIRST_ZERO / Math.PI; // 1.21967 -> theta_R = 1.22 lambda/D

// J_1(x) Bessel function of the first kind.
export function besselJ1(x) {
  const ax = Math.abs(x);
  if (ax < J1_SERIES_THRESH) {
    const z2 = (x / 2) * (x / 2);
    let term = 1, s = 1;
    for (let k = 1; k <= J1_SERIES_NMAX; k += 1) {
      term *= -z2 / (k * (k + 1));
      s += term;
      if (Math.abs(term) < 1e-16 * Math.abs(s)) break;
    }
    return (x / 2) * s;
  }
  const z = 8 / ax;
  const z2 = z * z;
  const p = 1 + z2 * (0.183105e-2 + z2 * (-0.3516396496e-4 + z2 * (0.2457520174e-5 + z2 * (-0.240337019e-6))));
  const q = z * (0.04687499995 + z2 * (-0.2002690873e-3 + z2 * (0.8449199096e-5 + z2 * (-0.88228987e-6 + z2 * (0.105787412e-6)))));
  const phase = ax - 3 * Math.PI / 4;
  const ans = Math.sqrt(0.6366197723675814 / ax) * (p * Math.cos(phase) - q * Math.sin(phase));
  return x < 0 ? -ans : ans;
}

// Airy intensity I(x)/I0 = (2 J1(x)/x)^2.
export function airyIntensity(x) {
  if (Math.abs(x) < 1e-9) return 1;
  const t = 2 * besselJ1(x) / x;
  return t * t;
}

// Single-source Airy intensity as a function of radius in Rayleigh units.
export function airyAtRayleigh(uRadius) {
  return airyIntensity(J1_FIRST_ZERO * uRadius);
}

// Rayleigh angle theta_R (radians) for aperture D and wavelength lambda.
export function rayleighAngle(lambda, D) {
  return RAYLEIGH_FACTOR * lambda / D;
}

// Combined intensity of two equal incoherent sources at +/- sep/2 along
// the u-axis, evaluated at (u, v). All lengths in Rayleigh units.
export function twoSourceIntensity(u, v, sep) {
  const r1 = Math.hypot(u + sep / 2, v);
  const r2 = Math.hypot(u - sep / 2, v);
  return airyAtRayleigh(r1) + airyAtRayleigh(r2);
}

// Intensity along the separation axis (v = 0).
export function axialIntensity(u, sep) {
  return airyAtRayleigh(Math.abs(u + sep / 2)) + airyAtRayleigh(Math.abs(u - sep / 2));
}

// Saddle-to-peak ratio along the axis: the central dip relative to the
// brighter of the two peaks. < 1 means a visible dip (resolvable).
export function dipRatio(sep) {
  if (sep < 1e-6) return 1;
  const mid = axialIntensity(0, sep);
  // The profile is symmetric; scan u >= 0 (including the centre) for the
  // true peak. Seeding peak with mid guarantees peak >= saddle, so the
  // ratio never exceeds 1 from sampling gaps.
  let peak = mid;
  for (let u = 0; u <= sep / 2 + 0.8; u += 0.005) {
    const I = axialIntensity(u, sep);
    if (I > peak) peak = I;
  }
  return mid / peak;
}

// Resolution verdict from the separation in Rayleigh units.
export function verdict(sep) {
  if (sep >= 1.03) return 'RESOLVED';
  if (sep >= 0.97) return 'AT RAYLEIGH LIMIT';
  return 'UNRESOLVED';
}
