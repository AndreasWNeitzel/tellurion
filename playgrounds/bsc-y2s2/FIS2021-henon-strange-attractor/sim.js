// sim.js
// Henon map x' = 1 - a x^2 + y; y' = b x. Default a = 1.4, b = 0.3 gives
// the canonical strange attractor with max-Lyapunov ~ 0.4192 and box-count
// dimension ~ 1.26.

export const DEFAULT_PARAMS = { a: 1.4, b: 0.3 };

export function henonStep(state, params) {
  const xn = 1 - params.a * state.x * state.x + state.y;
  const yn = params.b * state.x;
  return { x: xn, y: yn };
}

// Run nSteps of Henon and return the trail.
export function henonTrail(initX, initY, nSteps, params = DEFAULT_PARAMS) {
  const xs = new Float64Array(nSteps);
  const ys = new Float64Array(nSteps);
  let s = { x: initX, y: initY };
  for (let i = 0; i < nSteps; i += 1) {
    s = henonStep(s, params);
    xs[i] = s.x;
    ys[i] = s.y;
  }
  return { xs, ys };
}

// Max-Lyapunov via tangent linearization. The Jacobian of Henon is
//   J = [[-2 a x, 1], [b, 0]]
// Iterate a tangent vector, renormalize, accumulate log stretch.
export function henonMaxLyapunov(initX, initY, nSteps, params = DEFAULT_PARAMS, rescaleEvery = 100, warmup = 1000) {
  let s = { x: initX, y: initY };
  let dx = 1, dy = 0;
  for (let i = 0; i < warmup; i += 1) s = henonStep(s, params);
  let logSum = 0, nRescale = 0;
  for (let i = 0; i < nSteps; i += 1) {
    const xn  = 1 - params.a * s.x * s.x + s.y;
    const yn  = params.b * s.x;
    const dnx = -2 * params.a * s.x * dx + dy;
    const dny = params.b * dx;
    s = { x: xn, y: yn };
    dx = dnx; dy = dny;
    if ((i % rescaleEvery) === rescaleEvery - 1) {
      const r = Math.hypot(dx, dy);
      if (r > 0) {
        logSum += Math.log(r);
        nRescale += 1;
        dx /= r; dy /= r;
      }
    }
  }
  const total = nRescale * rescaleEvery;
  return total === 0 ? 0 : logSum / total;
}
