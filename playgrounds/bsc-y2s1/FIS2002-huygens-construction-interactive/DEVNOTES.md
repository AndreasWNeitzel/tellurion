# DEVNOTES - bsc-y2s1/FIS2002-huygens-construction-interactive (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  6 passed + visual 5/5 x3. Shipped.

## Colormap 2026-05-19 (user: zero point of the diverging colormap must be black)
Swapped the field map from shared rdbu (white at the zero point,
washes out the dark theme) to the new shared divBlack (black at
zero, cool blue negative, warm orange positive). Render-only; sim.js
+ 6 invariants byte-identical; goldens recaptured. Gate 6 + smoke +
5/5 x3.
