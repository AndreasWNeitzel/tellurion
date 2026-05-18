# DEVNOTES - earth-axial-precession-nutation-3d (hidden dev reference)

Repo-only. NOT linked from index.html, NOT in the gallery, never shown
to site users. Exhaustive debugging/maintenance reference.

## What it is
WebGL2 hero. Lit 3D Earth at obliquity; spin axis drawn into world
space; the axis tip traces the lunisolar precession cone with the
18.6-yr nutation superposed. Camera: drag-orbit, scroll-zoom. Readout:
simulated year + axis angles. Share keys: scale (zoom), year0 (epoch).

## Physics constants and why these values
- General precession in longitude: 50.29 arcsec/yr (IAU; Smart). Drives
  the cone; integrated, gives 360 deg in ~25,772 yr (the "Platonic
  year" / pole-star cycle).
- Mean obliquity epsilon0: the standard epoch value ~23.44 deg
  (EPS0_DEG in the shared engine) with the slow secular term. Sets the
  precession-cone half-angle.
- Nutation, principal term only: period 18.6 yr (regression of the
  Moon's ascending node). Amplitudes Delta-psi = 17.2 arcsec
  (longitude), Delta-epsilon = 9.2 arcsec (obliquity). These are the
  dominant IAU nutation coefficients; the hundreds of smaller terms are
  intentionally omitted (see Approximations).

## Engine reuse (hard rule 6)
Imports precessionLongitude, nutation, obliquity, EPS0_DEG from
shared/js/engine/earth-rotation-cpu.js. No duplicated celestial-
mechanics code in this playground. If the cone math looks wrong, debug
the shared engine, not playground.js.

## Numerical method
Closed-form series evaluation only. No ODE, no RNG -> deterministic,
reproducible capture. axisAtYear(yr) gives the pole direction; the
trace samples 25772 yr over TRACE_MAX_POINTS. Capture sets
st.yearsElapsed = CAPTURE_FRAC * 25772 * 0.5 (up to half a circuit
across the 5 frames) so the cone visibly advances frame to frame.

## Invariants (invariants.test.mjs) and rationale
1. precessionLongitude(1) == 50.29 (+-0.01): the defining rate.
2. 360 deg accumulates in 25000-27000 yr: period closure / pole cycle.
3. obliquity(0) == EPS0_DEG (+-0.01 deg): correct base tilt.
4. max |Delta-epsilon| over 18.6 yr in 8-12 arcsec: nutation in epsilon.
5. max |Delta-psi| over 18.6 yr in 15-20 arcsec: nutation in longitude.
Loose-ish bands because the 9.2/17.2 values are the principal-term
amplitudes and the test scans the period numerically.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer (multimodal, golden frames + rubric): PASS on
  all categories - 3D lit Earth renders, precession cone legible and
  sweeps, nutation wobble visible, t-000/050/100 progress cleanly, no
  text overlap, readout present. Verdict: ship-ready.
- Defects found and fixed this sweep: spec.md had placeholder
  hook/one_paragraph (the gallery card rendered "STATUS: needs_hook")
  and a dense, non-approachable description/caption; rewrote all four
  for first-exposure undergrads and added the standard spec sections
  (physical setup, equations, method, expected features, invariants,
  limiting cases, risk). Physics numbers unchanged.
- Render-neutral edit: only spec.md frontmatter/body + this DEVNOTES;
  index.html #stage canvas unchanged, so golden frames stay valid and
  NO recapture / visual-gate rerun was required. Rebuilt the index so
  the gallery card picks up the new hook/one_paragraph/caption.

## Known approximations / limitations
- Only the principal 18.6-yr nutation term; full IAU1980/2000 has many
  more small terms. Sufficient for the qualitative pole-cycle story the
  invariants pin; do not claim arcsecond ephemeris accuracy.
- Time runs fast (simulated years per real second) for watchability;
  it is a visualization, not an ephemeris.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (5 tests)
- node scripts/build-index.mjs         (regenerate gallery card)
- visual gate: npx playwright test visual.test.mjs (SSIM>0.92 x3)
  Only needed if the #stage render changes; text/spec edits do not.
