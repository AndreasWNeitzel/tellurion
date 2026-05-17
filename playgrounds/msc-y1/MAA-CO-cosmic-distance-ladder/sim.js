// Distance-ladder relations, the four rungs as pure closed forms so they
// can be gate-tested headlessly and used by the renderer from one source.
// Reference: Weinberg, Cosmology (2008), Sec. 1.6; Freedman and Madore,
// ARA&A 48, 673 (2010).

export const H0 = 70;          // km/s/Mpc
export const C_KMS = 299792.458;
export const M_SNIA = -19.3;   // Type Ia absolute V magnitude

// Trigonometric parallax: d[pc] = 1000 / p[mas]. Exact inverse law.
export function dParallax(pMas) { return 1000 / pMas; }

// Leavitt period-luminosity law for classical Cepheids (V band):
// M_V = -2.78 log10(P/d) - 1.35.
export function MVCepheid(periodDays) { return -2.78 * Math.log10(periodDays) - 1.35; }

// Distance from the distance modulus: m - M = 5 log10(d/10 pc), so
// d[pc] = 10^((m - M + 5)/5). At m = M this returns exactly 10 pc.
export function dModulus(m, M) { return Math.pow(10, (m - M + 5) / 5); }

// Hubble flow: v = c z = H0 d, so d[pc] = 1e6 c z / H0 (c, H0 in km/s).
export function dHubble(z) { return 1e6 * C_KMS * z / H0; }

// The four rung distances in parsecs for a given ladder state.
export function ladder({ parallax, cepheidP, snApparent, z }) {
  return [
    dParallax(parallax),
    dModulus(snApparent, MVCepheid(cepheidP)),
    dModulus(snApparent, M_SNIA),
    dHubble(z),
  ];
}
