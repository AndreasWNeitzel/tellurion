# 2D site percolation

Drop dots independently at each cell of a square grid with probability p; ask whether they connect from top to bottom. As p rises past 0.5927 a single giant cluster suddenly appears that spans the lattice.

What to look for: at p = 0.4 just a handful of small clusters; at p = p_c a fractal cluster structure; at p = 0.7 one continent and thin strands. The yellow cells are the largest cluster; the "spans" readout flips from "no" to "yes" near p_c.

Controls: p (occupation probability), L (lattice size). Resample rerolls the random occupations.

## Reference

Stauffer and Aharony 1994, Chapter 2; Newman and Ziff 2000, Phys. Rev. Lett. 85, 4104.

## Verification

- Strong invariants: trivial limits, no spanning below p_c, spanning above, monotone P_inf, p_c value.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
