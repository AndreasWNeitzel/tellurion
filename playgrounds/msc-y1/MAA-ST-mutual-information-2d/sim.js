// sim.js
// Joint Gaussian mutual information.
//
// For (X, Y) ~ N(0, Sigma) with covariance
//   Sigma = [[sigma_x^2,        rho sigma_x sigma_y],
//            [rho sigma_x sigma_y,        sigma_y^2]]
// the differential entropy of a 2D Gaussian is
//   h(X, Y) = 0.5 log( (2 pi e)^2 det(Sigma) )
// and the marginal entropies are
//   h(X) = 0.5 log(2 pi e sigma_x^2)
//   h(Y) = 0.5 log(2 pi e sigma_y^2).
// Mutual information collapses to a clean formula:
//   I(X; Y) = h(X) + h(Y) - h(X, Y) = -0.5 log(1 - rho^2).
// (MacKay 2003, Ch. 2; Cover and Thomas 2006, Eq. 8.85.)
//
// We render the joint density on a 2D grid and report I in nats.

export function sample2DGaussianPdf({
  rho, sigmaX = 1, sigmaY = 1, gridN = 96, span = 3.2,
} = {}) {
  const N = gridN;
  const pdf = new Float64Array(N * N);
  const det = sigmaX * sigmaX * sigmaY * sigmaY * (1 - rho * rho);
  const norm = 1 / (2 * Math.PI * Math.sqrt(det));
  const inv = 1 / (1 - rho * rho);
  let zMax = 0;
  for (let j = 0; j < N; j += 1) {
    const y = -span + (2 * span) * (j / (N - 1));
    for (let i = 0; i < N; i += 1) {
      const x = -span + (2 * span) * (i / (N - 1));
      const z2 = (x * x) / (sigmaX * sigmaX) - 2 * rho * x * y / (sigmaX * sigmaY) + (y * y) / (sigmaY * sigmaY);
      const p = norm * Math.exp(-0.5 * inv * z2);
      pdf[j * N + i] = p;
      if (p > zMax) zMax = p;
    }
  }
  return { pdf, N, span, zMax, sigmaX, sigmaY };
}

export function marginalX(joint) {
  const { pdf, N, span } = joint;
  const dy = (2 * span) / (N - 1);
  const px = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    let s = 0;
    for (let j = 0; j < N; j += 1) s += pdf[j * N + i];
    px[i] = s * dy;
  }
  return px;
}

export function marginalY(joint) {
  const { pdf, N, span } = joint;
  const dx = (2 * span) / (N - 1);
  const py = new Float64Array(N);
  for (let j = 0; j < N; j += 1) {
    let s = 0;
    for (let i = 0; i < N; i += 1) s += pdf[j * N + i];
    py[j] = s * dx;
  }
  return py;
}

export function miAnalytic(rho) {
  if (Math.abs(rho) >= 1) return Infinity;
  return -0.5 * Math.log(1 - rho * rho);
}

export function entropyXY(joint) {
  const { pdf, N, span } = joint;
  const cell = ((2 * span) / (N - 1)) ** 2;
  let h = 0;
  for (let k = 0; k < pdf.length; k += 1) {
    const p = pdf[k];
    if (p > 0) h -= p * Math.log(p) * cell;
  }
  return h;
}

export function entropy1D(p, span) {
  const N = p.length;
  const dx = (2 * span) / (N - 1);
  let h = 0;
  for (let i = 0; i < N; i += 1) if (p[i] > 0) h -= p[i] * Math.log(p[i]) * dx;
  return h;
}

// Numerical MI via the joint pdf and its marginals (returned in nats).
export function miNumeric(joint) {
  const hx = entropy1D(marginalX(joint), joint.span);
  const hy = entropy1D(marginalY(joint), joint.span);
  const hxy = entropyXY(joint);
  return hx + hy - hxy;
}
