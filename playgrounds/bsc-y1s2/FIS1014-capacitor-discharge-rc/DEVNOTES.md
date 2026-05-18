# DEVNOTES - FIS1014-capacitor-discharge-rc (hidden dev ref)
Repo-only. Not linked, not in gallery, never shown to users.
Lives under playgrounds/bsc-y1s2/.

## What it is
Canvas2D. RC circuit + V(t)=V0 e^{-t/RC} decay curve with a t=tau
(37%) marker. Readout: V_0, R, C, tau, live V. Closed-form.

## Post-build sweep (2026-05-18)
- Opus visual-reviewer 6/6 PASS (circuit + exponential decay, tau
  marker at 37%, readout consistent with the model, frames build,
  render correct).
- Fixed placeholder hook/one_paragraph (exponential decay, tau=RC the
  timing heartbeat). Removed the raw griffithsem2017 figcaption key.
  Render-neutral, NO recapture. Index rebuilt.

## Gate: node --check; vitest invariants; build-index; visual gate
  only if #stage changes (text-only sweep).

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.
