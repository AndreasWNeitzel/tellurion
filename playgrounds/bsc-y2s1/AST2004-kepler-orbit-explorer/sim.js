// sim.js
// Kepler orbit explorer headless core. 2D Newtonian Kepler with GM = 1
// (dimensionless units where a = 1 corresponds to Earth's orbit, 1 yr).
// Multiple independent bodies share the engine: each body has its own
// state vector but the central force is the same and bodies do not
// interact with each other. Symplectic Verlet preserves energy.

import {
  create as engineCreate,
  step as engineStep,
} from '../../../shared/js/engine/symplectic.js';

export const DEFAULT_DT = 0.005;
export const TWO_PI = 2 * Math.PI;

// Real Solar System inner planets (a in AU, e dimensionless, period in yr).
// Argument of periapsis omega chosen to spread the planets visually so they
// don't all line up at apastron at t = 0.
export const PLANETS = [
  { name: 'Mercury', a: 0.387, e: 0.2056, omega: 0.0 * TWO_PI / 4, color: 'cat-1' },
  { name: 'Venus',   a: 0.723, e: 0.0068, omega: 0.5 * TWO_PI / 4, color: 'cat-2' },
  { name: 'Earth',   a: 1.000, e: 0.0167, omega: 1.0 * TWO_PI / 4, color: 'cat-3' },
  { name: 'Mars',    a: 1.524, e: 0.0934, omega: 1.5 * TWO_PI / 4, color: 'cat-4' },
];

// Place a body at periastron (closest approach) along the orientation `omega`.
// r_p = a (1 - e); v_p = sqrt((1 + e) / (a (1 - e))) at periastron.
// The velocity is perpendicular to the position; we orient both vectors
// consistently with omega so the orbit's major axis is rotated by omega.
export function periastronIC(a, e, omega = 0) {
  const r_p = a * (1 - e);
  const v_p = Math.sqrt((1 + e) / (a * (1 - e)));
  // position along direction omega; velocity perpendicular (omega + pi/2)
  return {
    x:  r_p * Math.cos(omega),
    y:  r_p * Math.sin(omega),
    vx: -v_p * Math.sin(omega),
    vy:  v_p * Math.cos(omega),
  };
}

// Kepler's third law in GM = 1 units: T = 2 pi a^(3/2).
export function keplerThirdLaw(a) {
  return TWO_PI * Math.pow(a, 1.5);
}

// Build a swarm with N independent bodies sharing the central potential.
// `bodies` is an array of { a, e, omega }. Each body owns 2 coordinates
// (x_i, y_i); state is laid out [x_0, y_0, x_1, y_1, ...].
export function createSwarm(bodies) {
  const N = bodies.length;
  const positions  = new Float64Array(2 * N);
  const velocities = new Float64Array(2 * N);
  for (let i = 0; i < N; i += 1) {
    const ic = periastronIC(bodies[i].a, bodies[i].e, bodies[i].omega ?? 0);
    positions[2 * i]     = ic.x;
    positions[2 * i + 1] = ic.y;
    velocities[2 * i]     = ic.vx;
    velocities[2 * i + 1] = ic.vy;
  }
  const masses = new Float64Array(N);
  masses.fill(1);

  function accelerationFn(q, _qdot, _m, _t, out) {
    for (let i = 0; i < N; i += 1) {
      const x = q[2 * i], y = q[2 * i + 1];
      const r2 = x * x + y * y;
      const r3 = r2 * Math.sqrt(r2);
      out[2 * i]     = -x / r3;
      out[2 * i + 1] = -y / r3;
    }
  }
  function energyFn(q, qdot, _m) {
    let E = 0;
    for (let i = 0; i < N; i += 1) {
      const x = q[2 * i], y = q[2 * i + 1];
      const vx = qdot[2 * i], vy = qdot[2 * i + 1];
      const r = Math.sqrt(x * x + y * y);
      E += 0.5 * (vx * vx + vy * vy) - 1 / r;
    }
    return E;
  }
  const inst = engineCreate({
    positions, velocities, masses,
    accelerationFn, energyFn,
    integrator: 'verlet',
  });
  return {
    inst,
    N,
    bodies: bodies.slice(),
    periods: bodies.map(b => keplerThirdLaw(b.a)),
  };
}

export function stepSwarm(swarm, dt = DEFAULT_DT) {
  engineStep(swarm.inst, dt);
}

// Read one body's current (x, y).
export function bodyPosition(swarm, i) {
  return { x: swarm.inst.q[2 * i], y: swarm.inst.q[2 * i + 1] };
}

// Eccentricity from current state (Laplace-Runge-Lenz vector magnitude).
export function eccentricityFromState(x, y, vx, vy) {
  const r  = Math.sqrt(x * x + y * y);
  const v2 = vx * vx + vy * vy;
  const L  = x * vy - y * vx;
  // Energy E = v^2/2 - 1/r; semi-latus rectum p = L^2; e = sqrt(1 + 2 E L^2).
  const E  = 0.5 * v2 - 1 / r;
  const arg = 1 + 2 * E * L * L;
  return Math.sqrt(Math.max(0, arg));
}

// Semi-major axis from energy: a = -1 / (2 E).
export function semiMajorFromState(x, y, vx, vy) {
  const r  = Math.sqrt(x * x + y * y);
  const v2 = vx * vx + vy * vy;
  return 1 / (2 / r - v2);
}
