# Playground specification template

Every `playgrounds/<name>/spec.md` follows this structure. The architect drafts it; physics-skeptic and numerics-skeptic review it; invariant-auditor uses it as the source of truth for tests.

```markdown
---
title: <Short title for caption use>
slug: <kebab-case-slug>
status: draft  # draft | in-progress | implemented | verified | shipped
audience: portfolio
created: <ISO date>
---

# <Full title>

## Physical setup

Three to five sentences of plain prose. What system is being modeled, in what regime, with what assumptions. Include the dimensional reduction (2D, 1D, axisymmetric) and any conventions (signs, units, signature).

## Governing equations

LaTeX block. State every equation with a single equation number per line. For boundary conditions, give them as a separate block.

```math
\dot{x} = f(x, t)
```

## Numerical method

- **Discretization**: name the scheme (e.g., velocity-Verlet, Crank-Nicolson, Yee FDTD, Wolff cluster).
- **Time step**: explicit value or formula. State the stability bound and the margin.
- **Spatial grid or particle count**: N, dx, total run length.
- **Boundary conditions**: explicit (periodic, PML, absorbing, reflective).
- **RNG**: stated PRNG and seed if stochastic. Default seed `0xC0FFEE`.

## Controls

Markdown table:

| name | type | units | range | default | sets |
|------|------|-------|-------|---------|------|
| ...  | ...  | ...   | ...   | ...     | ...  |

## Expected qualitative features

Bullet list. Each bullet becomes a visual-reviewer rubric item.

- The single-slit far-field shows a central lobe of width 2 lambda / a with secondary lobes at the correct positions.
- Energy drift over 10^4 steps remains below 0.1 percent.
- The Lyapunov exponent on the logistic map at r = 4 converges to ln 2 within 1 percent.

## Invariants and acceptance thresholds

| invariant | strong/medium/weak | threshold |
|-----------|--------------------|-----------|
| total energy drift | strong | < 1e-3 over 10^4 dt |
| ... | ... | ... |

If no strong invariant is available, state so explicitly and document the visual SSIM fallback threshold.

## Limiting cases for verification

| limit | expected | source |
|-------|----------|--------|
| weak field b >> M | deflection -> 4M/b | Carroll Ch. 5, eq. 5.71 |
| ... | ... | ... |

## Visual fallback

If invariants are weak (e.g., dissipative ML training), state the visual SSIM threshold (default 0.92 minimum at fixed seed) and which reference frames are committed.

## Citations

- Book or paper, edition, chapter, equation or algorithm number.
- All bib keys must exist in `docs/CITATIONS.bib`.

## Stretch goals

Optional features for a v1.1, listed but not built in the first ship.

## Risk register

Three highest risks specific to this playground, with one-line mitigations.
```

## Spec writing rules

1. Equations are LaTeX; never images.
2. Every numerical choice has a cited justification or a derivation in the spec.
3. Every control has units stated. Dimensionless controls are marked as such.
4. The Expected qualitative features section must contain at least three checkable bullets.
5. STATUS field is updated as the playground progresses. The audit command checks for status drift.
