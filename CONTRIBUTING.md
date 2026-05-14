# Contributing

This repository is a curated portfolio. External contributions are welcome but the surface area is small. Please open an issue before opening a PR.

## What is in scope

- Bugfixes in existing playgrounds.
- New playgrounds that fit the curriculum framework (`docs/CURRICULUM.md`) or extend it explicitly.
- Improvements to shared engines under `shared/js/engine/`.

## What is out of scope

- Cosmetic restyles without an obvious aesthetic upgrade.
- New frameworks or build tooling (the stack is intentionally minimal: ES2022 modules, Canvas2D, SVG, Playwright + Vitest for tests; KaTeX for math).
- AI-generated prose. The repository enforces an AI-tell filter and a no-emoji rule via PreToolUse hooks.

## Per-playground requirements

Each playground must ship with:

1. `spec.md` with frontmatter (see `docs/TAGS.md` and existing playgrounds).
2. `sim.js`: headless numerical engine.
3. `invariants.test.mjs`: at least five Vitest invariant tests.
4. `index.html` + `playground.js`: the UI.
5. `references/golden-frames/`: five PNG frames captured at deterministic seeds.
6. `visual.test.mjs`: Playwright SSIM check against the golden frames at threshold 0.92.
7. `README.md`: three short paragraphs.
8. `.verified` marker: written by the `ship-one` flow after every gate passes.

## Style

- No em-dash and no en-dash anywhere.
- No emoji in source, docs, captions, or commit messages.
- No AI-tells in prose: delve, leverage as verb, in conclusion, moreover, furthermore, it's worth noting, navigate as metaphor, tapestry, landscape as metaphor.
- Citations as `arXiv:YYMM.NNNNN`, `ADS:bibcode`, `doi:...`, `github.com/org/repo`, or explicit `[no-source: internal-reasoning]` tag.

See `CLAUDE.md` for the full hard-rule list.
