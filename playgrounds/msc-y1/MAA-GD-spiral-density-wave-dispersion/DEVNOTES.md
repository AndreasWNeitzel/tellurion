# DEVNOTES - msc-y1/MAA-GD-spiral-density-wave-dispersion (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants invariants pass + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Real card text (hook + one_paragraph) sourced from the spec body; render-neutral.
invariants Tests  5 passed + visual 5/5 x3. Shipped.

## Hero rehaul 2026-05-19 (mission #286, no-plot-as-main)
Was the banned pattern: a static nu^2(k) cartesian curve, capture not
sweeping (5 identical goldens). Rebuilt render-only (sim.js
nuSquared/ToomreQ/kCrit + the 5 invariants byte-identical):
- Primary is a differentially-rotating face-on particle disk (2200
  stars, flat Vc). The density wave makes stars crowd azimuthally
  toward the spiral potential (theta += amp sin(phase)/m), so Q<1
  grows a bold 2-arm grand-design spiral at rate sqrt(-nu^2_min)
  while Q>1 stays smooth and shears away.
- nu^2(k) demoted to a side diagnostic with the unstable band
  shaded and k* marked.
- Pitfalls fixed across 3 cycles: radial-only displacement read as
  noise (-> azimuthal bunching); pitch = kStar*6 wound the spiral
  ~60 rad into concentric noise because the toy's nu^2 minimum sits
  past the plotted k range (-> decoupled visual pitch to a fixed
  loose 1.7; kStar drives only the diagnostic marker).
- Capture sweeps sigma {0.4,0.8,1.2,2.0,3.2} crossing Q=1 at an
  evolved state -> 5 distinct goldens (spiral -> smooth).
Gate: 5 invariants + smoke + visual 5/5 x3 PASS. Shipped.
