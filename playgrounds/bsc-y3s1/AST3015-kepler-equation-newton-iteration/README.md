# Kepler equation Newton iteration

The transcendental Kepler equation $M = E - e \sin E$ has no closed-form inverse. Newton's method $E_{n+1} = E_n - (E_n - e \sin E_n - M) / (1 - e \cos E_n)$ converges quadratically: each iteration roughly squares the remaining error. The right-panel log-scale dot trail makes this visceral: drops of 2, then 4, then 8 dex per step.

Look for the slowing planet at aphelion (Kepler's second law in action), and the iteration count growing from 4-5 at $e = 0.5$ to 10+ at $e = 0.99$.

Sliders set eccentricity and animation speed.

## Reference

Primary citation: Carroll-Ostlie, *An Introduction to Modern Astrophysics*, 2e, Ch. 2 (`carroll-ostlie`).

## Verification

- Strong invariants: residual $M - E + e \sin E$ within $10^{-10}$ for $e \le 0.99$; orbit closure to $10^{-10}$ over one period.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
