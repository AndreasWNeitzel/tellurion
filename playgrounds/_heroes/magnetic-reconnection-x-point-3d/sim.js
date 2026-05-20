// Headless physics for the magnetic-reconnection X-point hero.
// Sweet-Parker geometry: two oppositely directed magnetic fields are
// driven together at an inflow speed v_in; field lines reconnect in a
// thin resistive current sheet of half-width delta and the released
// magnetic energy is ejected along the sheet at the Alfven speed v_A.
//
// Sweet-Parker reconnection rate: M_A = v_in / v_A = S^{-1/2} where
// S = v_A L / eta is the Lundquist number (Parker 1957 JGR 62, 509;
// Sweet 1958 in IAU Symp. 6, p. 123).
//
// References:
//   Priest and Forbes, Magnetic Reconnection, CUP 2000, Ch. 4.
//   Kulsrud, Plasma Physics for Astrophysics, Princeton 2005, Ch. 14.
//
// Citation keys:
//   `priest-forbes-reconnection`
//   `kulsrud-plasma-astro`

export const PRESETS = {
  laboratory: { L: 1.0, v_A: 1.0, eta: 1.0e-3 },     // S = 1e3
  solar_corona: { L: 1.0, v_A: 1.0, eta: 1.0e-8 },    // S = 1e8 (real corona)
  fast_petschek: { L: 1.0, v_A: 1.0, eta: 0.05 },    // M_A ~ 0.1
};

// Sweet-Parker scalings.
export function lundquist(params) {
  const { L, v_A, eta } = params;
  return v_A * L / Math.max(1e-30, eta);
}

export function reconnectionRate(params) {
  // M_A = v_in / v_A = 1 / sqrt(S)
  return 1 / Math.sqrt(lundquist(params));
}

export function inflowSpeed(params) {
  return params.v_A * reconnectionRate(params);
}

export function sheetHalfWidth(params) {
  // delta = L / sqrt(S)
  return params.L / Math.sqrt(lundquist(params));
}

// Hyperbolic X-point field B = (B0 y / a, B0 x / a, 0). Field lines are
// hyperbolae xy = const. The kinematic inflow velocity is the dual
// stagnation flow v = (-v_in x / L, v_in y / L, 0) with the sign
// chosen so material is compressed toward the sheet (along x in our
// convention).
export function fieldAt(x, y, B0 = 1, a = 1) {
  return { Bx: B0 * y / a, By: B0 * x / a };
}

// Sweet-Parker outflow profile along the sheet (y = 0). Bernoulli
// pressure balance gives v_out -> v_A at the sheet edge. Use a smooth
// tanh ramp so the flow is well-behaved.
export function outflowAlongSheet(s, params) {
  const { L, v_A } = params;
  return v_A * Math.tanh(s / Math.max(1e-9, 0.2 * L));
}

// Magnetic energy released per unit volume per unit time at the
// reconnection rate: E_dot = (B0^2 / 8 pi) * 2 v_in / delta (Poynting
// flux into the sheet). In code units we drop 8 pi:
export function energyDeposition(params, B0 = 1) {
  return (B0 * B0) * inflowSpeed(params) / Math.max(1e-9, sheetHalfWidth(params));
}

// Deterministic RNG for tracer particle seeding.
export function makeRng(seed = 0xC0FFEE) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}
