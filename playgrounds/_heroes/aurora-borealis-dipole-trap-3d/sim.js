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
  // Dipole moment along +y, matching the render (poles drawn at +/-y,
  // equator in the x-z plane). The previous code put m along z while
  // the render used y, so funnelled particles never reached the drawn
  // poles and almost none lit the oval.
  const r2 = x * x + y * y + z * z;
  if (r2 < 1e-8) return [0, 0, 0];
  const r = Math.sqrt(r2);
  const r5 = r2 * r2 * r;
  const mdotr = m_dip * y;            // m = (0, m_dip, 0)
  const Bx = 3 * mdotr * x / r5;
  const By = (3 * mdotr * y - r2 * m_dip) / r5;
  const Bz = 3 * mdotr * z / r5;
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

// Sunward injection radius: the solar wind enters the frame here.
export const RSPAWN = 6.5;

// Spawn an INCOMING solar-wind particle. The solar wind streams toward
// Earth from the sunward side (here -x). Far from Earth the dipole
// field is negligible (B ~ 1/r^3), so the stream travels essentially
// straight. As a particle approaches, the strengthening field deflects
// it: most of the stream is turned aside, but the fraction that enters
// the polar cusps becomes magnetised (gyroradius far smaller than the
// field-line scale) and spirals down the converging field lines to the
// poles, precipitating into the atmosphere as aurora. The Boris pusher
// (stepLorentz) integrates the real Lorentz force; this function only
// sets up the incoming beam.
export function spawnParticle(rng) {
  // Position: a broad sheet on the sunward face, spanning enough
  // latitude to feed both the equatorial trapping region and the
  // high-latitude cusps.
  const x0 = -RSPAWN + (rng() - 0.5) * 1.0;
  const y0 = (rng() * 2 - 1) * 4.6;
  const z0 = (rng() * 2 - 1) * 4.6;
  // Bulk velocity toward Earth (+x) with a small thermal spread.
  const V0 = 0.70 + 0.25 * rng();
  return {
    x: x0, y: y0, z: z0,
    vx: V0,
    vy: (rng() - 0.5) * 0.06,
    vz: (rng() - 0.5) * 0.06,
    age: 0,
    excited: false,
    color: 'green',
    minMagLat: 90,  // minimum magnetic latitude reached (starts high, updates as particle moves)
  };
}

// Check if particle has reached the auroral layer (RAURORA radius)
// at high magnetic latitude. Returns null if outside the auroral
// region, else the emission color.
export function checkAuroralExcitation(p) {
  const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
  // A particle precipitates when it reaches the upper atmosphere.
  if (r > REARTH * 1.22 || r < REARTH * 0.97) return null;
  // High magnetic latitude (poles along y): the auroral oval sits at
  // |lat| ~ 60-75 deg, i.e. |y|/r above sin(58 deg).
  const sinLat = Math.abs(p.y) / Math.max(1e-6, r);
  if (sinLat < 0.84) return null;
  // Green (atomic-oxygen 557.7 nm) lower down, red (630.0 nm) higher.
  return r < REARTH * 1.08 ? 'green' : 'red';
}
