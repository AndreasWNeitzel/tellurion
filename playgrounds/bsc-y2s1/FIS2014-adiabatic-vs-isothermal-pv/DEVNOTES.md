# DEVNOTES - bsc-y2s1/FIS2014-adiabatic-vs-isothermal-pv (hidden dev ref)

Repo-only.

## Code-fix sweep 2026-05-18
playground.js bootSync: sine-wave capture (t-000 and t-100 both V=1) replaced with linear st.V = 0.3 + CAPTURE_FRAC*2.1; t-000 compressed (V=0.30, adi T=486K) verified.
Recaptured; 5 golden frames now distinct (screenshot-verified). invariants 7/7 + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants 7/7 + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  7 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW verdict (CONFIRMED/NEEDS CODE FIX) is STALE (pre-fix). Verified-clean: golden frames 5/5 byte-distinct, invariants.test.mjs is a real non-skeleton suite that passes, and the headline closed form was node-hand-checked vs the textbook: isothermal pV=const, adiabatic pV^gamma=const, W=nRT ln(V2/V1); 7 real invariants pass. No code/render change; render unchanged so no gate needed.
