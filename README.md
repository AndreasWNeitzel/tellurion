# Playgrounds Portfolio

Curated set of in-browser physics, astronomy, statistical-mechanics, and machine-learning playgrounds rendered with Canvas2D and SVG. The audience is AI-lab hiring committees and ESA Research Fellowship reviewers. Every artifact reads as research code, not as textbook clipart.

## What is here

- **203 verified playgrounds** spanning the UPorto FCUP Bachelor in Physics (years 1-3) and the MSc in Astronomy and Astrophysics. Each one ships with a `spec.md` describing physical setup + equations + numerical method + citations, a headless `sim.js`, ≥5 Vitest invariants, a `playground.js` UI, Playwright SSIM visual gates at threshold 0.92, and a `.verified` marker.
- **6 designated WebGL2 heroes** (`playgrounds/_heroes/`): wave-heightfield-clickable-3d and lorenz-attractor-3d-ensemble shipped as Canvas2D MVPs; hydrogen-orbitals-3d, tokamak-plasma-confinement-3d, earth-axial-precession-nutation-3d, schwarzschild-kerr-blackhole-3d scoped with full visual-standard spec.md and queued for WebGL2 implementation. See `docs/HEROES.md` and `docs/NEEDS-ATTENTION.md`.
- **Shared infrastructure**: numerical engines under `shared/js/engine/`, render primitives + colormaps under `shared/js/render/`, controls under `shared/js/controls/` (incl. share-state URL contract), engine-gl primitives under `shared/js/engine-gl/`.
- **Dissemination layer**: landing page (`scripts/build-landing.mjs`, `dist/index.html` and root `index.html`), 24-tag controlled vocabulary (`docs/TAGS.md`), curriculum index (`docs/CURRICULUM.md`), card index (`docs/INDEX.md`).

## Curriculum mapping

Every playground is tagged with `primary_uc` and `curriculum_year` in its spec.md frontmatter, drawing from FCUP's BSc Physics and MSc Astronomy & Astrophysics units. Regenerate the chronological index with:

```
node scripts/build-curriculum-index.mjs   # writes docs/CURRICULUM.md
```

## How to develop

Stack: plain ES2022 modules. No frameworks. KaTeX for math. Canvas2D + SVG only (WebGL2 carve-out for heroes per CLAUDE.md hard rule 8). Tests with Vitest + Playwright.

```
npm install                                       # one-time
npx vitest run                                    # invariant tests (currently 1306 passing)
npx playwright test                               # visual gates (SwiftShader-compatible)
node scripts/build-landing.mjs                    # regen dist/index.html
node scripts/build-index.mjs                      # regen docs/INDEX.md
node scripts/build-curriculum-index.mjs           # regen docs/CURRICULUM.md
node scripts/lint-playground-html.mjs <slug>      # pre-ship HTML lint (catches raw <,> in $math$)
node scripts/capture-reference.mjs --playground <slug>   # capture deterministic golden frames
```

## What "done" means

Per `CLAUDE.md` section "What done means":

1. spec.md (physical setup, equations, numerics, citations, controls, expected features, invariants, thresholds).
2. invariants.test.mjs (≥5 conservation/identity tests, all passing offline).
3. visual.test.mjs (Playwright + SSIM 0.92 against committed golden frames).
4. Multimodal /critique pass returns "no missing qualitative features".
5. index.html accessible (keyboard, ARIA, AA contrast), 60 fps on mid-range laptop.
6. Live invariant readout in a monospace span.
7. Paper-style caption.
8. Three-paragraph README in the playground folder.
9. Share-state contract supported (URL hash, parseUrlState, mountShareButton).

## Hard rules

See `CLAUDE.md`. Highlights: no em-dash, no en-dash, no emoji, no AI-tells in prose, no `Math.random` outside `shared/js/render/rng.js`, no engine duplication, every playground cites a source.

## Status snapshot (2026-05-14)

- 203 verified playgrounds (all gates green).
- 1306 invariant tests passing (221 test files).
- 6 heroes designated: 6 Canvas2D MVPs shipped (all invariants green); WebGL2 upgrade queued for each.
- Phases 0-15 of the dissemination directive complete (frontmatter + tags, landing, share-state, a11y, hero designation, perf budget, license + contributing, visual standard, engine-gl, all 6 heroes on WebGL2 MVP, final polish).
- See `docs/NEEDS-ATTENTION.md` for hero-polish punch list and `docs/AUDIT.md` for the inventory.

## License

MIT. See `LICENSE`.

## Maintainer

Andreas W. Neitzel · ORCID 0000-0001-6283-907X · IA/CAUP, U. Porto · andreaswneitzel@gmail.com
