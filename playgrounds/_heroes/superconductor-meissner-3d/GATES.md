# GATES: superconductor-meissner-3d

- Physics: shared/js/engine/meissner-cpu.js (built and tested first,
  tests/meissner.test.mjs, 8 tests). Image-dipole moment -mz (the
  Meissner B.n=0 condition; on-axis cancellation verified in the
  test). Build correction: the image sign was +mz first; the
  surface-Bz-vanishes test caught it (anti-parallel coaxial pair is
  correctly repulsive = levitation).
- Render: shared/js/engine-gl/meissner-3d.js; CPU streamline
  integration through fieldAt, shaded solids, default framebuffer +
  in-shader ACES (headless-GL lesson). Dead loop / unused setMagnetY
  removed (simplifier).
- Anti-cheat: __physicsCheck re-checks surface screening +
  1/h^4 levitation; invariants assert divergence-free, London decay
  to 1%, and the weight balance.
- Honest framing: Type-II "vortex" is a labelled regime (no faked
  flux lattice); Earnshaw instability + Type-II pinning stated in
  spec, not a false stability claim.
- Determinism: capture fixes per-fraction (T,B), equilibrium height,
  camera.
