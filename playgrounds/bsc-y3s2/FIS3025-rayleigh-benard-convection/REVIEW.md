# REVIEW - rayleigh-benard-convection (pre-computed; maintainer actions later)

## Verdict
NEEDS CODE FIX + RECAPTURE

## Defects (severity-ranked)
1. [HIGH] Frame sizes not all distinct (distinct_sizes=2). Only 2 unique file sizes from 5 capture frames, meaning 3 frames are duplicated. CAPTURE_FRAC parameter should vary Rayleigh number or time to show convection-pattern evolution (onset of convection, vortex formation, etc.). All 5 should be visually distinct.
2. [MEDIUM] Raw BibTeX keys in HTML: 2 citations in backticks.

## Text / approachability
Hook and one_paragraph present and clear.

## Source-material & equation fidelity
Rayleigh-Benard convection, Boussinesq equations, critical Rayleigh number: standard thermal convection. Correct.

## Golden-frame observations
Only 2 distinct frame sizes. Convection pattern may not show full temporal or parameter evolution. Multiple frames are identical or very similar.

## Hero-candidate
NO: Rayleigh-Benard convection is pedagogical but visual impact depends on clear pattern transitions (laminar to convecting). Recapture needed first.

## Maintainer notes
- Debug CAPTURE_FRAC mapping: ensure all 5 frames show different convection states (onset, weak convection, strong/turbulent patterns).
- Fix 2 raw bib keys.
- Rerun with --deterministic.
