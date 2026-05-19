# GATES: laser-cavity-3d

- Physics: shared/js/engine/laser-rate-cpu.js (built and tested
  first, tests/laser-rate.test.mjs, 7 tests). Threshold and Q-switch
  are emergent from the RK4 rate equations.
- Render: shared/js/engine-gl/laser-cavity-3d.js, additive
  atom/photon/beam point pools + mirror discs, default framebuffer +
  in-shader ACES (the headless-GL lesson).
- Anti-cheat: __physicsCheck re-derives the emergent threshold,
  sub-threshold floor and gain clamping; invariants assert the same
  plus the sharp output kink and the Q-switch energy accounting.
- Q-switch test history: several iterations - the physics was always
  right; the failures were model-inappropriate absolute magnitudes,
  too-short integration windows, and a stiff spike needing a fine dt.
  Final invariants are model-robust (transient spike peak >> CW,
  inversion undershoots below N_th, pulse energy = drained inversion).
- Determinism: capture fixes per-fraction pump (multiple of P_th),
  step count, camera.
