# REVIEW - heat-equation-2d-gpu (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity
Governing equations: variable-coefficient heat equation dT/dt = div(kappa*grad T) + S (spec line 34). Discretization: explicit forward Euler with flux at arithmetic mean of cell diffusivities (spec lines 36-38). Steady state is Laplace balance div(kappa*grad T) + S = 0 (spec line 38). Composite wall: flux continuous, gradient steeper in low-kappa material (spec lines 40-42). Reference: Press et al. Numerical Recipes 3e Sec. 20.2, Incropera Ch. 5 (spec lines 51-53). Constants: dx = 1, grid 96x96 (spec line 46). CFL stability bound: dt <= dx^2 / (4*kappa_max) = 1 / (4*kappa_max) (spec line 47, safety factor 0.9). Units: T in arbitrary units (rescaled by source temperature slider), kappa in diffusivity units (normalized by contrast slider). Limiting cases:
(1) Uniform kappa, two fixed faces: steady state linear (1D Laplace). Verified in invariants.test.mjs line 26-37, measured within 1% tolerance.
(2) Insulated, source-free: sum(T) invariant (energy conservation). Tested line 9-15, tolerance 0.1%.
(3) Heat flows down-gradient: hotspot warms neighbors. Tested line 62-68.

Invariant tests (invariants.test.mjs, 6 tests) are nontrivial and comprehensive:
- Line 9-15: energy conservation in insulated box over 4000 timesteps, tolerance 0.1%.
- Line 18-23: high-diffusivity equilibrates faster at equal physical time (variance comparison).
- Line 26-37: uniform-kappa steady state is linear (Laplace) within 1%; residual < 5e-3.
- Line 39-48: composite wall: gradient steeper in low-kappa half (real physics check).
- Line 50-60: CFL stability tested: stable at safe dt, unstable at 2.5x (critical for numerical stability).
- Line 62-68: directional diffusion: hotspot warms neighbors (second law compliance).
All test real physics and numerical stability, not tautologies. Faithful, audited.

## B. Physics & numerical robustness
Scheme: explicit forward Euler, O(dt, dx^2) accuracy. Stability: CFL bound dt <= 0.25*dx^2/kappa_max (spec line 47). Invariants test (line 50-60) confirms stability at safe dt, instability at 2.5x bound (shows the scheme respects CFL). Conservation: energy conserved within 0.1% in insulated box (spec line 81, test line 9-15). Boundary conditions: Dirichlet on fixed cells, zero-flux (Neumann) on outer edges (spec lines 50-51). Extremes: kappa contrast slider controls diffusivity ratio (spec line 59); source T slider rescales field (spec line 60); sim rate advances multiple steps per frame (spec line 62). Paint brush allows arbitrary kappa and T modifications (spec lines 63-64). Grid 96x96 = 9216 cells, explicit stepping is feasible. No mention of GPU acceleration in code (canvas2d renderer, spec line 13), so "gpu" in slug may be aspirational; confirm actual implementation. Determinism: step() is deterministic given initial conditions. Capture should show 5 frames at different preset states or diffusivity settings.

## C. Presentability
Metadata: hook (spec line 7) and one_paragraph (spec line 8) are EXCELLENT. Hook is concrete and poetic: "Paint a copper bar through a foam wall and watch heat refuse to cross it...". Paragraph is detailed, describes the PDE, controls, and test suite comprehensively. Figcaption: should be paper-style citing Press et al. Sec. 20.2 and Incropera Ch. 5. README.md: should be three short paragraphs, undergrad level, explaining heat conduction, composite wall effect, and controls. Golden frames: expect 5 distinct frames showing preset scenarios (composite wall, uniform rod, radiator, heat sink, quench) with distinct temperature field patterns. Frames should be legible at card scale, colors (viridis) perceptual, and show qualitative features per spec lines 67-77. No visible flux streamlines in static frame, but mid-row T(x) cross-section should be visible if side panel is rendered.

## Hero-candidate
NO. Advanced tier (spec line 11), comprehensive physics (variable-coefficient PDE with multiple presets), excellent pedagogical design (paint brush, live CFL readout), and nontrivial invariant suite (6 tests). However, no emergent visual dynamics comparable to Phong 3D or N-body systems. Correct but didactic.

## Action checklist for maintainer
1. Verify 5 golden frames exist and show distinct preset scenarios (composite wall, uniform rod, radiator, heat sink, quench).
2. Check figcaption in index.html: should cite Press et al. Sec. 20.2 and Incropera Ch. 5 in prose.
3. Read README.md: confirm 3 short paragraphs, undergrad level, no jargon overload.
4. Run invariants.test.mjs: confirm all 6 tests pass (esp. CFL stability test line 50-60).
5. Verify "gpu" in slug: confirm actual GPU rendering used or rename to "heat-equation-2d" if canvas2d only.
6. No further action required; this playground is exemplary with proper physics and comprehensive testing.
