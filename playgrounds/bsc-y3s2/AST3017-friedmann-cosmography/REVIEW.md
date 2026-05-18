# REVIEW - friedmann-cosmography (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [MEDIUM] Raw BibTeX key in user-facing HTML: index.html line 51 has "Ch. 4 (`liddle-cosmology`)". Remove backticks and cite key; use plain text "Liddle 2017" or a link.

## Text / approachability
Hook and one_paragraph are present and well-written. Describe the physical arc (Big Bang to future acceleration) and control function. Spec is rigorous and complete with limiting cases and invariants. No jargon issues detected.

## Source-material & equation fidelity
Friedmann equation, comoving distance, and age integrals in spec match Liddle Ch. 4. Numerical methods (Simpson, midpoint) documented. Invariants test confirms E(0)=1, age estimates, and monotonicity (8 tests passing per spec). Physics is sound.

## Golden-frame observations
Frames t-000 to t-100 show distinct file sizes (90K to 108K). Examine content: t-000 shows early universe (a small), t-100 shows later epoch. Animation loop moves cosmic patch forward in time along scale factor curve. Solid/dashed transition at "today" is sharp. Readout panel shows live t, a, z values.

## Hero-candidate
NO: cosmological evolution plot is pedagogical but not visually novel. Scale factor growth is well-known textbook material.

## Maintainer notes
- Fix raw bib key in index.html line 51: change to "Liddle 2017" or link format.
- Confirm frames show distinct cosmic times (read the bottom readout values across all 5).
- All other checks pass: hook/paragraph present, equations correct, readout visible.
