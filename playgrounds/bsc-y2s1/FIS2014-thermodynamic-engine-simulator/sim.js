// Ideal-gas thermodynamic cycles. Headless and deterministic. n moles
// of a gas with adiabatic index gamma run a closed cycle (Carnot, Otto,
// Diesel, Stirling). Each segment carries a process type and its work
// W (by the gas) and heat Q. Around a closed loop the internal energy
// returns, so the first law gives sum Q = sum W = the enclosed PV area.
//   isothermal:  pV = const,   W = nRT ln(V2/V1),  Q = W
//   adiabatic:   pV^gamma = const,  Q = 0,  W = (P1 V1 - P2 V2)/(g-1)
//   isochoric:   W = 0,  Q = n Cv dT
//   isobaric:    W = p dV,  Q = n Cp dT
// Reference: Callen, Thermodynamics (2nd ed.), Ch. 4; Reif,
// Fundamentals of Statistical and Thermal Physics, Ch. 5.

export const R = 8.314;

export function cycleStates({ type = 'carnot', Th = 600, Tc = 300, r = 4, n = 1, gamma = 5 / 3, alpha = 1.8 }) {
  const Cv = R / (gamma - 1), Cp = gamma * Cv;
  const Vmin = 1, Vmax = r * Vmin;
  const segs = [];
  const seg = (proc, s, e) => {
    // s,e = {P,V,T}; compute W (by gas) and Q.
    let W = 0, Q = 0;
    if (proc === 'isothermal') { W = n * R * s.T * Math.log(e.V / s.V); Q = W; }
    else if (proc === 'adiabatic') { W = (s.P * s.V - e.P * e.V) / (gamma - 1); Q = 0; }
    else if (proc === 'isochoric') { W = 0; Q = n * Cv * (e.T - s.T); }
    else if (proc === 'isobaric') { W = s.P * (e.V - s.V); Q = n * Cp * (e.T - s.T); }
    segs.push({ proc, s, e, W, Q });
  };
  const P = (V, T) => n * R * T / V;
  if (type === 'carnot') {
    const V1 = Vmin, T1 = Th;
    const V2 = Vmin * Math.sqrt(r);                    // isothermal expansion at Th
    const V3 = V2 * Math.pow(Th / Tc, 1 / (gamma - 1)); // adiabatic to Tc
    const V4 = V3 / (V2 / V1);                          // isothermal compression at Tc
    const A = { P: P(V1, Th), V: V1, T: Th }, B = { P: P(V2, Th), V: V2, T: Th };
    const C = { P: P(V3, Tc), V: V3, T: Tc }, D = { P: P(V4, Tc), V: V4, T: Tc };
    seg('isothermal', A, B); seg('adiabatic', B, C); seg('isothermal', C, D); seg('adiabatic', D, A);
  } else if (type === 'otto') {
    // Intake at Tc; adiabatic compression to T2; isochoric heat-in to
    // T3 = Th r^{g-1} so the adiabatic expansion lands back exactly at
    // T4 = Th and the isochoric exhaust returns to T1 = Tc. This makes
    // eta = 1 - r^{1-g} exactly, independent of the reservoir gap.
    const rr = Math.pow(Vmax / Vmin, gamma - 1);
    const V1 = Vmax, T1 = Tc;
    const V2 = Vmin, T2 = Tc * rr;                              // adiabatic compression
    const T3 = Th * rr;                                         // isochoric heat-in
    const V4 = V1, T4 = Th;                                     // adiabatic expansion
    const A = { P: P(V1, T1), V: V1, T: T1 }, B = { P: P(V2, T2), V: V2, T: T2 };
    const C = { P: P(V2, T3), V: V2, T: T3 }, D = { P: P(V4, T4), V: V4, T: T4 };
    seg('adiabatic', A, B); seg('isochoric', B, C); seg('adiabatic', C, D); seg('isochoric', D, A);
  } else if (type === 'diesel') {
    const V1 = Vmax, T1 = Tc;
    const V2 = Vmin, T2 = T1 * Math.pow(V1 / V2, gamma - 1);    // adiabatic compression
    const V3 = V2 * alpha, T3 = T2 * alpha;                     // isobaric heat-in
    const V4 = V1, T4 = T3 * Math.pow(V3 / V4, gamma - 1);      // adiabatic expansion
    const A = { P: P(V1, T1), V: V1, T: T1 }, B = { P: P(V2, T2), V: V2, T: T2 };
    const C = { P: P(V3, T3), V: V3, T: T3 }, D = { P: P(V4, T4), V: V4, T: T4 };
    seg('adiabatic', A, B); seg('isobaric', B, C); seg('adiabatic', C, D); seg('isochoric', D, A);
  } else { // stirling, with an ideal regenerator (the isochoric heats
    // are exchanged internally, not with the reservoirs)
    const V1 = Vmin, V2 = Vmax;
    const A = { P: P(V1, Tc), V: V1, T: Tc }, B = { P: P(V2, Tc), V: V2, T: Tc };
    const C = { P: P(V2, Th), V: V2, T: Th }, D = { P: P(V1, Th), V: V1, T: Th };
    seg('isothermal', A, B); seg('isochoric', B, C); seg('isothermal', C, D); seg('isochoric', D, A);
    segs[1].regen = true; segs[3].regen = true;
  }
  return segs;
}

export function analysis(segs) {
  let W = 0, Qin = 0, Qout = 0, dU = 0;
  for (const s of segs) {
    W += s.W; dU += s.Q - s.W;                  // dU keeps every Q (first law)
    if (s.regen) continue;                       // regenerated heat is internal
    if (s.Q > 0) Qin += s.Q; else Qout += -s.Q;
  }
  const eff = Qin > 0 ? W / Qin : 0;
  return { W, Qin, Qout, dU, eff };
}

export function carnotEff(Th, Tc) { return 1 - Tc / Th; }
export function ottoEff(r, gamma = 5 / 3) { return 1 - Math.pow(r, 1 - gamma); }

// Sample a process into a PV polyline.
export function sampleSeg(seg, gamma = 5 / 3, n = 40) {
  const out = [], { proc, s, e } = seg;
  for (let i = 0; i <= n; i += 1) {
    const f = i / n; let V, P;
    if (proc === 'isochoric') { V = s.V; P = s.P + (e.P - s.P) * f; }
    else if (proc === 'isobaric') { V = s.V + (e.V - s.V) * f; P = s.P; }
    else if (proc === 'isothermal') { V = s.V + (e.V - s.V) * f; P = s.P * s.V / V; }
    else { V = s.V + (e.V - s.V) * f; P = s.P * Math.pow(s.V / V, gamma); }
    out.push([V, P]);
  }
  return out;
}
