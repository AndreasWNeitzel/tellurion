# Mutual information of a bivariate Gaussian

The simplest non-trivial mutual-information example. Two correlated Gaussian variables X and Y; the joint density is a 2D Gaussian shaped by the covariance matrix. Mutual information I(X; Y) measures how much knowing X tells you about Y; for a Gaussian it has the closed form -0.5 ln(1 - rho^2).

What to look for: at rho = 0 the heatmap is upright and circular; the marginals are independent. As rho grows the heatmap tilts along the diagonal, the marginal shapes stay the same, and I rises. Pushing rho near +/- 1 collapses the joint onto a line and I diverges. We display both the closed-form I and the numerical integral on the same grid; they agree to a few percent.

Controls: rho is the correlation, sigma_x and sigma_y are the marginal widths. Reset returns to defaults; "rho = 0" snaps to the independent case.

## Reference

MacKay 2003, Information Theory, Inference, and Learning Algorithms, Chapter 2; Cover and Thomas 2006, Elements of Information Theory 2e, Eq. 8.85.

## Verification

- Strong invariants: I monotone in |rho|, numeric I within 3 percent of analytic, marginals normalize to 1, marginal entropy = 0.5 ln(2 pi e sigma^2).
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
