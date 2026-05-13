# GP kernel zoo

A Gaussian Process is a distribution over functions. Pick a kernel, see five sample function draws. Add some observations (click the bottom panel) and see the posterior collapse around them.

What to look for: RBF is very smooth; Matern 3/2 is rougher; periodic shows exact period-1.5 repetition; linear is linear regression. Posterior std collapses at observation points and matches prior std far from observations.

Controls: kernel dropdown, length scale, amplitude, observation noise. Buttons clear observations and resample the prior.

## Reference

Murphy 2022, PML Vol. 1, Ch. 17; MacKay 2003, Information Theory Ch. 45.

## Verification

- Strong invariants: Cholesky factors, zero-mean prior, exact interpolation with low noise, posterior std <= prior std, k(x, x) = sigma_f^2.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
