# DEVNOTES - bsc-y2s2/FIS2021-billiards-circle-stadium-sinai (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants 7/7 + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  7 passed + visual 5/5 x3. Shipped.

## Ellipse table 2026-05-19 (user: wants a proper ellipse to show the two foci)
Added an ellipse billiard (A=1.4, B=0.9, foci at +/- c=sqrt(A^2-B^2)
~1.07). sim.js: stepEllipse (specular reflection off x^2/A^2 +
y^2/B^2 = 1, inward normal -grad F), step() dispatch, GEOM_BOUNDS,
ELLIPSE_AXES export. index.html: geometry option. playground.js:
ellipse boundary + the two foci drawn and labelled; IC launched
from a focus so every chord reflects through the other focus (the
two-focus property, a dense star + confocal caustic); integrable
flag now true for the ellipse too. invariants 8 -> 10: ellipse speed
conservation, every bounce on the ellipse, and the alternating
focus-to-focus reflection law within 1e-6. Gate 10 + smoke + 5/5 x3.
