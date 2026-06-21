// sim.js
// Scalar fields f(x, y) with their exact analytic gradients, and the
// directional derivative of f at a point along a unit direction u(theta):
//   D_u f = grad f . u = f_x cos(theta) + f_y sin(theta)
//         = |grad f| cos(theta - theta_grad).
// So D_u f is largest along the gradient (steepest ascent, value |grad f|),
// zero perpendicular to it (along the level set), and most negative in the
// opposite direction. The gradient is always perpendicular to the contour
// through the point. Everything is closed form; the gradients below are exact,
// not finite differences.
//
// Reference: Stewart, Calculus, 8e, Sec. 14.6 (directional derivatives and the
// gradient vector); Marsden and Tromba, Vector Calculus, 6e, Ch. 2.

const SG = 0.75;     // Gaussian width for the single-bump field

export const FIELDS = {
  gaussian: {
    label: 'gaussian hill',
    f: (x, y) => Math.exp(-(x * x + y * y) / (2 * SG * SG)),
    grad: (x, y) => { const g = Math.exp(-(x * x + y * y) / (2 * SG * SG)); return [-g * x / (SG * SG), -g * y / (SG * SG)]; },
  },
  saddle: {
    label: 'saddle',
    f: (x, y) => 0.5 * (x * x - y * y),
    grad: (x, y) => [x, -y],
  },
  ripple: {
    label: 'ripple',
    f: (x, y) => Math.sin(1.3 * x) * Math.cos(1.3 * y),
    grad: (x, y) => [1.3 * Math.cos(1.3 * x) * Math.cos(1.3 * y), -1.3 * Math.sin(1.3 * x) * Math.sin(1.3 * y)],
  },
  twohills: {
    label: 'two hills',
    f: (x, y) => Math.exp(-(((x - 1) ** 2) + y * y) / (2 * 0.8 * 0.8)) + 0.85 * Math.exp(-(((x + 1.1) ** 2) + ((y + 0.7) ** 2)) / (2 * 0.7 * 0.7)),
    grad: (x, y) => {
      const g1 = Math.exp(-(((x - 1) ** 2) + y * y) / (2 * 0.8 * 0.8));
      const g2 = 0.85 * Math.exp(-(((x + 1.1) ** 2) + ((y + 0.7) ** 2)) / (2 * 0.7 * 0.7));
      return [-g1 * (x - 1) / (0.8 * 0.8) - g2 * (x + 1.1) / (0.7 * 0.7), -g1 * y / (0.8 * 0.8) - g2 * (y + 0.7) / (0.7 * 0.7)];
    },
  },
};

// Directional derivative of f at (x, y) along the unit vector (cos t, sin t).
export function directionalDerivative(field, x, y, theta) {
  const [gx, gy] = field.grad(x, y);
  return gx * Math.cos(theta) + gy * Math.sin(theta);
}

// Gradient vector, magnitude (the maximum directional derivative) and its angle.
export function gradInfo(field, x, y) {
  const [gx, gy] = field.grad(x, y);
  return { gx, gy, mag: Math.hypot(gx, gy), ang: Math.atan2(gy, gx) };
}
