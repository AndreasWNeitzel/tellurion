// Spin valve magnetoresistance: the two-current (Mott 1936) series
// resistor model for GMR and the Julliere (1975) model for TMR, with
// a Dieny (1991) spin-valve hysteresis loop.
//
// Two-current GMR (FM/NM/FM, spin-up and spin-down conduct in
// independent parallel channels, Mott; Baibich et al. 1988):
//   parallel:     R_P  = 2 R_up R_dn / (R_up + R_dn)
//   antiparallel: R_AP = (R_up + R_dn) / 2
//   GMR = (R_AP - R_P)/R_P = (R_up - R_dn)^2 / (4 R_up R_dn) >= 0,
// and with the channel asymmetry beta = (R_dn - R_up)/(R_dn + R_up),
// R_AP/R_P = 1/(1 - beta^2) and GMR = beta^2/(1 - beta^2).
//
// Julliere TMR (FM/I/FM tunnel junction): G_P ~ 1 + P1 P2,
// G_AP ~ 1 - P1 P2, so
//   TMR = (R_AP - R_P)/R_P = 2 P1 P2 / (1 - P1 P2).
//
// Hysteresis: a soft free layer switches at +-Hc_free, a pinned
// (exchange-biased) layer stays fixed; the junction is parallel
// (low R) or antiparallel (high R) by history. Closed-form,
// deterministic, no RNG.

// Two-current GMR.
export function rParallel(rUp, rDn) { return 2 * rUp * rDn / (rUp + rDn); }
export function rAntiparallel(rUp, rDn) { return 0.5 * (rUp + rDn); }
export function gmrRatio(rUp, rDn) {
  const rp = rParallel(rUp, rDn), rap = rAntiparallel(rUp, rDn);
  return (rap - rp) / rp;
}
export function channelAsymmetry(rUp, rDn) { return (rDn - rUp) / (rDn + rUp); }

// Julliere TMR.
export function tmrJulliere(p1, p2) { return 2 * p1 * p2 / (1 - p1 * p2); }
// Resistances normalised so the parallel state is R = 1.
export function tmrResistances(p1, p2) {
  const rP = 1;
  const rAP = (1 + p1 * p2) / (1 - p1 * p2);            // R_AP/R_P = (1+P1P2)/(1-P1P2)
  return { rP, rAP };
}

// Spin-valve hysteresis. The free-layer state m_f in {+1,-1} switches
// when the field passes -+Hc_free; the pinned layer is fixed at +1
// for |H| < Hc_pin. The junction resistance is R_P when the layers
// are parallel (m_f == m_p) and R_AP otherwise. State is path
// dependent.
export function createValve({ hcFree = 0.3, hcPin = 1.2, rP = 1, rAP = 2 } = {}) {
  return { mFree: 1, mPin: 1, hcFree, hcPin, rP, rAP, H: 0 };
}
export function stepField(v, H) {
  if (H > v.hcFree) v.mFree = 1;
  else if (H < -v.hcFree) v.mFree = -1;
  if (H > v.hcPin) v.mPin = 1;
  else if (H < -v.hcPin) v.mPin = -1;
  v.H = H;
  return v;
}
export function valveResistance(v) {
  return v.mFree === v.mPin ? v.rP : v.rAP;
}
export function valveState(v) { return v.mFree === v.mPin ? 'parallel' : 'antiparallel'; }

// One full triangular field sweep +Hmax -> -Hmax -> +Hmax, returning
// the hysteretic R(H) loop (deterministic, starts saturated parallel).
export function hysteresisLoop(steps, { hcFree = 0.3, hcPin = 1.2, rP = 1, rAP = 2, Hmax = 1.6 } = {}) {
  const v = createValve({ hcFree, hcPin, rP, rAP });
  stepField(v, Hmax);                                   // saturate parallel
  const H = new Float64Array(steps + 1);
  const R = new Float64Array(steps + 1);
  const branch = new Int8Array(steps + 1);              // -1 down-sweep, +1 up-sweep
  for (let i = 0; i <= steps; i += 1) {
    const ph = i / steps;                               // 0..1 over the full cycle
    const h = ph < 0.5 ? Hmax - 4 * Hmax * ph : -Hmax + 4 * Hmax * (ph - 0.5);
    stepField(v, h);
    H[i] = h; R[i] = valveResistance(v); branch[i] = ph < 0.5 ? -1 : 1;
  }
  return { H, R, branch };
}
