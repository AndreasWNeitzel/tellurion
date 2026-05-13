# Mean-field VI on a banana

Fit an axis-aligned Gaussian to a curved banana-shaped target distribution. The canonical failure mode of variational inference: the curved valley cannot be captured by any axis-aligned Gaussian, so VI settles into a compact ellipse at the bend.

What to look for: the orange ellipse shrinks and finds the highest-density region near (0, 0). It never follows the banana's curvature. The ELBO trace climbs over training; the mean-field family simply lacks the expressiveness.

Controls: lr (learning rate), K (Monte Carlo samples), speed. Reset / Single step / Pause / Play.

## Reference

Bishop and Bishop 2024, Deep Learning, Chapter 16; Blei, Kucukelbir, McAuliffe 2017.

## Verification

- Strong invariants: ELBO climbs, mu near (0, 0), sigma bounded, banana topology.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
