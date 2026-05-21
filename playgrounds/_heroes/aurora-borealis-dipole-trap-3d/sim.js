// Headless physics for the aurora-borealis-dipole-trap-3d hero. A
// charged particle moves in a magnetic dipole field; we integrate the
// Lorentz force F = q v x B with velocity-Verlet (the Boris pusher
// would be exact but the simple integrator is sufficient at our
// timestep). Where particles dip into the atmospheric layer near the
// magnetic poles they excite oxygen/nitrogen and emit aurora.
//
// References: Stormer, The Polar Aurora, Oxford 1955 (`stormer1955`);
// Kivelson and Russell, Introduction to Space Physics, Cambridge 1995
// (`kivelson-russell-1995`); Jackson, Classical Electrodynamics, Ch. 12.

// Earth-centered Cartesian frame. The dipole moment points along -z
// (south magnetic pole in northern geographic, by Stormer convention,
// but we orient it conventionally with +z = magnetic north for the
// visualization).

export const REARTH = 1.0;          // Earth radius in code units
export const RAURORA = 1.10;        // top of atmosphere where aurora lights up (~600 km)
export const RTRAP = 6.0;           // outermost trapping shell

// Magnetic dipole field at position (x, y, z). The dipole moment M is
// along z, magnitude m_dip. Formula:
//   B = (mu0 m_dip / 4 pi) * (3 (m.r) r - r^2 m) / r^5
// in units where mu0 m_dip / 4 pi = 1.
export function dipoleField(x, y, z, m_dip = 1.0) {
  const r2 = x * x + y * y + z * z;
  if (r2 < 1e-8) return [0, 0, 0];
  const r = Math.sqrt(r2);
  const r5 = r2 * r2 * r;
  const mdotr = m_dip * z;            // m = (0, 0, m_dip)
  const Bx = 3 * mdotr * x / r5;
  const By = 3 * mdotr * y / r5;
  const Bz = (3 * mdotr * z - r2 * m_dip) / r5;
  return [Bx, By, Bz];
}

// One Lorentz-force step: v_new = v + (q/m) dt (v x B). We use a
// simple leapfrog with the Boris rotation embedded: angle theta =
// |B| (q/m) dt; rotate v around B by theta. This is symplectic and
// conserves |v| (kinetic energy) exactly.
export function borisPush(v, B, qOverM, dt) {
  const Bmag = Math.sqrt(B[0] * B[0] + B[1] * B[1] + B[2] * B[2]);
  if (Bmag < 1e-12) return v;
  // Half rotation about B by angle theta = qOverM * Bmag * dt.
  const theta = qOverM * Bmag * dt;
  const t = Math.tan(theta / 2);
  const tx = (B[0] / Bmag) * t;
  const ty = (B[1] / Bmag) * t;
  const tz = (B[2] / Bmag) * t;
  // v' = v + v x t
  const vpx = v[0] + (v[1] * tz - v[2] * ty);
  const vpy = v[1] + (v[2] * tx - v[0] * tz);
  const vpz = v[2] + (v[0] * ty - v[1] * tx);
  // s = 2 t / (1 + |t|^2)
  const t2 = tx * tx + ty * ty + tz * tz;
  const sx = 2 * tx / (1 + t2);
  const sy = 2 * ty / (1 + t2);
  const sz = 2 * tz / (1 + t2);
  // v_new = v + v' x s
  const vnx = v[0] + (vpy * sz - vpz * sy);
  const vny = v[1] + (vpz * sx - vpx * sz);
  const vnz = v[2] + (vpx * sy - vpy * sx);
  return [vnx, vny, vnz];
}

