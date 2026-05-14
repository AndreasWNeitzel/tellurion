# Open work as of 2026-05-14 03:13 UTC

## Tier 1 — WebGL2 hero polish

All 6 heroes are on WebGL2. Each renders cleanly under headless Chromium; visual gates pass at threshold 0.92 SSIM. Remaining polish:

- Full Kerr ray-trace (per-pixel RK4 in Boyer-Lindquist with Carter constants). Current MVP uses weak-field deflection + horizon capture + photon-ring highlight + lensed disk approximation. Substantial enhancement work for a separate session.
- Bloom + blue-noise dither on the final pass for each hero (HDR pipeline; currently only ACES + vignette).
- Marching-cubes isosurface toggle for hydrogen-orbitals-3d (volume ray-march is shipped; isosurface mode pending).
- Banana-orbit test particles + plasma volumetric emission for tokamak-plasma-confinement-3d.
- Sun + Moon orbit rendering + precession-trace cone for earth-axial-precession-nutation-3d.

## Tier 2 — dissemination polish

1. Hooks + one_paragraph: every spec.md has `STATUS: needs_hook` / `needs_paragraph`. Per hard rule, Claude does not author these; needs Andreas.
2. Performance budget (Phase 5): not yet wired into capture-reference.mjs.
3. A11y audit script (Phase 3): not yet written; aesthetics-reviewer agent does not yet have the mandatory a11y section.
4. CPU vs GPU agreement tests (1e-4 after 1000 steps at seed 0xC0FFEE): GPU readback path exists for wave but tests not yet authored.

## Tier 3 — review pass for existing 209 verified playgrounds

User deferred to themselves; will systematically review each playground.

## Source-of-truth files

- `docs/HEROES.md` — hero status table.
- `docs/CURRICULUM.md` / `docs/INDEX.md` / `dist/index.html` — regenerated from spec.md frontmatter.
- `docs/AUDIT.md` — snapshot inventory.
