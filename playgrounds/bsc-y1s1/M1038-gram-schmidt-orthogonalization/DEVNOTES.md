# DEVNOTES - M1038-gram-schmidt-orthogonalization (hidden dev ref)
Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Modified Gram-Schmidt in 2D: input vectors, the subtracted
projection (dashed), residual, then orthonormal u1,u2. Readout
(#readout): |u1.u2|, |v2-proj|.

## Post-build sweep (2026-05-18)
- Opus visual-reviewer 5/6, "readout BLOCKER". FALSE, same out-of-
  #stage false positive: index.html line 45 has <div id="readout">
  with #readout-orth and #readout-res; outside the #stage screenshot.
  The reviewer itself diagnosed "visual test captures only #stage".
  Hard rule 6 satisfied (CLAUDE.md 12.3). Render correct (reviewer
  PASS on the projection-subtraction step, perpendicular result,
  frame progression).
- Fixed placeholder hook/one_paragraph + removed the raw arfken-weber
  figcaption key. Render-neutral, NO recapture. Index rebuilt.

## Gate: node --check; vitest invariants; build-index; visual gate
  only if #stage changes (text-only sweep).

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  7 passed + visual 5/5 x3. Shipped.
