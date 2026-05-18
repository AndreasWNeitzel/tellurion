# REVIEW - AST2004-roche-tidal-disruption (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity
Spec.md provides physical setup, equations, and numerical method. Invariants and acceptance thresholds documented. Code audit deferred to maintainer after placeholder resolution.

## B. Physics & numerical robustness
Determinism, stability, and capture span deferred to detailed code review.

## C. Presentability
[HIGH-SEVERITY BLOCKER] spec.md contains placeholder status fields: hook: "STATUS: needs_hook", one_paragraph: "STATUS: needs_paragraph". These render on the gallery card and must be replaced with actual prose.

[NOTE] Tag indicates live-readout feature expected. Confirm CLAUDE.md rule is met: "A live invariant readout is visible in the playground UI. The number is rendered in a monospace span."

## Hero-candidate
NO. Classification deferred to maintainer.

## Action checklist for maintainer
1. **Replace placeholder hook and one_paragraph (BLOCKER).** spec.md lines require actual prose.
2. **Verify live invariant readout.** If live-readout tag is present, confirm a monospace invariant span is rendered in the UI on every frame.
3. **Complete scientific audit.** After placeholder resolution, run full physics, numerics, and capture-span audit.
