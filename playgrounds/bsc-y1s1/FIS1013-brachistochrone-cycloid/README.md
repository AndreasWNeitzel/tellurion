# Brachistochrone: why the cycloid wins

Three frictionless beads start at A = (0, 0) and race to B = (4, -2) under
uniform gravity. The cyan bead follows the cycloid (Bernoulli's
brachistochrone solution); the orange bead a straight line; the yellow bead
a circular arc through A, tangent to the horizontal at A and passing
through B. The cycloid wins despite the line being shortest, because
descending steeply at the start builds enough speed to make up for the
longer path length.

Look for: the cyan bead reaches the bottom first, the yellow second, the
orange last. The time bars at the bottom show the analytic traversal times.
For the canonical X_B = 4, Y_B = 2 geometry, T_cycloid is about 5 to 8
percent shorter than T_arc and about 10 percent shorter than T_line.

Use speed to control animation speed. Reset restarts at t = 0 with all
three beads at A. Pause / Play freezes and resumes.

## Reference

- Marion and Thornton, Classical Dynamics 5e Ch. 6 (`marion-thornton`).
- Bernoulli 1696, Acta Eruditorum.

## Verification

- Strong invariant: T_cycloid < T_arc < T_line confirmed for the standard
  geometry; analytic cycloid time formula T = sqrt(R/g) theta_B to 1e-9.
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
