// Special-relativity optics of a starship (DOM-free engine).
//
// A ship moves with speed beta = v/c along +z through a field of
// stars. Every visible effect below is the exact Lorentz transform of
// the incoming photons' 4-momenta; nothing is eased or faked.
//
//   gamma            = 1 / sqrt(1 - beta^2)
//   aberration       cos th' = (cos th - beta) / (1 - beta cos th)
//   Doppler factor   D = 1 / [ gamma (1 - beta cos th') ]      (>1 blue)
//   relativistic beaming   I_obs / I_emit = D^4   (headlight effect)
//   length contraction     L = L0 / gamma   (along the motion)
//   proper time            d tau = dt / gamma
//
// cos th is measured from the direction of motion (+z) in the lab
// (star rest) frame; cos th' in the ship frame. The aberration map is
// its own inverse under beta -> -beta, which the invariant test uses
// to prove the transform is exact.
//
// References: Rindler, Relativity: Special, General and Cosmological,
// 2nd ed., OUP 2006, Sec. 4 (aberration, Doppler); Misner, Thorne &
// Wheeler, Gravitation, Sec. 2 (beaming, I_nu/nu^3 invariance).

export function gamma(beta) {
  return 1 / Math.sqrt(1 - beta * beta);
}

// Aberration of the apparent SOURCE position: lab-frame cosine ->
// ship-frame cosine. The whole sky bunches toward +z as beta grows
// (a star at 90 deg in the lab is seen ahead of the moving ship);
// stars exactly ahead (cos -> +1) stay ahead.
export function aberrateCos(beta, cosLab) {
  const c = Math.max(-1, Math.min(1, cosLab));
  return (c + beta) / (1 + beta * c);
}

// Inverse aberration (ship-frame cosine -> lab-frame cosine): the same
// formula with beta -> -beta.
export function deaberrateCos(beta, cosShip) {
  const c = Math.max(-1, Math.min(1, cosShip));
  return (c - beta) / (1 - beta * c);
}

// Doppler factor D = nu_obs / nu_emit, expressed with the SHIP-frame
// angle (the direction the observer actually looks). D > 1 is a
// blueshift (forward), D < 1 a redshift (aft).
export function dopplerFactor(beta, cosShip) {
  const g = gamma(beta);
  return 1 / (g * (1 - beta * Math.max(-1, Math.min(1, cosShip))));
}

// Relativistic beaming: bolometric intensity scales as D^4 because
// I_nu / nu^3 is a Lorentz invariant and nu_obs = D nu_emit.
export function beamingFactor(beta, cosShip) {
  const D = dopplerFactor(beta, cosShip);
  return D * D * D * D;
}

// Length seen by the lab for a ship of proper length L0.
export function contractedLength(L0, beta) {
  return L0 / gamma(beta);
}

// Proper time elapsed on the ship for lab time t.
export function properTime(t, beta) {
  return t / gamma(beta);
}

// Shift a rest wavelength by the Doppler factor (lambda_obs =
// lambda_emit / D).
export function shiftedWavelength(lambdaRest, beta, cosShip) {
  return lambdaRest / dopplerFactor(beta, cosShip);
}

// Spacetime interval s^2 = (c dt)^2 - dx^2 (c = 1) of an event,
// transformed by a boost of speed beta along x. Used by the invariant
// test: s^2 must be unchanged.
export function boostEvent(t, x, beta) {
  const g = gamma(beta);
  return { t: g * (t - beta * x), x: g * (x - beta * t) };
}
export function interval2(t, x) { return t * t - x * x; }

// Map an approximate blackbody-ish wavelength (nm) to an sRGB-ish
// colour. Good enough for the Doppler tint on point stars; the exact
// curve does not matter, the monotone blue<->red shift does.
export function wavelengthRGB(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = (440 - nm) / (440 - 380) * 0.5 + 0.2; g = 0; b = 1; }
  else if (nm < 490) { r = 0; g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { r = 0; g = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; b = 0; }
  else if (nm < 645) { r = 1; g = (645 - nm) / 65; b = 0; }
  else { r = 1; g = 0; b = 0; }
  // keep some floor so very shifted stars stay faintly visible
  return [0.15 + 0.85 * r, 0.10 + 0.85 * g, 0.15 + 0.85 * b];
}
