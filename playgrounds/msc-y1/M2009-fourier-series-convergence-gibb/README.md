# Fourier Series: Convergence, Epicycles and the Gibbs Overshoot

A Fourier series is the idea that any repeating shape, however jagged, is secretly a sum of smooth sine and cosine waves. Pick a square, sawtooth or triangle wave here and slide the number of terms up: with just a few sines the sum is lumpy, with many it hugs the target closely. The same sum is also drawn a second way, as a chain of little rotating arrows (epicycles) whose tip retraces the curve, the same trick that drew planetary orbits before Kepler.

What to look for: near a sharp jump (the square and the sawtooth have them) the sum always shoots past the true value by about 9 percent of the jump, and adding more terms does not shrink that overshoot, it only squeezes it into a thinner spike right at the edge. That stubborn 9 percent is the Gibbs phenomenon, and the bottom-right panel shows it as a flat orange line that refuses to fall to zero, while the blue Parseval-energy line climbs smoothly to one (all the function's energy has been captured by the coefficients). The triangle wave has no jump, so it has no overshoot and the sum matches it almost immediately.

Controls: the target selector chooses the wave (and whether it even has a jump). The terms slider sets how many sines and cosines are added; watch the epicycle chain grow and the fit improve. Reset returns to the square wave with eight terms; Pause freezes the rotating vectors.

## Reference

Primary citation: Arfken, Weber and Harris, Mathematical Methods for Physicists; Gibbs, Nature 59, 606 (1899).

## Verification

- Strong invariant: Parseval energy converges to the mean square within 0.1 percent; the Gibbs overshoot stays within 1 percent of 8.95 percent of the jump and the epicycle tip equals the partial sum.
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
