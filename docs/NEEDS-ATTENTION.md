# Open work as of 2026-05-14

## Tier 1 — WebGL2 hero upgrades (6 / 6 deferred)

All six heroes ship with Canvas2D MVPs that pass their invariant gates. The full visual-standard WebGL2 path is queued for each:

1. `wave-heightfield-clickable-3d`: 3D Blinn-Phong heightfield surface with three-point lighting + ACES tonemap + bloom + vignette + blue-noise dither.
2. `lorenz-attractor-3d-ensemble`: ping-pong RG32F texture trajectories + viridis log-density splat accumulator with temporal decay.
3. `hydrogen-orbitals-3d`: volume ray-march on 128^3 grid; marching-cubes isosurface mode; HSV phase coloring toggle.
4. `tokamak-plasma-confinement-3d`: glowing-tube geometry along field lines colored by $|B|$ via viridis; volumetric plasma emission with Planck temperature mapping; guiding-center test particles.
5. `earth-axial-precession-nutation-3d`: oblate Earth with procedural fractal-noise continents/oceans/ice caps; sun + Moon orbit; precession trace on celestial sphere.
6. `schwarzschild-kerr-blackhole-3d`: per-pixel null geodesic RK4 ray-march in Boyer-Lindquist coordinates; Planck blackbody disk emission with Doppler beaming and gravitational redshift; ergosphere translucency.

## Tier 2 — dissemination polish

1. Hooks: every spec.md has `hook: 'STATUS: needs_hook'`. Per hard rule, Claude does not author hook copy.
2. one_paragraph: same; needs Andreas.
3. Performance budget (Phase 5): not yet wired into capture-reference.mjs.
4. A11y audit script (Phase 3): not yet written; the aesthetics-reviewer agent does not yet have the mandatory a11y section.
5. CPU vs GPU agreement tests (1e-4 after 1000 steps at seed 0xC0FFEE): cannot run until GPU paths exist.

## Tier 3 — review pass for existing 203 verified playgrounds

The user explicitly deferred this to themselves: they will systematically review each playground once the backlog is empty. The fast-ship batch all uses Pause/Play state sync with `aria-pressed` toggling and `running` flag tracking, slider input handlers that re-render rather than reset state, and select-elements for discrete-mode choices (e.g., function pickers in root-finding, regime selectors in superfluid-transition).

## Source-of-truth files

- `docs/HEROES.md` — hero status.
- `docs/CURRICULUM.md` — regen with `node scripts/build-curriculum-index.mjs`.
- `docs/INDEX.md` — card list, regen with `node scripts/build-index.mjs`.
- `dist/index.html` — landing, regen with `node scripts/build-landing.mjs`.
- `docs/AUDIT.md` — snapshot inventory.
