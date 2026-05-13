# Drake equation explorer

$N = R_\star \cdot f_p \cdot n_e \cdot f_l \cdot f_i \cdot f_c \cdot L$ with sliders on the four most uncertain factors and a 2000-trial Monte Carlo that draws each factor log-uniformly within $\pm 0.5$ dex of the slider center. The histogram shows $\log_{10}N$; the dashed white line is the point estimate; the accent line is the MC median.

Look for the gap between the optimistic $N \sim 30$ at the Carroll-Ostlie defaults and pessimistic values where $N < 1$. This gap is the Fermi paradox.

Four sliders.

## Reference

Primary citation: Carroll-Ostlie, *An Introduction to Modern Astrophysics*, 2e, Ch. 7 (`carroll-ostlie`).

## Verification

- Strong invariants: $N = 30$ exact at Carroll-Ostlie defaults; doubling $L$ doubles $N$; Monte Carlo deterministic with seed 0xC0FFEE.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
