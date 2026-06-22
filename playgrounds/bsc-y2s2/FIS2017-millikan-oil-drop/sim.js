// Millikan's oil-drop experiment. A charged oil drop between two horizontal capacitor
// plates feels gravity (buoyancy-corrected), Stokes drag, and an electric force qE with
// E = V/d. With the field off the drop falls at a terminal velocity that fixes its
// radius via Stokes' law; with the field on, the balancing voltage gives the charge
//   q = m' g d / V,
// which always comes out an integer multiple of the elementary charge e. SI units.
// Reference: Eisberg and Resnick, Quantum Physics, 2nd ed., Ch. 2.

export const E_CHARGE = 1.602176634e-19;  // C
export const ETA = 1.81e-5;               // air viscosity, Pa s
export const RHO_OIL = 920;               // kg/m^3
export const RHO_AIR = 1.2;               // kg/m^3
export const G = 9.81;                    // m/s^2
export const PLATE_GAP = 5e-3;            // m

// Buoyancy-corrected weight of a drop of radius r.
export function dropWeight(r) { return (4 / 3) * Math.PI * r * r * r * (RHO_OIL - RHO_AIR) * G; }

// Charge of n elementary units.
export function charge(n) { return n * E_CHARGE; }

// Voltage that exactly balances a drop of radius r carrying n elementary charges.
export function balanceVoltage(r, n) { return (dropWeight(r) * PLATE_GAP) / (n * E_CHARGE); }

// Terminal (drag-limited) vertical velocity at applied voltage V, upward positive.
export function terminalVelocity(r, n, V) {
  return (charge(n) * V / PLATE_GAP - dropWeight(r)) / (6 * Math.PI * ETA * r);
}

// Radius recovered from the field-off fall speed (Stokes' law), the first Millikan step.
export function radiusFromFall(vFall) { return Math.sqrt((9 * ETA * Math.abs(vFall)) / (2 * (RHO_OIL - RHO_AIR) * G)); }

// Charge inferred from a measured balancing voltage, q = m' g d / V.
export function chargeFromBalance(r, V) { return (dropWeight(r) * PLATE_GAP) / V; }
