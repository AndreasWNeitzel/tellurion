# GATES: quantum-tunnelling-barrier-3d

- Physics: shared/js/engine/tdse-cn-cpu.js (built and tested first,
  tests/tdse-cn.test.mjs, 10 tests). Crank-Nicolson reusing the
  complex Thomas solver cn-tridiag.js (no engine duplication).
- Render: shared/js/engine-gl/tdse-landscape-3d.js, V(x) ridge +
  phase-coloured |psi|^2 curtain + classical ball, default
  framebuffer + in-shader ACES (headless-GL lesson).
- Anti-cheat: __physicsCheck re-runs CN headlessly and fails if the
  norm drifts > 1e-6 or R+T deviates from 1; invariants assert the
  same plus thickness-dependence and the analytic T(E) limits.
- Determinism: capture fixes a per-fraction preset + step count +
  camera; no time-based shader randomness.
- S4: pan absent (fixed target), no speed multiplier (fixed
  sub-steps + Step) - stated in spec.
