// sim.js
// Shapiro time delay: extra travel time of a light signal that grazes a
// massive body. To leading order in the post-Newtonian (PPN) expansion of
// Schwarzschild,
//
//   delta t = 2 M ln[(r_E + r_R + R) / (r_E + r_R - R)]
//
// where r_E and r_R are the Sun-to-emitter and Sun-to-receiver distances,
// R is the straight-line Earth-receiver distance, and the photon path
// passes within impact parameter b of the Sun.
//
// Standard form for light grazing the Sun (b approx solar radius):
//   delta t = 4 M ln(4 r_E r_R / b^2)         (G = c = 1, M = solar mass)
//
// In practical units: t = (4 G M / c^3) ln(4 r_E r_R / b^2). For Earth
// emitter and Cassini receiver near the Sun, this is ~ 100 microseconds.
//
// Reference: Schutz, A First Course in General Relativity 2e Ch. 11
// (`schutz-firstcourse`); Hartle Ch. 9.

export const M_GEOM = 1.0;  // Schwarzschild mass in geometric units

export function shapiroDelay(rE, rR, b, M = M_GEOM) {
  // Leading-order PPN (Schutz 11.17): delta t = 2 M ln(4 r_E r_R / b^2).
  return 2 * M * Math.log(4 * rE * rR / (b * b));
}

// Full closed-form (Schutz 11.16): delta t = 2 M ln[(rE + sqrt(rE^2 - b^2)) (rR + sqrt(rR^2 - b^2)) / b^2].
export function shapiroDelayFull(rE, rR, b, M = M_GEOM) {
  const aE = rE + Math.sqrt(rE * rE - b * b);
  const aR = rR + Math.sqrt(rR * rR - b * b);
  return 2 * M * Math.log(aE * aR / (b * b));
}

// Photon path (Newtonian straight line for visualization).
export function photonPath(rE, rR, b) {
  // Sun at origin. Emitter at (-rE, 0); receiver at (+rR, 0).
  // Path passes at y = b parallel to the x-axis (impact parameter).
  return {
    emitter: { x: -rE, y: b },
    receiver: { x:  rR, y: b },
    sun: { x: 0, y: 0 },
  };
}
