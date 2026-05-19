# DEVNOTES - soliton-canal-3d (hidden dev ref)

Repo-only.

## Build 2026-05-19 (SUITE#1)

- Shared KdV engine validated independently first (7 tests, including
  mass/momentum/energy to 1e-4 over 1e4 steps and the two-soliton
  overtaking collision to 1%). Committed 5373df87 before the renderer.
- GL water: Fresnel(sky reflect, deep body) + Blinn-Phong sun spec
  (HDR, feeds bloom) + crest sheen; concrete banks; caustic floor that
  samples the height texture curvature. Sky is analytic (gradient +
  sun disc), reused for the reflection so they match.
- Watch-outs:
  - sim N and engine NX must be equal (512) so a surface vertex
    samples its own R32F texel under NEAREST. If they diverge the
    surface looks quantised.
  - dispersion (canal-depth slider) scales the linear symbol; the
    invariant tests use the default 1, unaffected.
  - capture sweep steps ~ 4200*frac at dt=1.8e-3; if the collision is
    off-frame, retune the per-fraction step count, not the camera.
- If the gate visual flakes once (RT precision), re-gate before
  treating it as a real failure (precedent across the heroes).
