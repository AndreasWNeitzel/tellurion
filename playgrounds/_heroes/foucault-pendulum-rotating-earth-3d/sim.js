// Headless physics for the Foucault pendulum hero. A pendulum
// suspended at colatitude theta (so latitude = pi/2 - theta) oscillates
// in a local tangent plane. In the Earth-co-rotating frame the
// equations of motion in the (e_east, e_north) local horizontal basis
// are (small-angle):
//   xddot = -omega_pend^2 x + 2 Omega_eff yddot,
//   yddot = -omega_pend^2 y - 2 Omega_eff xddot,
// where Omega_eff = Omega_earth * cos(theta) = Omega_earth * sin(lat).
// The Coriolis term rotates the plane of oscillation at angular rate
// Omega_eff: 360 deg in 24h / sin(lat). At the pole, one full
// precession per sidereal day; at the equator, no precession at all.
// References: Foucault, Comptes Rendus 32 (1851) 135 (`foucault1851`);
// Goldstein, Classical Mechanics, 3rd ed., Ch. 4.10 (`goldstein-mechanics`).

// Sidereal-day-equivalent Earth rotation rate. We choose Omega such
// that one period at latitude 90 deg is comfortably observable in a
// few seconds of animation.
export const OMEGA_EARTH = 0.6;            // code units; 1 "day" ~ 2pi/0.6 s
export const G_OVER_L = 4.0;               // pendulum natural frequency squared
export const PENDULUM_OMEGA = Math.sqrt(G_OVER_L);

// Local-horizontal coordinates (x = east, y = north), latitude phi
// in radians. Returns one velocity-Verlet step in the rotating frame.
export function step(state, dt, phi = Math.PI / 4) {
  const Omega_z = OMEGA_EARTH * Math.sin(phi);    // effective rotation
  // Predictor-corrector for the Coriolis term: do an exact rotation
  // by 2 Omega_z dt over the velocity, then apply the harmonic spring.
  const cos = Math.cos(-2 * Omega_z * dt);
  const sin = Math.sin(-2 * Omega_z * dt);
  // Half-kick: spring force -omega_pend^2 (x, y) over dt/2.
  state.vx += -G_OVER_L * state.x * (dt / 2);
  state.vy += -G_OVER_L * state.y * (dt / 2);
  // Rotate velocity by Coriolis angle (this is the canonical Boris-
  // style trick for the centrifugal-Coriolis subsystem):
  const vxNew = cos * state.vx - sin * state.vy;
  const vyNew = sin * state.vx + cos * state.vy;
  state.vx = vxNew;
  state.vy = vyNew;
  // Drift
  state.x += dt * state.vx;
  state.y += dt * state.vy;
  // Half-kick
  state.vx += -G_OVER_L * state.x * (dt / 2);
  state.vy += -G_OVER_L * state.y * (dt / 2);
  state.t += dt;
}

// Precession period in code-time units: 2 pi / (Omega_earth sin lat).
export function precessionPeriod(phi) {
  const Om = OMEGA_EARTH * Math.sin(phi);
  if (Math.abs(Om) < 1e-9) return Infinity;
  return 2 * Math.PI / Math.abs(Om);
}

// Pendulum period (latitude-independent).
export function pendulumPeriod() {
  return 2 * Math.PI / PENDULUM_OMEGA;
}

// Plane-of-oscillation angle (in radians from local east), measured by
// the angle between the position vector and the e_east axis when the
// pendulum is near its turning point (|v| smallest). For small Coriolis
// the simpler measure atan2(y, x) drifts at rate -Omega_eff.
export function planeAngle(state) {
  return Math.atan2(state.y, state.x);
}

// Total mechanical energy (kinetic + harmonic potential). Small-angle
// approximation; conserved by the symplectic integrator to dt^2 drift.
export function energy(state) {
  return 0.5 * (state.vx * state.vx + state.vy * state.vy)
    + 0.5 * G_OVER_L * (state.x * state.x + state.y * state.y);
}

// Initial condition: release at +x with zero velocity.
export function ic(amp = 1.0) {
  return { x: amp, y: 0, vx: 0, vy: 0, t: 0 };
}
