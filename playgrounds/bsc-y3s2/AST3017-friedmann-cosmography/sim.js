// sim.js
// Friedmann cosmography in a flat LCDM universe. The dimensionless
// Hubble function E(z) = H(z) / H_0 is
//
//   E(z) = sqrt(Omega_m (1+z)^3 + Omega_Lambda).
//
// Cosmic age is
//
//   t(z) = (1 / H_0) integral_z^infty dz / ((1+z) E(z)).
//
// Comoving distance:
//
//   D_C(z) = (c / H_0) integral_0^z dz / E(z).
//
// We use H_0 = 67.4 km/s/Mpc (Planck 2018).
//
// Reference: Liddle, An Introduction to Modern Cosmology 3e Ch. 4
// (`liddle-cosmology`).

export const H0_KMSMPC = 67.4;
export const C_KMS = 299792.458;
// Hubble time t_H = 1/H_0 in Gyr. 1/H_0 (1/s) -> Gyr: 1/(H_0 km/s/Mpc) * Mpc/km -> s -> Gyr.
// 1 Mpc / (km/s) = 3.0857e19 km / (km/s) = 3.0857e19 s = 9.778e11 yr = 977.8 Gyr.
// So t_H = 977.8 / H_0 Gyr where H_0 is in km/s/Mpc.
export function hubbleTimeGyr(H0 = H0_KMSMPC) {
  return 977.8 / H0;
}

export function E(z, Om, Ol) {
  const a = 1 + z;
  return Math.sqrt(Om * a * a * a + Ol);
}

// Comoving distance in Mpc.
export function comovingDistanceMpc(z, Om, Ol, H0 = H0_KMSMPC, n = 2000) {
  let s = 0;
  const dz = z / n;
  for (let i = 0; i < n; i += 1) {
    const z1 = i * dz, z2 = (i + 1) * dz;
    s += dz / 6 * (1 / E(z1, Om, Ol) + 4 / E(0.5 * (z1 + z2), Om, Ol) + 1 / E(z2, Om, Ol));
  }
  return (C_KMS / H0) * s;
}

// Cosmic age from z to infinity in Gyr. Use a change of variable a = 1/(1+z).
// t(z) = (1/H_0) integral_0^a da / (a H(a)/H_0), where H/H_0 = sqrt(Om/a^3 + Ol).
// = (1/H_0) integral_0^a da / sqrt(Om/a + Ol a^2)
export function ageGyr(z, Om, Ol, H0 = H0_KMSMPC, n = 2000) {
  const aTarget = 1 / (1 + z);
  let s = 0;
  const da = aTarget / n;
  for (let i = 0; i < n; i += 1) {
    const a1 = (i + 0.5) * da;
    s += da / Math.sqrt(Om / a1 + Ol * a1 * a1);
  }
  return hubbleTimeGyr(H0) * s;
}

// Lookback time: t_now - t(z).
export function lookbackGyr(z, Om, Ol, H0 = H0_KMSMPC) {
  return ageGyr(0, Om, Ol, H0) - ageGyr(z, Om, Ol, H0);
}
