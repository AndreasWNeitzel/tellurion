# Catastrophic cancellation in floating point

For small $x$, computing $1 - \cos(x)$ as `1 - Math.cos(x)` is the textbook example of catastrophic cancellation: $\cos(x)$ rounds to within machine epsilon of $1$, and the subtraction loses almost all the significant digits. The algebraically identical $2 \sin^2(x/2)$ avoids the near-equal subtraction and stays accurate down to the smallest positive double.

Look for the curves on the log-log plot: the orange (naive) line climbs from machine epsilon at $x \sim 1$ up to 100 percent relative error at $x \sim 10^{-15}$; the cyan (stable) line stays at machine epsilon across the full range. The dashed horizontal line is the machine epsilon floor.

One slider sets $\log_{10}(x)$ for the dashed vertical marker; the readout reports the relative error of both formulae against a truncated Taylor reference.

## Reference

Primary citation: Newman, *Computational Physics*, Ch. 4 (`newman2013`).

## Verification

- Strong invariants: naive rel err $> 10^{-3}$ at $x = 10^{-8}$; stable stays at machine epsilon throughout.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
