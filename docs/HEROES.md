# Hero playgrounds

Heroes are the showcase entries that justify the WebGL2 carve-out from CLAUDE.md hard rule 8. Each is held to the visual standard codified in `docs/HERO_VISUAL_STANDARD.md` and ships with a CPU mirror under `shared/js/engine/` for invariant testing.

## Selection criteria

1. The phenomenon is visually arresting in three dimensions in a way Canvas2D cannot reproduce.
2. There is a clean closed-form or analytic check that gates the implementation.
3. The didactic surface is wide enough that a reviewer spends more than five minutes interacting.

## Six designated heroes (status as of 2026-05-14)

| Slug | Status | Invariants | Notes |
|-|-|-|-|
| `wave-heightfield-clickable-3d` | shipped Canvas2D MVP | 5/5 | 96x96 leapfrog wave equation; click impulses. WebGL2 Blinn-Phong surface upgrade queued. |
| `lorenz-attractor-3d-ensemble` | shipped Canvas2D MVP | 3/3 | 10^3 trajectories from 1e-3 ball; RK4. WebGL2 splat-accumulator queued. |
| `hydrogen-orbitals-3d` | shipped Canvas2D MVP | 7/7 | Analytic $|\psi_{n,l,m}|^2$ slice with HSV phase or viridis density; CPU mirror at shared/js/engine/hydrogen-orbital-cpu.js. WebGL2 volume ray-march queued. |
| `tokamak-plasma-confinement-3d` | shipped Canvas2D MVP | 4/4 | Toroidal vacuum with helical field lines; ITER-like q_a formula. CPU mirror at shared/js/engine/tokamak-cpu.js. WebGL2 tube-rendering + plasma volumetric emission queued. |
| `earth-axial-precession-nutation-3d` | shipped Canvas2D MVP | 5/5 | 50.29 arcsec/yr lunisolar precession + 18.6-yr nutation (17.2/9.2 arcsec amplitudes). CPU mirror at shared/js/engine/earth-rotation-cpu.js. WebGL2 textured oblate Earth queued. |
| `schwarzschild-kerr-blackhole-3d` | shipped Canvas2D MVP | 9/9 | Geometry schematic: horizon $r_+$, photon sphere $3M$, ergosphere $r_{\rm erg}(\theta)$, ISCO. Planck disk emission $T \propto r^{-3/4}$. CPU mirror at shared/js/engine/schwarzschild-kerr-cpu.js. WebGL2 per-pixel null geodesic ray-march queued. |

All six heroes verified. Total 33 hero invariants passing.

## WebGL2 exemption

CLAUDE.md hard rule 8 retains `Canvas2D + SVG` as the default. The exemption to `renderer: webgl2` is available for hero-flagged playgrounds; each WebGL2 hero must ship a CPU mirror at `shared/js/engine/<slug>-cpu.js`. The CPU mirror exercises invariants; the GPU path is then checked to agree with the CPU path on a downsampled grid to 1e-4 after 1000 steps at seed 0xC0FFEE. Visual tests run under SwiftShader.

## Deferred WebGL2 upgrade work

All six heroes currently render in Canvas2D as MVP implementations with the correct physics and full invariant coverage. The full visual standard (Blinn-Phong + ACES + viridis/Planck + three-point lighting + HDR bloom + vignette + dither + idle camera drift) is queued per-hero. See `docs/NEEDS-ATTENTION.md`.
