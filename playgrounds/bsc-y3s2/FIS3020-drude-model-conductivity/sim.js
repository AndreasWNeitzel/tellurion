// The Drude model of electrical conduction. Free electrons (density n, mass m, charge
// -e) drift through a metal under a field E, accelerating between random collisions of
// mean time tau that randomize their velocity. The steady drift velocity is
// v_d = -eE tau/m, giving Ohm's law j = sigma E with the DC conductivity sigma = n e^2 tau/m.
// At frequency omega the response rolls off as sigma(omega) = sigma_0/(1 + i omega tau).
// Units e = m = 1. Reference: Ashcroft and Mermin, Solid State Physics, Ch. 1.

export function conductivity(tau, n = 1) { return n * tau; }                 // sigma = n e^2 tau/m
export function currentDensity(E, tau, n = 1) { return conductivity(tau, n) * E; }  // j = sigma E
export function driftVelocity(E, tau) { return -E * tau; }                   // v_d = -e E tau/m
export function meanFreePath(vth, tau) { return vth * tau; }                 // ell = v_th tau

// Magnitude of the AC conductivity, sigma_0 / sqrt(1 + (omega tau)^2): the Drude rolloff.
export function acConductivityMag(omega, tau, sigma0) { return sigma0 / Math.sqrt(1 + (omega * tau) * (omega * tau)); }

// Monte Carlo drift of a Drude electron: acceleration -E between Poisson collisions of
// rate 1/tau that reset the velocity to a random thermal direction. Returns the mean v_x.
export function simulateDrift(E, tau, vth, steps, dt, rng) {
  let vx = 0, sum = 0;
  for (let i = 0; i < steps; i += 1) {
    vx += -E * dt;
    if (rng() < dt / tau) { vx = vth * Math.cos(2 * Math.PI * rng()); }
    sum += vx;
  }
  return sum / steps;
}
