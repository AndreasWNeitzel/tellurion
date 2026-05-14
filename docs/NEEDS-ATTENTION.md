# Open work as of 2026-05-14 03:56 UTC

## Tier 1 — final hero polish

Two items remain. Each is enhancement work; no correctness gates fail without them.

1. **Full Kerr ray-trace** for `schwarzschild-kerr-blackhole-3d`. Current MVP uses weak-field impact-parameter check + horizon capture + photon-ring highlight + Planck disk approximation. The full per-pixel RK4 null geodesic in Boyer-Lindquist with Carter constants $(E, L_z, Q)$ is queued.
2. **Direct CPU-vs-GPU readback agreement** at 1e-4 after 1000 steps at seed 0xC0FFEE. CPU mirrors are tested for determinism and bounded state (`tests/heroes/wave-cpu-gpu-agreement.test.mjs`). The full GPU readback comparison requires a browser harness inside vitest, which is fragile; visual SSIM gates currently cover the practical signal.

Already done this round:
- HDR bloom + ACES + blue-noise dither + vignette in all 6 heroes via `shared/js/engine-gl/postprocess.js`.
- Hydrogen-orbitals-3d gained an Isosurface (Blinn-Phong) mode toggle.
- Tokamak-plasma-confinement-3d gained 12 banana-orbit test particles drawn as additive GL_POINTS with pulsing color.
- Earth-axial-precession-nutation-3d gained a sun marker, moon point with inclined orbit ring (5.14 deg).

## Tier 2 — dissemination polish

1. Hooks + one_paragraph: every spec.md has `STATUS: needs_hook`. Per hard rule, Claude does not author these.
2. Performance budget (Phase 5) currently emits per-frame rAF timings into perf.json. A summary aggregator (median across all 209 playgrounds, with a 60Hz budget threshold) is queued.
3. A11y audit currently covers landing + 6 heroes. A `--all` run takes ~3 min and would catch any regressions in the 200+ curriculum playgrounds. Wire into CI.

## Tier 3 — review pass for existing 209 verified playgrounds

User-deferred. The "static dial -> plot" engagement uplift (click-to-perturb, animated trails, audio toggles) is documented but not implemented per-playground.

## Source-of-truth files

- `docs/HEROES.md` — hero status table (updated this round).
- `docs/CURRICULUM.md` / `docs/INDEX.md` / `dist/index.html` — regenerated from spec.md.
- `docs/AUDIT.md` — inventory snapshot.
- `docs/QUALITY_AUDIT.md` — mechanical pass report.
- `docs/A11Y_REPORT.md` — latest a11y audit run.
