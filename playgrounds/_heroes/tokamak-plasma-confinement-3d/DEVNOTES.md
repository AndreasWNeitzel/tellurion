# DEVNOTES - tokamak-plasma-confinement-3d (hidden dev reference)

Repo-only. NOT linked from index.html, NOT in the gallery, never shown
to site users. Exhaustive debugging/maintenance reference.

## What it is
WebGL2 hero. Toroidal vessel, helical field lines coloured by |B|,
glowing core, and a particle ensemble split into co-passing (white),
counter-passing (blue) and trapped (amber, banana-orbit). Engine
shared/js/engine-gl/tokamak.js, sole consumer this playground.
Deterministic: mulberry32 seeded with DEFAULT_SEED.

## Physics and engine reuse (hard rule 6)
Closed-form quantities from shared/js/engine/tokamak-cpu.js
(re-exported by sim.js): MU0, safetyAtEdge, safetyAxis, bToroidal,
bounceTime. B_t proportional to 1/R; q = r B_t / (R B_p); q_axis ~
q_a/2 for parabolic current; trapped fraction ~ sqrt(a/R0) (inverse
aspect ratio mirror trapping). Sliders: R0 (1..3 m), a (0.2..1 m),
B0 (1..10 T), Ip (0.1..20 MA). Readout: q_edge, q_axis, trapped %,
FPS.

## Post-build sweep record (2026-05-18)
- First Opus visual-reviewer pass on the committed goldens scored
  1/6 (1 PASS, 2 PARTIAL, 3 FAIL): claimed FAIL on "all five frames
  effectively static / identical", "field lines a dot cloud, no
  helix", "only white population visible", and "particle cloud
  drowns the structure".
- Verified objectively rather than trusting OR dismissing the
  reviewer (black-hole-sweep precedent: thumbnails mislead this
  reviewer):
  * Committed-golden inter-frame SSIM (repo compareImagesSSIM, the
    gate's own comparator): t-000..t-100 = 0.8836, 0.8842, 0.8872,
    0.8869; t-000 vs t-100 = 0.8707. The frames are OBJECTIVELY very
    distinct (well below the gate's 0.92 match line). The reviewer's
    central "static / identical" FAIL is FALSE, a thumbnail-
    downscaling artifact.
  * HTTP probe served exactly like the real harness
    (tests/helpers/static-server.mjs). The served capture frame
    matches the committed golden (NOT stale, unlike the black-hole
    case). Live A vs B 3 s apart SSIM 0.9594: continuous motion is
    real. WebGL2 + EXT_color_buffer_float OK under SwiftShader, no
    pageerror, only benign ReadPixels GPU-stall perf warnings.
  * Full-resolution inspection by me: the torus, the faint blue
    helical flux-surface mesh, the glowing core band, and all three
    populations (white dominant, amber and some blue visible) are
    present. Functional and render-correct, just visually busy at
    thumbnail scale.
- Adjudication: reviewer's "static" and "stale" FAILs are objectively
  refuted; "only white visible" is largely a downscale artifact (the
  legend and full-res frame show amber/blue); "particle cloud drowns
  structure" is a fair but SUBJECTIVE hero-polish point, not a
  correctness defect. Not lowering the gate bar: the deterministic
  visual gate passes and the goldens are valid (served == committed).
- This was therefore a RENDER-NEUTRAL text sweep (no shader/
  playground change, no recapture, no visual-gate rerun; same
  precedent as the lorenz sweep). Fixed: placeholder hook/
  one_paragraph (rendered literally on the card); stale spec body
  header "(hero, Canvas2D MVP)" (FALSE, it is a working WebGL2
  engine); raw `goedbloed-plasma` bib key shown in the caption
  (goedbloed-plasma IS a valid key, line 1291; just not shown raw to
  users now); dense LaTeX description. Rewrote approachable, added
  standard spec sections; index.html description + figcaption
  rewritten. Invariants 4/4. Index rebuilt.

## HERO-PROMOTION candidates (for the hero-promotion backlog item)
- Thin the particle count and/or render field lines as explicit
  bright line primitives so the helical flux-surface topology is the
  visual dominant, not the dot cloud.
- Stronger emissive plasma-core glow (Planck-temperature falloff).
- Make co/counter/trapped colour separation read at thumbnail scale
  (boost amber/blue brightness or size, dim the white majority).
- Add a slow camera orbit so depth reads even when paused; widen the
  capture-fraction spread.
- Wire share-state (parseUrlState + Share button) so R0/a/B0/Ip
  round-trip in the URL (currently declared but not wired).

## Invariants (invariants.test.mjs) and rationale
1. q_a in (0.5, 3) for the ITER-like test params.
2. q_axis = q_a / 2 (parabolic current).
3. B_t proportional to 1/R: B_t(2,5,1)=2.5, B_t(4,5,1)=1.25.
4. banana bounce period > 0.
All closed-form on the CPU; the GPU only renders, cannot affect them.

## Gate commands
- node --check playground.js sim.js
  (engine: node --check ../../../shared/js/engine-gl/tokamak.js)
- npx vitest run invariants.test.mjs   (4 tests)
- node scripts/build-index.mjs
- visual gate: npx playwright test visual.test.mjs (SSIM>0.92 x3)
  ONLY if the #stage render changes; this sweep was text-only so it
  was not rerun (goldens verified valid: served == committed,
  inter-frame SSIM ~0.87).
- HTTP probe (NOT file://, ES modules CORS-block at origin null):
  /tmp/pg-probe.mjs pattern via tests/helpers/static-server.mjs.

## Sweep 2026-05-19
Stale goldens recaptured (deterministic, physically correct: toroidal plasma, co/counter-passing + trapped banana orbits) + render-neutral ## Explainer.
invariants 4 passed + visual 5/5 x3. Shipped.
