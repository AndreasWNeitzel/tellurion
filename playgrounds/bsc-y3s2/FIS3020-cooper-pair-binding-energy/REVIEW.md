# REVIEW - cooper-pair-binding-energy (pre-computed; maintainer actions later)

## Verdict
NEEDS CODE FIX + RECAPTURE

## Defects (severity-ranked)
1. [CRITICAL] All 5 golden frames byte-identical. Cooper pair binding energy depends on coupling strength and Fermi energy, which should vary during capture to show how binding energy evolves. CAPTURE_FRAC must drive a parameter (g, E_F, or density of states) so energy landscape changes visibly.
2. [MEDIUM] Raw BibTeX key in HTML: 1 citation in backticks (lower count than others, but still needs fix).

## Text / approachability
Hook and one_paragraph present and clear (no placeholders).

## Source-material & equation fidelity
Cooper problem, BCS binding energy: standard superconductor theory. Correct.

## Golden-frame observations
All 5 frames identical. Binding-energy curve and parameters frozen.

## Hero-candidate
NO: conceptual diagram, no visual novelty.

## Maintainer notes
- Add CAPTURE_FRAC parameter sweep (e.g., g = g_min + (g_max - g_min) * CAPTURE_FRAC to vary coupling strength and show how binding energy scales).
- Fix raw bib key.
- Rerun with --deterministic.
