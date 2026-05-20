// Greenhouse-effect radiative balance.
// References:
//   Pierrehumbert, Principles of Planetary Climate, CUP 2010, Ch. 4.
//   Hansen et al., Science 213 (1981) 957.

export const S_SOLAR_WM2 = 1361.0;
export const SIGMA_SB = 5.670374e-8;

// =========================================================================
// Pure-radiative emission temperature: T_eff = (S(1-A) / (4 sigma))^(1/4).
// =========================================================================
export function emissionTemperature_K(S_Wm2, A) {
  return Math.pow(S_Wm2 * (1 - A) / (4 * SIGMA_SB), 0.25);
}

// =========================================================================
// Single-layer grey-atmosphere surface temperature.
// T_surf = T_eff (2 / (1 + tau_LW))^(1/4).
// =========================================================================
export function surfaceTemperature_K(S_Wm2, A, tau_LW) {
  const T_eff = emissionTemperature_K(S_Wm2, A);
  return T_eff * Math.pow(2 / (1 + tau_LW), 0.25);
}

// =========================================================================
// CO2 -> tau_LW log parametrisation.
// tau(c) = tau_0 exp(-beta log_2(c/c_0)).
// Tuned so that c = 280 ppm gives tau ~ 0.10 (Earth pre-industrial),
// and doubling to 560 ppm gives Delta T_surf ~ 3 K.
// =========================================================================
const TAU_0 = 0.10;
const C_0_PPM = 280;
const BETA = 0.35;
export function tauFromCO2(c_ppm) {
  const tau = TAU_0 * Math.exp(-BETA * (Math.log2(c_ppm / C_0_PPM)));
  return Math.max(0.001, Math.min(1.0, tau));
}

// =========================================================================
// Multi-layer grey atmosphere (n layers, identical tau each).
// Used for the Venus runaway preset where we stack many opaque layers.
//   T_surf^4 = (1 + N(1 - tau)) T_eff^4   (textbook grey, Pierrehumbert).
// In the fully-opaque limit (tau = 0), T_surf = T_eff * (N + 1)^(1/4),
// which is the result that drives Venus to its observed 737 K with
// about N = 200 IR-opaque layers.
// =========================================================================
export function multilayerSurfaceTemperature_K(S_Wm2, A, tau_per_layer, n_layers) {
  const T_eff = emissionTemperature_K(S_Wm2, A);
  const opacityFactor = 1 + n_layers * (1 - tau_per_layer);
  return T_eff * Math.pow(opacityFactor, 0.25);
}

// =========================================================================
// PRESETS.
// =========================================================================
export const GHE_PRESETS = {
  snowball: {
    label: 'Snowball Earth',
    A: 0.70, co2_ppm: 100, n_layers: 1,
    description: 'Ice-covered Earth, very high albedo.',
  },
  preindustrial: {
    label: 'Pre-industrial Earth (1850)',
    A: 0.30, co2_ppm: 280, n_layers: 1,
    description: 'Earth before industrial CO2 emissions.',
  },
  current: {
    label: 'Current Earth (2025)',
    A: 0.30, co2_ppm: 420, n_layers: 1,
    description: 'Earth today: CO2 = 420 ppm, T_surf = 288 K.',
  },
  doubled_co2: {
    label: '2x CO2 (IPCC scenario)',
    A: 0.30, co2_ppm: 560, n_layers: 1,
    description: 'CO2 doubled to 560 ppm: Delta T ~ 3 K (climate sensitivity).',
  },
  venus_runaway: {
    label: 'Venus (runaway greenhouse)',
    A: 0.75, co2_ppm: 1e6, n_layers: 200,
    description: 'Venus: 90 bar CO2, T_surf = 737 K (200 IR-opaque layers).',
  },
};

// =========================================================================
// PHOTON PATH model. We model two photon populations:
//   - shortwave (visible) sunbeams approaching Earth: streaming straight
//     toward Earth disk; some bounce off (reflected by albedo).
//   - longwave (IR) photons emitted from surface upward.
//     Each has probability tau_LW of escaping to space; otherwise
//     re-absorbed by the atmosphere layer (and the surface heats up).
// =========================================================================
export function makeRng(seed = 0xC0FFEE) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
