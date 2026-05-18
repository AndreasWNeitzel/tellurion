# REVIEW - kepler-equation-newton-iteration (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [blocker] spec.md contains placeholder markers: hook = 'STATUS: needs_hook', one_paragraph = 'STATUS: needs_paragraph'. Replace with actual descriptions.
2. [medium] index.html contains raw bib key in parentheses: (`carroll-ostlie`). Move to spec References or figcaption.

## Text / approachability
- README.md (17 lines) adequately describes the Newton-Raphson iteration for the Kepler equation and expected convergence.
- spec.md: replace placeholders.

## Source-material & equation fidelity
- Kepler equation: M = E - e sin(E), Newton method for solving it.
- Carroll and Ostlie (1996) is standard reference for orbital mechanics.

## Golden-frame observations
- Five frames have distinct MD5 hashes; convergence progression visible as iteration count advances.

## Hero-candidate
NO. Standard numerical methods visualization.

## Maintainer notes
- Replace spec.md placeholders with hook (e.g., "Newton-Raphson solves the Kepler equation in 5-10 iterations") and one_paragraph.
- Remove bib key from index.html or cite author/year inline.
