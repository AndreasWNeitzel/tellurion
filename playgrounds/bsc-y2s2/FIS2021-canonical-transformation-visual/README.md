# Canonical Transformations

Hamiltonian mechanics is invariant under a special class of coordinate
changes: the canonical ones, which keep the structure of phase space
intact. The test is beautifully simple: the Poisson bracket {Q,P}
must equal one, which is the same as saying the transformation
preserves area in phase space (Liouville's theorem). The left panel
is a Cartesian grid and a blob in (q,p); the right is their image,
which you can morph continuously from the identity to the full map
and watch the whole grid deform, with the original underlaid faintly,
the map equation written out, and a colour-coded canonical / not
status.

What to look for: drag morph t (or press Play) and watch the grid
bend. The harmonic scaling turns the energy circle into an ellipse of
the same area, the geometric heart of action-angle variables; the
rotation spins the grid rigidly; the squeeze stretches it into a thin
sliver yet the area readout never budges and {Q,P} stays exactly one,
a canonical map that is not a symmetry. Through every one of those
the area holds the entire way along the morph, because each
intermediate is itself canonical. Then pick p-doubling: as you scrub
t the grid stretches and the area grows smoothly from one to two, the
status flips to red, and Hamilton's equations would not survive it.

Controls: the map selector chooses the transformation; the parameter
slider drives its free parameter (scale, angle, or squeeze factor);
morph t deforms from the identity to the full map and Play animates
it; energy sets the blob size; Reset restores the harmonic scaling.

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
