// 2D point-vortex dynamics. N ideal point vortices at positions r_a
// with circulations Gamma_a; vortex b is advected by the velocity
// induced by all the others (Biot-Savart in 2D),
//   v(p) = sum_{a} Gamma_a/(2 pi) * zhat x (p - r_a) / |p - r_a|^2 ,
// a Hamiltonian system (Saffman 1992; Aref 1983) with conserved
// circulation, linear and angular impulse, and Hamiltonian
//   H = -1/(4 pi) sum_{a<b} Gamma_a Gamma_b ln |r_a - r_b| .
// Integrated with classical RK4 (the system is first order; RK4 keeps
// H to ~0.1% over a run). A tiny core radius desingularises near
// collisions without affecting well-separated configurations. No DOM,
// deterministic. Reference: Saffman, Vortex Dynamics, CUP 1992
// (`saffman1992`); Aref, Annu. Rev. Fluid Mech. 15 (1983) 345
// (`aref1983`); Batchelor, sec. 7.3 (`batchelor1967`).

const CORE2 = 1e-6;                                  // desingularisation r^2 floor

export function createState(vortices) {
  // vortices: [{ x, y, gamma }, ...]
  return {
    n: vortices.length,
    x: Float64Array.from(vortices.map(v => v.x)),
    y: Float64Array.from(vortices.map(v => v.y)),
    g: Float64Array.from(vortices.map(v => v.gamma)),
  };
}

// Velocity induced at (px, py) by every vortex except index `skip`.
export function inducedVelocity(s, px, py, skip = -1) {
  let vx = 0, vy = 0;
  for (let a = 0; a < s.n; a += 1) {
    if (a === skip) continue;
    const dx = px - s.x[a], dy = py - s.y[a];
    const r2 = dx * dx + dy * dy + CORE2;
    const c = s.g[a] / (2 * Math.PI * r2);
    vx += -c * dy;                                   // zhat x (p - r_a)
    vy += c * dx;
  }
  return [vx, vy];
}

function deriv(s, X, Y) {
  const dx = new Float64Array(s.n), dy = new Float64Array(s.n);
  for (let b = 0; b < s.n; b += 1) {
    let vx = 0, vy = 0;
    for (let a = 0; a < s.n; a += 1) {
      if (a === b) continue;
      const ex = X[b] - X[a], ey = Y[b] - Y[a];
      const r2 = ex * ex + ey * ey + CORE2;
      const c = s.g[a] / (2 * Math.PI * r2);
      vx += -c * ey; vy += c * ex;
    }
    dx[b] = vx; dy[b] = vy;
  }
  return [dx, dy];
}

export function step(s, dt) {
  const { n, x, y } = s;
  const k1 = deriv(s, x, y);
  const x2 = new Float64Array(n), y2 = new Float64Array(n);
  for (let i = 0; i < n; i += 1) { x2[i] = x[i] + 0.5 * dt * k1[0][i]; y2[i] = y[i] + 0.5 * dt * k1[1][i]; }
  const k2 = deriv(s, x2, y2);
  const x3 = new Float64Array(n), y3 = new Float64Array(n);
  for (let i = 0; i < n; i += 1) { x3[i] = x[i] + 0.5 * dt * k2[0][i]; y3[i] = y[i] + 0.5 * dt * k2[1][i]; }
  const k3 = deriv(s, x3, y3);
  const x4 = new Float64Array(n), y4 = new Float64Array(n);
  for (let i = 0; i < n; i += 1) { x4[i] = x[i] + dt * k3[0][i]; y4[i] = y[i] + dt * k3[1][i]; }
  const k4 = deriv(s, x4, y4);
  for (let i = 0; i < n; i += 1) {
    x[i] += dt / 6 * (k1[0][i] + 2 * k2[0][i] + 2 * k3[0][i] + k4[0][i]);
    y[i] += dt / 6 * (k1[1][i] + 2 * k2[1][i] + 2 * k3[1][i] + k4[1][i]);
  }
}

export function totalCirculation(s) {
  let g = 0;
  for (let i = 0; i < s.n; i += 1) g += s.g[i];
  return g;
}
export function linearImpulse(s) {
  let px = 0, py = 0;
  for (let i = 0; i < s.n; i += 1) { px += s.g[i] * s.x[i]; py += s.g[i] * s.y[i]; }
  return [px, py];
}
export function angularImpulse(s) {
  let l = 0;
  for (let i = 0; i < s.n; i += 1) l += s.g[i] * (s.x[i] * s.x[i] + s.y[i] * s.y[i]);
  return l;
}
export function hamiltonian(s) {
  let h = 0;
  for (let a = 0; a < s.n; a += 1) {
    for (let b = a + 1; b < s.n; b += 1) {
      const dx = s.x[a] - s.x[b], dy = s.y[a] - s.y[b];
      h += s.g[a] * s.g[b] * Math.log(Math.sqrt(dx * dx + dy * dy + CORE2));
    }
  }
  return -h / (4 * Math.PI);
}

// Analytic translation speed of a vortex pair (dipole) with equal and
// opposite circulation Gamma separated by distance d: v = Gamma/(2 pi d).
export function dipoleSpeed(gamma, d) { return gamma / (2 * Math.PI * d); }

// Convenience presets.
export function preset(name) {
  if (name === 'dipole') return [{ x: -2, y: 1, gamma: 1 }, { x: -2, y: -1, gamma: -1 }];
  if (name === 'corotating') return [{ x: -1, y: 0, gamma: 1 }, { x: 1, y: 0, gamma: 1 }];
  if (name === 'tripole') return [{ x: -1.5, y: 0, gamma: 1 }, { x: 1.5, y: 0, gamma: 1 }, { x: 0, y: 0, gamma: -0.6 }];
  if (name === 'quadrupole') return [
    { x: -1, y: -1, gamma: 1 }, { x: 1, y: -1, gamma: -1 },
    { x: 1, y: 1, gamma: 1 }, { x: -1, y: 1, gamma: -1 }];
  return [{ x: -2, y: 1, gamma: 1 }, { x: -2, y: -1, gamma: -1 }];
}
