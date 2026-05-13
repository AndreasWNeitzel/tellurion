# Lyapunov Spectrum

The Henon map is a 2D quadratic recurrence x_{n+1} = 1 - a x_n^2 + y_n, y_{n+1} = b x_n. At the canonical parameters (a, b) = (1.4, 0.3) it produces a strange attractor with two Lyapunov exponents whose values witness the orbit's expansion in one direction (lambda_1 positive, around 0.42) and contraction in the other (lambda_2 negative, around -1.62). The Benettin QR algorithm computes both exponents by tracking an orthonormal 2x2 frame tangent to the orbit and accumulating log magnitudes after re-orthonormalization at every step.

Look for the banana-shaped attractor on the left at the canonical point. As you drag the (a, b) handle on the right panel the attractor morphs continuously, lambda_1 grows or shrinks, and the trace lambda_1 + lambda_2 stays pinned to ln|b| (the Benettin invariant). Drag toward smaller a or smaller b and the attractor becomes a thin loop or fragmented set; drag to a > ~1.5 with small b and the orbit escapes to infinity, which the playground flags as unbounded.

Controls: drag inside the parameter panel (top right) to set (a, b). Reset returns to the canonical (1.4, 0.3). Play/Pause is present for consistency with the other playgrounds but the dynamics are computed in one synchronous batch per parameter change, so pausing only freezes future recomputation.

## Reference

Primary citations: Strogatz, "Nonlinear Dynamics and Chaos", 2nd ed., Section 12.2 "Henon Map" (bib key `strogatz2015`). The Lyapunov-exponent definition is in Section 10.5 "Liapunov Exponent". The Benettin QR algorithm for computing the full spectrum: Benettin, Galgani, Giorgilli, Strelcyn, "Lyapunov Characteristic Exponents for Smooth Dynamical Systems and for Hamiltonian Systems; A Method for Computing All of Them. Part 1: Theory", Meccanica 15, 9-20 (1980), bib key `benettin1980`.

## Verification

- Strong invariants:
  - Trace identity lambda_1 + lambda_2 = ln|b| to within 1e-10 (machine precision over 10^5 iterations) for all (a, b) producing a bounded orbit.
  - At canonical (a=1.4, b=0.3), lambda_1 within 2 percent of 0.42.
- Medium invariant: lambda_2 < 0 across the valid parameter region (the y-direction is contracting).
- Visual gate: SSIM > 0.92 against committed golden frames at fixed (a, b) sweep.
- Last verified: see `.verified`.
