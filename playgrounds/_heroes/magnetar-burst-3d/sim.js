// Headless physics for the magnetar-burst hero.
// A magnetar is a neutron star with an extreme magnetic field
// (~ 10^14-10^15 G), strong enough that magnetic stress fractures
// the crust. Occasional crustquakes release magnetic energy as
// short hard-X-ray bursts (SGRs and AXPs).
//
// Key relations:
//   E_dipole_loss = (2 / (3 c^3)) B_pole^2 R_NS^6 omega^4 sin^2 alpha
//   tau_spindown = P / (2 dot P)
//   Magnetic dipole formula: B_p^2 = (3 c^3 I / (2 pi^2 R_NS^6)) P dot P
//   E_mag = B^2 / (8 pi) * V_NS ~ 1e47 erg * (B / 1e15 G)^2
//
// References:
//   Duncan and Thompson, ApJ 392 (1992) L9 (magnetar model).
//   Mereghetti, Astron. Astrophys. Rev. 15 (2008) 225 (review).
//   `duncan-thompson-1992`, `mereghetti-2008`.

const G_CONST = 6.6743e-11;
const C = 2.998e8;
const R_NS_M = 1e4;             // 10 km
const I_NS = 1e38;              // kg m^2 (rough)
const M_SUN = 1.989e30;

// Spindown timescale tau = P / (2 dot P).
// For magnetic dipole braking:
//   tau = (3 c^3 I) / (B_p^2 R^6 omega^2 sin^2 alpha)   (in SI)
// We use convenient units: B_p in 1e14 G, P in seconds.
// Convert 1 G = 1e-4 T. So B in Tesla = B_G * 1e-4.
//
// dot P = (8 pi^2 R_NS^6 B^2 sin^2 alpha) / (3 mu_0 c^3 I P).
// (SI; the mu_0 factor is the standard dipole-radiation conversion.)
export function spindownDotP(B_G, P_s, sin_alpha = 1) {
  const B_T = B_G * 1e-4;
  const mu0 = 4 * Math.PI * 1e-7;
  return (8 * Math.PI * Math.PI * Math.pow(R_NS_M, 6) * B_T * B_T * sin_alpha * sin_alpha)
    / (3 * mu0 * Math.pow(C, 3) * I_NS * P_s);
}

export function spindownAge_yr(B_G, P_s) {
  const dP = spindownDotP(B_G, P_s);
  if (dP <= 0) return Infinity;
  return P_s / (2 * dP) / (365.25 * 86400);
}

// Magnetic energy reservoir: E_B = (B^2 / 8 pi) * V_NS (cgs).
// In SI: E_B = (B^2 / (2 mu_0)) * V_NS with V_NS = (4/3) pi R^3.
export function magneticEnergy_J(B_G) {
  const B_T = B_G * 1e-4;
  const mu0 = 4 * Math.PI * 1e-7;
  const V = (4 / 3) * Math.PI * Math.pow(R_NS_M, 3);
  return (B_T * B_T) / (2 * mu0) * V;
}

// Quantum critical field (Schwinger): B_QED = m_e^2 c^3 / (e hbar) ~ 4.4e9 T = 4.4e13 G.
export const B_QED_G = 4.413e13;

// Burst duration: short SGR burst is ~ 0.1 s; long bursts up to ~ 1000 s.
// Burst energy: 10^39 - 10^46 erg typical, with extreme giant flares
// (e.g. 2004 SGR 1806-20) reaching 1e46 erg = 1e39 J.
export function isInBurstingRegime(B_G) {
  return B_G > 1e13;     // SGR/AXP threshold
}

// Photon emission rate during a burst, decaying as power law.
export function burstLightcurve(t_s, t_peak_s, peak_intensity = 1) {
  if (t_s < 0) return 0;
  if (t_s < t_peak_s) return peak_intensity * Math.pow(t_s / t_peak_s, 2);
  return peak_intensity * Math.pow(t_s / t_peak_s, -1.5);
}

// Critical magnetic field at the photon Larmor radius:
//   r_L = sqrt(hbar c / eB).
// At B = B_QED, r_L = electron Compton wavelength.

// Schmidt-rotator-style burst trigger: each crustquake event picks a
// random location on the star's surface and releases a fraction of
// the magnetic energy.
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

export const KNOWN_MAGNETARS = [
  { name: 'SGR 1806-20', B_G: 2e15, P_s: 7.55, note: '2004 giant flare 1e46 erg' },
  { name: '1E 1841-045 (AXP)', B_G: 7e14, P_s: 11.78, note: 'persistent X-ray source' },
  { name: 'SGR 1900+14', B_G: 7e14, P_s: 5.16, note: 'X-ray bursting source' },
];
