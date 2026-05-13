# Bayesian Coin Update

Conjugate Beta-Binomial inference for the bias theta of an unfair coin. Prior Beta(alpha0, beta0); k heads in n flips; posterior Beta(alpha0 + k, beta0 + n - k). The plot overlays prior, normalized likelihood, and posterior, with a shaded 95 percent credible interval around the posterior mean.

Adjust alpha0, beta0, k, n to see how prior strength and observed data combine. Press "Flip 5 (random)" to simulate five additional flips at the true bias 0.7 and watch the posterior concentrate.

## Reference

Gelman, Carlin, Stern, Dunson, Vehtari, Rubin, "Bayesian Data Analysis", 3rd ed., 2013, Section 2.2 (Beta-binomial conjugate analysis); Murphy, "Probabilistic Machine Learning: An Introduction", 2022, Section 11.2. Both verified in chapter_index.

## Verification

- Posterior parameters match a0+k and b0+n-k exactly.
- Beta(1,1) is uniform with pdf = 1 everywhere.
- Mean and variance match the conjugate formulae.
- Posterior variance shrinks roughly as 1/n with more data.
- The 95 percent credible interval contains the posterior mean.
