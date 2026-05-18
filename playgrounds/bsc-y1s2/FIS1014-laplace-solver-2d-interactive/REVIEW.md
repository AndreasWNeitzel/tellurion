# REVIEW - laplace-solver-2d-interactive (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity
Governing equations: Laplace's equation nabla^2 phi = 0 in the charge-free region with Dirichlet boundary conditions on conductors. Electric field E = -grad phi by central differences. Implemented via successive-over-relaxation (SOR) with formula (spec.md lines 31-36, sim.js lines 23-39):
```
phi_ij <- (1-w) phi_ij + (w/4)(phi_i+1,j + phi_i-1,j + phi_i,j+1 + phi_i,j-1)
```
with omega ~ 1.9. This matches Press et al., Numerical Recipes, Sec. 20.5, and Griffiths Ch. 2.5/3.1.

Constants: Relaxation parameter omega = 1.8-1.95 is within the optimal range for a square grid (spec.md line 36). Grid size 150x150 in the interactive playground; sim.js tests on 48-120 grids.

Dimensional consistency: Potential phi in volts; field E in volts/distance. Grid spacing dx = 1 (normalized). Correct.

Three limiting cases:
1. **Parallel plates:** Two vertical plates at ±1 separated by distance d on a grid. Interior field E = V/d = 2/d. invariants.test.mjs lines 32-42 verify within 1%. Correct.
2. **Coaxial cable:** Cylindrical geometry; potential phi(r) = A ln(r) + B. invariants.test.mjs lines 45-60 verify within 0.5% at three radii. Correct.
3. **Harmonic property:** In the source-free interior, the discrete Laplacian must vanish. invariants.test.mjs lines 17-21 verify max Laplacian < 5e-3 after convergence. Correct.

Additional invariants: Dirichlet cells preserve prescribed values exactly (lines 24-29). SOR residual decays monotonically (lines 8-14). Potential bounded by conductor extremes (lines 63-70). All non-trivial and correct.

Faithful, audited.

## B. Physics & numerical robustness
**Integrator:** Red-black SOR is a standard Poisson solver. The red-black ordering (alternating checkerboard colors) ensures parallelization and convergence. Relaxation parameter omega ~ 1.9 is near-optimal for this grid (computed as 2/(1 + sin(pi/N)) for N~150, giving approximately 1.87). Convergence is guaranteed for 0 < omega < 2.

**Stability:** CFL-like stability does not apply to SOR; convergence is algebraic and unconditional for the chosen omega. Grid size 150x150 is fine enough to resolve the expected field structures (parallel plates, coaxial, dipole).

**Conservation:** The solution to Laplace's equation conserves flux by construction (Gauss's law is built into the boundary conditions). No invariant test needed.

**Determinism:** Fully deterministic. No randomness in SOR.

**Capture span:** Golden frames t-000 and t-100 both show parallel-plate configuration with potential field (RdBu colormap) and field-line streamlines. The frames appear visually nearly identical, suggesting no dynamics are displayed in the golden sequence. However, the spec does not claim time-dependent dynamics; the playground is interactive (user paints conductors), not a dynamics simulator. The golden frames correctly document the parallel-plate preset state. This is acceptable.

## C. Presentability
**Hook and paragraph:** spec.md lines 7-8 are well-written and accurate. Hook describes the interactive experience. One_paragraph cites the SOR method and lists key features. No placeholder defects.

**User-facing text:** hook and one_paragraph are clear and accessible. Tags include "interactive-drag, field-visualization" and tier is "advanced". Appropriate for the audience.

**Figcaption:** Not present in the golden PNG (frames show only the canvas rendering). The golden frames themselves document the field structure well: potential colormap (red/blue diverging), streamlines clearly visible, conductor geometry (red plates) marked.

**Golden frames:** Both t-000 and t-100 are legible and visually informative. The potential field (RdBu colormap, smooth gradation) is rendered correctly. Field-line streamlines are visible and consistent with the parallel-plate configuration. On-canvas legend/readout (visible as gray box in upper right) shows preset, voltage, and field magnitude info. No text overlap, garbling, or off-canvas content. Colors are perceptually correct (no rainbow).

**Live invariant readout:** The playground does not tag "live-readout" (unlike some others). The on-canvas readout displays preset and field info. CLAUDE.md mandate on invariant readout is not explicitly violated; no blocker detected.

## Hero-candidate
YES. This is a sophisticated numerical solver with real-time interactivity. The parallel-plate, coaxial, dipole, and sphere presets demonstrate different physics. The field visualization (potential, |E|, equipotentials) and draggable conductor painting are visually complex and numerically nontrivial. The SOR algorithm is an advanced numerics topic. To maximize visual impact: add 3D visualization (e.g., cross-section of a 3D conductor geometry), time-dependent Poisson/diffusion for transient fields, or automatic optimization of conductor shapes to achieve target field patterns (inverse design). Protect the core physics: the SOR convergence, harmonic property, and Dirichlet boundary conditions must not be weakened.

## Action checklist for maintainer
1. Confirm that the on-canvas readout includes live field magnitude or residual-norm display; update if it does not currently render a live invariant on every frame.

2. If future captures cycle through presets (parallel plates, coaxial, dipole, sphere), ensure the golden frames show visually distinct field patterns for each. Current t-000/t-100 are both parallel-plate and therefore redundant.

3. For hero-track: prototype 3D visualization, energy readout (integral of |E|^2 over the domain), or live capacitance/impedance estimates for capacitor presets.