// One Boris-pusher step in a magnetic dipole. Drift then kick.
export function stepLorentz(p, dt, qOverM = 1.0, m_dip = 1.0) {
  // Drift half-step.
  p.x += 0.5 * dt * p.vx;
  p.y += 0.5 * dt * p.vy;
  p.z += 0.5 * dt * p.vz;
  // Magnetic rotation.
  const B = dipoleField(p.x, p.y, p.z, m_dip);
  const [nvx, nvy, nvz] = borisPush([p.vx, p.vy, p.vz], B, qOverM, dt);
  p.vx = nvx; p.vy = nvy; p.vz = nvz;
  // Drift half-step.
  p.x += 0.5 * dt * p.vx;
  p.y += 0.5 * dt * p.vy;
  p.z += 0.5 * dt * p.vz;
}

// Spawn a particle TRAPPED on a dipole field line. Real solar-wind
// particles that get captured into the magnetosphere bounce between
// magnetic mirror points along a field line. Spawning them with the
// right initial conditions (mostly perpendicular velocity at the
// equator of a particular L-shell) gives bouncing motion that funnels
// them toward the poles, where they spiral in tighter and tighter
// until they hit the atmosphere. Spawning them on a free incoming
// trajectory from the solar-wind direction (the old version) does
// NOT reproduce the auroral oval; most particles fly past Earth
// without being trapped.
export function spawnParticle(rng) {
  // Choose an L-shell between 3 and 6 (the auroral L-shell range; the
  // Van Allen inner belt is ~ 1.5-3, outer belt ~ 4-7).
  const L = 3.0 + rng() * 3.0;
  // Pick an azimuthal angle (longitude on the magnetic equator).
  const phi = rng() * 2 * Math.PI;
  // The field-line geometry: r(lambda) = L cos^2(lambda). Start at the
  // equator where lambda = 0, so r = L.
  const x0 = L * Math.cos(phi);
  const y0 = 0;        // y = z = 0 at the equator (here z = magnetic-axis direction)
  const z0 = L * Math.sin(phi);
  // Wait — our axis convention has z = magnetic-axis vertical. We need
  // the equator to be in the (x, y) plane, with z = up to north pole.
  // Re-do: spawn at (x = L cos phi, y = L sin phi, z = 0).
  const xe = L * Math.cos(phi);
  const ye = L * Math.sin(phi);
  const ze = 0;
  // Velocity: mostly perpendicular to the field (large pitch angle),
  // with a small parallel component so it bounces. At the equator the
  // field points in -z (toward south pole through the planet) wait
  // actually for a dipole moment along +z, at the equator B points
  // along -z direction (well, downward through the magnetic equator).
  // We give the velocity in the (rho, phi, z) frame: v_perp along
  // -rho_hat (so it rotates around the field), v_par small along z.
  const rho_hat_x = Math.cos(phi), rho_hat_y = Math.sin(phi);
  const phi_hat_x = -Math.sin(phi), phi_hat_y = Math.cos(phi);
  const vPerp = 0.5 + 0.3 * rng();
  const vPar = (rng() - 0.5) * 0.4;       // small longitudinal speed → bounces between mirror points.
  const vx = vPerp * phi_hat_x;            // gyration direction (azimuthal)
  const vy = vPerp * phi_hat_y;
  const vz = vPar;
  return {
    x: xe, y: ye, z: ze,
    vx, vy, vz,
    age: 0,
    excited: false,
    color: 'green',
    L,                                       // remember the launch L-shell
  };
}

// Check if particle has reached the auroral layer (RAURORA radius)
// at high magnetic latitude. Returns null if outside the auroral
// region, else the emission color.
export function checkAuroralExcitation(p) {
  const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
  // The auroral oval is at radius ~ RAURORA; we accept hits between
  // RAURORA and 1.5 * REARTH (so the bouncing particle deposits when
  // it dips below the trap).
  if (r > REARTH * 1.18 || r < REARTH * 0.98) return null;
  // High magnetic latitude: |z| / r > sin(60 deg) = 0.866 (oval at
  // |lat| ~ 60-75 deg).
  const sinLat = Math.abs(p.z) / Math.max(1e-6, r);
  if (sinLat < 0.85) return null;
  if (r < REARTH * 1.05) return 'green';
  return 'red';
}
