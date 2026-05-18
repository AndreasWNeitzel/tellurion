# DEVNOTES - FIS1014-coulomb-equilibrium-charges (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.
Lives under playgrounds/bsc-y1s2/ (FIS1014 = year-1 semester-2 E&M).

## What it is
Canvas2D. Fixed point charges (square / dipole / line / hexagon) +
draggable test charge flowing along field lines; equilibria where the
net field is zero (all saddles by Earnshaw). Find-equilibrium force
descent. Readout (#readout, HTML below #stage): F, V.

## Post-build sweep (2026-05-18) - first to consume a pre-computed REVIEW.md
- Pre-review by the chunk-0 background agent (REVIEW.md): verdict
  RENDER-NEUTRAL TEXT FIX ONLY; defects = placeholder hook/
  one_paragraph (spec lines 12-13) and raw `griffiths-em` key in
  index.html line 8 + line 11 and README line 2 (and spec body line
  23). Golden frames verified distinct/coherent; hero NO; readout is
  an HTML div below #stage (NOT a defect).
- My own t-050 spot-check confirmed the render (square of charges,
  field lines, test-charge trace, readout). Render-neutral.
- Fixed: rewrote placeholder hook/one_paragraph approachable (Coulomb
  sum, field-line flow, Earnshaw/Laplace -> saddles, ion traps).
  Removed the raw griffiths-em key from index.html (description +
  figcaption), README, and the spec body line, replacing with
  "Griffiths, Introduction to Electrodynamics, Ch. 2"; sharpened the
  index description to state the Earnshaw saddle point. NO recapture.
  Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).

## Sweep 2026-05-18
Recaptured stale golden frames (deterministic across two runs); screenshot-verified physically correct (quadrupole field-line topology, test charge departing the unstable central equilibrium). Added comprehensive ## Explainer.
invariants Tests passed + visual 5/5 x3. Shipped.
