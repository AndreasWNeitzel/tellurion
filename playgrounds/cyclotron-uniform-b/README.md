# Cyclotron motion in a uniform magnetic field

A charged particle (q = m = 1) in a uniform out-of-page magnetic field B
moves in a circle of radius r = m v / (q B) at angular frequency
omega_c = q B / m. The Lorentz force F = q v x B is perpendicular to v,
so it does no work and the speed stays constant. The motion is a perfect
circle no matter the starting speed; what changes with v is the radius.

Look for: the warm-orange particle traces along the cyan dashed analytic
circle. Increase B and the circle shrinks, but the orbital period gets
shorter too: T = 2 pi m / (q B). Increase v at fixed B and the circle
grows, but the period stays the same. The velocity arrow always points
tangent to the circle.

Use B and |v| sliders to set the field and initial speed. Speed controls
animation rate. Reset returns to the initial state.

## Reference

- Jackson, Classical Electrodynamics 3e Ch. 12.

## Verification

- Strong invariant: speed conservation to 1e-5; trajectory on analytic
  circle to 1e-3; period closure under RK4 to 1e-2.
- Visual gate: SSIM > 0.92 across 5 frames following one full period.
- Last verified: see `.verified`.
