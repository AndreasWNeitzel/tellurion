# REVIEW - quantum-confinement-nanostructure (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity

Infinite square well energy spectrum: E_n = ℏ²π²n²/(2mL²). Closed form, exact. Spec.md and index.html correctly state E_2 - E_1 = 3E_1 relation and confinement gap scaling as 1/L².

Dimensionality-dependent density of states (DOS):
- 3D bulk: g(E) ∝ E^{1/2} (free electron model).
- 2D well: staircase with jumps at subband edges E_n ∝ n².
- 1D wire: van Hove singularities g(E) ∝ (E - E_c)^{-1/2} at subband thresholds.
- 0D dot: delta peaks (quantized levels only).

Source citations correct: Griffiths QM, Davies 1998, Ashcroft-Mermin. Equations match canonical references.

Invariants (invariants.test.mjs): normalization, E2-E1 relation (lines 5-11), 1/L² scaling (lines 13-20), bulk limit gap→0 (line 17), DOS shapes (lines 27-51), absorption onset (lines 53-57). Nontrivial and comprehensive. ✓

No physics defects identified.

## B. Physics & numerical robustness

Bisection/integration for subband energies uses standard midpoint rule, 400-panel integration. Robust.

Live readout panel (index.html): E_1, E_2-E_1, gap, absorption onset. Monospace, visible, deterministic.

Golden frames: 5 distinct frames covering bulk, well, wire, dot with visually clear DOS shapes. Axes labeled, level markers visible.

Determinism confirmed (pure functions).

No robustness defects identified.

## C. Presentability

Hook and one_paragraph: both filled (not placeholders). ✓

Index.html header: clear introduction to confinement, equation display via KaTeX. ✓

Figcaption: paper-style, cites method and sources. ✓

README: 3 short paragraphs, explains concept and controls. Undergrad-accessible. ✓

No data-slot debris. ✓

No defects identified.

## Hero-candidate

YES (conditional). Golden frames show pedagogical progression from 3D (continuous DOS) to 0D (delta peaks). Van Hove singularity (1D) and staircase (2D) are visually distinct. Clarity and engagement match featured-shelf criteria.

## Action checklist for maintainer

1. Confirm invariants.test.mjs passes (gate-tested as of May 13).
2. Verify golden frames render correctly on live site.
3. Compare against _heroes/ hero shelf if a quantum-confinement reference exists.
4. If visual polish verified, promote hero_candidate to true and ship.

