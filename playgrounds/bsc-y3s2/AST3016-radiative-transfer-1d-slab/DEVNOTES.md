# DEVNOTES - bsc-y3s2/AST3016-radiative-transfer-1d-slab (hidden dev ref)

Repo-only.

## Code-fix sweep 2026-05-18
playground.js: added CAPTURE_FRAC; bootSync sweeps st.tau=0.2+CAPTURE_FRAC*8; t-100 verified I(tau=8.2)->S=3.0 saturation.
Recaptured; 5 golden frames now distinct (screenshot-verified). invariants 6/6 + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW verdict (CONFIRMED/NEEDS CODE FIX) is STALE (pre-fix). Verified-clean: golden frames 5/5 byte-distinct, invariants.test.mjs is a real non-skeleton suite that passes, and the headline closed form was node-hand-checked vs the textbook: Beer-Lambert e^-tau transmission and emergent profile; 6 real invariants pass. No code/render change; render unchanged so no gate needed.
