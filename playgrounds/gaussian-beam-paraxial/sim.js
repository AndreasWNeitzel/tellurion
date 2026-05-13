// sim.js
// Fundamental TEM_00 paraxial Gaussian beam.
//
// Beam waist w_0 (1/e^2 intensity radius at z = 0), wavelength lambda.
// Rayleigh range z_R = pi w_0^2 / lambda.
// Spot radius w(z) = w_0 sqrt(1 + (z / z_R)^2).
// Radius of curvature R(z) = z (1 + (z_R / z)^2) (R -> infinity at z = 0, R -> z far field).
// Gouy phase eta(z) = atan(z / z_R).
//
// Intensity I(r, z) = I_0 (w_0 / w(z))^2 exp(-2 r^2 / w(z)^2).
//
// Reference: Siegman 1986, Lasers, Chapter 17 (`siegman1986`).

export function spotRadius(z, w0, zR) {
  return w0 * Math.sqrt(1 + (z / zR) * (z / zR));
}

export function radiusOfCurvature(z, zR) {
  if (z === 0) return Infinity;
  return z * (1 + (zR / z) * (zR / z));
}

export function gouyPhase(z, zR) {
  return Math.atan2(z, zR);
}

export function rayleighRange(w0, lambda) {
  return Math.PI * w0 * w0 / lambda;
}

export function divergenceAngle(w0, lambda) {
  return lambda / (Math.PI * w0);  // far-field half-angle
}

// 2D intensity field I(r, z) on a grid. Returns Float32Array indexed
// (j * Nz + i) for j = 0..Nr-1, i = 0..Nz-1.
// Coordinates: z from -zMax to +zMax, r from -rMax to +rMax (so we plot the
// beam through its waist symmetrically).
export function intensityField({ Nz = 320, Nr = 200, zMax, rMax, w0, lambda }) {
  const zR = rayleighRange(w0, lambda);
  const field = new Float32Array(Nz * Nr);
  for (let j = 0; j < Nr; j += 1) {
    const r = -rMax + (2 * rMax) * (j / (Nr - 1));
    for (let i = 0; i < Nz; i += 1) {
      const z = -zMax + (2 * zMax) * (i / (Nz - 1));
      const w = spotRadius(z, w0, zR);
      const norm = (w0 / w) * (w0 / w);
      const intensity = norm * Math.exp(-2 * r * r / (w * w));
      field[j * Nz + i] = intensity;
    }
  }
  return { field, Nz, Nr, zMax, rMax, zR };
}

// 1D power-through-aperture (1 - exp(-2 R^2 / w^2)) fraction for circular
// aperture of radius R at axial position z (Siegman Eq. 17.51).
export function powerThroughAperture(R, z, w0, zR) {
  const w = spotRadius(z, w0, zR);
  return 1 - Math.exp(-2 * R * R / (w * w));
}
