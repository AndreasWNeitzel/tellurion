// The Carnot cycle of an ideal gas: two isotherms (at T_h and T_c) joined by two
// adiabats. With nR = 1 and the gas starting at (V1, T_h), the four corner volumes
// follow from the isothermal expansion ratio r = V2/V1 and the adiabatic relation
// T V^(gamma-1) = const, which forces V3/V4 = V2/V1. The heat exchanged on the
// isotherms gives the efficiency eta = 1 - T_c/T_h. Reference: Callen,
// Thermodynamics and an Introduction to Thermostatistics, 2nd ed., Ch. 4.

// Build the cycle geometry. Legs are indexed 0..3:
//   0: isothermal expansion at T_h   (V1 -> V2)
//   1: adiabatic expansion            (V2 -> V3, T_h -> T_c)
//   2: isothermal compression at T_c (V3 -> V4)
//   3: adiabatic compression          (V4 -> V1, T_c -> T_h)
export function cycleStates(Th, Tc, r, gamma, V1 = 1, nR = 1) {
  const V2 = r * V1;
  const ratio = Math.pow(Th / Tc, 1 / (gamma - 1));   // adiabatic volume expansion
  const V3 = V2 * ratio, V4 = V1 * ratio;
  const st = { Th, Tc, r, gamma, nR, V1, V2, V3, V4 };
  st.P1 = nR * Th / V1; st.P2 = nR * Th / V2; st.P3 = nR * Tc / V3; st.P4 = nR * Tc / V4;
  return st;
}

// Volume endpoints of a leg.
export function legVolumes(st, leg) {
  return [[st.V1, st.V2], [st.V2, st.V3], [st.V3, st.V4], [st.V4, st.V1]][leg];
}

// Pressure at volume V on a given leg (ideal gas; adiabats obey P V^gamma = const).
export function pressureAt(st, leg, V) {
  const { Th, Tc, nR, gamma, V2, V4 } = st;
  if (leg === 0) return nR * Th / V;
  if (leg === 2) return nR * Tc / V;
  if (leg === 1) return (nR * Th / V2) * Math.pow(V2 / V, gamma);
  return (nR * Tc / V4) * Math.pow(V4 / V, gamma);
}

// Temperature at volume V on a given leg (constant on isotherms, T V^(gamma-1)=const on adiabats).
export function temperatureAt(st, leg, V) {
  const { Th, Tc, gamma, V2, V4 } = st;
  if (leg === 0) return Th;
  if (leg === 2) return Tc;
  if (leg === 1) return Th * Math.pow(V2 / V, gamma - 1);
  return Tc * Math.pow(V4 / V, gamma - 1);
}

// Heat absorbed from the hot reservoir on the isothermal expansion, Q_h > 0.
export function heatHot(st) { return st.nR * st.Th * Math.log(st.V2 / st.V1); }
// Heat rejected to the cold reservoir on the isothermal compression, Q_c > 0.
export function heatCold(st) { return st.nR * st.Tc * Math.log(st.V3 / st.V4); }
// Net work per cycle, equal to the area enclosed in the P-V plane, W = Q_h - Q_c.
export function netWork(st) { return heatHot(st) - heatCold(st); }
// Carnot efficiency.
export function efficiency(st) { return 1 - st.Tc / st.Th; }
