// 1D chain of N point masses with nearest-neighbor springs.
// Linear modes have dispersion omega(k) = 2 sqrt(K/m) |sin(k a / 2)|
// where a is the lattice spacing. Transverse and longitudinal modes
// share this dispersion in the simple scalar model.
// Display: transverse: particles move perpendicular to the chain.
//          longitudinal: particles move along the chain.
// Reference: Crawford Waves Ch. 5 (`crawford-waves`); Ashcroft-Mermin Ch. 22 (`ashcroft-mermin`).
export function omegaK(k, K = 1, m = 1, a = 1) {
  return 2 * Math.sqrt(K / m) * Math.abs(Math.sin(k * a / 2));
}
export function modePosition(i, t, mode, k, A, N, a = 1) {
  const x0 = i * a;
  const omega = omegaK(k);
  const phase = k * x0 - omega * t;
  if (mode === 'transverse') return { x: x0, y: A * Math.cos(phase) };
  return { x: x0 + A * Math.cos(phase), y: 0 };
}
// Energy per atom: KE + PE. Sum should be conserved for the noiseless mode.
export function totalEnergy(positions, prevPositions, K = 1, m = 1, dt = 0.01) {
  let E = 0;
  const N = positions.length;
  for (let i = 0; i < N - 1; i += 1) {
    const dx = positions[i + 1].x - positions[i].x;
    const dy = positions[i + 1].y - positions[i].y;
    E += 0.5 * K * (dx * dx + dy * dy);
  }
  for (let i = 0; i < N; i += 1) {
    const vx = (positions[i].x - prevPositions[i].x) / dt;
    const vy = (positions[i].y - prevPositions[i].y) / dt;
    E += 0.5 * m * (vx * vx + vy * vy);
  }
  return E;
}
