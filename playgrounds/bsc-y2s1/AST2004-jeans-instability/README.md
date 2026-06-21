# Jeans instability

A self-gravitating gas cloud is a tug of war between gravity (which collapses it)
and pressure (which smooths clumps into sound waves). For a plane-wave density
ripple the two balance through the dispersion relation omega^2 = c_s^2 k^2 - 4 pi
G rho. Long-wavelength ripples (small k) have omega^2 < 0 and grow exponentially,
the gravitational collapse that seeds star formation; short ones oscillate as
sound waves. The crossover is the Jeans length lambda_J = sqrt(pi c_s^2 / G rho).

The scene is a 2D patch of the gas cloud, drawn as glowing gas tracers that
follow a Zel'dovich displacement set by the mode's growth rate. Set a wavelength
above the Jeans length and the cloud fragments and drains into dense orange
cores (collapse, the start of star formation); set it below and the perturbation
just sloshes and the cloud stays diffuse and blue. A banner and the scene colour
make the regime unmistakable. The lower plot is the growth rate against
wavelength, negative (oscillation) on the short side, rising to a free-fall
plateau on the long side, and crossing zero exactly at the Jeans length. A
colder or denser cloud shrinks the Jeans length, so smaller patches collapse
(for T = 10 K, n = 1e3 cm^-3 the readout shows lambda_J ~ 1.5 pc, M_J ~ 50 solar
masses).

Use the temperature, density, and wavelength sliders. Pause freezes the scene
and Reset restores the cold-cloud collapse.

## Reference

Primary citation: Carroll and Ostlie, *An Introduction to Modern Astrophysics*,
2nd ed., Ch. 12.

## Verification

- Strong invariants: omega^2 = 0 at k = k_J; lambda_J proportional to c_s /
  sqrt(rho); cold-cloud Jeans length and mass in the expected ranges.
- Live readout: the Jeans criterion (omega^2 < 0 iff lambda > lambda_J), checked
  each frame in the rail.
