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

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (5 tests)
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was caption-only).
