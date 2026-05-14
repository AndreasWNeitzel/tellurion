# Hero visual standard

This document codifies the visual treatment for playgrounds with `hero_candidate: true` and `renderer: webgl2` in their spec.md. Heroes have a higher fidelity bar than other playgrounds, justified by the WebGL2 carve-out from CLAUDE.md hard rule 8.

## Shading

- Blinn-Phong for opaque surfaces, with specular term controlled by a roughness slider.
- Diffuse component uses a 256-pixel LUT (default: viridis) for height/intensity mapping.
- Fresnel via Schlick approximation: `F = F_0 + (1 - F_0)(1 - n . v)^5`.

## Tonemap

- ACES filmic on the final pass: `(x (a x + b)) / (x (c x + d) + e)` with the published Hill 2017 constants.
- Black point clamped to `--bg-dark`.

## Color science

- Scalar fields (heightmaps, accumulators, densities): viridis or cividis.
- Self-luminous volumes (plasma cores, disk emission, sun): Planck temperature `T_K -> XYZ -> sRGB` via the standard 1931 colorimetric pipeline.
- Complex amplitudes / phase: HSV phase coloring with H = arg(psi) / 2pi.

## Lighting

- Three-point for opaque heroes: key upper-right, fill 30% lower-left (cooler), rim 60% behind (cool hue).
- Emission-only for self-luminous volumes (no ambient).

## Composition

- Default camera: 30 deg elevation, 45 deg azimuth, perspective FOV 50 deg.
- Subject occupies the central third.
- Idle camera drift at 0.5 deg/sec after 3 sec of no user input.

## Post

- HDR bloom: threshold 1.0, knee 0.25, 3 mip levels.
- Vignette: 0 to 25% corner darkening.
- 8-bit blue-noise dither on the final color buffer.

## Animation

- Cubic-bezier easing.
- 100 ms debounce on state transitions.

## Typography

- CSS tokens for all sizes and weights.
- Live readouts use tabular-numerals monospace.

## Mandatory spec.md sections (heroes only)

1. "Visual standard instantiation": overrides to the standard, per-hero. Example: "We disable rim light because the subject is volumetric."
2. "Stack exemption": short justification for the WebGL2 carve-out + CPU mirror path.
