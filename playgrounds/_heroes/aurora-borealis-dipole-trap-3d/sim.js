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

// Spawn a particle injected from the solar-wind direction (+x). The
// initial velocity has both perpendicular and parallel components so
// the particle's trajectory has a mix of gyration and bouncing along
// the field line (the classic mirror-trap motion).
export function spawnParticle(rng) {
  const r = 5.5 + rng() * 0.8;     // injected outside the L-shell trap region
  const z0 = (rng() - 0.5) * 2.0;
  const y0 = (rng() - 0.5) * 2.0;
  return {
    x: r, y: y0, z: z0,
    vx: -1.0 - 0.5 * rng(),
    vy: (rng() - 0.5) * 0.4,
    vz: (rng() - 0.5) * 0.4,
    age: 0,
    excited: false,                 // becomes true when it deposits energy near pole
    color: 'green',                 // or 'red' depending on altitude
  };
}

// Check if particle has reached the auroral layer (height < RAURORA + small)
// near a magnetic pole. Returns null if not, otherwise the emission
// color: 'green' (oxygen ~558 nm, lower altitude) or 'red' (oxygen
// ~630 nm, higher altitude).
export function checkAuroralExcitation(p) {
  const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
  if (r > RAURORA * 1.5) return null;
  // Near a pole: cos(latitude) low means high latitude
  const cosLat = Math.abs(p.z) / Math.max(1e-6, r);
  if (cosLat < 0.7) return null;          // not high-latitude enough
  // Color depends on altitude:
  if (r < REARTH * 1.04) return 'green';  // 100-300 km
  return 'red';                            // 300-600 km
}
