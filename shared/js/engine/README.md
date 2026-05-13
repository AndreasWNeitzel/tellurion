# shared/js/engine/

Headless numerical engines. No DOM, no `performance.now`, no `window`. Each engine exports the API contract from `docs/ARCHITECTURE.md`:

```
create(state)        // factory
step(instance, dt)   // mutate state in place
diagnostics(instance) // return scalar invariants
snapshot(instance)   // structured-cloneable copy
seed(instance, n)    // for stochastic engines
```

Build engines in the order set by `docs/BUILD_ORDER.md`. The `numerics-skeptic` subagent reviews each engine's integrator and stability bounds before implementation.

Engines under this directory are imported by playgrounds and by `tests/engines/*.test.mjs`. Each must ship its own unit test alongside the playground that first depends on it.

## Current engines

| name | depends on | implemented |
|------|------------|-------------|
| symplectic.js | none | no |
| fd-grid.js | none | no |
| yee-fdtd.js | none | no |
| mcmc-harness.js | rng.js | no |
| optimizer-harness.js | none | no |
| barnes-hut.js | none | no |
| lattice-mc.js | rng.js | no |
| mlp-trainer.js | optimizer-harness | no |
