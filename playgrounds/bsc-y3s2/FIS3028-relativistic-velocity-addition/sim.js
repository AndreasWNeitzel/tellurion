// Relativistic addition of collinear velocities. A frame moves at u (units of c) and an
// object moves at v within it; the object's speed in the original frame is not u + v but
//   w = (u + v) / (1 + u v).
// This keeps |w| < 1 for any sub-light inputs and leaves light (beta = 1) invariant. The
// clean structure appears in the rapidity phi = artanh(beta), which simply adds:
//   phi_w = phi_u + phi_v.
// Units c = 1. Reference: Taylor and Wheeler, Spacetime Physics, 2nd ed., Ch. 3.

export function addVelocity(u, v) { return (u + v) / (1 + u * v); }

export function galilean(u, v) { return u + v; }

export function rapidity(beta) { return Math.atanh(beta); }

export function velocityFromRapidity(phi) { return Math.tanh(phi); }

export function lorentzFactor(beta) { return 1 / Math.sqrt(1 - beta * beta); }
