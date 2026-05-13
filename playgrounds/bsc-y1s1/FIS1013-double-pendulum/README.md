# Double Pendulum

Two bobs on rigid massless rods swing under gravity, with the lower bob pinned to the end of the upper rod. The Lagrangian gives coupled velocity-dependent equations of motion. Below a low-energy cap the trajectory is quasi-periodic; above it the system becomes chaotic. Total mechanical energy is conserved by the integrator to better than one part in a thousand over the default initial condition.

Look for the trail behind the lower bob. At the default initial condition (theta1 = 0.5 rad, theta2 = -0.3 rad, both at rest) the trail forms a recognizable repeating arc, characteristic of motion on a 2D invariant torus. Drag the lower bob outward (raising the total energy toward the cap E_cap = 0.85*((m1 + m2)*g*l1 - m2*g*l2)) and the trail breaks up: that is the entry into the chaotic regime, where the trajectory wanders without retracing. The live |dE/E| readout reports how well the integrator is conserving energy; if you drag past the energy cap, the readout turns warm-accent to signal that the invariant gate has been forfeited.

Controls: drag either bob on the canvas to set its initial angle (the dragged angle is reached at rest; velocities zero out). Double-click anywhere on the canvas to zero out the current velocities without changing position. Use the m1, m2, l1, l2 sliders to change the masses and rod lengths in SI units. Reset returns to the default IC; Play/Pause toggles time integration.

## Reference

Primary citation: Newman, "Computational Physics", 2013, Exercise 8.15 "The double pendulum" (bib key `newman2013`; the EOM and the small-amplitude normal modes derive directly from this exercise). Secondary: Strogatz, "Nonlinear Dynamics and Chaos", 2nd ed., Sections 6.3 (Fixed Points and Linearization), 6.5 (Conservative Systems), and 6.7 (Pendulum) (bib key `strogatz2015`).

## Verification

- Strong invariants:
  - Total energy conserved to |dE/E| < 1e-3 over 10^4 steps at the default IC (m1 = m2 = 1 kg, l1 = l2 = 1 m, g = 9.81 m/s^2).
  - Small-amplitude eigenfrequencies match the analytic linearized values omega_+/- = sqrt(g*(2 +/- sqrt(2))) within 1 percent.
  - Single-mass limit (m2 -> 0) recovers the simple-pendulum period T = 2*pi*sqrt(l1/g) within 0.5 percent.
- Medium invariant: angular momentum L_z is not conserved (gravity breaks SO(2)); the test asserts a deviation of at least 0.1 kg*m^2/s within 1000 steps from the default IC.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
