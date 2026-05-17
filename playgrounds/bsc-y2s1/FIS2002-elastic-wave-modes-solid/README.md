# Elastic Waves: P and S Modes in a Solid

This playground solves the elastodynamic equation
`rho u_tt = (lambda+mu) grad(div u) + mu lap(u)` for the vector
displacement of a 2D isotropic solid. A source launches two body
waves: a fast compressional P wave at `v_P = sqrt((lambda+2mu)/rho)`
and a slower shear S wave at `v_S = sqrt(mu/rho)`. The medium is
coloured by its divergence (compression), a reference grid shows it
straining, and the red and blue rings are the analytic P and S
wavefronts.

Watch the two rings separate: the P front always leads. The side
panel is the seismogram recorded at a station off the source axis,
where the P arrival is followed by the S arrival a time
`d (1/v_S - 1/v_P)` later, exactly the delay a seismologist uses to
locate an earthquake. Drag the shear modulus toward zero and the S
ring slows and vanishes (a fluid carries no shear waves); raise lambda
and the P ring races ahead. The explosive source makes a pure
compressional pulse, the shear couple a pure shear pulse.

The source selector chooses the excitation; the lambda and mu sliders
set the Lame parameters and hence the two speeds (shown live in the
readout). Reset returns to a point force with lambda=2, mu=1 and Pause
freezes the field.

## Reference

Primary citation: Landau and Lifshitz, *Theory of Elasticity*
(Vol. 7), Sec. 22-24 (`landau-elasticity`).

## Verification

- Strong invariant: measured P and S front speeds match
  `sqrt((lambda+2mu)/rho)` and `sqrt(mu/rho)` within 10%; the
  seismograph P-to-S delay matches `d(1/v_S - 1/v_P)` within 20%.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
