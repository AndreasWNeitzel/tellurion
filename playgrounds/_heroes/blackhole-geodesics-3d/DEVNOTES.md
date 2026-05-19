# DEVNOTES - blackhole-geodesics-3d (hidden dev ref)

Repo-only.

## Build 2026-05-19 (SUITE#3)

- Shared geodesic engine validated first (8 tests, committed
  6e0e2bb8). Sign bug found via the sharp-threshold bisection test:
  an incoming ray has du/dphi > 0 (u increasing as r decreases); the
  escape detector also had the sign backwards. Fixed; threshold then
  lands on 3 sqrt3 M to < 0.1 percent.
- Render REUSES the proven schwarzschild-kerr.js hero shader; no new
  GL written (D3 risk reduction). The geodesics are the interactive
  subject on the equatorial-plane Canvas2D panel; the lensed BH is
  the hero scene.
- Spin slider only feeds the shader; analysed geodesics are
  Schwarzschild and the readout says so (no false Kerr claim).
- Watch-out: capture frames must have the geodesic fully drawn
  (g.anim = xs.length) and a fixed per-fraction camera, else SSIM
  flickers on the moving tracer.
