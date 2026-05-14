// Carnot, Otto, Diesel, Stirling cycles. All quantities normalized.
// Reference: Callen Thermodynamics Ch. 4-5 (`callen`); Reif Ch. 5 (`reif`).
export function carnotEfficiency(Tc, Th) { return 1 - Tc / Th; }
// Otto: e = 1 - 1 / r^{gamma - 1}; r = V1/V2 compression ratio.
export function ottoEfficiency(r, gamma) { return 1 - 1 / Math.pow(r, gamma - 1); }
// Diesel: e = 1 - (1 / r^{gamma - 1}) * ((rc^gamma - 1) / (gamma (rc - 1))).
export function dieselEfficiency(r, rc, gamma) {
  return 1 - (1 / Math.pow(r, gamma - 1)) * ((Math.pow(rc, gamma) - 1) / (gamma * (rc - 1)));
}
// Stirling (with regenerator, ideal): e = 1 - Tc/Th.
export function stirlingEfficiency(Tc, Th) { return 1 - Tc / Th; }
// Build PV curve for the Otto cycle: 1->2 adiabatic compression, 2->3 isochoric heat in,
//   3->4 adiabatic expansion, 4->1 isochoric heat out.
export function ottoPVCurve(V1, V2, P1, T1, T3, gamma) {
  const points = [];
  const P2 = P1 * Math.pow(V1 / V2, gamma);
  const T2 = T1 * Math.pow(V1 / V2, gamma - 1);
  const P3 = P2 * (T3 / T2);
  const P4 = P3 * Math.pow(V2 / V1, gamma);
  const N = 30;
  for (let i = 0; i <= N; i += 1) { const v = V1 + (V2 - V1) * i / N; points.push({ V: v, P: P1 * Math.pow(V1 / v, gamma) }); }
  for (let i = 0; i <= N; i += 1) { const t = i / N; points.push({ V: V2, P: P2 + (P3 - P2) * t }); }
  for (let i = 0; i <= N; i += 1) { const v = V2 + (V1 - V2) * i / N; points.push({ V: v, P: P3 * Math.pow(V2 / v, gamma) }); }
  for (let i = 0; i <= N; i += 1) { const t = i / N; points.push({ V: V1, P: P4 + (P1 - P4) * t }); }
  return points;
}
