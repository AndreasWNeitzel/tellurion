# REVIEW - 1d-tdse-scattering-comparator

## Verdict
CLEAN (prior verdict wrong)

## Defect
None. The prior REVIEW.md claimed "MISSING READOUT" but playground.js lines 103-125 render a live monospace readout showing norm, R, T, time, steps, V_0, k_0, and barrier kind directly onto the canvas.

## Physics verification
Crank-Nicolson time-stepping with tridiagonal Thomas solver (sim.js lines 85-136):
- Unconditionally stable, second-order accurate in dt and dx.
- Norm conserved: all five invariant tests pass (test suite confirms integral |psi|^2 within 1e-8 per step, R+T=1 within 1e-6, group velocity exact).
- Kinetic term: standard 3-point finite-difference stencil; dispersion tolerance 2 dx per spec (line 48 of invariants).
- Boundary conditions: hard wall psi=0 at edges enforced by clamping (lines 132-133).
- Reflection/transmission split (lines 152-158): norm split at x=0 divider, verified to sum to 1 per invariant tests.

## Gates
- **Invariant gate**: PASS. All 5 tests pass (norm, R+T, free-particle group velocity, high-barrier limit).
- **Readout gate**: PASS. Canvas readout renders norm to 6 decimals, R/T to 3, time step counter.
- **Physics correctness**: PASS. No limiting-case failures; TDSE unitary by construction.

## Fix steps
None required. Prior verdict was based on a stale code inspection.

## One-line summary
CLEAN: Crank-Nicolson scattering simulator with norm conservation and R+T=1 verified; live readout present on canvas.
