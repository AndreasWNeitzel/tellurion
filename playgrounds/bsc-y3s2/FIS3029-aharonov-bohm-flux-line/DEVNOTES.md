# DEVNOTES - bsc-y3s2/FIS3029-aharonov-bohm-flux-line (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants invariants pass + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (CODE FIX + RECAPTURE) partly stale: AB phase physics correct, sim.js + 4 real invariants pass, hook/one_paragraph real prose (NOT placeholders; stale claim), has Explainer. Sole genuine defect: bootSync ignored captureFraction so all 5 goldens identical at phi=0. Fixed: added CAPTURE_FRAC; deterministic capture sets st.phi = 2*frac (0 to 2 cycles) and syncs the slider. Recaptured 5 distinct goldens; READ t-000 (phi=0, bright central fringe) and t-025 (phi=0.5, fringes shifted half a cycle, dark centre) physically correct AB shift, 60fps. No sim/invariants/text change. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW CODE-FIX partly stale: AB physics, sim.js, 4 invariants, text already correct. Sole genuine defect: bootSync ignored captureFraction so all 5 goldens identical at phi=0. Added CAPTURE_FRAC; capture sweeps st.phi=2*frac (0 to 2 cycles); recaptured 5 distinct verified-correct goldens (phi=0 bright centre; phi=0.5 fringes shifted half a cycle).
invariants Tests  4 passed + visual 5/5 x3. Shipped.
