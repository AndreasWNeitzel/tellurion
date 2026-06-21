// sim.js
// The tangent plane and the linear approximation of a surface z = f(x,y). At a
// point (x0, y0) the tangent plane is
//   L(x,y) = f(x0,y0) + f_x(x0,y0)(x - x0) + f_y(x0,y0)(y - y0),
// the best linear approximation: it matches f in value and in both slopes at the
// point, so the error f - L vanishes there and grows quadratically with distance,
// set by the second derivatives (the Hessian),
//   f - L approx (1/2)[f_xx dx^2 + 2 f_xy dx dy + f_yy dy^2].
//
// Reference: Stewart, Calculus, 8e, Sec. 14.4 (tangent planes and linear
// approximations).

export const SURFS = {
  bowl: { label: 'f = (x^2 + y^2)/2', f: (x, y) => 0.5 * (x * x + y * y), fx: (x, y) => x, fy: (x, y) => y, fxx: () => 1, fyy: () => 1 },
  saddle: { label: 'f = (x^2 - y^2)/2', f: (x, y) => 0.5 * (x * x - y * y), fx: (x, y) => x, fy: (x, y) => -y, fxx: () => 1, fyy: () => -1 },
  bump: { label: 'f = exp(-(x^2+y^2)/2)', f: (x, y) => Math.exp(-0.5 * (x * x + y * y)), fx: (x, y) => -x * Math.exp(-0.5 * (x * x + y * y)), fy: (x, y) => -y * Math.exp(-0.5 * (x * x + y * y)), fxx: (x, y) => (x * x - 1) * Math.exp(-0.5 * (x * x + y * y)), fyy: (x, y) => (y * y - 1) * Math.exp(-0.5 * (x * x + y * y)) },
  wave: { label: 'f = sin(x) cos(y) / 2', f: (x, y) => 0.5 * Math.sin(x) * Math.cos(y), fx: (x, y) => 0.5 * Math.cos(x) * Math.cos(y), fy: (x, y) => -0.5 * Math.sin(x) * Math.sin(y), fxx: (x, y) => -0.5 * Math.sin(x) * Math.cos(y), fyy: (x, y) => -0.5 * Math.sin(x) * Math.cos(y) },
};

export function tangentPlane(s, x0, y0, x, y) { return s.f(x0, y0) + s.fx(x0, y0) * (x - x0) + s.fy(x0, y0) * (y - y0); }
export function approxError(s, x0, y0, x, y) { return s.f(x, y) - tangentPlane(s, x0, y0, x, y); }
export function gradMag(s, x, y) { return Math.hypot(s.fx(x, y), s.fy(x, y)); }
