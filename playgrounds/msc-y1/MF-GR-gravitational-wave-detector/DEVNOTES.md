# DEVNOTES - msc-y1/MF-GR-gravitational-wave-detector (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  8 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  8 passed + visual 5/5 x3. Shipped.

## Merge 2026-05-19
User: GW-detector boring (only the instrument); merge with the similar chirp playground; show the actual in-falling merger and the spacetime ripples with a real physics engine; keep the instrumentation. Rebuilt the primary view: two black holes on a Keplerian separation a=(G M/omega_orb^2)^(1/3) that shrinks as the chirp rises, radiating a two-arm leading-quadrupole ripple that tightens into the merger then rings down; chirp strain h(t), matched-filter SNR (recovers M_chirp), and a LIGO arm-strain indicator demoted to diagnostic strips. sim.js byte-identical (Peters/waveform/matchedFilter; invariants 8/8). Deleted the redundant AST3017-gravitational-wave-chirp-sonification card; regenerated index/catalogue/landing (0 dangling refs). Note: do NOT run generate-playground-html on this card (it rebuilt the controls scaffold and dropped the slider/readout ids -> null addEventListener -> capture timeout); restored the hand-authored index.html and edited title/aria/figcaption by hand, then recaptured. Verified live (animating inspiral->merger->ringdown, 2-arm ripple, instrument diagnostics), smoke OK, visual 5/5 x3.
