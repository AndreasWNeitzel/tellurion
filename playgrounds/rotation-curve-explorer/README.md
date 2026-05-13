# Rotation Curve Explorer

A top-down view of a model spiral galaxy and an inset rotation curve. Stars orbit at $\Omega(R) = v(R) / R$ for the active model. Three rotation-curve models share the same visible matter (Hernquist bulge plus Miyamoto-Nagai disk) but differ in the unseen mass: Keplerian (all visible mass concentrated at the centre), visible only (no halo), and visible plus an NFW dark-matter halo. The synthetic observation set on the inset was drawn from the third model with 6 km/s Gaussian noise.

Watch the highlighted tracer at the solar circle $R = 8$ kpc. Under the DM model it orbits at $\sim 220$ km/s ($\sim 220$ Myr per orbit). Under the Keplerian model it slows to $\sim 120$ km/s. Under the visible-only model it sits at $\sim 200$ km/s, but step out to $R = 25$ kpc and the visible-only curve drops to $\sim 110$ km/s while the data still sit at $\sim 200$ km/s. That gap is the dark-matter problem.

Controls: select a rotation-curve model (radio buttons), pause or resume, reset time to zero.

## Reference

Primary citation: Binney and Tremaine, "Galactic Dynamics", 2nd ed., Sections 2.1 (Spherical systems), 2.2 (Potential theory of axisymmetric systems), 2.3 (Potential-density pairs for flattened systems). Bib key `binneytremaine2008`, chapter_index verified.

## Verification

- Strong invariants:
  - DM model reduced chi^2 < 2 against its own synthetic observations.
  - Keplerian chi^2 > 50x DM chi^2; visible-only chi^2 > 20x DM chi^2.
  - Galaxy tracer radii preserved to better than 1e-9 kpc under any model (circular orbits).
  - DM model v(R) flat to within 35 km/s over [8, 28] kpc.
- Medium invariant: all three models agree within 30 percent at R = 4 kpc.
- Visual gate: SSIM > 0.92 against committed golden frames showing a time sweep at the DM model.
- Last verified: see `.verified`.
