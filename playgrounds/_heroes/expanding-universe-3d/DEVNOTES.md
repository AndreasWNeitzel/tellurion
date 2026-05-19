# DEVNOTES - expanding-universe-3d (hidden dev ref)

Repo-only.

## Build 2026-05-19 (SUITE#4)

- Shared Friedmann engine validated first (9 tests, committed
  c6b9ae78). Test-side fix: the Einstein-de Sitter exponent must be
  measured in time-since-the-Big-Bang (t - t_bb), not cosmic time
  (t=0 is today); the engine itself is exact.
- Render reuses the established headless-GL lesson: default
  framebuffer + in-shader ACES; additive galaxy point sprites whose
  proper position is comoving * a(t), redshift tint by distance.
- Light pulse emits from a lattice galaxy (index seeded by click x)
  toward the origin; the displayed redshift is the engine's
  a_now/a_emit - 1, the quantity that matters.
- Closed-universe turnaround: engine flips da/dt sign when E(a)
  crosses zero with Om_k < 0; Big-Crunch invariant guards it.
- Bug fixed during build: an invalid hex seed literal in the GL
  module (0xC05M1C) -> replaced with 0x05317 + gridN.
- Watch-out: capture sweeps the four model presets across fractions;
  keep the per-fraction camera fixed or SSIM drifts on the lattice.
