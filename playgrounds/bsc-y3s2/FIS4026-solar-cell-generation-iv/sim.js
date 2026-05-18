// Single-diode solar cell and the Shockley-Queisser detailed-balance
// limit (Shockley 1949; Shockley and Queisser 1961; Wurfel, Physics
// of Solar Cells, 2nd ed.; Green 1981 for the fill factor).
//
// Ideal single-diode model (no series / shunt parasitics):
//   I(V) = I_L - I_0 [ exp(V/(n V_T)) - 1 ],   V_T = kT/q,
// so at V = 0, I = I_sc = I_L, and at I = 0,
//   V_oc = n V_T ln(I_L/I_0 + 1).
// Power P = V I peaks at the maximum-power point; the fill factor is
// FF = (V_mp I_mp)/(V_oc I_sc) and the efficiency eta = P_mpp / P_in.
//
// Detailed balance: photogeneration from every photon above the gap
// of a blackbody sun, recombination from the cell's own 300 K
// blackbody emission; this gives V_oc < E_g/q and a single efficiency
// maximum near 1.1 to 1.4 eV. Closed-form / quadrature, deterministic.

export const Q = 1.602176634e-19;                      // C
export const KB = 1.380649e-23;                        // J/K
export const HPL = 6.62607015e-34;                     // J s
export const CL = 2.99792458e8;                        // m/s
export const T_CELL = 300;                             // K
export const T_SUN = 5778;                             // K
export const VT = KB * T_CELL / Q;                     // thermal voltage (V)

// Ideal single-diode current (A), per unit area if I_L, I_0 are
// densities. I_L photocurrent, I_0 saturation current, n ideality.
export function cellCurrent(V, { iL = 400, i0 = 1e-9, n = 1 } = {}) {
  return iL - i0 * (Math.exp(V / (n * VT)) - 1);
}
export function shortCircuitCurrent(p = {}) { return cellCurrent(0, p); }
export function openCircuitVoltage({ iL = 400, i0 = 1e-9, n = 1 } = {}) {
  return n * VT * Math.log(iL / i0 + 1);
}
export function power(V, p) { return V * cellCurrent(V, p); }

// Maximum-power point by golden-section search on P(V) in (0, V_oc).
export function maxPowerPoint(p = {}) {
  const voc = openCircuitVoltage(p);
  let a = 0, b = voc;
  const gr = (Math.sqrt(5) - 1) / 2;
  let c = b - gr * (b - a), d = a + gr * (b - a);
  for (let i = 0; i < 120; i += 1) {
    if (power(c, p) < power(d, p)) a = c; else b = d;
    c = b - gr * (b - a); d = a + gr * (b - a);
  }
  const Vm = 0.5 * (a + b);
  return { Vmp: Vm, Imp: cellCurrent(Vm, p), Pmp: power(Vm, p) };
}
export function fillFactor(p = {}) {
  const { Pmp } = maxPowerPoint(p);
  return Pmp / (openCircuitVoltage(p) * shortCircuitCurrent(p));
}
// Green (1981) empirical ideal fill factor from the normalised V_oc.
export function fillFactorGreen(p = {}) {
  const { n = 1 } = p;
  const voc = openCircuitVoltage(p) / (n * VT);
  return (voc - Math.log(voc + 0.72)) / (voc + 1);
}

// Blackbody photon flux (photons / m^2 / s) with photon energy above
// Eg (in eV), integrated by Simpson's rule over energy.
function photonFluxAbove(EgEv, T) {
  const Eg = EgEv * Q;
  const Emax = Math.max(Eg * 1.0 + 12 * KB * T, Eg + 5 * Q);
  const N = 2000;
  const pref = 2 * Math.PI / (HPL ** 3 * CL * CL);
  let s = 0;
  const f = (E) => (E <= 0 ? 0 : pref * E * E / (Math.exp(E / (KB * T)) - 1));
  const dx = (Emax - Eg) / N;
  for (let i = 0; i <= N; i += 1) {
    const E = Eg + i * dx;
    const w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    s += w * f(E);
  }
  return s * dx / 3;
}
// Incident blackbody power density (W/m^2) over all photon energies.
function blackbodyPower(T) {
  const sigma = 2 * Math.PI ** 5 * KB ** 4 / (15 * HPL ** 3 * CL * CL);
  return sigma * T ** 4;
}

// Shockley-Queisser detailed-balance efficiency for a gap Eg (eV).
// The sun is a blackbody at T_SUN diluted to a chosen incident power
// P_in (W/m^2); recombination is the cell's 300 K blackbody emission.
export function sqLimit(EgEv, { Pin = 1000 } = {}) {
  const dilute = Pin / blackbodyPower(T_SUN);
  const Jsc = Q * dilute * photonFluxAbove(EgEv, T_SUN);
  const J0 = Q * photonFluxAbove(EgEv, T_CELL);
  const Voc = (KB * T_CELL / Q) * Math.log(Jsc / J0 + 1);
  // maximise V * J(V), J(V) = Jsc - J0[exp(qV/kT) - 1]
  let a = 0, b = Voc;
  const gr = (Math.sqrt(5) - 1) / 2;
  const Jp = (V) => V * (Jsc - J0 * (Math.exp(Q * V / (KB * T_CELL)) - 1));
  let c = b - gr * (b - a), d = a + gr * (b - a);
  for (let i = 0; i < 120; i += 1) {
    if (Jp(c) < Jp(d)) a = c; else b = d;
    c = b - gr * (b - a); d = a + gr * (b - a);
  }
  const Pmax = Jp(0.5 * (a + b));
  return { eta: Pmax / Pin, Voc, Jsc, J0, EgV: EgEv };
}

// Sampled I-V and P-V curves over [0, V_oc].
export function ivCurve(steps, p = {}) {
  const voc = openCircuitVoltage(p);
  const V = new Float64Array(steps + 1), I = new Float64Array(steps + 1), P = new Float64Array(steps + 1);
  for (let i = 0; i <= steps; i += 1) {
    const v = voc * 1.02 * i / steps;
    V[i] = v; I[i] = Math.max(0, cellCurrent(v, p)); P[i] = v * I[i];
  }
  return { V, I, P };
}
export function sqCurve(steps, eMin, eMax, opts = {}) {
  const Eg = new Float64Array(steps + 1), eta = new Float64Array(steps + 1);
  for (let i = 0; i <= steps; i += 1) {
    const e = eMin + (eMax - eMin) * i / steps;
    Eg[i] = e; eta[i] = sqLimit(e, opts).eta;
  }
  return { Eg, eta };
}
