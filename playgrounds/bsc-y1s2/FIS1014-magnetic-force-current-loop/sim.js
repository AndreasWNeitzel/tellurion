// sim.js
// Torque on a current loop in a uniform magnetic field, the electric-motor
// principle. A loop of N turns, area A, carrying current I has a magnetic moment
// m = N I A n (n the unit normal). In a uniform field B the net force is zero but
// the torque is
//   tau = m x B,   |tau| = N I A B sin(theta),
// theta the angle between m and B, with orientation energy U = -m.B =
// -N I A B cos(theta). Stable equilibrium at theta = 0 (m aligned with B),
// unstable at theta = pi.
//
// Free mode: a magnetic pendulum, Im theta'' = -N I A B sin(theta) - gamma theta'.
// Motor mode: a commutator reverses the current as the loop passes theta = 0, pi,
// so the torque always drives the rotation one way,
//   Im theta'' = N I A B |sin(theta)| - gamma theta',
// a DC motor whose torque ripples as |sin| and which reaches a terminal speed set
// by the load gamma.
//
// Reference: Griffiths, Introduction to Electrodynamics, 5e, Sec. 6.1.3; Halliday,
// Resnick and Walker, Fundamentals of Physics, Ch. 28.

export function moment(N, I, A) { return N * I * A; }
export function torqueFree(N, I, A, B, theta) { return -N * I * A * B * Math.sin(theta); }
export function torqueMotor(N, I, A, B, theta) { return N * I * A * B * Math.abs(Math.sin(theta)); }
export function energy(N, I, A, B, theta) { return -N * I * A * B * Math.cos(theta); }
export function totalEnergy(s, p) { return 0.5 * p.Im * s.omega * s.omega + energy(p.N, p.I, p.A, p.B, s.theta); }

export function createState(theta0 = 0.7, omega0 = 0) { return { theta: theta0, omega: omega0, t: 0 }; }

// Semi-implicit (symplectic) step; mode 'free' or 'motor'.
export function step(s, dt, p) {
  const tau = p.mode === 'motor' ? torqueMotor(p.N, p.I, p.A, p.B, s.theta) : torqueFree(p.N, p.I, p.A, p.B, s.theta);
  const alpha = (tau - p.gamma * s.omega) / p.Im;
  s.omega += alpha * dt;
  s.theta += s.omega * dt;
  s.t += dt;
  return s;
}

// Small-angle period of the free magnetic pendulum.
export function smallAnglePeriod(p) { return 2 * Math.PI * Math.sqrt(p.Im / (p.N * p.I * p.A * p.B)); }

// Terminal angular speed of the motor: the half-cycle-average drive (2/pi) N I A B
// balances the load gamma omega.
export function terminalOmegaMotor(p) { return (2 / Math.PI) * p.N * p.I * p.A * p.B / p.gamma; }
