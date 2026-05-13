# E x B drift and the cycloid

A charged particle (q = m = 1) in crossed uniform fields E (right, yellow)
and B (out of page, dots). Starting from rest, the particle accelerates
under E until v x B curves it back; the result is a cycloid trajectory
with amplitude E / B^2, drifting uniformly in the E x B / B^2 direction.
The drift speed E / B is independent of charge and mass, so positive
and negative charges drift the same way.

Look for: the warm-orange particle traces looping cycloid arcs. The cyan
arrow attached to the particle is the analytic drift vector v_d. Larger
E gives faster drift and bigger loops. Larger B tightens the loops and
shortens the cyclotron period but does not change the drift direction
(only its magnitude through E / B).

Use the E and B sliders to set the fields. Speed controls animation rate.
Reset returns the particle to the origin.

## Reference

- Jackson, Classical Electrodynamics 3e Ch. 12.

## Verification

- Strong invariant: drift formula E x B / B^2 exact; from-rest trajectory
  reaches y = -E/B * T after one cyclotron period; numerical-vs-analytic
  agreement within 1e-3 at t = 1.
- Visual gate: SSIM > 0.92 across 5 frames.
- Last verified: see `.verified`.
