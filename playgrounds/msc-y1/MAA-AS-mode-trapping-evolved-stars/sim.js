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

// Hero (appended; deltaP / modePeriods above are byte-identical).
// deltaP = Pi_1 (1 - A cos(2 pi P / P_trap)) is minimal when
// cos = +1: those modes are the trapped ones. Trapping strength in
// [0,1], 1 = fully trapped (a deltaP minimum), 0 = freely
// propagating (a deltaP maximum).
export function trapping(P, P_trap) {
  return 0.5 * (1 + Math.cos(2 * Math.PI * P / P_trap));
}

// Radial-displacement envelope of the g-mode along fractional radius
// x in [0,1] (0 centre, 1 surface). The g-mode cavity is the
// radiative core x in [0, xenv]; the boundary conditions taper the
// amplitude to zero at both ends. A propagating mode (trap -> 0) is
// spread across the cavity; a trapped mode (trap -> 1) is sharply
// confined just outside the glitch at xg.
export function gModeEnvelope(x, xg, trap, xenv = 0.62) {
  if (x <= 0 || x >= xenv) return 0;
  const cavity = Math.sin(Math.PI * x / xenv);            // zero at 0 and xenv
  const w = 0.07;
  const bump = Math.exp(-((x - (xg + 0.015)) ** 2) / (2 * w * w));
  return ((1 - trap) * 0.55 + trap * 1.35 * bump) * cavity;
}

// Monotone phase so the eigenfunction has ~n radial nodes; the local
// wavelength shortens near the glitch (N spikes there), a real
// g-mode feature.
export function gModePhase(x, n, xg) {
  const glitch = 0.18 * Math.tanh((x - xg) / 0.05);
  return Math.PI * n * (x + 0.12 * Math.sin(Math.PI * x) + glitch);
}
