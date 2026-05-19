# DEVNOTES - wormhole-traversal-3d (hidden dev ref)

Repo-only.

## Build 2026-05-19 (SUITE#5)

- Shared Ellis engine validated first (10 tests, committed f49fd4ec).
  Closed-form embedding z = b0 asinh(l/b0) (since (dz/dl)^2 =
  b0^2/(b0^2+l^2)); traverse iff |L/E| < b0.
- Render: per-pixel RK2 null geodesic in (l, phi); side = sign(l_end)
  picks one of two procedural skies; throat skim glow at L ~ b0.
  Default framebuffer + in-shader ACES (headless-GL RGBA16F lesson).
- Build bug: a backtick character inside a GLSL `//` comment in the
  fragment-shader template literal silently terminated the JS string
  -> node --check SyntaxError. Removed the backticks. Watch for this
  in all future shader strings (no backticks anywhere in GLSL).
- Honest framing is a hard IA requirement: exotic-matter caveat is in
  spec.md (## Explainer + Honest framing), the page description, and
  the engine docstring.
- Watch-out: capture sweeps l = 14 - 26*frac (a full traversal); keep
  b0 fixed and yaw near zero or SSIM drifts on the sky.
