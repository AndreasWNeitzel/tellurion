// sim.js
// Constrained optimisation by Lagrange multipliers. To extremise f(x,y) on a
// constraint curve g(x,y) = c, the gradient of f must be parallel to the
// gradient of g: grad f = lambda grad g. Equivalently, the constraint curve is
// tangent to a level set of f at the optimum, and the directional derivative of
// f along the constraint vanishes there (grad f . tangent = 0).
//
// Each preset supplies f and its exact gradient, the constraint as a
// parametrised curve r(t) with tangent r'(t) and the constraint gradient grad g
// along it. The constrained value f(r(t)) and the tangency condition are then
// exact functions of t.
//
// Reference: Stewart, Calculus, 8e, Sec. 14.8 (Lagrange multipliers);
// Marsden and Tromba, Vector Calculus, 6e, Sec. 3.4.

export const PRESETS = {
  circleLinear: {
    label: 'f = x + y on the unit circle',
    fExpr: 'x + y', gExpr: 'x^2 + y^2 = 1',
    f: (x, y) => x + y, gradf: () => [1, 1],
    curve: (t) => [Math.cos(t), Math.sin(t)], dcurve: (t) => [-Math.sin(t), Math.cos(t)],
    gradg: (x, y) => [2 * x, 2 * y],
    tRange: [0, 2 * Math.PI], periodic: true, view: 1.6,
  },
  circleProduct: {
    label: 'f = x y on the unit circle',
    fExpr: 'x y', gExpr: 'x^2 + y^2 = 1',
    f: (x, y) => x * y, gradf: (x, y) => [y, x],
    curve: (t) => [Math.cos(t), Math.sin(t)], dcurve: (t) => [-Math.sin(t), Math.cos(t)],
    gradg: (x, y) => [2 * x, 2 * y],
    tRange: [0, 2 * Math.PI], periodic: true, view: 1.6,
  },
  lineQuad: {
    label: 'f = x^2 + 3 y^2 on the line x + y = 1',
    fExpr: 'x^2 + 3 y^2', gExpr: 'x + y = 1',
    f: (x, y) => x * x + 3 * y * y, gradf: (x, y) => [2 * x, 6 * y],
    curve: (t) => [t, 1 - t], dcurve: () => [1, -1],
    gradg: () => [1, 1],
    tRange: [-1.3, 2.3], periodic: false, view: 2.0,
  },
  ellipseDist: {
    label: 'distance from (1.3, 0.4) to an ellipse',
    fExpr: '(x-1.3)^2 + (y-0.4)^2', gExpr: 'x^2/1.4^2 + y^2/0.8^2 = 1',
    f: (x, y) => (x - 1.3) ** 2 + (y - 0.4) ** 2, gradf: (x, y) => [2 * (x - 1.3), 2 * (y - 0.4)],
    curve: (t) => [1.4 * Math.cos(t), 0.8 * Math.sin(t)], dcurve: (t) => [-1.4 * Math.sin(t), 0.8 * Math.cos(t)],
    gradg: (x, y) => [2 * x / (1.4 * 1.4), 2 * y / (0.8 * 0.8)],
    tRange: [0, 2 * Math.PI], periodic: true, view: 2.0,
  },
};

// f evaluated along the constraint at parameter t.
export function constrainedValue(p, t) { const [x, y] = p.curve(t); return p.f(x, y); }

// Tangency condition: grad f . r'(t). Zero exactly at a constrained extremum.
export function tangentSlope(p, t) {
  const [x, y] = p.curve(t); const gf = p.gradf(x, y); const dc = p.dcurve(t);
  return gf[0] * dc[0] + gf[1] * dc[1];
}

// 2D cross product grad f x grad g; zero when the gradients are parallel
// (the Lagrange condition).
export function gradientCross(p, t) {
  const [x, y] = p.curve(t); const gf = p.gradf(x, y), gg = p.gradg(x, y);
  return gf[0] * gg[1] - gf[1] * gg[0];
}

// Constrained optima: parameters t where the tangency slope changes sign.
export function optima(p, n = 720) {
  const [t0, t1] = p.tRange; const out = [];
  let prev = tangentSlope(p, t0);
  for (let i = 1; i <= n; i += 1) {
    const t = t0 + (t1 - t0) * i / n; const cur = tangentSlope(p, t);
    if (prev === 0 || (cur < 0) !== (prev < 0)) {
      // refine by bisection.
      let lo = t0 + (t1 - t0) * (i - 1) / n, hi = t, fl = prev;
      for (let k = 0; k < 50; k += 1) { const m = 0.5 * (lo + hi); const fm = tangentSlope(p, m); if ((fl < 0) !== (fm < 0)) hi = m; else { lo = m; fl = fm; } }
      const tm = 0.5 * (lo + hi); out.push({ t: tm, value: constrainedValue(p, tm) });
    }
    prev = cur;
  }
  return out;
}
