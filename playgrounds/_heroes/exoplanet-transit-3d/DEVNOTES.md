# DEVNOTES - exoplanet-transit-3d (hidden dev ref)

Repo-only.

## Build 2026-05-19 (SUITE#9)

- Shared transit engine validated first (8 tests, committed
  fbb0f530). Numerical disc integration (160 x 220 polar grid) with
  quadratic limb darkening; central-transit depth matches (Rp/Rs)^2
  to 1 percent (the invariant gate).
- Render: limb-darkened star imposter (point sprite with per-pixel
  mu = sqrt(1-r^2)) + planet dark disc imposter + orbit ring +
  background stars. Camera azimuth/elevation 0 = edge-on; an
  Edge-on button snaps back. Default framebuffer + in-shader ACES
  (the headless-GL RGBA16F lesson, as #1-#8).
- Light curve panel is prominent (S3 exception per directive).
- Watch-out: gl_PointSize for the star is set to 360 (covers a good
  fraction of the canvas at the chosen FOV); on stricter drivers
  PointSize may clamp, in which case widen the imposter to a quad.
  SwiftShader headless tolerates 360.
