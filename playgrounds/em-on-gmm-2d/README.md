# EM on a 2D Gaussian mixture

A 600-point synthetic 2D dataset drawn from 3 Gaussian clusters with known parameters. EM tries to recover those parameters. Faint dashed ellipses show the truth; the colored ellipses are the current estimate.

What to look for: hit Step a few times and watch the colored ellipses settle onto the data. The log-likelihood trace at the bottom is monotone non-decreasing (EM is guaranteed to never get worse). Try K bigger or smaller than the true number to see how the algorithm splits or merges clusters. Bad init seeds can land in a local optimum; reseed with the second slider.

Controls: K is the number of components, init seed picks the K-means style starting points. Step / Run 20 advance the algorithm.

## Reference

Bishop 2006, PRML, Section 9.2; Murphy 2022, Probabilistic Machine Learning Vol. 1, Section 17.2; Dempster, Laird, Rubin 1977.

## Verification

- Strong invariants: log-likelihood monotone, gamma normalization, mean recovery within 0.6, weights sum to 1, det Sigma > 0.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
