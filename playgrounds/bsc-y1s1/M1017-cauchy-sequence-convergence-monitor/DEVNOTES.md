# DEVNOTES - M1017-cauchy-sequence-convergence-monitor (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Sequence on a number line with an epsilon tube around the
limit; reports the smallest N(epsilon) trapping the tail. Convergent
demos (geometric, Leibniz) tighten; harmonic shown as a divergent
counterexample. Readout: tail diameter, epsilon, N.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 5/6 PASS with a minor PARTIAL on criterion 4:
  the interior frames (t-050/t-075, Leibniz held while N0 60->90) are
  visually similar. The reviewer explicitly said "not a flaw if
  intended ... Verdict: PASS"; the sequence/epsilon DO differ across
  the full set. This is an animation-pacing nicety, NOT a defect (the
  frames are not identical and the concept reads). Recorded for an
  optional hero-promotion polish, not fixed in this sweep.
- Fixed: placeholder hook/one_paragraph rewritten approachable
  (Cauchy = name-epsilon-get-N promise). Removed the raw arfken-weber
  key from the figcaption. Render-neutral, NO recapture. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  5 passed + visual 5/5 x3. Shipped.
