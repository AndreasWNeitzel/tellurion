# Arnold Cat Map

Arnold's cat map on the unit torus: x' = (2x + y) mod 1, y' = (x + y) mod 1. The map is area-preserving and uniformly hyperbolic, with eigenvalues (3 +/- sqrt 5) / 2 giving maximum Lyapunov exponent log((3 + sqrt 5) / 2) = 0.9624. On an N x N pixel grid the dynamics is finite and exactly periodic: for N = 64 the period is 48 iterations. Start with a recognizable cat-silhouette pattern and watch the map shred it into apparent noise, then return it exactly at iter = T.

Controls: grid size N, iteration count, reset, step, play.

## Reference

Ott, "Chaos in Dynamical Systems", 2nd ed., 2002, Section 2.4 (Topological conjugacy and symbolic dynamics). Verified in chapter_index.

## Verification

- Area-preserving: 100 random points map back into [0, 1) x [0, 1).
- Lyapunov exponent equals log((3 + sqrt 5) / 2) = 0.9624 to 1e-12.
- Recurrence period: 48 for N = 64, 12 for N = 16 (textbook).
- After T iterations the grid returns to its initial state pixel-exact.
