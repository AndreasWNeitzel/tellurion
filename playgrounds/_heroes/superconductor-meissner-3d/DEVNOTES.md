# DEVNOTES - superconductor-meissner-3d (hidden dev ref)

Repo-only.

## Build 2026-05-19 (SUITE#7)

- Shared Meissner engine validated first (8 tests, committed
  c4fcbeb4). Physics correction during build: the screening image
  must have moment -mz (so B.n=0 at the cold surface). I first wrote
  +mz; the "normal field vanishes at the surface" test failed and the
  on-axis algebra confirmed -mz. The anti-parallel coaxial pair is
  repulsive => the levitation force F = 3 m^2 / (32 h^4), consistent.
- Render: 30 CPU-integrated field-line streamlines through fieldAt
  (curve around when SC, penetrate when normal) + shaded magnet/
  sample boxes + glowing London skin. Default framebuffer + in-shader
  ACES (the headless-GL RGBA16F lesson, as #1-#6). Removed a dead
  loop and the unused setMagnetY (simplifier) before commit.
- Magnet height settles by a damped relaxation to
  levitationHeight(m, weight) when SC, else drops to ~0.7 (onto the
  sample). Honest: ideal Meissner is Earnshaw-unstable; spec states
  Type-II pinning gives real stability (no faked flux lattice).
- Watch-out: capture fixes per-fraction (T,B) preset + equilibrium
  height + camera; if SSIM drifts it is the settle animation, set
  h to the equilibrium directly in capture (already done).
