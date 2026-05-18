# DEVNOTES - FIS3029-wkb-vs-shooting (hidden dev ref)

Repo-only. Not user-facing.

## Sweep 2026-05-18 (text-only, render-neutral)

Deep-audit REVIEW.md verdict was "RENDER-NEUTRAL TEXT FIX ONLY":
physics CLEAN (Bohr-Sommerfeld vs exact shooting, power-law well), the
only blocker was placeholder spec frontmatter
(hook/one_paragraph = STATUS: needs_*). Rewrote both as approachable
first-exposure-undergrad prose (the half-wave action rule; p=2 exact,
p=4 ground-state factor-3 miss, high-n correspondence). sim.js /
playground.js untouched -> invariants 4/4, visual 5/5 x3 against the
existing goldens (render unchanged, no recapture). Index rebuilt;
shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.
