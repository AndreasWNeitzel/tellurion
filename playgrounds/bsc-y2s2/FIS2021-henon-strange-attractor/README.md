# Henon Strange Attractor

The Henon 1976 map x' = 1 - a x^2 + y, y' = b x. At the canonical (a=1.4, b=0.3) the iterates settle onto a strange attractor with maximum Lyapunov exponent ~ 0.4192 and box-counting dimension ~ 1.26. Tune a and b to walk through the period-doubling cascade and the Henon-Smale horseshoe regime.

Controls: two parameter sliders, pause/play, reset.

## Reference

Strogatz, "Nonlinear Dynamics and Chaos", 2nd ed., Section 12.2; Ott, "Chaos in Dynamical Systems", 2nd ed., Section 3.1. Both verified in chapter_index.

## Verification

- Strong invariants: max-Lyapunov in [0.35, 0.50] from tangent-vector renormalization; trail bounded inside the canonical bounding box; b=0 collapses to the 1D logistic-like map; a=0,b=0 lands at fixed point (1, 0); bit-identical reproducibility.
- Visual gate: SSIM > 0.92 across 5 frames at the canonical parameters.
