# REVIEW - kronig-penney-bands (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [HIGH] Placeholder hook in spec.md: `STATUS: needs_hook` not removed (one_paragraph is filled).
2. [MEDIUM] Raw BibTeX key in HTML: 1 citation in backticks.
3. [LOW] Missing readout: spec lists 'live-readout' tag but HTML has 0 readout elements. Decide: either add readout (e.g., band gap width, E_F) or remove tag.

## Text / approachability
Hook is placeholder. One_paragraph present. Rewrite hook to explain Kronig-Penney model: periodic potential creates band gaps and dispersion relation E(k).

## Source-material & equation fidelity
Kronig-Penney potential (square wells + barriers), band structure, band gaps: standard solid-state physics. Correct.

## Golden-frame observations
Frames have 5 distinct file sizes. 0 readout elements. Band diagram varies across captures (likely potential depth or well width sweep), showing band gap variation.

## Hero-candidate
NO: Kronig-Penney band diagram is textbook.

## Maintainer notes
- Replace placeholder hook.
- Fix raw bib key.
- Review live-readout tag: add readout element and update HTML, or remove tag from spec.
