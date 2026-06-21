// sim.js
// Change of variables in a double integral: the Jacobian as the local
// area-scaling factor. For a map T: (u,v) -> (x,y), the area element transforms
// as dx dy = |J| du dv, with
//   J = det [[x_u, x_v], [y_u, y_v]].
// Hence the change-of-variables theorem
//   double integral over R of f dx dy = double integral over S of f(T) |J| du dv.
// With f = 1 this says the mapped area equals the integral of |J| over the
// source region S. The playground deforms a real grid by a real map, colours
// each mapped cell by its |J|, and accumulates the area three ways to show the
// theorem numerically.
//
// Reference: Stewart, Calculus, 8e, Sec. 15.10 (change of variables in multiple
// integrals); the Jacobian determinant.

export const MAPS = {
  polar: {
    label: 'polar: x = r cos t, y = r sin t',
    u: [0.18, 1.0], v: [0, Math.PI / 2], uName: 'r', vName: 't',
    map: (u, v) => [u * Math.cos(v), u * Math.sin(v)],
    jac: (u) => u,                                   // |J| = r
    area: () => 0.5 * (1.0 * 1.0 - 0.18 * 0.18) * (Math.PI / 2),
  },
  linear: {
    label: 'linear shear',
    u: [-1, 1], v: [-1, 1], uName: 'u', vName: 'v',
    map: (u, v) => [u + 0.6 * v, 0.5 * u + v],
    jac: () => Math.abs(1 * 1 - 0.6 * 0.5),          // |ad - bc| = 0.7, constant
    area: () => 4 * 0.7,                             // source area 4, scaled by 0.7
  },
  square: {
    label: 'complex square: (u,v) -> (u^2 - v^2, 2uv)',
    u: [0.12, 1.05], v: [0.08, 1.0], uName: 'u', vName: 'v',
    map: (u, v) => [u * u - v * v, 2 * u * v],
    jac: (u, v) => 4 * (u * u + v * v),              // |J| = 4|z|^2
    area: null,
  },
  warp: {
    label: 'sinusoidal warp',
    u: [-1, 1], v: [-1, 1], uName: 'u', vName: 'v',
    map: (u, v) => [u + 0.3 * Math.sin(Math.PI * v), v + 0.3 * Math.sin(Math.PI * u)],
    jac: (u, v) => Math.abs(1 - (0.3 * Math.PI * Math.cos(Math.PI * v)) * (0.3 * Math.PI * Math.cos(Math.PI * u))),
    area: null,
  },
};

// Numeric |J| from central differences of the map, independent of jac().
export function numericJac(map, u, v, h = 1e-5) {
  const [xu1, yu1] = map(u + h, v), [xu0, yu0] = map(u - h, v);
  const [xv1, yv1] = map(u, v + h), [xv0, yv0] = map(u, v - h);
  const xu = (xu1 - xu0) / (2 * h), yu = (yu1 - yu0) / (2 * h);
  const xv = (xv1 - xv0) / (2 * h), yv = (yv1 - yv0) / (2 * h);
  return Math.abs(xu * yv - xv * yu);
}

// Shoelace area of a quad given as four [x,y] corners in order.
export function quadArea(p) {
  let a = 0;
  for (let i = 0; i < 4; i += 1) { const j = (i + 1) % 4; a += p[i][0] * p[j][1] - p[j][0] * p[i][1]; }
  return Math.abs(a) / 2;
}

// Accumulate over an N x N grid on the source region:
//   mappedArea = sum of true mapped-cell areas (shoelace of the deformed quads),
//   jacInt     = sum of |J| du dv at cell centres (the change-of-variables RHS),
//   naive      = sum of du dv (no Jacobian, the wrong answer).
export function accumulate(m, N) {
  const du = (m.u[1] - m.u[0]) / N, dv = (m.v[1] - m.v[0]) / N;
  let mappedArea = 0, jacInt = 0, naive = 0;
  for (let i = 0; i < N; i += 1) {
    for (let j = 0; j < N; j += 1) {
      const u0 = m.u[0] + i * du, v0 = m.v[0] + j * dv;
      const quad = [m.map(u0, v0), m.map(u0 + du, v0), m.map(u0 + du, v0 + dv), m.map(u0, v0 + dv)];
      mappedArea += quadArea(quad);
      jacInt += m.jac(u0 + du / 2, v0 + dv / 2) * du * dv;
      naive += du * dv;
    }
  }
  return { mappedArea, jacInt, naive };
}
