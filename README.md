# Tellurion

Tellurion is the source repository for [tellurion.dev](https://tellurion.dev), a laboratory of interactive physics and astronomy simulations I built over the course of my PhD as a public educational resource. There are 332 playgrounds at the moment, spanning mechanics, electromagnetism, optics, quantum, relativity, statistical mechanics, fluid dynamics, condensed matter, and astrophysics. The set is anchored to the University of Porto FCUP BSc in Physics and MSc in Astronomy and Astrophysics curricula.

The name refers to the 18th-century mechanical apparatus for teaching how the Earth, Moon, and Sun move together: a hand-built physics instrument designed for demonstration through direct manipulation. This site extends the idea to the rest of the curriculum.

## Status

Public beta. The site is functional and the physics is being reviewed by working physicists. Errors are inevitable at this scale: typographic, pedagogical, occasionally substantive. I keep a corrections page at [tellurion.dev/#corrections](https://tellurion.dev/#corrections) and credit reporters. If you find something wrong, please tell me.

## What is here

- `playgrounds/` one directory per simulation, scaffolded from `_template/`. Curriculum playgrounds live under `bsc-y1s1` through `bsc-y3s2` and `msc-y1`. The larger 3D and multi-mode showcase pieces are under `_heroes/` and `_legends/`.
- `shared/` numerical engines under `engine/`, Canvas2D and SVG primitives and colormaps under `render/`, controls (knobs, share-state URL contract) under `controls/`, and the WebGL2 primitives used by the heroes under `engine-gl/`.
- `scripts/build-landing.mjs` regenerates the landing page from playground `spec.md` frontmatter. `scripts/build-index.mjs` regenerates `docs/INDEX.md`. `scripts/build-curriculum-index.mjs` regenerates `docs/CURRICULUM.md`.
- `docs/` curriculum mapping (`CURRICULUM.md`), the playground card index (`INDEX.md`), the controlled tag vocabulary (`TAGS.md`), and the source-of-truth bibliography (`CITATIONS.bib`).

## Run locally

```
npm install
npm run dev
```

Vite serves the site at `http://localhost:5173`. The stack is ES2022 modules, no frameworks; KaTeX for math; Canvas2D and SVG, with a WebGL2 carve-out for the heroes.

To regenerate the landing after editing a playground or its `spec.md` frontmatter:

```
node scripts/build-landing.mjs
```

## Testing

Each playground ships an `invariants.test.mjs` (Vitest): conservation and identity checks on the headless simulation, at thresholds set in the playground's `spec.md`. These check that the numerics are stable. They do not establish that the physics setup is correct; that review is done by people.

```
npx vitest run
```

A pixel-regression suite (`visual.test.mjs` under Playwright, SSIM 0.92) is available for local diagnostic use. Reference frames are not committed; regenerate them locally first with `node scripts/capture-reference.mjs --playground <slug>` and then run `npx playwright test`.

## Corrections and contributions

For corrections to existing playgrounds, email is the fastest path: [andreaswneitzel@gmail.com](mailto:andreaswneitzel@gmail.com). For larger changes, open an issue before opening a pull request.

## License

MIT. See [`LICENSE`](LICENSE).

## Citation

If you reference a playground in teaching or research, please cite it as:

```
Neitzel, A. W. (2026). Tellurion: a laboratory of interactive physics simulations. https://tellurion.dev/
```

A [`CITATION.cff`](CITATION.cff) file is included for tooling that supports the Citation File Format.

## Maintainer

Andreas W. Neitzel
ORCID: [0000-0001-6283-907X](https://orcid.org/0000-0001-6283-907X)
PhD candidate, Instituto de Astrofísica e Ciências do Espaço (IA/CAUP), University of Porto
[andreaswneitzel@gmail.com](mailto:andreaswneitzel@gmail.com)
