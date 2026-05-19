# GATES: wormhole-traversal-3d

- Physics: shared/js/engine/wormhole-cpu.js (built and tested first,
  tests/wormhole.test.mjs, 10 tests). Ellis/Morris-Thorne; null norm
  conserved 1e-5; traverse < b0 / scatter > b0.
- Render: shared/js/engine-gl/wormhole-3d.js, per-pixel RK2 null
  geodesic, default framebuffer + in-shader ACES (headless-GL
  lesson). Build bug fixed: a backtick inside a GLSL comment closed
  the JS template literal; removed it.
- Anti-cheat: __physicsCheck re-derives flare-out + the traverse/
  scatter threshold + null drift from the CPU engine; invariants
  assert the same.
- Honest framing: spec.md + the page text + the docstring all state
  the exotic-matter caveat (IA authorship/honesty requirement).
- S4: zoom fixed FOV, yaw replaces full orbit, tidal scaling is a
  readout comparison knob (Ellis is tidal-free) - all stated.
- Determinism: capture sweeps l, fixed b0, near-zero yaw; sky time
  term frozen per fraction.
