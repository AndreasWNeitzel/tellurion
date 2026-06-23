// Phased linear antenna array: beam steering and the array factor.
//
// N isotropic radiators sit on a line, spacing d, fed with a progressive
// phase shift beta between neighbours. The array factor is the geometric
// sum
//   AF(psi) = sum_{n=0}^{N-1} e^{i n psi}
//           = sin(N psi / 2) / sin(psi / 2),   psi = k d sin(theta) + beta,
// with k = 2 pi / lambda. The main beam points where psi = 0, i.e.
//   sin(theta0) = -beta / (k d),
// so a linear phase taper steers the beam without moving the elements.
// Grating lobes (full-strength copies of the main beam) appear once the
// spacing reaches d >= lambda.
//
// Angles are in radians unless a name ends in Deg. The normalised power
// pattern returns (|AF| / N)^2 in [0, 1].
//
// References:
//   Balanis, Antenna Theory: Analysis and Design (2016), Ch. 6.
//   Kraus and Marhefka, Antennas for All Applications (2002), Ch. 5.

const TAU = 2 * Math.PI;

// Progressive phase shift (radians) that steers the main beam to theta0.
export function steerPhase(dOverLambda, theta0) {
  return -TAU * dOverLambda * Math.sin(theta0);
}

// psi = k d sin(theta) + beta, written with beta = steerPhase.
export function psiOf(theta, dOverLambda, theta0) {
  return TAU * dOverLambda * (Math.sin(theta) - Math.sin(theta0));
}

// Normalised array-factor power (|AF|/N)^2 at angle theta.
export function arrayPower(theta, N, dOverLambda, theta0) {
  const psi = psiOf(theta, dOverLambda, theta0);
  const s = Math.sin(psi / 2);
  let af;
  if (Math.abs(s) < 1e-9) af = N;                       // psi -> 0 limit
  else af = Math.sin(N * psi / 2) / s;
  const p = (af / N) ** 2;
  return p > 1 ? 1 : p;
}

// Per-element excitation phase (radians, mod 2pi) for the phasor display.
export function elementPhase(n, dOverLambda, theta0) {
  const beta = steerPhase(dOverLambda, theta0);
  let ph = (n * beta) % TAU;
  if (ph < 0) ph += TAU;
  return ph;
}

// Grating-lobe directions (radians) other than the main beam: psi = 2 pi m,
// i.e. sin(theta) = sin(theta0) + m / dOverLambda inside [-1, 1], m != 0.
export function gratingLobes(dOverLambda, theta0) {
  const out = [];
  const s0 = Math.sin(theta0);
  for (let m = -8; m <= 8; m += 1) {
    if (m === 0) continue;
    const s = s0 + m / dOverLambda;
    if (s > -1 && s < 1) out.push(Math.asin(s));
  }
  return out;
}

// Half-power (-3 dB) beamwidth of the main lobe, in radians, found by
// scanning outward from theta0 until the power drops below 1/2.
export function halfPowerBeamwidth(N, dOverLambda, theta0) {
  const step = 0.0002;                                  // ~0.01 deg
  const edge = (sign) => {
    let th = theta0;
    for (let i = 0; i < 20000; i += 1) {
      th += sign * step;
      if (th <= -Math.PI / 2 || th >= Math.PI / 2) return sign * Math.PI / 2;
      if (arrayPower(th, N, dOverLambda, theta0) < 0.5) return th;
    }
    return th;
  };
  return edge(+1) - edge(-1);
}

// Peak side-lobe level (dB, negative) relative to the main beam: the
// largest secondary maximum outside the main lobe.
export function peakSidelobeDb(N, dOverLambda, theta0) {
  const hp = halfPowerBeamwidth(N, dOverLambda, theta0);
  const guard = Math.max(hp, 0.02);
  const grat = gratingLobes(dOverLambda, theta0);
  let peak = 0;
  const step = 0.001;
  for (let th = -Math.PI / 2; th <= Math.PI / 2; th += step) {
    if (Math.abs(th - theta0) < guard) continue;        // skip the main lobe
    if (grat.some((g) => Math.abs(th - g) < guard)) continue; // skip grating lobes
    const p = arrayPower(th, N, dOverLambda, theta0);
    if (p > peak) peak = p;
  }
  return peak > 0 ? 10 * Math.log10(peak) : -100;
}

export const DEG = Math.PI / 180;
