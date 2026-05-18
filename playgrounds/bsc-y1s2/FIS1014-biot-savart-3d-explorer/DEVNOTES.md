# DEVNOTES - FIS1014-biot-savart-3d-explorer (hidden dev ref)
Repo-only. Not linked, not in gallery, never shown to users.
Lives under playgrounds/bsc-y1s2/ (FIS1014 = year-1 semester-2 E&M).

## What it is
Canvas2D pseudo-3D. Current loop + Biot-Savart field glyphs and field
lines + on-axis Bz(z) profile. Readout: preset, I, R, |B|@axis,
state.

## Post-build sweep (2026-05-18)
- Opus visual-reviewer 5.5/6 PASS (dipole topology plausible, on-axis
  Bz peak correct, readout updating; the only soft note was that the
  camera orbit is subtle across 25% steps, not a defect). Render
  correct.
- hook/one_paragraph already approachable (ph=0). Only fix: removed
  the raw griffithsem2017 key from the data-slot caption.
  Render-neutral, NO recapture. Index rebuilt.

## Gate: node --check; vitest invariants; build-index; visual gate
  only if #stage changes (caption-only sweep).

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.
