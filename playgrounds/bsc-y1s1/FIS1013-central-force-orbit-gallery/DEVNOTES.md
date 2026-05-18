# DEVNOTES - FIS1013-central-force-orbit-gallery (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Orbit under a central force F ~ r^p with a live effective-
potential V_eff(r) panel (energy line + turning points) and a readout
(E, L, p, r, class). 5 presets: Kepler ellipse, harmonic, precessing
rosette, unbound escape, near-circular. Pure local sim.js, no shared
engine, no GL.

## Post-build sweep record (2026-05-18) - capture gallery fix
- Opus visual-reviewer: 5/6, PARTIAL on "frames show only the Kepler
  preset, not the gallery contrast" (render correct; the capture path
  `if (CAPTURE_NAME) advance(1.0 + CAPTURE_FRAC*6.0)` only ever used
  the default Kepler preset). A real pedagogical gap for a *gallery*.
- Fix: capture now picks a preset by CAPTURE_FRAC index
  (Object.assign(st, PRESETS[idx]); rebuild(); advance(6.0)), so the
  five goldens step Kepler ellipse / harmonic / precessing rosette /
  unbound escape / near-circular. Deterministic. New inter-frame SSIM
  0.87..0.91 (was ~all-Kepler). Verified by my own inspection (t-000
  bound ellipse, t-050 rosette p=-2.5, t-100 near-circular E at the
  V_eff minimum) and a re-dispatched Opus visual-reviewer: 6/6,
  "prior single-preset defect resolved". Visual gate 5/5 x3.
- Also removed the raw `goldstein` bib key from the user-facing
  data-slot caption. hook/one_paragraph were already approachable.
- Minor polish (NOT a blocker, recorded for hero-promotion): the
  rosette frame traces only a short arc at advance(6.0); a longer
  trace would show the full flower. The frame is still correct and
  distinct, and the live page traces the full rosette over time.
- Index rebuilt.

## Invariants
6 tests (orbit closure for p=-1/Hooke, V_eff turning points, E/L
conservation via the symplectic step, escape classification). Plus
in-page __physicsCheck (dE<1e-4, dL<1e-7 over 2e4 steps). All
unaffected by the capture change.

## Post-build sweep record (2026-05-18) - two live-reported physics/UX bugs

User tested the live page and reported: "Kepler is zooming in and out
weirdly. Rosette just gets flung out into infinity (with the default
params)." Both confirmed and fixed.

### Bug 1: "Precessing rosette" preset escaped to infinity
Preset was `{ p: -2.5, L: 1.1, r0: 1.5, vr0: 0 }`. For V = k r^p the
force exponent is p-1; stable bound orbits need p > -2 (effective-
potential / Bertrand stability). At p = -2.5 V_eff has a *maximum*, no
well, no bound orbit. Headless run of the real sim.js:

  OLD p=-2.5  ESCAPED step 3204  r=500  dE=2.0e+5  class=unbound

It plunged to r=0.047 (near-singular r^(-3.5) force), fixed-dt Verlet
injected dE~2e5, particle flung out. Physics AND numerics made the
named preset wrong (the earlier sweep note above, "t-050 rosette
p=-2.5", was describing this broken preset).

Fix: preset -> `{ p: -1.5, L: 1.3, r0: 2.0, vr0: 0 }`.
  NEW p=-1.5  class=bound  rmin=0.945 rmax=2.000  dE=1.2e-6
p=-1.5 is bound, non-Bertrand, so it precesses. Apsidal angle
pi/sqrt(3+n), n=p-1=-2.5 -> ~254 deg/period (!=180) = genuine open
rosette. t-050 golden re-inspected: readout class=bound, V_eff panel
shows a well with two turning points around the particle.

### Bug 2: Kepler view breathed every orbit
`maxR = max(maxR*0.999, min(14, r*1.08))` chased instantaneous r with a
slow decay; a bound ellipse inflated maxR at apoapsis and decayed it at
periapsis, rescaling the whole scene each period. Replaced with monotone
`maxR = min(14, max(maxR, r*1.12))`; rebuild() already reseeds
maxR=st.r0*1.4 on any change/escape, so the frame fits once then holds.
Kepler is bound (rmin 0.692, rmax 1.800, dE 1e-8) so it never rescales
again. p slider still [-3,3]; user-dialled p<=-2 still escapes (correct
physics) but now as a clean monotone zoom-out + relaunch.

Re-verified: invariants 6/6, recaptured gallery, visual 5/5 x3, t-000
and t-050 inspected directly.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (6 tests)
- recapture (REQUIRED, capture path changed): node scripts/capture-reference.mjs
  --playground FIS1013-central-force-orbit-gallery --deterministic
- visual gate: npx playwright test visual.test.mjs (SSIM>0.92 x3)
- node scripts/build-index.mjs
