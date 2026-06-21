# Gaia parallaxes: distance, bias, and extinction

A parallax is the tiny angular wobble of a nearby star as the Earth circles the Sun, and it gives the distance through $d = 1/\varpi$. The trouble is that the measured parallax is noisy, and inverting a noisy number is treacherous: $1/\varpi$ is nonlinear, so the distance you get is biased and skewed once the fractional error $f = \sigma_\varpi/\varpi$ stops being tiny, and the noise can even drive the measured parallax negative, where the inversion is meaningless. The cure, which is routine in Galactic archaeology with Gaia, is to treat the distance as a Bayesian inference: combine the Gaussian parallax likelihood with a distance prior to get a proper posterior. The top panel runs a live Monte Carlo of the naive estimator, drawing parallaxes and inverting them, against the analytic posterior; the middle panel turns the distance into an absolute magnitude, where dust extinction adds a second blur; and the bottom panel shows exactly when the bias starts to bite.

Raise the fractional error and the Monte Carlo histogram of $1/\varpi$ grows a long tail toward large distances while the naive distance (red) pulls away from the posterior median (green): the inversion bias made visible. Toggle the prior and watch the difference, with a flat prior the posterior tail runs away at high error, while the exponentially-decreasing space-density prior of Bailer-Jones (the one Gaia distance catalogues use) tames it. The bottom panel quantifies the rule of thumb: below about 20 percent fractional error you can almost invert safely, above it the correction climbs quickly. Step through the real Gaia stars and, in the middle panel, see that ignoring the extinction $A_G$ (gold dashed) makes a star look fainter than it truly is, a systematic that propagates straight into its place on the HR diagram.

The parallax and error sliders set a hypothetical measurement, the prior controls choose the prior and its length scale, and the star selector loads real Gaia DR3 measurements. Pause freezes the Monte Carlo and Reset returns to the first star.

## Reference

Bailer-Jones 2015, PASP 127, 994 (the EDSD prior); Luri et al. 2018, A&A 616, A9 (using Gaia parallaxes); Gaia Collaboration 2023, A&A 674, A1 (Gaia DR3).

## Verification

- Strong invariants: the posterior integrates to one; the 68 percent credible interval brackets the median; the EDSD posterior applies a non-trivial correction to the naive 1/parallax at large fractional error. Every example star is a real Gaia measurement, with absent values left null rather than imputed.
- Visual gate: SSIM against committed golden frames at both folds.
