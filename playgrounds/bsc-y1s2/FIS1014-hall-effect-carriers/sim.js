// sim.js
// The Hall effect. A current I flows along a conducting bar (thickness t, width w)
// in a transverse magnetic field B. The Lorentz force qv x B deflects the moving
// carriers to one edge; charge piles up there until the transverse Hall field it
// creates exactly cancels the magnetic force. In steady state the carriers drift
// straight again and the bar holds a transverse Hall voltage
//   V_H = I B / (n q t),
// with n the carrier density and q the signed carrier charge. The magnitude fixes
// the carrier density; the polarity reveals the sign of the carriers, which is the
// whole point of the measurement. Both positive and negative carriers deflect to
// the same edge (charge sign and drift direction both flip), but the resulting
// charge polarity, and so the sign of V_H, is opposite.
//
// Convention here: current in +x, B in +z, the bar's "top" edge is the one
// carriers are pushed to when B > 0, and V_H = V(top) - V(bottom). With this
// orientation holes give a positive V_H and electrons a negative one.
//
// Reference: Griffiths, Introduction to Electrodynamics, 4th ed., Ex. 5.2 and
// Prob. 5.41; Ashcroft and Mermin, Solid State Physics, Ch. 1 (the Hall effect
// and the sign of the carriers).

export const E = 1.602176634e-19; // elementary charge, C

export const CARRIERS = {
  hole: { label: 'holes (positive)', sign: +1, color: '#ff7a59' },
  electron: { label: 'electrons (negative)', sign: -1, color: '#4ea8ff' },
};

// drift speed of the carriers, m/s, from J = n q v_d and I = J w t.
export function driftSpeed(I, n, w, t) { return I / (n * E * w * t); }

// the steady transverse Hall field, V/m: it cancels the magnetic force, E_H = v_d B.
export function hallField(I, B, n, w, t) { return driftSpeed(I, n, w, t) * B; }

// the Hall voltage V(top) - V(bottom), volts, signed by carrier and field.
export function hallVoltage(I, B, n, t, sign) { return sign * I * B / (n * E * t); }

// the Hall coefficient, m^3/C, sign set by the carrier sign.
export function hallCoefficient(n, sign) { return sign / (n * E); }
