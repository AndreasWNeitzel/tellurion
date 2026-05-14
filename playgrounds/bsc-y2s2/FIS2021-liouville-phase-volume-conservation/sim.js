// Liouville's theorem: phase-space volume is conserved under Hamiltonian flow.
// Demonstration: initialize an ensemble of points in a small (q, p) patch and
// integrate under the pendulum Hamiltonian. The patch deforms but its area
// (estimated by convex hull) stays approximately constant.
// Reference: Lemos Ch. 6 (`lemos-mech`); Goldstein Ch. 8 (`goldstein-mech`).
export function pendulumStep(q, p, dt) {
  const p_h = p + 0.5 * dt * (-Math.sin(q));
  const q_n = q + dt * p_h;
  const p_n = p_h + 0.5 * dt * (-Math.sin(q_n));
  return { q: q_n, p: p_n };
}
// Estimate phase-space area by shoelace formula on the convex hull or polygon.
export function polygonArea(points) {
  let s = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i], b = points[(i + 1) % points.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return 0.5 * Math.abs(s);
}
// Build a rectangle of points (just the boundary samples in order) at center (q0, p0).
export function rectangleSamples(q0, p0, w, h, n = 24) {
  const pts = [];
  for (let i = 0; i < n; i += 1) pts.push([q0 - w / 2 + (i / n) * w, p0 - h / 2]);
  for (let i = 0; i < n; i += 1) pts.push([q0 + w / 2, p0 - h / 2 + (i / n) * h]);
  for (let i = 0; i < n; i += 1) pts.push([q0 + w / 2 - (i / n) * w, p0 + h / 2]);
  for (let i = 0; i < n; i += 1) pts.push([q0 - w / 2, p0 + h / 2 - (i / n) * h]);
  return pts;
}
