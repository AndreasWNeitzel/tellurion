# Open work as of 2026-05-14

## Tier 1 — WebGL2 hero upgrades (4 / 6 remaining)

Two heroes are now on WebGL2: wave-heightfield (3D heightfield surface with Blinn-Phong + three-point lighting + ACES) and lorenz-ensemble (GPU ensemble of 1024 trajectories with HDR accumulator splat + viridis + vignette). The remaining four heroes ship as Canvas2D MVPs that pass invariant gates; the full WebGL2 visual-standard path is queued:

1. `hydrogen-orbitals-3d`: volume ray-march on 128^3 grid; marching-cubes isosurface mode; HSV phase coloring toggle. CPU mirror ready.
2. `tokamak-plasma-confinement-3d`: glowing-tube geometry along field lines colored by $|B|$ via viridis; volumetric plasma emission with Planck temperature mapping; guiding-center test particles.
3. `earth-axial-precession-nutation-3d`: oblate Earth with procedural fractal-noise continents/oceans/ice caps; sun + Moon orbit; precession trace on celestial sphere.
4. `schwarzschild-kerr-blackhole-3d`: per-pixel null geodesic RK4 ray-march in Boyer-Lindquist coordinates with Carter constants; Planck blackbody disk emission with Doppler beaming and gravitational redshift; ergosphere translucency.

## Tier 2 — dissemination polish

1. Hooks + one_paragraph: every spec.md has `STATUS: needs_hook` / `needs_paragraph`. Per hard rule, Claude does not author these; needs Andreas.
2. Performance budget (Phase 5): not yet wired into capture-reference.mjs.
3. A11y audit script (Phase 3): not yet written; aesthetics-reviewer agent does not yet have the mandatory a11y section.
4. CPU vs GPU agreement tests (1e-4 after 1000 steps at seed 0xC0FFEE): wave + lorenz GPU paths exist; tests not yet authored.

## Tier 3 — review pass for existing 209 verified playgrounds

User deferred to themselves; will systematically review each playground.

## Source-of-truth files

- `docs/HEROES.md` — hero status table.
- `docs/CURRICULUM.md` / `docs/INDEX.md` / `dist/index.html` — regenerated from spec.md frontmatter.
- `docs/AUDIT.md` — snapshot inventory.
