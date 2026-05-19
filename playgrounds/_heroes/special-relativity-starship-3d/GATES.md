# GATES: special-relativity-starship-3d

- Physics: shared/js/engine/special-relativity-cpu.js (built and
  tested first, tests/special-relativity.test.mjs, 8 tests). Exact
  Lorentz optics; no easing.
- Render: shared/js/engine-gl/starship-3d.js. WebGL2 (relaxation in
  spec.md). Additive points, default framebuffer + in-shader ACES
  (RGBA16F FBO not color-renderable in headless GL, same finding as
  soliton-canal-3d).
- Determinism: seeded star catalogue (mulberry 0xC0FFEE); capture
  sweeps beta with a fixed look; no time uniform in shaders.
- Anti-cheat: __physicsCheck recomputes gamma and aberration round
  trip; invariants.test.mjs asserts interval invariance, self-inverse
  aberration, beaming = Doppler^4, Newtonian limit.
- S4: zoom intentionally fixed FOV, marker spacing and star density
  intentionally fixed; all stated in spec, not silent.
- Probe inverts the projection analytically (no GPU pick).
