# DEVNOTES - quantum-tunnelling-barrier-3d (hidden dev ref)

Repo-only.

## Build 2026-05-19 (SUITE#6)

- Shared TDSE engine validated first (10 tests, committed 976540d1),
  reusing cn-tridiag.js's complex Thomas solver per rule #6. CN is
  unitary so the norm-drift < 1e-6 invariant is the anti-cheat.
- CN matrix: alpha = dt/(4 dx^2); A diag = 1 + i(2 alpha + dt/2 V),
  offdiag = -i alpha; RHS B = conjugate-signed; Dirichlet ends
  decoupled (boundary rows set to identity).
- Render: V(x) opaque ridge + |psi|^2 phase-coloured curtain
  (cyclic colour) + classical ball point; default framebuffer +
  in-shader ACES (the headless-GL RGBA16F lesson, as for #1-#5).
- Flux split read relative to the last barrier's right edge; R+T=1
  only after the packet clears the barrier (run length matters).
- Watch-out: capture sweeps the four presets + one default across
  fractions with a fixed step count and camera; if SSIM drifts it is
  the moving packet, recheck the per-fraction step count not physics.
