// sim.js
// Critical points of f(x,y) and the second-derivative (Hessian) test. At a
// critical point grad f = 0, and the Hessian
//   H = [[f_xx, f_xy], [f_xy, f_yy]]
// classifies it: with det = f_xx f_yy - f_xy^2 and trace = f_xx + f_yy,
//   det > 0, trace > 0  -> local minimum (both eigenvalues positive),
//   det > 0, trace < 0  -> local maximum (both eigenvalues negative),
//   det < 0             -> saddle (eigenvalues of opposite sign),
//   det = 0             -> degenerate (the test is inconclusive).
// The eigenvectors of H are the principal directions, along which the function
// curves up (positive eigenvalue) or down (negative).
//
// Reference: Stewart, Calculus, 8e, Sec. 14.7 (maximum and minimum values).

export const FUNCS = {
  bowl: { label: 'f = x^2 + y^2', f: (x, y) => x * x + y * y, grad: (x, y) => [2 * x, 2 * y], hess: () => [2, 0, 2], crit: [[0, 0]] },
  saddle: { label: 'f = x^2 - y^2', f: (x, y) => x * x - y * y, grad: (x, y) => [2 * x, -2 * y], hess: () => [2, 0, -2], crit: [[0, 0]] },
  four: { label: 'f = x^3 - 3x + y^3 - 3y', f: (x, y) => x ** 3 - 3 * x + y ** 3 - 3 * y, grad: (x, y) => [3 * x * x - 3, 3 * y * y - 3], hess: (x, y) => [6 * x, 0, 6 * y], crit: [[1, 1], [-1, -1], [1, -1], [-1, 1]] },
  monkey: { label: 'f = x^3 - 3xy^2 (monkey saddle)', f: (x, y) => x ** 3 - 3 * x * y * y, grad: (x, y) => [3 * x * x - 3 * y * y, -6 * x * y], hess: (x, y) => [6 * x, -6 * y, -6 * x], crit: [[0, 0]] },
};

// Classify a Hessian [hxx, hxy, hyy].
export function classify(H) {
  const [hxx, hxy, hyy] = H;
  const det = hxx * hyy - hxy * hxy, tr = hxx + hyy;
  const disc = Math.sqrt(Math.max(0, tr * tr - 4 * det));
  const l1 = (tr + disc) / 2, l2 = (tr - disc) / 2;
  let type;
  if (Math.abs(det) < 1e-7) type = 'degenerate';
  else if (det > 0) type = tr > 0 ? 'min' : 'max';
  else type = 'saddle';
  return { det, tr, l1, l2, type };
}

// Unit eigenvector of the symmetric Hessian [hxx, hxy, hyy] for eigenvalue lambda.
export function eigvec(H, lambda) {
  const [hxx, hxy, hyy] = H;
  let v;
  if (Math.abs(hxy) > 1e-9) v = [lambda - hyy, hxy];
  else v = Math.abs(hxx - lambda) <= Math.abs(hyy - lambda) ? [1, 0] : [0, 1];
  const n = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / n, v[1] / n];
}

export function gradNorm(field, x, y) { const [gx, gy] = field.grad(x, y); return Math.hypot(gx, gy); }
