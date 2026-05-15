# Audit snapshot (2026-05-14 03:18 UTC)

## Inventory

- 209 verified spec.md files total (203 curriculum + 6 hero placeholders).
- All 209 playgrounds have a `.verified` marker, `spec.md` `status: verified`, 6 source files (sim/invariants/index/playground/spec/README), and golden frames.
- 1327 invariant tests across 221 test files; all currently green.
- 6 / 6 heroes on WebGL2 with Canvas2D fallback.
- 0 a11y violations across landing + 6 heroes (WCAG 2.0 A/AA via axe-core).

## Per-year card count

| Year | Verified |
|-|-|
| bsc-y1s1 | 26 |
| bsc-y1s2 | 9 |
| bsc-y2s1 | 37 |
| bsc-y2s2 | 24 |
| bsc-y3s1 | 18 |
| bsc-y3s2 | 41 |
| msc-y1 | 38 |
| hero | 6 |

## Heroes (WebGL2)

| Slug | Renderer | CPU mirror | Invariants |
|-|-|-|-|
| wave-heightfield-clickable-3d | webgl2 | shared/js/engine/wave-2d-cpu.js | 5/5 |
| lorenz-attractor-3d-ensemble | webgl2 | (uses sim.js directly) | 3/3 |
| hydrogen-orbitals-3d | webgl2 | shared/js/engine/hydrogen-orbital-cpu.js | 7/7 |
| tokamak-plasma-confinement-3d | webgl2 | shared/js/engine/tokamak-cpu.js | 4/4 |
| earth-axial-precession-nutation-3d | webgl2 | shared/js/engine/earth-rotation-cpu.js | 5/5 |
| schwarzschild-kerr-blackhole-3d | webgl2 | shared/js/engine/schwarzschild-kerr-cpu.js | 9/9 |

## Dissemination layer status

| Phase | Status |
|-|-|
| 0. Frontmatter + tag vocabulary | done |
| 1. Landing + discovery + curriculum | done |
| 2. Share-state contract | done |
| 3. A11y audit (axe-core CDN) + aesthetics-reviewer section | done |
| 4. Tier framework + hero designation | done |
| 5. Performance budget (rAF median/p95 per capture) | done |
| 6. License + CONTRIBUTING + CoC | done |
| 7. Hero visual standard + shared modules | done |
| 8. WebGL2 infrastructure + smoke test | done |
| 9-14. Six heroes (WebGL2 path) | done (MVP visual standard) |
| 15. Final polish | done |

## Open work

`docs/NEEDS-ATTENTION.md` lists Tier-1 polish (full Kerr ray-trace, bloom + blue-noise dither, hydrogen isosurface mode, tokamak banana orbits, earth sun/moon) plus hooks/one_paragraph copy (author-only).

## Tests

- 1327 / 1327 passing.
- 12 borderline tolerance fixes applied across the final ship sweep (method-of-images 3D integration, Lagrangian -0/0, synchrotron Hz upper bound, alpha-decay Geiger-Nuttall log, phonon equal-mass degeneracy, series 1/2^n limit, Cauchy single-window guard, lienard FWHM-not-peak-shift, Coulomb softening, RV peak phase, wave-heightfield numerical damping, tokamak q_a uniform-current vs profile-corrected).

## Source-of-truth files

- `docs/HEROES.md`: hero status.
- `docs/CURRICULUM.md`: chronological by year/UC; regen from spec.md.
- `docs/INDEX.md`: flat card list.
- `dist/index.html` / `index.html`: landing.
- `docs/A11Y_REPORT.md`: last audit run.
- `docs/NEEDS-ATTENTION.md`: open punch list.
- `docs/TAGS.md`: controlled vocabulary.
