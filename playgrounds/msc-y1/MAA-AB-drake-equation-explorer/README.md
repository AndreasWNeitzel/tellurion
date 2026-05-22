# Drake equation explorer

The Drake equation estimates how many communicating civilizations exist in the Galaxy right now. It multiplies a star-formation rate by a chain of probabilities (planets, habitability, intelligence, technology, longevity). Four sliders control the four most uncertain factors; the other factors are held at their best-guess astronomical values. Adjust the sliders and watch the estimated number $N$ sweep through many orders of magnitude.

The histogram shows the distribution of $N$ from a 2000-trial Monte Carlo. Each trial draws each factor log-uniformly within a range (plus or minus 0.5 dex) around the slider's central value. The dashed line marks the point estimate at your slider settings; the accent-colored line shows the median of the Monte Carlo samples. The spread, not the headline number, is the real lesson.

The Fermi paradox appears as the large gap between optimistic ($N \sim 30$ civilizations at the default settings) and the pessimistic scenarios (where $N < 1$, meaning we might be alone). Explore this gap by varying the civilization lifetime $L$ or the fraction where intelligence arises $f_i$.

## Reference

Primary citation: Carroll-Ostlie, *An Introduction to Modern Astrophysics*, 2e, Ch. 7 (`carroll-ostlie`).

## Verification

- Strong invariants: $N = 30$ exact at Carroll-Ostlie defaults; doubling $L$ doubles $N$; Monte Carlo deterministic with seed 0xC0FFEE.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
