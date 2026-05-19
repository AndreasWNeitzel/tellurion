# GATES: soliton-canal-3d

Engineering decisions and assumptions.

- Physics engine: shared/js/engine/kdv-1d-spectral-cpu.js (built first,
  tested in tests/kdv-1d-spectral.test.mjs). Integrating-factor RK4,
  exact linear propagator exp(i delta k^3 h), 2/3 Orszag dealiasing.
  N=512, L=60, dt=1.8e-3, ~7 steps/frame.
- Render: shared/js/engine-gl/kdv-canal-3d.js. WebGL2 (relaxation
  documented in spec.md). Reuses createGL2 / compileProgram /
  createFBO / setupPostProcess. Height as an R32F NX-wide texture,
  NEAREST so each surface vertex samples its own node exactly.
- Determinism: shaders have no time uniform; the dither is per-pixel
  hash only. Capture seeds the two-soliton preset and steps
  proportionally to captureFraction with a fixed per-fraction camera,
  so the five golden frames are a deterministic collision sweep.
- Conservation is the anti-cheat gate: __physicsCheck re-runs the
  integrator headlessly and fails if mass/momentum/energy drift
  exceeds 1e-4; invariants.test.mjs asserts the same plus the
  amplitude-speed law, the post-collision amplitudes, and the
  soliton-vs-dispersion contrast.
- Pan is intentionally omitted (S4 states it): the canal is the whole
  scene and a fixed orbit target keeps the collision framed.
