# playgrounds-portfolio

Canvas2D and SVG physics, astronomy, and ML playgrounds. Built for autonomous extension by Claude Code under a strict dual-gate verification regime.

## Repository purpose

Twelve to eighteen interactive playgrounds rendered as static HTML, one per concept, each cited to a canonical textbook chapter and verified by both a strong physical invariant (energy, norm, detailed balance) and a perceptual visual gate (SSIM > 0.92 against committed reference frames). The aesthetic target is Ciechanowski / Distill, not default D3.

Audience: AI-lab hiring committees, ESA Research Fellowship reviewers, and the technically literate public.

## Install

```
npm install
npx playwright install --with-deps chromium
```

Optional Python tooling (citation linting, reference numerics):

```
uv sync
```

## Quickstart

To open a playground in a browser, serve the project over HTTP. Each playground loads `playground.js` as an ES module that imports from `shared/`, so browsers block it from `file://`.

```
npm run dev
```

That starts vite on `http://localhost:5173/`. The root page lists shipped playgrounds; or jump directly to `http://localhost:5173/playgrounds/<slug>/index.html`. Any equivalent static server works.

To scaffold a new playground:

```
npm run scaffold <slug>
```

This copies `playgrounds/_template` into `playgrounds/<slug>`, substitutes placeholders, and prepares the folder for the `playground-architect` subagent to draft `spec.md`.

The build flow for any playground:

```
/scaffold <slug>            create folder
playground-architect         draft spec.md and engine reuse plan
physics-skeptic              review the equations and BCs
numerics-skeptic             review the integrator and stability
(implement playground.js)
invariant-auditor            write and run invariants.test.mjs
/verify <slug>               run all four gates
/ship <slug>                 bundle, update index, commit (manual push)
```

## Workspace map

```
.claude/                    settings, subagents, slash commands, hooks
docs/                       PLAYGROUND_SPEC, VERIFICATION, AESTHETIC, ARCHITECTURE,
                            BUILD_ORDER, CITATIONS.bib, INDEX (auto-updated by /ship)
shared/css/                 design tokens and base styles (single source of truth)
shared/js/engine/           numerical engines (headless, no DOM)
shared/js/render/           Canvas2D/SVG helpers, colormaps, seeded RNG
shared/js/controls/         knobs, drag handles, parameter panels, theme toggle
shared/js/invariants/       reusable invariant checkers
playgrounds/                one folder per playground
playgrounds/_template/      scaffold source for /scaffold
scripts/                    scaffold.sh, capture-reference.mjs, verify-all.sh, bundle.sh
tests/                      cross-cutting engine tests and helpers
.github/workflows/          CI: verify gates on PR and main
```

## Subagent roster

Defined in `.claude/agents/`:

- `playground-architect` (opus): decomposes a topic into spec, engine reuse plan, file list, risks.
- `physics-skeptic` (opus): audits equations, BCs, units, limiting cases.
- `numerics-skeptic` (opus): audits integrator, CFL, conditioning, FP pitfalls.
- `invariant-auditor` (opus): drafts and runs `invariants.test.mjs`, diagnoses failures.
- `visual-reviewer` (opus): multimodal pass against the spec rubric.
- `aesthetics-reviewer` (opus): enforces `docs/AESTHETIC.md`.
- `citation-validator` (sonnet): cross-checks claims against `docs/CITATIONS.bib`.

Invoke any of them by name through the Task tool. They return structured findings, not encouragement.

## Slash commands

- `/scaffold <slug>` create a new playground from the template.
- `/verify <slug>` run invariant + visual + aesthetic + citation gates.
- `/ship <slug>` bundle, update index, commit (push is manual).
- `/audit` status table across all playgrounds.
- `/critique <slug or path>` parallel skeptic pass without modifying files.

## Hard rules

See `CLAUDE.md`. Three you will hit fast:

1. No em-dashes or en-dashes anywhere. Hook will block writes that include them.
2. No AI-tell vocabulary in prose (delve, leverage as verb, in conclusion, etc.). Hook will block prose writes that include them.
3. Every playground must have a strong invariant test (or a documented exemption with a visual SSIM threshold) and a live invariant readout in the UI.

## Verification gates

| gate | enforced by | minimum |
|------|-------------|---------|
| Invariant | `invariant-auditor` + Vitest | strong-form pass at spec threshold |
| Visual | `scripts/capture-reference.mjs` + Playwright + SSIM | SSIM > 0.92 vs goldens |
| Multimodal review | `visual-reviewer` | all rubric items present |
| Aesthetic | `aesthetics-reviewer` | conforms to `docs/AESTHETIC.md` |
| Citation | `citation-validator` | all claims tied to `docs/CITATIONS.bib` entries |

The `.verified` marker in each playground records the last passing run. `/ship` refuses to proceed without it.

## Determinism

Every playground accepts `?seed=N&deterministic=1` URL params and fires a `simulation-ready` window event after each frame. Reference capture (`scripts/capture-reference.mjs`) and visual tests rely on this. The default seed is `0xC0FFEE`, persisted as `PORTFOLIO_REF_SEED` by the session-start hook.

## Build order

See `docs/BUILD_ORDER.md`. Start with `logistic-cobweb` and `double-pendulum` to validate the rendering and invariant infrastructure end to end before building engines (Phase 2 onward) that seed multiple playgrounds.

## CI

`.github/workflows/verify.yml` runs engine unit tests, per-playground invariants, and visual gates on every push and pull request against `main`. Subagent passes (`aesthetics-reviewer`, `citation-validator`) run advisory in CI; they block locally via `/verify`.

## Stack constraints

- Canvas2D and SVG only.
- KaTeX for math.
- Vanilla ES2022 modules, no frameworks.
- Browser storage forbidden inside engines.
- WebGL / Three.js / Pyodide / WASM forbidden unless a playground's `spec.md` documents the justification.

The constraint exists to keep playgrounds small, hostable as static files anywhere, and free of build-time secrets.

## License and citations

Source code: MIT. Captions and methodology references are tied to entries in `docs/CITATIONS.bib`. New entries must include book title, author, edition, ISBN, and a precise chapter or equation pointer.
