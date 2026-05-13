# BTW sandpile and self-organized criticality

The Bak-Tang-Wiesenfeld sandpile: drop grains at random, sites with
height >= 4 topple by sending one grain to each of four neighbors,
cascading. Grains at the boundary fall off. The system organizes itself
into a critical state with power-law avalanche-size distribution
P(s) ~ s^(-1.21). This was the original example of self-organized
criticality.

Look for: at first the lattice fills up uniformly, with small
avalanches. After many drops large cascades start appearing
intermittently. The right panel shows the avalanche-size histogram on
log-log scale with the s^(-1.21) reference line. After 10k+ drops the
histogram should align with the reference.

Use speed for drops per frame. Reset clears the lattice.

## Reference

- Bak, Tang, Wiesenfeld 1987 PRL.
- Bak 1996, How Nature Works (`bak1996`).

## Verification

- Strong invariant: heights bounded to [0, 3]; non-negative topples;
  power-law tail emerges.
- Visual gate: SSIM > 0.92 across 5 frames showing thermalization.
- Last verified: see `.verified`.
