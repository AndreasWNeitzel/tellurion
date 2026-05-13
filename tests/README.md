# tests/

Cross-cutting tests that do not belong to a single playground.

```
tests/
  helpers/
    ssim.mjs         Playwright + pngjs + ssim.js comparator
  engines/
    <engine>.test.mjs  unit tests per shared engine
```

Per-playground invariant and visual tests live in their own folder under `playgrounds/<slug>/`, not here.

Vitest is configured to pick up `tests/**/*.test.mjs` and `playgrounds/*/invariants.test.mjs`. Playwright is configured to pick up `playgrounds/*/visual.test.mjs`.
