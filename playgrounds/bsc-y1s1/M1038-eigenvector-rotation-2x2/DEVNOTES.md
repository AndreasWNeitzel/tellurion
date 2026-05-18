# DEVNOTES - M1038-eigenvector-rotation-2x2 (hidden dev ref)
Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. 2x2 M maps the unit circle to an ellipse; eigenvector lines
with tips at |lambda_i|; generic vectors swing to the dominant
eigenvector. Readout (#readout): lambda_1,lambda_2; det,tr.

## Post-build sweep (2026-05-18)
- Opus visual-reviewer 5/6, called the live readout a hard-rule
  BLOCKER. FALSE: index.html line 45 has <div id="readout"
  role="status"> with #readout-eigs (lambda_1,lambda_2) and
  #readout-trdet (det,tr); the visual gate screenshots only #stage so
  the panel below the canvas is not in the goldens. Hard rule 6
  satisfied (CLAUDE.md 12.3 adjudication recorded). Render correct
  (reviewer PASS on circle/ellipse/eigenvectors, frame progression,
  no defects).
- Fixed placeholder hook/one_paragraph + removed the raw arfken-weber
  figcaption key. Render-neutral, NO recapture. Index rebuilt.

## Gate: node --check; vitest invariants; build-index; visual gate
  only if #stage changes (text-only sweep).

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  7 passed + visual 5/5 x3. Shipped.
