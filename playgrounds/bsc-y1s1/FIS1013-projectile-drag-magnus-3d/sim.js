// Projectile in 3D with gravity, quadratic drag and the Magnus force
// from spin. Headless and deterministic (RK4, fixed dt). The equation
// of motion (unit mass) is
//   dv/dt = -g z_hat - c |v| v + cM (omega x v),
// integrated from launch until the ball returns to the ground (z = 0).
// The Magnus term is always perpendicular to both v and omega, so a
// side-spinning ball curves laterally and a top/back-spinning ball
// gains or loses range. Reference: Marion and Thornton, Classical
// Dynamics (5th ed.), Ch. 2; R. K. Adair, The Physics of Baseball.

const G = 9.81;

// Build the spin vector from a rate and an axis keyword.
export function spinVector(rateRadS, axis) {
  if (axis === 'top') return [0, rateRadS, 0];      // topspin: Magnus pushes down
  if (axis === 'back') return [0, -rateRadS, 0];    // backspin: Magnus gives lift
  if (axis === 'side') return [0, 0, rateRadS];     // sidespin: omega along +z
  return [0, 0, 0];                                 // knuckle: no spin
}

export function magnusForce(omega, v, cM) {
  return [
    cM * (omega[1] * v[2] - omega[2] * v[1]),
    cM * (omega[2] * v[0] - omega[0] * v[2]),
    cM * (omega[0] * v[1] - omega[1] * v[0]),
  ];
}

// One trajectory. opts: speed, elevDeg, aziDeg, omega([wx,wy,wz]),
// c (drag), cM (Magnus). Returns { pts:[[x,y,z]...], range, apex, side,
// tof }. World axes: x downrange, y lateral, z up.
export function trajectory(opts) {
  const { speed = 30, elevDeg = 35, aziDeg = 0, omega = [0, 0, 0], c = 0, cM = 0 } = opts;
  const el = elevDeg * Math.PI / 180, az = aziDeg * Math.PI / 180;
  let p = [0, 0, 0.0];
  let v = [speed * Math.cos(el) * Math.cos(az), speed * Math.cos(el) * Math.sin(az), speed * Math.sin(el)];
  const dt = 0.002;
  const pts = [p.slice()];
  let apex = 0, tof = 0;
  const acc = (vv) => {
    const sp = Math.hypot(vv[0], vv[1], vv[2]);
    const m = magnusForce(omega, vv, cM);
    return [
      -c * sp * vv[0] + m[0],
      -c * sp * vv[1] + m[1],
      -G - c * sp * vv[2] + m[2],
    ];
  };
  for (let i = 0; i < 60000; i += 1) {
    // RK4 on (p, v).
    const a1 = acc(v);
    const v2 = [v[0] + a1[0] * dt / 2, v[1] + a1[1] * dt / 2, v[2] + a1[2] * dt / 2];
    const a2 = acc(v2);
    const v3 = [v[0] + a2[0] * dt / 2, v[1] + a2[1] * dt / 2, v[2] + a2[2] * dt / 2];
    const a3 = acc(v3);
    const v4 = [v[0] + a3[0] * dt, v[1] + a3[1] * dt, v[2] + a3[2] * dt];
    const a4 = acc(v4);
    const pn = [
      p[0] + (dt / 6) * (v[0] + 2 * v2[0] + 2 * v3[0] + v4[0]),
      p[1] + (dt / 6) * (v[1] + 2 * v2[1] + 2 * v3[1] + v4[1]),
      p[2] + (dt / 6) * (v[2] + 2 * v2[2] + 2 * v3[2] + v4[2]),
    ];
    const vn = [
      v[0] + (dt / 6) * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]),
      v[1] + (dt / 6) * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]),
      v[2] + (dt / 6) * (a1[2] + 2 * a2[2] + 2 * a3[2] + a4[2]),
    ];
    tof += dt;
    if (pn[2] >= apex) apex = pn[2];
    if (pn[2] <= 0 && p[2] > 0) {
      // Linear-interpolate the ground crossing.
      const f = p[2] / (p[2] - pn[2]);
      const g = [p[0] + f * (pn[0] - p[0]), p[1] + f * (pn[1] - p[1]), 0];
      pts.push(g);
      return { pts, range: Math.hypot(g[0], g[1]), side: g[1], apex, tof };
    }
    p = pn; v = vn;
    if (i % 8 === 0) pts.push(p.slice());
  }
  return { pts, range: Math.hypot(p[0], p[1]), side: p[1], apex, tof };
}

// Analytic vacuum range and apex for the invariant tests.
export function vacuumRange(speed, elevDeg) {
  const el = elevDeg * Math.PI / 180;
  return speed * speed * Math.sin(2 * el) / G;
}
export function vacuumApex(speed, elevDeg) {
  const el = elevDeg * Math.PI / 180;
  return (speed * Math.sin(el)) ** 2 / (2 * G);
}

export { G };
