// sim.js
// Shakura-Sunyaev standard thin-disc temperature profile around a
// non-rotating compact object (Newtonian gravity):
//
//   T(r) = T_in * (R_in / r)^(3/4) * [1 - sqrt(R_in / r)]^(1/4)
//
// where T_in is a reference temperature at the inner edge (set so that
// the maximum temperature is 1 unit) and R_in is the inner disc radius
// (we take R_in = 1 in units where ISCO = 6 GM/c^2).
//
// Far from the inner edge: T ~ r^(-3/4), the famous "T ~ r^(-3/4)"
// scaling for steady, optically thick, geometrically thin discs.
//
// Each annulus radiates as a local blackbody. The radiated SED is the sum
// of Planck spectra weighted by annulus area:
//   F_nu = integral 2 pi r dr * B_nu(T(r))
//
// Reference: Frank, King, Raine, Accretion Power in Astrophysics 3e Ch. 5
// (`frank-king-raine`); Shakura-Sunyaev 1973.

export const R_IN = 1.0;
export const R_OUT = 200.0;
export const T_IN_REFERENCE = 1.0;     // dimensionless

// Bare temperature scaling (without the inner-edge boundary correction).
export function temperatureBare(r) {
  return T_IN_REFERENCE * Math.pow(R_IN / r, 0.75);
}

// Full Shakura-Sunyaev temperature profile.
export function temperature(r) {
  if (r <= R_IN) return 0;
  return T_IN_REFERENCE * Math.pow(R_IN / r, 0.75) * Math.pow(1 - Math.sqrt(R_IN / r), 0.25);
}

// Maximum temperature: occurs at r = (49 / 36) R_in (set dT/dr = 0).
// At that radius T_max approx 0.488 * T_IN_REFERENCE.
export const R_TMAX = (49 / 36) * R_IN;
export const T_MAX  = temperature(R_TMAX);

// Wien-displacement: peak wavelength lambda_max ~ 1 / T (in suitable
// units).
//
// Planck spectrum B_nu(T) in dimensionless units (h = k = 1), used to
// build the multicolour-blackbody SED of the whole disc.
export function planckNu(nu, T) {
  if (T <= 1e-6 || nu <= 0) return 0;
  const x = nu / T;
  if (x > 60) return 0;
  return (nu * nu * nu) / (Math.exp(x) - 1);
}

// Disc-integrated SED  F_nu = integral 2 pi r B_nu(T(r)) dr, sampled on
// a log-frequency grid. The hallmark is the F_nu ~ nu^(1/3) middle
// segment between the Rayleigh-Jeans tail and the Wien cutoff.
export function discSED(nNu = 80, rOut = R_OUT) {
  const nuLo = 0.02, nuHi = 8.0;
  const nu = new Float64Array(nNu);
  const Fnu = new Float64Array(nNu);
  const nR = 240;
  for (let k = 0; k < nNu; k += 1) {
    const lnu = Math.log(nuLo) + (Math.log(nuHi) - Math.log(nuLo)) * k / (nNu - 1);
    nu[k] = Math.exp(lnu);
    let s = 0;
    for (let j = 1; j < nR; j += 1) {
      const r = R_IN * Math.pow(rOut / R_IN, j / (nR - 1));
      const dr = r - R_IN * Math.pow(rOut / R_IN, (j - 1) / (nR - 1));
      s += 2 * Math.PI * r * planckNu(nu[k], temperature(r)) * dr;
    }
    Fnu[k] = s;
  }
  return { nu, Fnu };
}

// For visualization, map T to RGB via a blackbody-like color.
export function temperatureToRGB(T) {
  // Map T to color: hot = blue/white, warm = orange, cool = red.
  // Cheap mapping using T / T_max.
  const ratio = T / T_MAX;
  // 0 = black, 0.3 = deep red, 0.7 = orange, 1 = bluish white.
  let r, g, b;
  if (ratio < 0.3) {
    r = 255 * (ratio / 0.3); g = 0; b = 0;
  } else if (ratio < 0.7) {
    const u = (ratio - 0.3) / 0.4;
    r = 255;
    g = 200 * u;
    b = 0;
  } else {
    const u = Math.min(1, (ratio - 0.7) / 0.3);
    r = 255;
    g = 200 + 55 * u;
    b = 240 * u;
  }
  return [r | 0, g | 0, b | 0];
}
