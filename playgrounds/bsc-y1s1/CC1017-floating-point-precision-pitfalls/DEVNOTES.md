# DEVNOTES - CC1017-floating-point-precision-pitfalls (hidden dev ref)

Repo-only. NOT linked from index.html, NOT in the gallery, never shown
to site users.

## What it is
Canvas2D. The Patriot/Dhahran (25 Feb 1991) range-gate failure as a
drivable floating-point pitfall: the fire-control clock multiplies
counts by a 24-bit chop of 0.1, losing ~9.537e-8 s/tick, accumulating
linearly with uptime; after ~100 h the 0.34 s error displaces the
range gate ~0.5 km, the Scud track drops, no interceptor fires. Drag
uptime; toggle the patched build; lower panel shows the 24-bit chop
and the linear error growth.

## Numerics / engine
Pure local sim.js (no shared engine, no GL). Exact IEEE 24-bit chop
error per tick times uptime times closing speed. CAPTURE_FRAC drives
the uptime for the 5 reference frames.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer: 6/6 on the visual rubric (clear scene,
  error-vs-uptime panel, monotonic drift, legible labels, no blow-up,
  story reads). One PARTIAL it raised, "cannot confirm a live
  monospace numeric readout from static PNGs", is a static-frame
  limitation, not a render defect; the 24-bit chop value and
  error/tick ARE shown as text in-frame, and the spec's live-readout
  is the on-page panel.
- Verified by my own inspection of t-100: "TRACK LOST" banner, gate
  walked off to the barracks (impact burst), Patriot turret, the
  "0.1 ~ 209715/2097152 = 0.0999999046, error/tick 9.537e-8 s"
  explainer, and the linear clock-error graph. Minor cosmetic: at the
  terminal frame the "range gate" / "barracks" labels are partly over
  the impact burst (does not obscure the physics story; recorded as a
  hero-promotion polish nicety, NOT a blocker; reviewer rated 6/6).
- Health: hook/one_paragraph already approachable. Only fix: removed
  the raw "(`goldberg1991`)" bib key from the user-facing figcaption
  (kept the human-readable GAO / Skeel / Goldberg sources; spec
  Citations keeps the `key` cross-refs per repo convention).
  Render-neutral, NO recapture.
- 12 invariants. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (12 tests)
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was figcaption-only).

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  12 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
User feedback: scene looked like a children's drawing, interceptor was a green line, uninteresting. Rebuilt the rendering (deterministic): sky gradient + stars, fire-control radar rings + sweep, dune terrain, Scud and a real launched PAC-2 interceptor as detailed missiles with exhaust plumes and smoke trails, acquisition-gate corner brackets (green locked vs flashing-red empty 'tracking a ghost'), layered expanding fireball + shock ring + debris + screen red-alert on the historically-accurate gate-miss impact (no launch, Scud strikes the barracks; a 'misfire' is NOT what happened and the scene shows the real failure). Physics, capture contract and cause panel unchanged; screenshot-verified intercept and Dhahran-miss frames.
invariants Tests passed + visual 5/5 x3. Shipped.

## Engagement rework 2026-05-19 (user: "much more interesting animation, verticality, Iron-Dome look, not infantile cartoon")
Render-only; sim.js + the 12 invariants byte-identical (the
floating-point model and lesson are untouched). Replaced the flat
diagonal Scud + lerp interceptor + cartoon barracks/dunes with a
tactical-terminal engagement:
- Scud is now a ballistic arc (parabola, steeper near impact)
  descending from high left onto the protected asset.
- Patriot boosts near-vertically from the battery then pitches over
  under turn-rate-limited lead-pursuit guidance and converges on the
  Scud: a real curved arc using the vertical space. Deterministic
  (pure function of phase) so captures are byte-stable.
- Iron-Dome aesthetic: near-black, radar range rings + sweep + grid,
  thin glowing tapered trails, sleek vector darts (no fins/windows),
  rotating target reticle, clean bracketed PROTECTED ASSET marker
  (no barracks-with-windows), HUD status banner.
- Failure mode preserved and historically faithful: once the clock
  drift walks the gate off (rangeErr > gate half) the track is
  dropped, NO LAUNCH, the Scud completes its arc and destroys the
  asset (red alert). The labelled clock-drift offset (gate vs true
  Scud) is the FP lesson, kept; the FP cause panel + linear
  accumulation plot are kept as the demoted diagnostic.
- Default uptime 100 -> 18 h so the page opens on the compelling
  dual view: the drift is real and shown (61.8 ms, panel marker)
  AND the arced intercept succeeds; dragging uptime up still
  demonstrates the lethal failure.
- Goldens recaptured (render fully changed); capture sweeps
  uptime+phase 0..100 h: tracking -> 144 m offset threshold ->
  TRACK LOST -> asset impact. 5 byte-distinct frames.
Gate: 12 invariants + smoke + visual 5/5 x3 PASS. Shipped.
