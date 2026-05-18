# DEVNOTES - FIS1013-foucault-pendulum (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Top-down Foucault pendulum: swing-plane precession at rate
Omega sin(latitude). Rosette trace, dashed initial axis, lit rim pegs
mark the current plane. Readout: latitude, t, omega_z, T_precess,
plane-rotated angle. RK4 on the linearised Coriolis EOMs. Pure local
sim.js.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS; confirmed by my own t-075
  inspection (golden rosette, precessing plane, full readout, no
  defects). Render correct.
- Fixed: placeholder hook/one_paragraph rewritten approachable
  (Foucault 1851, Omega sin lat, equator vs pole). Removed the raw
  marion-thornton key from the user-facing figcaption. Render-neutral,
  NO recapture. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.
