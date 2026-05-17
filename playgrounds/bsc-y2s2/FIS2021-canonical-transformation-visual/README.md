# Canonical Transformations

Hamiltonian mechanics is invariant under a special class of coordinate
changes: the canonical ones, which keep the structure of phase space
intact. The test is beautifully simple: the Poisson bracket {Q,P}
must equal one, which is the same as saying the transformation
preserves area in phase space (Liouville's theorem). This playground
shows a blob of phase points on the left and its image under a chosen
map on the right, with both numbers on screen.

What to look for: the harmonic scaling turns the energy ellipse into
a perfect circle without changing its area, the geometric heart of
action-angle variables. The rotation spins the blob rigidly. The
squeeze is the striking one: it stretches the blob into a thin sliver
yet the area readout does not budge and {Q,P} stays exactly one,
that is a canonical map that is not a symmetry. Then pick the
p-doubling map: the blob balloons to twice the area and the readouts
honestly report {Q,P} = 2 and ratio = 2, this map is not canonical
and Hamilton's equations would not survive it.

Controls: the map selector chooses the transformation; the parameter
slider drives its free parameter (scale, angle, or squeeze factor);
energy sets the blob size; Reset restores the harmonic scaling.

## Reference

Primary citation: Goldstein, Poole and Safko, *Classical Mechanics*
(3rd ed.), Ch. 9 (`goldstein-mech`); Landau and Lifshitz,
*Mechanics* (3rd ed.), Sec. 45 (`landau-mechanics`).

## Verification

- Strong invariant: the analytic Poisson bracket is exactly 1 for
  every canonical map and 2 for the p-doubling contrast; the
  phase-space area is preserved by the canonical maps and doubled by
  the non-canonical one; the harmonic scaling maps the ellipse to a
  circle of the same area; and the linear maps satisfy M^T J M = J.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
