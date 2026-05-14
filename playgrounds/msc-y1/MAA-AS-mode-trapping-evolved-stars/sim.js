// Mode trapping in evolved stars: g modes pass through a glitch (sharp variation in N)
// in the buoyancy frequency profile, producing periodic variation in ΔP(P).
// Toy model: ΔP(P) = Π_1 (1 - A cos(2 π P / P_trap)) with P_trap = 2 π / (omega buoyancy glitch).
// Reference: Mosser et al. 2018 (`mosser2018-trap`); Aerts-Christensen-Dalsgaard-Kurtz
// Ch. 3.4 (`aerts-asteroseism`).
export function deltaP(P, Pi_1, A, P_trap) {
  return Pi_1 * (1 - A * Math.cos(2 * Math.PI * P / P_trap));
}
export function modePeriods(N, Pi_1, A, P_trap, P0 = 800) {
  const ps = new Float64Array(N);
  ps[0] = P0;
  for (let i = 1; i < N; i += 1) ps[i] = ps[i - 1] + deltaP(ps[i - 1], Pi_1, A, P_trap);
  return ps;
}
