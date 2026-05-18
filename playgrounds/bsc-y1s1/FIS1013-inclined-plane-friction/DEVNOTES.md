# DEVNOTES - FIS1013-inclined-plane-friction (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Block on a ramp with Coulomb friction: static until
tan theta > mu_s, then slides with a = g(sin theta - mu_k cos theta).
Block colour/label flips static->sliding; side panel plots numerical
v(t) over the analytic prediction; readout: theta_c, relative error.
velocity-Verlet. Pure local sim.js.

## Post-build sweep record (2026-05-18) - reviewer non-defect adjudicated
- Opus visual-reviewer 5/6, called "force arrows absent" a blocking
  pedagogical defect. Investigated: playground.js draws no force
  arrows AND the spec/README never promise any (the reviewer itself
  noted "spec/README do not explicitly require force arrows, but the
  user's prompt assumes they exist"). So this is NOT a spec/impl
  divergence and NOT a defect; it was my review-prompt over-
  specifying. The actual playground is a valid static-vs-sliding +
  v(t)-vs-analytic demo (reviewer PASS on regime transition, numeric
  agreement, readout, legibility). No fix needed to the render.
  Optional future enhancement (NOT in sweep scope): add a free-body
  arrow overlay.
- Fixed: placeholder hook/one_paragraph rewritten approachable
  (friction as a threshold, critical angle, a = g(sin - mu cos)).
  Removed the raw marion-thornton key from the figcaption.
  Render-neutral, NO recapture. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  6 passed + visual 5/5 x3. Shipped.
