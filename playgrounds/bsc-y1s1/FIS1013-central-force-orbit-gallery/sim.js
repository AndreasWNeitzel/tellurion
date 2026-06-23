// Motion in a central potential V(r) = k r^p (p != 0) or k ln r (p = 0),
// with the orbit integrated by velocity-Verlet (symplectic, so the
// energy and angular momentum stay flat). The effective potential
// V_eff(r) = V(r) + L^2 / (2 mu r^2) governs the radial turning points
// and the orbit class. Headless and deterministic.
//   F(r) = -dV/dr = -k p r^(p-1)   (p != 0)
//   F(r) = -k / r                  (p = 0, logarithmic)
// Kepler is p = -1 with k < 0 (attractive 1/r); the isotropic
// oscillator is p = 2 with k > 0. Both give closed orbits (Bertrand).
// Reference: Goldstein, Classical Mechanics (3rd ed.), Ch. 3;
// Landau and Lifshitz, Mechanics (3rd ed.), Sec. 14-15.

export const MU = 1;

export function potential(r, k, p) {
  return p === 0 ? k * Math.log(r) : k * Math.pow(r, p);
}
export function forceMag(r, k, p) {
  // Radial force component F_r = -dV/dr (negative = attractive inward).
  return p === 0 ? -k / r : -k * p * Math.pow(r, p - 1);
}
export function vEff(r, k, p, L) {
  return potential(r, k, p) + (L * L) / (2 * MU * r * r);
}

export function createOrbit({ k = -1, p = -1, L = 1.0, r0 = 1.6, vr0 = 0 } = {}) {
  // Start at radius r0 with radial velocity vr0; tangential speed set
  // by the angular momentum L = mu r v_theta.
  const vth = L / (MU * r0);
  return {
    k, p, L,
    x: r0, y: 0,
    vx: vr0, vy: vth,
    t: 0,
  };
}

function accel(s, x, y) {
  const r = Math.hypot(x, y) || 1e-9;
  const F = forceMag(r, s.k, s.p);     // radial force component
  return [F * x / r / MU, F * y / r / MU];
}

export function step(s, dt) {
  // Velocity-Verlet.
  const [ax, ay] = accel(s, s.x, s.y);
  s.x += s.vx * dt + 0.5 * ax * dt * dt;
  s.y += s.vy * dt + 0.5 * ay * dt * dt;
  const [ax2, ay2] = accel(s, s.x, s.y);
  s.vx += 0.5 * (ax + ax2) * dt;
  s.vy += 0.5 * (ay + ay2) * dt;
  s.t += dt;
  return s;
}

export function energy(s) {
  const r = Math.hypot(s.x, s.y);
  return 0.5 * MU * (s.vx * s.vx + s.vy * s.vy) + potential(r, s.k, s.p);
}
export function angularMomentum(s) {
  return MU * (s.x * s.vy - s.y * s.vx);
}

// Laplace-Runge-Lenz direction (radians). Conserved (constant) only for
// the inverse-square law (p = -1): a fixed perihelion, closed ellipse.
// For other power laws it precesses (rosette), which is the drama.
export function lrlAngle(s) {
  const alpha = -s.k;                       // attractive 1/r^2 strength
  const px = MU * s.vx, py = MU * s.vy;
  const Lz = MU * (s.x * s.vy - s.y * s.vx);
  const r = Math.hypot(s.x, s.y) || 1e-9;
  const Ax = py * Lz - MU * alpha * s.x / r;
  const Ay = -px * Lz - MU * alpha * s.y / r;
  return Math.atan2(Ay, Ax);
}

// Classify the orbit from the energy relative to V_eff. Returns one of
// 'bound', 'unbound', 'circular'.
export function orbitClass(s) {
  const E = energy(s);
  // Sample V_eff to find its minimum (stable circular radius).
  let vmin = Infinity;
  for (let r = 0.05; r < 60; r *= 1.03) vmin = Math.min(vmin, vEff(r, s.k, s.p, s.L));
  if (Math.abs(E - vmin) < 1e-3) return 'circular';
  // Bound if V_eff -> +inf as r -> inf exceeds E (a finite outer turn).
  const far = vEff(1e4, s.k, s.p, s.L);
  return E < far ? 'bound' : 'unbound';
}
