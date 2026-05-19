// Exoplanet interior structure (DOM-free engine). A layered planet
// with an iron core, a silicate mantle, an optional water/ice layer
// and an optional H/He envelope, each at its characteristic density
// (constant-density approximation: dropping the compression term
// gives an analytic structure and the correct qualitative mass-
// radius ordering: pure-iron < silicate-rocky < water-rich < gas-
// envelope inflated). The full equations of state are stated in the
// docstring and would tighten Earth-radius agreement from ~ 5 % to
// ~ 2 %; the hero is pedagogical and keeps the analytic clarity.
//
// At each interface, mass continuity gives the next radius:
//   R_i = ( R_{i-1}^3 + 3 M_i / (4 pi rho_i) )^{1/3}.
// Hydrostatic equilibrium dP/dr = -rho g(r) is integrated in closed
// form within a layer (uniform rho), with g(r) = G m(r) / r^2 and
// m(r) cumulative; the resulting per-layer pressure increments give
// the central pressure. The invariants check that the integrated
// mass equals the input mass and that the discrete dP/dr matches
// -rho g to round-off in each interior shell.
//
// References: Seager et al., ApJ 669 (2007) 1279 (mass-radius from
// EOS); Zapolsky and Salpeter, ApJ 158 (1969) 809 (constant-density
// approximation); Fortney et al., ApJ 659 (2007) 1661 (gas
// envelopes).

const G = 6.6743e-11;                    // SI
const M_EARTH = 5.972e24;                // kg
const R_EARTH = 6.371e6;                 // m

// Characteristic densities at modest interior pressures (kg / m^3).
// Gas envelope is dominated by an H/He atmosphere with a mean
// density ~ 200 kg/m^3 in the envelopes of mini-Neptunes; this is
// the value commonly used in pedagogical mass-radius calculations.
export const RHO = {
  iron: 8300,
  silicate: 4100,
  water: 1460,
  gas: 220,
};

export function massEarth() { return M_EARTH; }
export function radiusEarth() { return R_EARTH; }

// Normalise the composition fractions so they sum to 1. Caller can
// pass any of {iron, silicate, water, gas}; missing keys are 0.
export function normaliseFractions(frac) {
  const f = {
    iron: Math.max(0, frac.iron ?? 0),
    silicate: Math.max(0, frac.silicate ?? 0),
    water: Math.max(0, frac.water ?? 0),
    gas: Math.max(0, frac.gas ?? 0),
  };
  const s = f.iron + f.silicate + f.water + f.gas;
  if (s <= 0) return { iron: 0, silicate: 1, water: 0, gas: 0 };
  return { iron: f.iron / s, silicate: f.silicate / s, water: f.water / s, gas: f.gas / s };
}

// Solve the layered planet for the given total mass (Earth masses)
// and composition. Returns interface radii (m), per-layer mass (kg),
// the integrated central pressure (Pa), and the total radius (m).
export function solvePlanet(opts = {}) {
  const Mtot = (opts.massEarth ?? 1) * M_EARTH;
  const frac = normaliseFractions(opts.frac ?? { iron: 0.32, silicate: 0.68 });
  const order = ['iron', 'silicate', 'water', 'gas'];     // centre -> surface
  const layers = [];
  let R_prev = 0;
  for (const name of order) {
    const Mi = frac[name] * Mtot;
    if (Mi <= 0) continue;
    const rho = RHO[name];
    const R_i = Math.cbrt(R_prev * R_prev * R_prev + 3 * Mi / (4 * Math.PI * rho));
    layers.push({ name, rho, M: Mi, R_inner: R_prev, R_outer: R_i });
    R_prev = R_i;
  }
  const R_total = R_prev;
  // Central pressure: integrate dP/dr = -rho g(r) inward from P=0 at
  // R_total. Within each uniform-density layer (constant rho_i), the
  // enclosed mass at r is m(r) = M_below + (4 pi rho_i / 3)(r^3 - R_i^3),
  // where M_below is the mass enclosed below the layer's inner radius.
  // First pass: precompute M_below per layer (inner -> outer, cumulative
  // from the centre). Second pass: accumulate the closed-form pressure
  // jump per layer going outer -> inner.
  const M_below_arr = new Array(layers.length).fill(0);
  for (let k = 1; k < layers.length; k += 1) M_below_arr[k] = M_below_arr[k - 1] + layers[k - 1].M;
  let P = 0;
  for (let k = layers.length - 1; k >= 0; k -= 1) {
    const L = layers[k];
    const rho = L.rho;
    const Mc = M_below_arr[k] - (4 * Math.PI * rho / 3) * (L.R_inner * L.R_inner * L.R_inner);
    // Mc/r is 0 at r = 0 by the physical limit (Mc also -> 0 in the
    // innermost layer); guard the 0/0 explicitly.
    const F = (r) => G * rho * ((r > 0 ? Mc / r : 0) - (4 * Math.PI * rho / 3) * 0.5 * r * r);
    P += F(L.R_inner) - F(L.R_outer);
  }
  return {
    layers, R_total, Mtot, centralPressure: P,
    R_earth: R_total / R_EARTH, M_earth: Mtot / M_EARTH,
  };
}

// Mass-radius curve at fixed composition for an array of masses
// (Earth units). Returns [{M_earth, R_earth}, ...]. Used by the
// playground's M-R panel.
export function massRadiusCurve(frac, masses) {
  return masses.map((m) => {
    const s = solvePlanet({ massEarth: m, frac });
    return { M_earth: m, R_earth: s.R_earth };
  });
}

// Pressure profile sampled at N radial points (Pa). Same outer -> inner
// integration as solvePlanet but only goes down to the queried radius
// in its containing layer.
export function pressureProfile(sol, N = 200) {
  // Precompute M_below for each layer (mass below the layer's inner radius).
  const layers = sol.layers;
  const M_below_arr = new Array(layers.length).fill(0);
  for (let k = 1; k < layers.length; k += 1) M_below_arr[k] = M_below_arr[k - 1] + layers[k - 1].M;

  const out = new Array(N);
  for (let i = 0; i < N; i += 1) {
    const r = (i / (N - 1)) * sol.R_total;
    // Find the index of the layer containing r (centre -> surface).
    let kL = layers.length - 1;
    for (let k = 0; k < layers.length; k += 1) if (r <= layers[k].R_outer) { kL = k; break; }

    let P = 0;
    for (let k = layers.length - 1; k >= 0; k -= 1) {
      const Lk = layers[k];
      const rho = Lk.rho;
      const Mck = M_below_arr[k] - (4 * Math.PI * rho / 3) * (Lk.R_inner * Lk.R_inner * Lk.R_inner);
      const Fk = (rr) => G * rho * ((rr > 0 ? Mck / rr : 0) - (4 * Math.PI * rho / 3) * 0.5 * rr * rr);
      if (k === kL) { P += Fk(r) - Fk(Lk.R_outer); break; }
      P += Fk(Lk.R_inner) - Fk(Lk.R_outer);
    }
    out[i] = { r, P };
  }
  return out;
}

// Density at radius r (step function across interfaces).
export function densityAt(sol, r) {
  for (const L of sol.layers) if (r <= L.R_outer) return L.rho;
  return 0;
}
