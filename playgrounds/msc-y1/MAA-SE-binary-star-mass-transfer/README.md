# Close Binary: Roche Lobes and Conservative Mass Transfer

This is the geometry that governs interacting binary stars. In the frame that corotates with the orbit, gravity plus the centrifugal force defines an effective potential whose critical surface is a figure-eight: each loop is a star's Roche lobe, and the two meet at the inner Lagrange point L1. A star that swells to fill its lobe spills gas through L1 onto its companion. The Eggleton formula gives the lobe radius from the mass ratio alone, and when the transfer is conservative (nothing leaves the system) the orbit's response is fixed entirely by how the mass ratio changes.

What to look for: transfer from the more massive star shrinks the orbit, which makes the donor overfill its lobe even more, a runaway that ends in a common envelope; transfer from the less massive star widens the orbit and is stable. Drag the transferred-mass slider and watch the operating point in Panel B slide down to the separation minimum exactly when the mass ratio reaches one, then climb back up. Push the donor past fill = 1 and the L1 stream and accretion disk switch on; change the masses and the stability panel flips between stable transfer and common envelope.

Controls: the donor and accretor mass sliders set the mass ratio and therefore the lobe sizes and the stability; the fill slider moves the donor between detached and Roche-lobe overflow; the transferred-mass slider evolves the orbit conservatively through the q = 1 turning point. Reset restores the defaults; Pause freezes the stream animation, which is illustration only.

## Reference

Primary citation: Eggleton 1983 (ApJ 268, 368); Frank, King and Raine, Accretion Power in Astrophysics; Hilditch, An Introduction to Close Binary Stars.

## Verification

- Strong invariant: Eggleton r_L within 0.5 percent of the reference; total mass and orbital angular momentum conserved under conservative transfer (J within 1 percent).
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
