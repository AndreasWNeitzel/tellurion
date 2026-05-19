# DEVNOTES - laser-cavity-3d (hidden dev ref)

Repo-only.

## Build 2026-05-19 (SUITE#8)

- Shared laser rate engine validated first (7 tests, committed
  00a8a308). The Q-switch test took several iterations: the physics
  was always correct (threshold, clamping, kink, pulse), the failures
  were my test thresholds, not the engine:
  1. absolute magnitude guesses (peak > 5, n > 1) replaced by
     model-robust relative comparisons (orders above the seed floor);
  2. "peak >> CW" only holds in the slow-upper-state regime
     (tau >> tauC) -> retuned to the textbook giant-pulse regime;
  3. the stiff spike NaNed at coarse dt -> fine dt (5e-4) in the
     open phase;
  4. pulse energy over-counted the post-pulse CW tail -> integrate
     only the spike window; the undershoot Nmin (not Nend) is the
     Q-switch signature.
- Render: additive atom/photon/beam point pools + two mirror discs,
  default framebuffer + in-shader ACES (the headless-GL RGBA16F
  lesson, as #1-#7).
- Playground sub-steps the integrator each frame so the Q-switch
  spike is resolved live.
- Watch-out: capture fixes pump = (multiple of P_th), step count,
  camera; if SSIM drifts it is the moving photons, recheck the
  per-fraction step count not the physics.
