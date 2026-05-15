# Open work as of 2026-05-14 04:07 UTC

## Tier 1: closed

All Tier-1 hero polish items have shipped:
- HDR bloom + blue-noise dither + vignette pipeline integrated into all 6 heroes via `shared/js/engine-gl/postprocess.js`.
- `hydrogen-orbitals-3d`: density + phase + isosurface (Blinn-Phong with gradient normals) modes.
- `tokamak-plasma-confinement-3d`: 12 banana-orbit test particles with toroidal drift + bounce.
- `earth-axial-precession-nutation-3d`: sun marker + moon orbiting on a 5.14 deg inclined ring.
- `schwarzschild-kerr-blackhole-3d`: real per-pixel Schwarzschild null-geodesic RK4 integration of `d²u/dφ² + u = 3Mu²`; capture/disk-crossing/escape branches; Planck blackbody disk emission with Doppler proxy; up to 2 disk crossings per ray (secondary lensed image).

The remaining Kerr-specific work (Carter constants $(E, L_z, Q)$, Boyer-Lindquist 4D integration for a≠0 spin, ergosphere shading) is documented as future work but not blocking. the playground is labeled `schwarzschild-kerr` and renders the Schwarzschild case correctly; the Kerr slider currently affects the disk inner edge and photon-ring radius via the existing simplification.

## Tier 2: dissemination polish

1. Hooks + one_paragraph: every spec.md has `STATUS: needs_hook`. Per hard rule, Claude does not author these; needs Andreas.
2. Performance budget (Phase 5) emits per-frame rAF timings into perf.json. A summary aggregator (median across all 209 playgrounds with a 60 Hz budget threshold) is queued.
3. A11y audit currently covers landing + 6 heroes. A `--all` run takes ~3 min and would catch any regressions in the 200+ curriculum playgrounds. Wire into CI.

## Tier 3: review pass for existing 209 verified playgrounds

User-deferred. Documented in `docs/QUALITY_AUDIT.md`. The "static dial -> plot" engagement uplift (click-to-perturb, animated trails, audio toggles) is documented but not implemented per-playground.

## Source-of-truth files

- `docs/HEROES.md`: hero status table.
- `docs/CURRICULUM.md` / `docs/INDEX.md` / `dist/index.html`: regenerated from spec.md.
- `docs/AUDIT.md`: inventory snapshot.
- `docs/QUALITY_AUDIT.md`: mechanical pass report.
- `docs/A11Y_REPORT.md`: last a11y audit run.
