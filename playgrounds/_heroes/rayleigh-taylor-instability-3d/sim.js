// Headless physics for the Rayleigh-Taylor instability hero.
// A dense fluid of density rho_h sits on top of a lighter fluid
// rho_l in a gravitational field g pointing down. Any small
// perturbation of the interface grows exponentially in the linear
// regime with rate
//
//   sigma(k) = sqrt(A k g),
//
// where A = (rho_h - rho_l) / (rho_h + rho_l) is the Atwood number
// (Rayleigh 1883; Taylor 1950). High-k modes grow fastest in the
// inviscid limit; surface tension or viscosity stabilize the
// shortest wavelengths.
//
// In the nonlinear stage, dense fluid forms downward "spikes" and
// light fluid forms upward "bubbles" with terminal velocity
//   v_bubble ~ sqrt(A g lambda / pi).
//
// References:
//   Rayleigh, Proc. Lond. Math. Soc. 14 (1883) 170. `rayleigh-1883`.
//   Taylor, Proc. R. Soc. A 201 (1950) 192. `taylor-1950`.
//   Sharp, Physica D 12 (1984) 3 (review). `sharp-1984`.

export const BOX_X = 2;
export const BOX_Y_HALF = 1;

export function atwoodNumber(rho_h, rho_l) {
  return (rho_h - rho_l) / (rho_h + rho_l);
}

// Linear RT growth rate sigma = sqrt(A k g). When A < 0 (stable
// stratification, light on top), sigma^2 < 0 and the interface
// oscillates with frequency sqrt(|A| k g) (internal gravity waves).
export function growthRate(k, A, g, surface_tension = 0, rho_avg = 1) {
  const buoy = A * k * g;
  const cap = surface_tension * k * k * k / rho_avg;
  const sq = buoy - cap;
  return sq >= 0 ? Math.sqrt(sq) : 0;
}

// Bubble terminal velocity (Davies-Taylor 1950):
//   v_t = sqrt(A g R) where R is the bubble radius.
export function bubbleVelocity(A_atwood, g, R) {
  return Math.sqrt(Math.max(0, A_atwood) * g * R);
}

// Kinematic velocity field for the linear (sinusoidal) RT mode.
// Stream function psi(x, y, t) = A(t) sin(k x) cosh(k y), so that
// inside |y| < L the flow has potential character and decays.
// We use:
//   u(x, y, t) = ∂psi/∂y = A(t) k sin(k x) sinh(k y)
//   v(x, y, t) = -∂psi/∂x = -A(t) k cos(k x) cosh(k y)
// A(t) = A0 exp(sigma t).
export function linearVelocity(x, y, k, amplitude) {
  // amplitude already has the sigma t factor folded in.
  const u = amplitude * k * Math.sin(k * x) * Math.sinh(k * y);
  const v = -amplitude * k * Math.cos(k * x) * Math.cosh(k * y);
  return { u, v };
}

// In the nonlinear regime we use a velocity field that captures the
// spike-and-bubble pattern: density gradient drives buoyancy. We
// model it with a saturating function so the velocity does not blow
// up. Velocity scales as sqrt(A g lambda) at saturation.
export function nonlinearVelocity(x, y, k, A_atwood, g) {
  // A row of alternating spikes (downward at x = pi/k, 3pi/k, ...) and
  // bubbles (upward at x = 0, 2pi/k, ...). Sharper than sinusoid.
  const v_amp = Math.sqrt(Math.max(0, A_atwood) * g / k) * 0.4;
  const phase = k * x;
  // y-window: only act near the interface.
  const win = Math.exp(-Math.abs(y) * 2);
  // Sign: -cos(k x) -> +1 at x=pi/k (spike going down), -1 at x=0 (bubble up)
  const v = -v_amp * Math.cos(phase) * win;
  const u = v_amp * 0.5 * Math.sin(phase) * win * Math.sign(y);
  return { u, v };
}

export function rk4Step(x, y, dt, velFn) {
  const k1 = velFn(x, y);
  const k2 = velFn(x + 0.5 * dt * k1.u, y + 0.5 * dt * k1.v);
  const k3 = velFn(x + 0.5 * dt * k2.u, y + 0.5 * dt * k2.v);
  const k4 = velFn(x + dt * k3.u, y + dt * k3.v);
  let nx = x + (dt / 6) * (k1.u + 2 * k2.u + 2 * k3.u + k4.u);
  let ny = y + (dt / 6) * (k1.v + 2 * k2.v + 2 * k3.v + k4.v);
  // Periodic in x.
  while (nx < 0) nx += BOX_X * Math.PI;
  while (nx >= BOX_X * Math.PI) nx -= BOX_X * Math.PI;
  // Clamp y to box.
  if (ny > BOX_Y_HALF) ny = BOX_Y_HALF;
  if (ny < -BOX_Y_HALF) ny = -BOX_Y_HALF;
  return { x: nx, y: ny };
}

export function makeRng(seed = 0xC0FFEE) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Most-unstable wavenumber when surface tension stabilises high k:
// k_max where d sigma^2 / dk = 0 gives k_max = sqrt(A g rho_avg / (3 T)).
export function mostUnstableK(A_atwood, g, surface_tension, rho_avg) {
  if (surface_tension <= 0) return Infinity;
  return Math.sqrt(A_atwood * g * rho_avg / (3 * surface_tension));
}
