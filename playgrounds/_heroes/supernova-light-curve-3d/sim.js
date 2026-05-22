// Supernova light-curve model: Arnett 1982 decay-chain power +
// homologous fireball expansion.
//
// References:
//   Arnett, ApJ 253 (1982) 785.
//   Filippenko, ARA&A 35 (1997) 309 (review of SN types).

// Decay constants (e-folding times in days).
export const TAU_NI_D = 8.8;          // 6.1 d / ln 2
export const TAU_CO_D = 111.3;        // 77.7 d / ln 2

// Specific decay energy released per gram per second (erg s^-1 g^-1).
export const EPS_NI = 3.9e10;
export const EPS_CO = 6.78e9;

// Solar mass in grams.
export const M_SUN_G = 1.989e33;

// =========================================================================
// Bateman equations for the Ni -> Co -> Fe chain.
// At t = 0, all mass is Ni-56.
//   m_Ni(t) = m0 * exp(-t / tau_Ni)
//   m_Co(t) = m0 * (tau_Co / (tau_Co - tau_Ni)) *
//             (exp(-t / tau_Co) - exp(-t / tau_Ni))
//   m_Fe(t) = m0 - m_Ni - m_Co
// =========================================================================
export function massPartition(t_days, m0_Ni_solar) {
  const m0 = m0_Ni_solar;
  const mNi = m0 * Math.exp(-t_days / TAU_NI_D);
  const mCo = m0 * (TAU_CO_D / (TAU_CO_D - TAU_NI_D))
              * (Math.exp(-t_days / TAU_CO_D) - Math.exp(-t_days / TAU_NI_D));
  const mFe = m0 - mNi - mCo;
  return { mNi, mCo, mFe };
}

// =========================================================================
// Bolometric luminosity (Arnett 1982, photospheric phase).
//   L(t) = (radioactive heating rate) * (1 - exp(-t / t_diff)^2)
// In the "instantaneous" Arnett rule, the rate equals
//   Q(t) = M_Ni * [eps_Ni exp(-t/tau_Ni)
//                  + eps_Co (exp(-t/tau_Co) - exp(-t/tau_Ni))
//                    * (tau_Co / (tau_Co - tau_Ni))].
// We use that directly (in erg/s) and apply the "photospheric
// trapping factor" (1 - exp(-(t/t_diff)^2)) for an effective rise
// time t_diff (typical 10-20 days for SN Ia).
// =========================================================================
const SEC_PER_DAY = 86400;
const TAU_NI_S = TAU_NI_D * SEC_PER_DAY;
const TAU_CO_S = TAU_CO_D * SEC_PER_DAY;

export function decayPower_ergS(t_days, m0_Ni_solar) {
  const m0_g = m0_Ni_solar * M_SUN_G;
  const t_s = t_days * SEC_PER_DAY;
  // Ni instantaneous mass.
  const m_Ni_g = m0_g * Math.exp(-t_s / TAU_NI_S);
  // Co instantaneous mass.
  const m_Co_g = m0_g * (TAU_CO_S / (TAU_CO_S - TAU_NI_S))
                 * (Math.exp(-t_s / TAU_CO_S) - Math.exp(-t_s / TAU_NI_S));
  return EPS_NI * m_Ni_g + EPS_CO * m_Co_g;
}

// Photospheric trapping factor (Arnett-style; the long-time tail
// equals the decay power exactly).
export function trappingFactor(t_days, t_diff_days = 14) {
  const x = t_days / t_diff_days;
  return 1 - Math.exp(-x * x);
}

// Type II-P recombination plateau: a hydrogen-recombination wave
// releases the shock-deposited energy at a roughly constant
// luminosity for ~100 days, then the photosphere recedes and the
// light curve drops onto the radioactive tail. Modelled as a rise
// followed by a sigmoid cutoff at t_plateau. Type Ia has no plateau.
export function plateauShape(t_days, t_plateau_days) {
  if (!t_plateau_days) return 0;
  const rise = 1 - Math.exp(-((t_days / 12) ** 2));
  const drop = 1 / (1 + Math.exp((t_days - t_plateau_days) / 8));
  return rise * drop;
}

export function bolometricLuminosity_ergS(t_days, m0_Ni_solar, t_diff_days = 14, plateau = null) {
  const radio = decayPower_ergS(t_days, m0_Ni_solar) * trappingFactor(t_days, t_diff_days);
  if (!plateau) return radio;
  return radio + plateau.L_ergS * plateauShape(t_days, plateau.t_d);
}

// =========================================================================
// Convert L (erg/s) to absolute bolometric magnitude.
//   M_bol = -2.5 log10(L) + 88.7   (zero-point: L_sun = 3.828e33 -> M_sun = +4.74).
// =========================================================================
export function absoluteBolMag(L_ergS) {
  if (L_ergS <= 0) return 100;
  return -2.5 * Math.log10(L_ergS) + 88.7;
}

// =========================================================================
// Preset SN parameters.
// =========================================================================
export const SN_PRESETS = {
  ia_2011fe: {
    label: 'SN 2011fe (Type Ia)',
    type: 'Ia',
    m0_Ni: 0.60,          // M_sun
    t_diff_d: 14,
    v_ej_kms: 11000,
    M_ej_solar: 1.40,
    peak_MV: -19.5,
  },
  ii_1987a: {
    label: 'SN 1987A (Type II)',
    type: 'II',
    m0_Ni: 0.075,         // canonical
    t_diff_d: 35,
    v_ej_kms: 3500,
    M_ej_solar: 15.0,
    peak_MV: -16.7,
    // Recombination-powered sustained bright phase: ~1.4e42 erg/s
    // (M_bol ~ -16.7) held for ~110 days, then onto the Co-56 tail.
    plateau: { L_ergS: 1.45e42, t_d: 110 },
  },
};

// =========================================================================
// Fireball geometry. Homologous expansion: r(t) = v_ej * t.
// =========================================================================
export function fireballRadius_cm(t_days, v_kms) {
  return v_kms * 1e5 * t_days * SEC_PER_DAY;
}

// =========================================================================
// Convenience.
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
