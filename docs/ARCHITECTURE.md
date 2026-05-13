# Architecture

## Module organization

```
shared/
  css/
    tokens.css           single source of truth for colors, fonts, spacing
    base.css             reset, typography, layout primitives
    fonts.css            @font-face for Inter, IBM Plex Mono
  js/
    engine/              numerical engines, headless, no DOM
      fd-grid.js
      yee-fdtd.js
      lattice-mc.js
      mcmc-harness.js
      barnes-hut.js
      symplectic.js
      optimizer-harness.js
      mlp-trainer.js
    render/
      canvas-utils.js
      colormaps.js
      svg-utils.js
      katex-helper.js
      rng.js
    controls/
      knob.js
      drag-handle.js
      parameter-panel.js
      play-pause.js
      reset-button.js
      theme-toggle.js
    invariants/
      energy.js
      momentum.js
      ess.js
      detailed-balance.js
      ks-divergence.js
      ssim.js
```

## Engine API contract

Every engine in `shared/js/engine/` exports:

1. A `create(state)` factory that returns an opaque instance.
2. A `step(instance, dt)` function that advances by `dt` and returns nothing (mutation in place for speed).
3. A `diagnostics(instance)` function that returns an object of named scalar invariants.
4. A `snapshot(instance)` function that returns a structured-cloneable copy of the state for testing.
5. A `seed(instance, n)` function for stochastic engines.

The engine is purely numerical. It does not know about Canvas or DOM. Playgrounds wire the engine to a renderer.

Example:

```javascript
// shared/js/engine/symplectic.js
export function create({ N, masses, positions, velocities }) { ... }
export function step(instance, dt) { /* velocity-Verlet */ }
export function diagnostics(instance) {
  return { energy: ..., angularMomentum: ..., lrl: ... };
}
export function snapshot(instance) { ... }
```

This contract makes engines testable without rendering. Invariant tests import the engine directly; the playground imports the engine plus a renderer.

## Render loop

Use a fixed physics step with an accumulator, decoupled from render dt. The render loop interpolates only if necessary.

```javascript
const PHYSICS_DT = 1 / 240;
let accumulator = 0;
let lastTime = performance.now();

function tick(now) {
  const frameDt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  accumulator += frameDt;
  while (accumulator >= PHYSICS_DT) {
    engine.step(sim, PHYSICS_DT);
    accumulator -= PHYSICS_DT;
  }
  renderer.draw(sim);
  readoutPanel.update(engine.diagnostics(sim));
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```

The accumulator pattern prevents the simulation from depending on frame rate. The readout updates on every render but is throttled inside `readoutPanel.update` to 10 Hz.

## Theming

`shared/css/tokens.css` defines CSS custom properties. `shared/css/base.css` consumes them. Playground-level CSS overrides are forbidden except for a documented playground-specific accent.

Dark mode swaps token values via `@media (prefers-color-scheme: dark)` and a `[data-theme="dark"]` class for manual override.

## Determinism

For visual reference capture, the playground must accept a query parameter `?seed=N&deterministic=1`. When set:

- All RNG seeded explicitly.
- All time-dependent features driven by an internal clock that increments by `PHYSICS_DT` per step rather than `performance.now`.
- Capture timing keyed to the internal clock, not wall time.

The `scripts/capture-reference.mjs` script sets these parameters and waits for an explicit `simulation-ready` window event before capturing each frame.

## Bundling

`scripts/bundle.sh <playground>` runs esbuild to produce `dist/playgrounds/<playground>/index.html`, `bundle.js`, `bundle.css`, and `goldens/`. The bundle is self-contained and can be served as a static file from any path. No build-time secrets.

## Hosting

Bundled artifacts are mounted into the personal-site repo at `assets/playgrounds/<playground>/`. The site embeds them in an `<iframe sandbox>` so each playground is sandboxed and CSP-isolated.

## Testing

- **Unit**: Vitest on engines under `shared/js/engine/`. Tests at `tests/engines/<engine>.test.mjs`.
- **Playground invariants**: Vitest per playground, at `playgrounds/<name>/invariants.test.mjs`. Imports the engine and runs headless.
- **Visual**: Playwright + SSIM. Configured in `playwright.config.ts`. Test files at `playgrounds/<name>/visual.test.mjs`.
- **Multimodal**: handled by `visual-reviewer` subagent, not by a static test.

## CI

GitHub Actions workflow at `.github/workflows/verify.yml`:

1. Install Node, install Playwright browsers (cached).
2. Run engine unit tests.
3. Run every playground's invariants.test.mjs.
4. Run every playground's visual.test.mjs.
5. Run aesthetics-reviewer in a non-blocking advisory mode (LLM cost cap).
6. On main branch: bundle and prepare deploy artifact (no auto-publish).

## Forbidden patterns

- Calling `Math.random` outside `shared/js/render/rng.js`.
- Time-of-day or wall-clock dependence in simulation logic.
- Inline styles in JSX-like template literals (we don't use JSX; this is vanilla DOM with template strings).
- Top-level await inside engine modules (Vitest loads them at the wrong moment otherwise).
- Mutation of engine state from the renderer.
- Reading from `performance.now()` inside the engine.

## Performance budget

- Engine step time on a mid-range laptop: under `PHYSICS_DT * 0.6` so we stay under budget at 240 Hz physics.
- Render time per frame: under 8 ms.
- Memory: a single playground under 50 MB heap.

If a playground exceeds these, profile before optimizing. Likely culprits: O(N^2) inner loops, garbage collection from object allocation in hot path, ImageData per-frame allocation.
