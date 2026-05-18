# DEVNOTES - FIS1013-bouncing-shapes-concave-surface (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Point balls fall into a selectable concave bowl (parabola,
V, quartic, circular arc, cosine well). On contact velocity is
reflected about the local tangent: normal scaled by restitution e,
tangential by 1 - mu. e=1, mu=0 conserves energy; e<1 settles. Pure
local sim.js, no shared engine, no GL.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS; confirmed by my own t-050
  inspection (quartic bowl, 6 coloured balls ON the surface with
  motion trails, readout "quartic y=a x^4 e=0.85 a=0.55", caption
  legible, no tunnelling/off-canvas).
- Health: hook/one_paragraph already approachable. Only fix: removed
  the raw bib key "(`kleppner`)" from the user-facing figcaption
  (kept the human-readable Kleppner and Kolenkow source).
  Render-neutral, NO recapture.
- 5 invariants. Index rebuilt.

## Feature add (2026-05-18) - 1000+ particles + shape arrangements

User request: "1000+ particles, with different presets as to their
original shape (star, heart, square, letter A, ball, asymmetric)".

- sim.js: ARRANGEMENTS map of inside-tests on normalized (u,v) in
  [-1,1]^2: scatter (legacy line), square, ball (disk), star (10-vertex
  point-in-polygon), heart (implicit (X^2+Y^2-1)^3 - X^2 Y^3 < 0),
  letterA (3 thick strokes via point-segment distance, the triangular
  counter falls out naturally), bolt (6-vertex lightning polygon -
  the required asymmetric figure: no horizontal or vertical mirror).
  createSystem rejection-samples n points inside the figure (guard
  n*400 tries), maps u->x=1.75u, v->y=2.5+1.05v, releases at rest with
  a colour index ci=floor((u+1)*3) so the figure reads as coloured
  vertical bands that stay legible while it shatters. scatter path and
  defaults unchanged, so the 5 invariants are untouched (still 5/5).
- playground.js: new controls (arrangement select, particle slider
  6..1800). Two render paths: n<=32 keeps the original glossy-sphere +
  fading-trail look; n>32 uses one batched Path2D per colour with solid
  dots (radius 64/sqrt(n), clamped) so 1800 balls hold 60 fps. Capture
  = deterministic 1200-ball star into the parabola, stepped by
  CAPTURE_FRAC*1.7 s (release -> shatter -> slosh) for 5 distinct
  dramatic goldens.
- Headless probe: all 6 shapes sample 1200/1200 points inside; 2400
  steps (10 s) of 1200 balls in ~75-92 ms (~0.03 ms/step), energy
  finite, settles. capture rAF 16.7 ms (60 fps).
- Verified by direct frame inspection: t-000 crisp recognizable star,
  t-050 dissolved pile at the parabola vertex, t-100 sloshing up both
  walls (e=0.85 not yet fully damped, correct). Visual gate 5/5 x3.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (5 tests)
- recapture (REQUIRED, #stage changed): node scripts/capture-reference.mjs
  --playground bsc-y1s1/FIS1013-bouncing-shapes-concave-surface --deterministic
- visual gate: npx playwright test visual.test.mjs (SSIM>0.92 x3)
- node scripts/build-index.mjs

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  5 passed + visual 5/5 x3. Shipped.
