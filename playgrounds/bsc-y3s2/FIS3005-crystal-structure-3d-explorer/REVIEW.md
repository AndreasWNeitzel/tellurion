# REVIEW - crystal-structure-3d-explorer (pre-computed; maintainer actions later)

## Verdict
NEEDS CODE FIX + RECAPTURE

## Defects (severity-ranked)
1. [HIGH] Frame sizes not all distinct (distinct_sizes=4). One frame is a duplicate, indicating incomplete 3D crystal-structure sweep. CAPTURE_FRAC parameter should vary lattice parameters or rotation angle so all 5 frames show qualitatively different crystal geometries.
2. [MEDIUM] Raw BibTeX keys in HTML: 2 citations exposed in backticks.

## Text / approachability
Hook and one_paragraph present and comprehensive. Physics clear.

## Source-material & equation fidelity
Crystal lattices, unit-cell definition, lattice vectors: standard crystallography. Correct.

## Golden-frame observations
4 distinct frame sizes from 5 captures. One frame is repeated (likely frame 3 or 4). 3D visualization is detailed (9 readout elements), but animation is incomplete.

## Hero-candidate
MAYBE: 3D crystal structure exploration is visually appealing. After recapture with full lattice-parameter sweep (varying a, b, c, or angles), could showcase 3D rendering quality. Defer until recaptured.

## Maintainer notes
- Debug CAPTURE_FRAC mapping: ensure all 5 capture values produce distinct crystal geometries (different lattice types or parameters).
- Fix 2 raw BibTeX keys in HTML.
- Rerun visual test with --deterministic.
- Verify 9 readouts display distinct values across frames (e.g., lattice parameter magnitudes).
