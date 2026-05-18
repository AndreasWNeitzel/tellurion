# REVIEW - sph-sod-shock-tube (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [blocker] spec.md contains placeholder markers: hook = 'STATUS: needs_hook', one_paragraph = 'STATUS: needs_paragraph'. Replace with actual descriptions.
2. [medium] index.html contains raw bib keys in body text: (`monaghan1992`), (`price2012sph`), (`sod1978`), (`leveque2002`). Move to figcaption or spec.md only.

## Text / approachability
- README.md is excellent: three paragraphs, explains setup, what to observe (three-wave Riemann structure), and controls clearly.
- index.html body text is accessible but has inline citation keys that must be cleaned.

## Source-material & equation fidelity
- Physics correct: Sod shock-tube canonical benchmark, gamma=1.4, left/right states exact.
- SPH with artificial viscosity (Monaghan 1992) proper for capturing shocks.
- Three-wave structure (rarefaction, contact, shock) correctly described.

## Golden-frame observations
- t-000: particles initialized in left/right states separated by membrane; three traces visible.
- t-025: rarefaction developing on left, shock front on right.
- t-050: three-wave structure clear; density shows contact discontinuity, pressure/velocity smooth across it.
- t-075, t-100: shock propagates, rarefaction spreads. Frames distinct.

## Hero-candidate
NO. Classic benchmark visualization; no novel graphics or emergent complexity.

## Maintainer notes
- Replace spec.md placeholders with proper hook (one sentence, e.g., "Three-wave Riemann solution: rarefaction, contact, shock") and one_paragraph.
- Remove bib keys from index.html body text. Keep them in spec References or move to figcaption "Source:" section.
- Frames are good; no recapture needed.
