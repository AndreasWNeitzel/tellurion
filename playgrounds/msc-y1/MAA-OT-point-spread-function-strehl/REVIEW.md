# REVIEW - point-spread-function-strehl (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [high] spec.md is architect placeholder; fill with PSF definition (Airy disk for diffraction-limited aperture), Strehl ratio (peak normalized by diffraction limit), phase errors/aberrations, wavefront error scaling, invariants (Strehl monotonic decrease with aberration, PSF broadens as wavefront degrades).
2. [medium] README stub; explain diffraction-limited imaging, Strehl as image quality metric, what to observe (PSF core narrowing/broadening with aberration), controls (aperture shape if switchable, aberration magnitude, wavelength).
3. [medium] index.html figcaption and description minimal.

## Text / approachability
spec and README stubs. User sees PSF shape change but no explanation of diffraction or wavefront error impact.

## Source-material & equation fidelity
Airy disk formula and Strehl ratio (peak intensity ratio to diffraction limit) appear correct. Wavefront error propagation is accurate. Reference: Born & Wolf (optics).

## Golden-frame observations
Frames show diffraction-limited Airy disk, aberrations broaden core and raise sidelobe floor, Strehl ratio decreases monotonically. No visual defects.

## Hero-candidate
NO. Optics/instrumentation pedagogy; tier: simple.

## Maintainer notes
Spec, README, figcaption. PSF optics code is correct.
