// Single charged particle in static electric and magnetic fields,
// m dv/dt = q (E + v x B), integrated with the Boris pusher (Boris
// 1970): a time-reversible leapfrog that conserves speed exactly in a
// pure magnetic field. The guiding-centre drifts (E x B, grad-B,
// curvature) and the magnetic-mirror adiabatic invariant
// mu = m v_perp^2 / 2B follow (Chen 1984; Northrop 1963; Jackson
// 1998). No DOM, deterministic. 3-vectors are plain [x, y, z].

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mag = (a) => Math.sqrt(dot(a, a));

// Field presets. Each returns { E(r), B(r) }.
export function fields(preset, p = {}) {
  const B0 = p.B0 ?? 1, E0 = p.E0 ?? 0.4, a = p.grad ?? 0.06, b = p.mirror ?? 0.05;
  switch (preset) {
    case 'cyclotron':
      return { E: () => [0, 0, 0], B: () => [0, 0, B0] };
    case 'exb':
      return { E: () => [E0, 0, 0], B: () => [0, 0, B0] };
    case 'gradB':
      return { E: () => [0, 0, 0], B: (r) => [0, 0, B0 * (1 + a * r[0])] };
    case 'curvature': {
      // Azimuthal B around the z-axis: field lines are circles, so the
      // guiding centre shows a curvature drift along z.
      return {
        E: () => [0, 0, 0],
        B: (r) => {
          const rho = Math.hypot(r[0], r[1]) || 1e-6;
          return [-B0 * r[1] / rho, B0 * r[0] / rho, 0];
        },
      };
    }
    case 'mirror':
      // Paraxial magnetic bottle, divergence-free to leading order:
      // B_z = B0 g(z), B_r = -(r/2) B0 g'(z) with g = 1 + b z^2. The
      // radial component is what produces the mirror force, so the
      // particle actually reflects.
      return {
        E: () => [0, 0, 0],
        B: (r) => {
          const g = 1 + b * r[2] * r[2];
          const gp = 2 * b * r[2];
          return [-0.5 * r[0] * B0 * gp, -0.5 * r[1] * B0 * gp, B0 * g];
        },
      };
    default:
      return { E: () => [0, 0, 0], B: () => [0, 0, B0] };
  }
}

export function createState({ q = 1, m = 1, r0 = [0, 0, 0], v0 = [1, 0, 0.3], preset = 'cyclotron', params = {} } = {}) {
  const f = fields(preset, params);
  return { q, m, r: r0.slice(), v: v0.slice(), preset, params, f, t: 0, trail: [] };
}

// Boris pusher. Exactly conserves |v| when E = 0.
export function step(s, dt) {
  const { q, m } = s;
  const E = s.f.E(s.r), B = s.f.B(s.r);
  const qm = q / m;
  const half = scl(E, qm * dt / 2);
  const vMinus = add(s.v, half);
  const tt = scl(B, qm * dt / 2);
  const t2 = dot(tt, tt);
  const ss = scl(tt, 2 / (1 + t2));
  const vPrime = add(vMinus, cross(vMinus, tt));
  const vPlus = add(vMinus, cross(vPrime, ss));
  s.v = add(vPlus, half);
  s.r = add(s.r, scl(s.v, dt));
  s.t += dt;
}

export function speed(s) { return mag(s.v); }
export function kinetic(s) { return 0.5 * s.m * dot(s.v, s.v); }

// E x B drift velocity (exact, charge- and mass-independent).
export function exbDrift(s) {
  const E = s.f.E(s.r), B = s.f.B(s.r);
  return scl(cross(E, B), 1 / dot(B, B));
}

// Magnetic moment mu = m v_perp^2 / (2 |B|), the adiabatic invariant.
export function magneticMoment(s) {
  const B = s.f.B(s.r), Bmag = mag(B) || 1e-12;
  const vpar = dot(s.v, B) / Bmag;
  const vperp2 = dot(s.v, s.v) - vpar * vpar;
  return s.m * vperp2 / (2 * Bmag);
}

export function vParallel(s) {
  const B = s.f.B(s.r), Bmag = mag(B) || 1e-12;
  return dot(s.v, B) / Bmag;
}

// Analytic cyclotron angular frequency omega_c = |q| B / m.
export function gyrofrequency(q, m, B0) { return Math.abs(q) * B0 / m; }
