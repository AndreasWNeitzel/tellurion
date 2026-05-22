# Playgrounds Portfolio

In-browser physics and astronomy playgrounds rendered with Canvas2D and SVG, with a WebGL2 carve-out for the 3D showcase pieces. Each one is an interactive simulation backed by a headless numerical engine, not a static figure. The portfolio is built to read as research code rather than textbook clipart.

## What is here

- **305 curriculum playgrounds** mapped to the University of Porto FCUP BSc in Physics (years 1-3) and MSc in Astronomy & Astrophysics. Each ships a `spec.md` (physical setup, equations, numerical method, citations, controls, expected features, acceptance thresholds), a headless simulation module, a `playground.js` UI, and the two automated gates described under Testing.
- **53 heroes** (`playgrounds/_heroes/`) and **5 legends** (`playgrounds/_legends/`): the larger 3D and multi-mode showcase playgrounds. Several use the WebGL2 layer in `shared/js/engine-gl/`, the documented exception to the Canvas2D/SVG rule.
- **Shared infrastructure**: numerical engines (`shared/js/engine/`), Canvas2D/SVG render primitives and colormaps (`shared/js/render/`), controls including the share-state URL contract (`shared/js/controls/`), and WebGL2 primitives (`shared/js/engine-gl/`).
- **Dissemination layer**: the landing page (`scripts/build-landing.mjs`, root `index.html`), a controlled tag vocabulary (`docs/TAGS.md`), the curriculum index (`docs/CURRICULUM.md`), and the card index (`docs/INDEX.md`).

## Curriculum mapping

Every playground carries `primary_uc` and `curriculum_year` in its `spec.md` frontmatter, drawn from FCUP's BSc Physics and MSc Astronomy & Astrophysics units. Regenerate the chronological index with:

```
node scripts/build-curriculum-index.mjs   # writes docs/CURRICULUM.md
```

## Testing

Each playground carries two automated gates:

- `invariants.test.mjs` (Vitest): conservation and identity checks on the headless simulation (energy, momentum, probability, detailed balance, analytic limiting cases), at thresholds set in the playground's `spec.md`.
- `visual.test.mjs` (Playwright): SSIM regression at threshold 0.92 against committed golden frames, run under SwiftShader for reproducible headless capture.

These gates check that the numerics are stable and the render has not regressed between commits. They do not establish that the physics setup or the pedagogy is correct; that review is done by people. A `.verified` marker is written for a playground when both gates pass.

## How to develop

Stack: plain ES2022 modules, no frameworks. KaTeX for math. Canvas2D and SVG, with WebGL2 limited to the heroes (CLAUDE.md hard rule 8).

```
npm install                                             # one-time
npx vitest run                                           # invariant tests (Vitest)
npx playwright test                                      # visual gates (SwiftShader-compatible)
node scripts/build-landing.mjs                           # regen the landing page
node scripts/build-index.mjs                             # regen docs/INDEX.md
node scripts/build-curriculum-index.mjs                  # regen docs/CURRICULUM.md
node scripts/lint-playground-html.mjs <slug>             # pre-ship HTML lint
node scripts/capture-reference.mjs --playground <slug>   # capture deterministic golden frames
```

## Contributing

The shippable bar for a playground (spec, gates, accessibility, a live invariant readout, a diagnostic plot, the share-state contract) is defined in `CLAUDE.md` and `docs/VERIFICATION.md`. New playgrounds scaffold from `playgrounds/_template/`. House style: no em-dash or en-dash, no emoji, every playground cites a source.

## License

MIT. See `LICENSE`.

## Maintainer

Andreas W. Neitzel. ORCID 0000-0001-6283-907X. IA/CAUP, University of Porto. andreaswneitzel@gmail.com
