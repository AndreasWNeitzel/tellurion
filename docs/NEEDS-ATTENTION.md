# Open work as of 2026-05-14

## Tier 1 — heroes still to implement (4 / 6)

1. `hydrogen-orbitals-3d`: analytic sampling kernel + volume ray-march fragment + isosurface marching-cubes. Status: spec.md ready, sim.js placeholder.
2. `tokamak-plasma-confinement-3d`: Grad-Shafranov on 32x32 (R, Z); field-line tubes; guiding-center test particles. Status: spec.md ready, sim.js placeholder.
3. `earth-axial-precession-nutation-3d`: oblate Earth + Euler equations + lunisolar quadrupole torque; procedural fractal-noise surface texture. Status: spec.md ready, sim.js placeholder.
4. `schwarzschild-kerr-blackhole-3d`: Carter-constant null geodesic ray-march; Planck disk emission with Doppler + gravitational redshift; ergosphere shading. Status: spec.md ready, sim.js placeholder.

## Tier 2 — hero polish (2 / 6 in MVP state)

1. `wave-heightfield-clickable-3d`: currently Canvas2D viridis colormap on the height field. WebGL2 Blinn-Phong 3D surface with three-point lighting + ACES + bloom + vignette + dither is the target.
2. `lorenz-attractor-3d-ensemble`: currently Canvas2D point cloud with depth-shaded color. WebGL2 splat-accumulator (ping-pong RG32F textures, log-density via additive blending + exponential decay) is the target.

## Tier 3 — dissemination polish

1. Hooks: every spec.md currently has `hook: 'STATUS: needs_hook'`. Per hard rule, Claude does not author hook copy; Andreas writes these manually.
2. one_paragraph: same; needs Andreas.
3. Landing-page hero cards display correctly only when at least one hero has `hero_candidate: true` AND is verified. Currently `wave-heightfield-clickable-3d` and `lorenz-attractor-3d-ensemble` are flagged, but their `_heroes/` placement may need a build-landing adjustment.
4. Performance budget (Phase 5): not yet wired into capture-reference.mjs.
5. A11y audit script (Phase 3): not yet written; the aesthetics-reviewer agent does not yet have the mandatory a11y section.
6. Hero invariant gates: GPU vs CPU agreement test pattern (1e-4 after 1000 steps at seed 0xC0FFEE) needs the GPU paths first.

## Tier 4 — review pass for existing 203 verified playgrounds

The user explicitly deferred this to themselves: they will systematically review each playground once the backlog is empty. The minimum mechanical checks (Pause/Play state sync, slider → toggle conversion, animation/engagement quality) were applied uniformly to the most-recently-shipped batch but have not been audited across the older playgrounds.

## Source-of-truth files

- `docs/HEROES.md`: hero status table.
- `docs/CURRICULUM.md`: regenerated from spec.md frontmatter; verify with `node scripts/build-curriculum-index.mjs`.
- `docs/INDEX.md`: card list; verify with `node scripts/build-index.mjs`.
- `dist/index.html`: landing; verify with `node scripts/build-landing.mjs`.
