# DEVNOTES - special-relativity-starship-3d (hidden dev ref)

Repo-only.

## Build 2026-05-19 (SUITE#2)

- Shared SR engine validated first (8 tests, committed 7b57cd06).
  Convention fix during build: the APPARENT source position aberrates
  as (cos+beta)/(1+beta cos) (sky bunches forward), not the photon-
  momentum form; the self-inverse test alone did not catch it, the
  "90 deg star moves forward" test did.
- Render reuses the soliton-canal lesson: draw straight to the default
  framebuffer with in-shader ACES; RGBA16F FBO is not color-renderable
  under headless SwiftShader.
- Per-star SR math on CPU each frame (2600 stars), uploaded to a
  DYNAMIC point VBO; rings aberrated point-by-point as LINE_STRIPs
  (segmented when a vertex goes behind the cockpit).
- Probe inverts projection -> ship dir -> deaberrate -> lab angle +
  Doppler; analytic, no GPU pick.
- Watch-outs: FOV fixed on purpose (zoom would confound aberration);
  if golden frames flake, it is the RT-precision additive blend, not
  the physics. Star size clamps [1.5,7] px so ultra-beaming does not
  blow a single star across the screen.
