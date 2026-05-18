# DEVNOTES - M1038-svd-singular-values-2d-shape (hidden dev ref)
Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. M = U S V^T as four panels (unit circle -> V^T -> S ->
U), singular values = ellipse semi-axes. Readout: sigma_1, sigma_2,
cond(M). Closed-form via eigenvalues of M^T M.

## Post-build sweep (2026-05-18)
- Opus visual-reviewer 5/6, PARTIAL "singular-vector axes not drawn
  as arrows on the ellipses". Checked spec.md: it does NOT promise
  drawn singular-vector arrows (only a numerical-stability note for
  s_2 -> 0). So this is a reviewer design preference, NOT a spec/impl
  divergence and NOT a defect; the 4-panel U.S.V^T decomposition and
  the sigma_1/sigma_2/cond readout convey the SVD correctly (reviewer
  PASS on geometry, readout, frame progression). Recorded as an
  optional hero-promotion enhancement, not fixed in this sweep.
- Fixed placeholder hook/one_paragraph + removed the raw arfken-weber
  figcaption key. Render-neutral, NO recapture. Index rebuilt.

## Gate: node --check; vitest invariants; build-index; visual gate
  only if #stage changes (text-only sweep).

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.
