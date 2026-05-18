# DEVNOTES - FIS1013-double-pendulum (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.
Phase-1 anchor piece (validates the render + invariant infra).

## What it is
Canvas2D. Planar double pendulum, velocity-Verlet + predictor-
corrector for the qdot-dependent Christoffel terms (physics dt 1 ms),
shared/js/engine/symplectic.js. Left: the linkage + lower-bob trail.
Right: phase trajectory (theta1 mod 2pi, omega1). Live readout panel
(#readout, below the figure): theta1, theta2, E (J), |dE/E|, Poincare
count.

## Post-build sweep record (2026-05-18) - reviewer false-blocker adjudicated
- Opus visual-reviewer: 5/6, called the live invariant readout
  "absent" and escalated a CLAUDE.md hard-rule-6 BLOCKER.
- Investigated rather than trusting it (anchor piece + hard-rule
  claim): index.html lines 67-72 define <div id="readout"> with
  spans readout-theta1/theta2/E/dE/poincare; playground.js wires
  them. The visual gate screenshots ONLY #stage, so an HTML readout
  panel BELOW the canvas is never in the golden PNGs; the reviewer
  could not see it. Confirmed live via an HTTP probe served like the
  real harness: readout renders theta1=-6.95, theta2=-3.00,
  E=18.7803 J, |dE/E|=5.86e-6, Poincare=0, and E updates
  18.7803->18.7806 over 1.5 s (live). Full-page screenshot shows the
  panel rendered. The reviewer's BLOCKER is FALSE; hard rule 6 is
  satisfied. Recorded here (CLAUDE.md 12.3: do not silently overrule
  a reviewer).
- The render itself is correct (reviewer PASS on linkage, chaotic
  trail, frame progression, mechanical integrity; my full-page
  inspection agrees). Description was already approachable.
- Fixed: placeholder hook/one_paragraph (rendered literally on the
  card) rewritten approachable (chaos, sensitivity, symplectic energy
  conservation). Figcaption had NO raw bib key (cites Newman/Strogatz
  cleanly). Render-neutral, NO recapture. Invariants 6/6. Index
  rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (6 tests)
- node scripts/build-index.mjs
- live-readout check: HTTP-serve (tests/helpers/static-server.mjs),
  not file:// (ES modules CORS-block); read #readout-* textContent.
- visual gate only if #stage changes (this sweep was text-only).

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.
