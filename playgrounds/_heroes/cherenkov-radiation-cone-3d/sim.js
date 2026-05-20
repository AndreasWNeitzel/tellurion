// Headless physics for the Cherenkov-radiation cone hero. A charged
// particle in a medium of refractive index n moves at speed v >
// c_med = c/n; each point on its trajectory emits a spherical light
// wave at the medium's phase speed, and coherent superposition makes
// these wavelets pile up on a cone with half-angle
//
//   cos(theta_C) = (c / n) / v = 1 / (beta * n),
//
// where beta = v/c. The threshold for Cherenkov emission is beta * n = 1.
//
// References: Jackson, Classical Electrodynamics, 3rd ed., Section 13.4
// (`jackson3e`); Frank and Tamm, Doklady Akad. Nauk SSSR 14 (1937) 109.

export const C_LIGHT = 1.0;             // light speed in vacuum, code units

// Cherenkov angle theta_C from beta = v/c and refractive index n.
// Returns null below threshold (beta * n < 1).
export function cherenkovAngle(beta, n) {
  const cosThetaC = 1 / (beta * n);
  if (cosThetaC > 1 || beta * n <= 1) return null;
  return Math.acos(cosThetaC);
}

// Number of photons emitted per unit length per unit wavelength
// (Frank-Tamm). Returned as a multiplicative factor for normalization
// to a reference (lambda0):
//   dN/(dx d lambda) propto (2 pi alpha / lambda^2) (1 - 1/(beta n)^2)
// We use the parenthesized factor as the "intensity"; the eye-friendly
// rendering picks a wavelength gradient from this.
export function frankTammFactor(beta, n) {
  const x = beta * n;
  if (x <= 1) return 0;
  return 1 - 1 / (x * x);
}

// Particle's position along x at time t (uniform motion).
export function particleX(t, beta) {
  return beta * C_LIGHT * t;
}

// A wavelet emitted at time t_emit from position (x_emit, 0, 0) has
// radius r = (c/n) * (t_obs - t_emit) at observation time t_obs.
// Returns null if the wavelet hasn't started propagating yet
// (t_obs < t_emit).
export function waveletRadius(t_obs, t_emit, n) {
  const cMed = C_LIGHT / n;
  const dt = t_obs - t_emit;
  if (dt < 0) return 0;
  return cMed * dt;
}

// Sample times t_emit uniformly in [0, t_obs] and return the (x_emit, r)
// pairs that the renderer can draw as expanding circles. The
// constructive interference forms a cone wherever the wavelets'
// envelope touches; that envelope is what makes the Cherenkov shock.
export function wavelets(t_obs, beta, n, N = 24) {
  const result = [];
  for (let k = 0; k < N; k += 1) {
    const t_emit = (k / N) * t_obs;
    result.push({
      x: particleX(t_emit, beta),
      t_emit,
      r: waveletRadius(t_obs, t_emit, n),
    });
  }
  return result;
}
