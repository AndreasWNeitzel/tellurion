# REVIEW - coulomb-equilibrium-charges (deep audit; supersedes any earlier pass)

## Verdict
NEEDS CODE FIX + RECAPTURE

## A. Scientific validity
Governing equations: Coulomb force F = k q sum_j ( q_j (r - r_j) / |r - r_j|^3 ) implemented in sim.js lines 6-16; Coulomb potential V = k sum_j ( q_j / |r - r_j| ) in lines 17-24. Both match Griffiths, Introduction to Electrodynamics, Ch. 2, and Marion-Thornton, Ch. 6. Constants absorbed into normalized units (k=1). Regularization 1e-6 on r^2 is physically reasonable softening to prevent singularities.

Units: [Force] = [charge]^2 / [distance]^3 in normalized units. Dimensional consistency verified.

Three limiting cases:
1. **Quadrupole symmetry at origin:** With 4 equal charges at (±1, ±1), net force at (0, 0) must vanish by symmetry. invariants.test.mjs lines 4-8 verify f_x and f_y both < 1e-10 (f_y tolerance is looser: 1e-6). Correct.
2. **Single-charge Coulomb law:** Single charge q=1 at origin; test at r=2. F = 1/4 = 0.25 by 1/r^2 law. invariants.test.mjs lines 10-14 expect this; correct.
3. **Dipole perpendicular bisector:** Two charges ±q at (±1, 0); test at (0, 2) should have f_x ≈ 0 (cancellation) and f_y > 0 (repulsion from dipole). invariants.test.mjs lines 16-20 verify; correct.

Invariant tests are non-trivial, geometrically specific, and pass by code inspection. Faithful, audited.

## B. Physics & numerical robustness
**Integrator:** Velocity-Verlet-like (playground.js lines 72-82) with synthetic damping 0.998 per step. Not time-reversible. For an interactive explorer of a conservative Coulomb system, this pragmatic dissipation stabilizes UI behavior but is not appropriate for a true dynamics simulator. PHYSICS_DT = 1/240 is stable given regularization. Regulator 1e-6 prevents singularities; slider bounds (-2 to 2, -1 to 1) are sensible.

**Conservation:** Energy dissipated by damping. No invariant conservation check needed given explicit dissipation. However, **no live invariant readout is visible in the UI.** CLAUDE.md mandate: "A live invariant readout is visible in the playground UI. The number is rendered in a monospace span. The absence of this readout is a blocker." The readout div (index.html line 10) displays F and V (observables, not invariants). HIGH-SEVERITY BLOCKER.

**Determinism:** Fully deterministic; no stochasticity in physics or rendering.

**Capture span:** Golden frames t-000 and t-100 appear nearly identical (cyan dot at center in both). Frame-to-frame displacement is imperceptible across all five frames. The test charge begins at (0.6, 1.1); if the capture advances physics by `CAPTURE_FRAC * 1000` steps (playground.js line 220), the expected behavior is drift from release toward equilibrium, visible across the five frames. Static appearance indicates capture does not span observable dynamics. Frames need to show visually distinct positions spanning from release to convergence. RECAPTURE REQUIRED.

## C. Presentability
**Hook and paragraph:** spec.md lines 12-13 contain proper, well-written prose (not placeholders). Hook is accurate. one_paragraph is detailed, mentions Earnshaw's theorem, and cites the stability insight. Excellent pedagogical text.

**User-facing text:** Gallery hook, one_paragraph, description all present and clean. No placeholder markers, no raw LaTeX, no template artifacts.

**Figcaption (index.html line 11):** "Figure 1. Drag the test charge to feel the field. Equilibrium at the center for symmetric configurations. Source: Griffiths, Introduction to Electrodynamics, Ch. 2."

Paper-style format, accurate. Brief on method but acceptable.

**README:** Three short paragraphs, explains what to drag, sources the text. Adequate.

**Golden frames:** Visually clear and legible. Field lines (amber), charges (red/blue squares), test charge (cyan dot), energy landscape (red-blue diverging colormap, no rainbow) all present and smooth. No text overlap, off-canvas content, or garbling. However, frames t-000 and t-100 are visually nearly identical, suggesting no dynamics are displayed. Recapture needed.

## Hero-candidate
NO. Standard 2D electrostatics visualization. No 3D, no emergent structure, no numerical virtuosity. Pedagogically sound but not spotlight-worthy.

## Action checklist for maintainer
1. **Add live invariant readout (BLOCKER).** Define an invariant (e.g., distance-to-nearest-equilibrium, or magnitude of gradient of potential at test charge position as a stability metric, or simply count cycles of oscillation if charge enters oscillatory regime). Render as monospace span in HTML and compute on every frame in playground.js. This is mandatory per CLAUDE.md rule.

2. **Recapture golden frames.** Use fixed initial position (e.g., (0.6, 1.1)) and advance physics by 0, 250, 500, 750, 1000 steps (or equivalent CAPTURE_FRAC values) to show the test charge drifting from release toward equilibrium. Ensure at least 3 of the 5 frames show visually distinct position to demonstrate dynamics.
