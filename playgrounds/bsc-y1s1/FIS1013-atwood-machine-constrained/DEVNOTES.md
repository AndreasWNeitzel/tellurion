# DEVNOTES - FIS1013-atwood-machine-constrained (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Atwood machine with a finite-inertia pulley:
a = (m1-m2)g / (m1+m2+I/R^2); unequal tensions T1 = m1(g-a),
T2 = m2(g+a). Disk/ring selector, zero-mass-pulley option, v(t)/a(t)
side traces. Pure local sim.js, no shared engine, no GL.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS; confirmed by my own t-050
  inspection: shaded massive pulley + gold spoke, m1/m2 blocks, cyan
  T=24 vs T=23 (unequal, the physics point), magenta weights, full
  readout (a, T1, T2, I, regime), linear v(t) / flat a(t) traces.
- Health: hook/one_paragraph already approachable. Only fix: removed
  the raw bib key "(`marion-thornton`)" from the user-facing
  data-slot caption (kept the human-readable Marion and Thornton
  source). Render-neutral (figcaption is below #stage), NO recapture.
- 6 invariants. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (6 tests)
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was caption-only).
