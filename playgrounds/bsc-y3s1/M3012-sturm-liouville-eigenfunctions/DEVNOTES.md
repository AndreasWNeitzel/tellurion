# DEVNOTES - bsc-y3s1/M3012-sturm-liouville-eigenfunctions (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Rework 2026-05-19 (task #302)

User complaints and fixes:

1. "Only shows up to 6 modes despite slider going higher."
   Root cause: `drawModes` had `const M = Math.min(6, N)`, a hard cap.
   Fix: replaced with `drawGallery`, a responsive small-multiples grid
   drawing all N (1..20) cells.

2. "Top plot doesn't seem to be affected in any way."
   Root cause: the only profile was `x(pi-x)`, sine coefficients decay
   ~1/n^3 so the reconstruction was visually converged by N=3.
   Fix: sharp triangular pluck (slow decay) + the new controlling
   variable is the density profile, which reshapes modes and spectrum.

3. "Consider a different approach."
   Old playground only did the trivial constant-coefficient case
   (phi_n = sin n x). Reworked into a genuine variable-density regular
   Sturm-Liouville problem -(T y')' = lambda rho(x) y solved
   numerically. Three linked panels: vibrating string with density made
   visible (line weight + ribbon), eigenvalue ladder vs the n^2
   reference, all-modes gallery.

Numerics:
- FD on n=96 interior nodes. (T/h^2)K y = lambda M y,
  K=tridiag(-1,2,-1), M=diag(rho_i). Symmetrize z=M^{1/2}y ->
  S z = lambda z, S symmetric tridiagonal.
- Cyclic Jacobi (`jacobiEig`), eigenvector accumulation, off-diagonal
  squared-norm stop 1e-24 or 80-sweep cap. Bit-reproducible
  (deterministic invariant asserts identical eigenpairs), goldens
  stable. One-shot solve cached per (density, grid); N change / pluck
  only re-project (O(N n)); no per-frame eigensolve.

Recipe compliance:
- sim.js closed-form exports byte-identical; numerical SL solver
  APPENDED. Old 9 closed-form invariants still pass alongside 7 new
  solver invariants (16/16).
- New real invariants: Sturm oscillation (k-1 interior nodes, all
  profiles incl. discontinuous two-step), weighted orthonormality,
  uniform reduction to k^2, positivity/ordering, clamped-end zeros,
  loading lowers the fundamental, deterministic eigenpairs.
- Share-state added (keys: N, density).

Verification:
- 16/16 invariants. Live full-#stage screenshots at
  uniform/heavy-center/two-step and N=8/18: all N modes shown, live
  readout psi_18 -> 17 nodes (two-step), ribbon + line-weight + ladder
  correct. Gate: 16 invariants, smoke OK, visual 5/5 x3. 60 fps.

Watch-out: two-step is the strongest test (discontinuous coefficient
still gives exactly k-1 nodes, oscillation matrix). Canvas 760x580
(was 500), three panels at 0.40/0.24/0.36 of H.
