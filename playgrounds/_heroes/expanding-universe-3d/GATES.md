# GATES: expanding-universe-3d

- Physics: shared/js/engine/friedmann-cpu.js (built and tested first,
  tests/friedmann.test.mjs, 9 tests). RK4 on da/dt with closed-
  universe turnaround + Big-Crunch detection.
- Render: shared/js/engine-gl/cosmic-lattice-3d.js. WebGL2, default
  framebuffer + in-shader ACES (the established headless-GL lesson).
- Anti-cheat: __physicsCheck recomputes the Friedmann constraint
  (a_dot/a)^2 = H0^2 E(a) on the integrated table; invariants assert
  it plus Hubble's law, 1+z = a-ratio, and the closed recollapse.
- Determinism: capture fixes a per-fraction model + camera; no time
  uniform in shaders. EdS power law measured from the Big Bang time
  (a test-side subtlety, engine is exact).
- S4: Omega_r fixed tiny, pan absent, both stated in spec.
