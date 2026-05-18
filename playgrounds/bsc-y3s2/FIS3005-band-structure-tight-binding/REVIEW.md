# REVIEW - band-structure-tight-binding (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [MEDIUM] Raw BibTeX keys in HTML: 2 citations exposed in backticks (e.g., `(ashcroft-mermin)`, `(kittel)`). Remove backticks and use proper citation format.

## Text / approachability
Hook and one_paragraph are excellent: detailed, pedagogically clear, explain physics progression (1D cosine, SSH gap, 2D saddle point). No jargon issues. Spec is comprehensive.

## Source-material & equation fidelity
Tight-binding Bloch Hamiltonian, 1D dispersion E = eps0 - 2t cos(ka), SSH chain gap 2|t1-t2|, 2D van Hove saddle, effective mass m* = hbar^2 / (2ta^2): all standard solid-state physics. Correct per Ashcroft-Mermin and Kittel.

## Golden-frame observations
Frames have 5 distinct file sizes. Scene shows band structure with live draggable Fermi level, DOS, and 2D Fermi-surface contour. Multi-panel rendering is clear and detailed. 9 readout elements visible (filling, E_F, etc.).

## Hero-candidate
YES: band-structure playground is pedagogically rich (covers 1D, dimerized, 2D lattices in one interface) and visually effective (colored bands, DOS, contours). Difficulty tier "advanced" and hero_candidate flag are correct. Candidate for visual excellence after raw bib fixes.

## Maintainer notes
- Fix 2 raw BibTeX keys in HTML: change to "Ashcroft & Mermin" and "Kittel" or add links.
- Verify all 9 readouts render visibly in captured frames (they should).
- No other defects detected.
