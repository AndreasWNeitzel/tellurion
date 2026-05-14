// Planck blackbody temperature to sRGB (linear).
// Standard CIE 1931 colorimetric pipeline, simplified for typical T in [1000, 30000] K.
// Reference: Wikipedia, Color rendering of spectra; Tanner Helland approximation.
export function planckTempToSRGB(T) {
  const t = Math.max(1000, Math.min(30000, T)) / 100;
  let r, g, b;
  // Tanner Helland fit.
  if (t <= 66) { r = 255; } else { r = 329.698727446 * Math.pow(t - 60, -0.1332047592); }
  if (t <= 66) { g = 99.4708025861 * Math.log(t) - 161.1195681661; }
  else { g = 288.1221695283 * Math.pow(t - 60, -0.0755148492); }
  if (t >= 66) { b = 255; }
  else if (t <= 19) { b = 0; }
  else { b = 138.5177312231 * Math.log(t - 10) - 305.0447927307; }
  return [Math.max(0, Math.min(255, r)) / 255, Math.max(0, Math.min(255, g)) / 255, Math.max(0, Math.min(255, b)) / 255];
}
