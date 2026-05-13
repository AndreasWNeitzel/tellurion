# Rotation Curve Explorer

A model spiral galaxy decomposed into three axisymmetric mass components: a Hernquist bulge, a Miyamoto-Nagai disk evaluated at z = 0, and an NFW dark-matter halo. Each component contributes a circular-velocity-squared at radius R in closed analytic form; the total rotation curve is the quadrature sum. The playground generates a synthetic "observed" curve at fixed "true" parameters with 4 km/s Gaussian noise; four sliders let the user fit the data by adjusting the masses of all three components plus the NFW concentration.

Look at the live chi-squared: at the true parameters (Reset button), reduced chi^2 sits near 1, indicating a good fit to the noisy data. Crank the halo mass down and the outer rotation curve drops below the data points; crank it up and the curve overshoots. The halo concentration c shifts mass inward (high c) or outward (low c), changing the inner rotation behavior. The disk and bulge dominate inside R = 10 kpc; the halo dominates outside.

Controls: drag the four mass / concentration sliders. Reset returns to the true parameters. Scale lengths (a_b, a_d, b_d, r_s through R_200) are fixed at their true values in v1; the stretch goal opens them up.

## Reference

Primary citation: Binney and Tremaine, "Galactic Dynamics", 2nd ed., Sections 2.2 (Spherical systems) for the Hernquist and NFW profiles and 2.3 (Potential-density pairs for flattened systems) for the Miyamoto-Nagai disk (bib key `binneytremaine2008`, chapter_index verified this session). No observational data set is reproduced; the data are synthetic at a fixed seed.

## Verification

- Strong invariants:
  - Reduced chi^2 < 2.0 at the true parameter values (expected ~ 1, single-seed fluctuation absorbed).
  - Deterministic synthetic data: identical noise draws on repeated runs at seed 0xC0FFEE.
- Medium invariant: asymptotic flatness of the rotation curve in R in [10, 50] kpc (signature of a halo-dominated outer disk).
- Visual gate: SSIM > 0.92 against committed golden frames showing a halo-mass sweep.
- Last verified: see `.verified`.
