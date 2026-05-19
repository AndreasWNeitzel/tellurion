# DEVNOTES - msc-y1/MAA-SE-stellar-structure-full-model (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  11 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  11 passed + visual 5/5 x3. Shipped.

## Hero-promotion 2026-05-19
The capture branch only varied st.ph (the convective-wobble phase), but the default 1 Msun Eddington n=3 model has almost no convective shells, so all five goldens were byte-identical and the visual gate was vacuous. The capture now sweeps the stellar mass 0.30 -> 15 Msun (the controlling parameter): each frame is the correct model for that mass, so the sliced star size and colour, the T/rho/P/L profiles, the convective/radiative zoning, the pp/CNO/3-alpha balance and the HR/ZAMS position all change across the five frames (R 0.43 -> 1.78 -> 6.78 Rsun). Also added a slow throttled live main-sequence auto-tour so the model is perceptibly alive on load; the mass slider takes over the instant the user drags it (st.tour := false), Reset re-enables it. Triage verdict: was below bar (static, five identical goldens); now at bar. Render/driver-side only: sim.js and the invariants are byte-identical (11/11), 5 distinct goldens, rAF ~16.7 ms (60 fps; model rebuild throttled to every 6 frames during the tour).
invariants Tests  11 passed + visual 5/5 x3. Shipped.
