// sim.js
// Eddy-current braking: a conducting plate falling through a localised magnetic
// field. Where the field varies, the flux through the plate changes as it moves,
// driving circulating (eddy) currents whose own force opposes the motion
// (Lenz's law). Modelling the plate as a conducting loop of effective area A and
// resistance R in the field B(y):
//   flux Phi = A B(y), EMF = -A B'(y) v, eddy current I = EMF / R,
//   retarding force F = I A B'(y) = -(A^2 / R) B'(y)^2 v.
// So the drag is proportional to the speed and to the SQUARE of the field
// gradient, and inversely to the resistance. A solid plate has a low resistance
// (strong braking); a slotted plate breaks the current loops, raising R and
// almost removing the brake, which is why the slotted plate falls through fast.
//
// Equation of motion (unit mass): dv/dt = g - kappa B'(y)^2 v, kappa = A^2 / R.
//
// Reference: Griffiths, Introduction to Electrodynamics, 5e, Sec. 7.1-7.2;
// Halliday, Resnick and Walker, Fundamentals of Physics, Ch. 30 (eddy currents).

export const G = 9.8;
export const Y_MAG = 2.0;   // field-band centre (y increases downward)
export const SIGMA_B = 0.42;  // field-band half width

export function fieldB(y, B0) { return B0 * Math.exp(-((y - Y_MAG) ** 2) / (2 * SIGMA_B * SIGMA_B)); }
export function fieldGrad(y, B0) { return -B0 * (y - Y_MAG) / (SIGMA_B * SIGMA_B) * Math.exp(-((y - Y_MAG) ** 2) / (2 * SIGMA_B * SIGMA_B)); }

export function createPlate(kappa, y0 = 0) { return { y: y0, v: 0, kappa, heat: 0 }; }

// Semi-implicit step (backward Euler on the linear drag term), unconditionally
// stable: v_{n+1} = (v_n + g dt) / (1 + drag dt), drag = kappa B'(y)^2.
export function stepPlate(p, dt, B0) {
  const Bp = fieldGrad(p.y, B0);
  const drag = p.kappa * Bp * Bp;
  const vNew = (p.v + G * dt) / (1 + drag * dt);
  p.heat += drag * vNew * vNew * dt;        // power dissipated = drag * v^2
  p.v = vNew; p.y += p.v * dt;
  return p;
}

// Instantaneous eddy current magnitude (units of A B' v / R, with A=1): the
// brightness of the visualised loop. kappa carries A^2/R, so |I| ~ sqrt(kappa) |B' v|.
export function eddyCurrent(p, B0) { return Math.sqrt(Math.max(p.kappa, 0)) * Math.abs(fieldGrad(p.y, B0) * p.v); }
export function dragForce(p, B0) { const Bp = fieldGrad(p.y, B0); return p.kappa * Bp * Bp * p.v; }
