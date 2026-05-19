# GATES: blackhole-geodesics-3d

- Physics: shared/js/engine/schwarzschild-geodesic-cpu.js (built and
  tested first, tests/schwarzschild-geodesic.test.mjs, 8 tests).
  Sign fix during build: an incoming ray has du/dphi > 0 (u
  increasing); the self-inverse-style tests did not catch it, the
  sharp-threshold bisection did.
- Render: REUSES the proven shared/js/engine-gl/schwarzschild-kerr.js
  (no new GL). Spin slider feeds the shader only; analysed geodesics
  are Schwarzschild and the readout states it.
- Anti-cheat: __physicsCheck re-derives the capture/escape flip at
  b_crit; invariants assert the bisected threshold < 0.1 percent and
  the conserved null orbit invariant < 1e-4.
- Determinism: capture sweeps b with a fixed per-fraction camera and a
  fully-drawn geodesic (anim complete).
- S4: disc radii and observer distance fixed for golden stability,
  stated in spec.
