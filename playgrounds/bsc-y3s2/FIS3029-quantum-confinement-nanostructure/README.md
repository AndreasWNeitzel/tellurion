# Quantum Confinement in Nanostructures

Confine a particle in an infinite square well of side `L` and its
energy is quantised, `E_n = hbar^2 pi^2 n^2 / (2 m L^2)`. The levels
go as `n^2` (so `E_2 - E_1 = 3 E_1`) and the ground-state confinement
energy scales as `1/L^2`: it grows as the box shrinks and vanishes in
the bulk limit. Which directions are confined sets the dimensionality,
and the density of states changes shape accordingly: `E^1/2` for the
3D bulk, a staircase for the 2D quantum well, `(E - E_c)^-1/2` van
Hove spikes for the 1D wire, discrete delta peaks for the 0D dot. The
physics is the gate-tested closed-form `sim.js`.

What to look for: the left panel is the well with its levels and the
wavefunctions `psi_n(x) = sin(n pi x / L)`; the readout shows
`E_2 - E_1` is exactly `3.00 E_1`. Slide the box size down and every
level flies up (the gap grows as `1/L^2`); slide it up and the levels
collapse toward the continuum. Switch the dimensionality and the
right-hand density of states changes qualitatively, the single most
instructive control here: a smooth `sqrt(E)` curve for the bulk, a
staircase for the well, diverging spikes for the wire, a discrete
ladder for the dot, with the optical-absorption onset (the effective
gap) marked.

Controls: the dimensionality selector, the box-size slider, the
effective-mass slider, Reset and Pause. Copy URL shares the state.

## Reference

Primary citations: Griffiths, *Introduction to Quantum Mechanics*
(`griffiths-qm`), for the infinite square well; Davies, *The Physics
of Low-Dimensional Semiconductors*, CUP 1998 (`davies1998`), for the
confinement energy and the dimensional density of states; Ashcroft
and Mermin, *Solid State Physics* (`ashcroft-mermin`), for the
free-electron `sqrt(E)` DOS.

## Verification

- Strong invariants (offline, `sim.js`): the `n^2` spectrum with
  `E_2 - E_1 = 3 E_1` and `E_1 = pi^2/(2 m L^2)` exactly; the
  `1/L^2` scaling and bulk limit; the 3D `sqrt(E)` DOS; the 2D
  staircase; the 1D van Hove divergence; the absorption onset.
- Visual gate: SSIM > 0.92 against committed golden frames of the
  deterministic dot sweep.
- Last verified: see `.verified`.
