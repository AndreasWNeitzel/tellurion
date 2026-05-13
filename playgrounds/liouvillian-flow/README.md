# Liouvillian Flow

A swarm of 256 tracer particles evolves on the pendulum phase space (theta, p) under the Hamiltonian H = p^2/2 - cos(theta), integrated by the project's velocity-Verlet symplectic engine. Each tracer is an independent pendulum sharing the same omega; their initial conditions are drawn from a 2D Gaussian centered on a user-chosen point. The cloud rotates around the stable equilibrium when below the separatrix, rotates monotonically when above, and stretches into a filament when straddling. The phase-space area is preserved by Hamiltonian flow (Liouville's theorem); the playground reports an empirical area metric derived from the cloud's covariance matrix.

Look for the dashed separatrix curve p = +/- 2 cos(theta/2). At the default blob center (theta=0.6, p=0) the cloud librates around (0, 0) with a slow tangential shear, retaining its area to within 1-2 percent over a single libration period. Drag the blob across the separatrix and the cloud's behavior changes dramatically: it stretches along the unstable manifold and the covariance-based area metric loses its sharp meaning (the cloud is no longer Gaussian). The first-tracer energy readout is the cleanest invariant: it stays constant to within machine precision under the symplectic integrator.

Controls: drag the dashed circle on the phase canvas to set the blob center. Double-click anywhere on the canvas to reset to default. Reset returns to (0.6, 0). Play/Pause toggles integration.

## Reference

Primary citations: Strogatz, "Nonlinear Dynamics and Chaos", 2nd ed., Section 6.5 "Conservative Systems" and Section 6.7 "Pendulum" (bib key `strogatz2015`). Engine: `shared/js/engine/symplectic.js`, validated in `tests/engines/symplectic.test.mjs`. Liouville's theorem itself is a standard analytical-mechanics result; the project bibliography does not currently include a canonical analytical-mechanics text (Goldstein, Hand-Finch), so the theorem is tagged `[no-source: standard-result]` in the spec.

## Verification

- Strong invariants:
  - Per-tracer energy conserved to |dE/E| < 1e-3 over 10^4 dt at dt = 1e-2 (any tracer below the separatrix).
  - Covariance-determinant area conserved to within 5 percent over 10^3 dt for the default blob.
  - Deterministic reproducibility: at seed 0xC0FFEE, tracer states match to machine precision across runs.
- Visual gate: SSIM > 0.92 against committed golden frames at the default blob center.
- Last verified: see `.verified`.
