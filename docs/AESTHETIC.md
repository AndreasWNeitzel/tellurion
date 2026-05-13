# Aesthetic standard

The target sits at the intersection of three references: Bartosz Ciechanowski's interactive blog posts (`ciechanow.ski`), Distill.pub articles, and Nicky Case's explorables. The non-target is "default D3 with sliders everywhere".

This document codifies the rules. `aesthetics-reviewer` enforces them.

## Color

- **Scalar fields**: `viridis` (default) or `cividis` (when colorblind audience matters). Both are perceptually uniform. Available in `shared/js/render/colormaps.js`.
- **Categorical labels**: Tableau-10 or Observable-10 subset, maximum six hues simultaneously. The token names are `--cat-1` through `--cat-6`.
- **Backgrounds**: `--bg-light` `#FBFBF9` in light mode, `--bg-dark` `#0E0F10` in dark. Pure white or pure black is a flag.
- **Accent**: one color only at any time. The default accent is `--accent` `#1B6CA8`. A second accent (warm) is `--accent-warm` `#C13B27` reserved for danger states and contrasting traces only. Never both as decorative emphasis.
- **Grids**: `--grid` at 30 percent opacity, 0.5 px stroke.

## Typography

- **Body**: Inter (preferred), IBM Plex Sans, Source Sans 3. Loaded from `shared/css/fonts.css`. Body size 16-17 px, line-height 1.55.
- **Math**: KaTeX inline and block. Math images are forbidden.
- **Numerical readouts**: monospace token `--font-mono` (JetBrains Mono, IBM Plex Mono, ui-monospace fallback). Tabular numerals only (`font-feature-settings: "tnum"`).
- **Captions**: same body family, 90 percent of body size, italic figure number only.

## Lines and strokes

- **Primary trace**: 1.5 px.
- **Secondary trace**: 1.0 px.
- **Grid**: 0.5 px at 30 percent opacity.
- **Highlight trace**: 2.5 px at full opacity, no glow.
- **Pixel-art lattice rendering** (Ising, Potts, cellular automata): `ctx.imageSmoothingEnabled = false`. Use `ctx.drawImage` of an offscreen ImageData with one pixel per cell, then CSS-scale.
- **Continuous fields**: smoothing on; use the colormap's full dynamic range.

## Control density

- At most five primary controls visible at rest. Secondary controls behind a single `<details>` disclosure labeled "More controls".
- Prefer direct manipulation for geometric quantities. A slider for "impact parameter" is a failure; dragging the trajectory's starting point is correct.
- Knobs and drag handles come from `shared/js/controls/`. No ad-hoc range inputs.
- A reset button is mandatory.
- A play/pause button is mandatory for time-evolving simulations.

## Whitespace and layout

- Figure-to-chrome ratio at least 70/30 by visible pixel area.
- Captions paper-numbered: "Figure 1. Title. One-sentence physics. Method, citation."
- Captions two to four sentences maximum.
- The live invariant readout sits in a fixed top-right or top-left position, monospace, with a label and units, never causing layout shift as the value updates.

## Motion

- 60 fps target. Use `requestAnimationFrame` with the fixed-step accumulator pattern (see `docs/ARCHITECTURE.md`).
- Honor `prefers-reduced-motion: reduce` by switching to a step-by-step button or a much slower playback.
- Debounce control changes that trigger full resimulation. Direct manipulation should redraw, not resimulate.

## Live readout (mandatory)

Every playground exposes at least one live numerical readout of an invariant or diagnostic. Format:

```
Energy drift:     3.2e-5
Acceptance:       0.247
ESS / second:     1,840
Tau (autocorr):   3.4
```

Right-aligned values in a monospace span with `tnum` enabled. Updating is throttled to 10 Hz so the eye can read it.

## Theme switching

- `prefers-color-scheme` respected by default. Manual toggle persists in `localStorage`.
- All colors come from CSS custom properties defined in `shared/css/tokens.css`. Per-playground overrides are forbidden except for highlighting a single specific quantity.

## Annotations

- Use marginal annotations sparingly. Distill-style margin notes are encouraged on wider viewports.
- Equations referenced in the body are numbered and the number is rendered with `\tag{n}` so they can be quoted in prose.

## Sample rendering checklist

When `aesthetics-reviewer` inspects, it confirms:

1. Background matches a token value.
2. Accent in use is a single token color.
3. Scalar fields use a token-approved colormap.
4. Body font matches the token family.
5. Math present is KaTeX, not images.
6. Grid lines at correct opacity.
7. Live invariant readout present in monospace with units.
8. No more than five primary controls visible.
9. Caption follows the paper template.
10. `prefers-reduced-motion` honored (test with the user-agent emulation).

A failure on any item that is not specifically waived in the playground's spec.md is a `REVIEW` verdict at minimum, often `FAIL`.
