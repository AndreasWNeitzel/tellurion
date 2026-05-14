# Hero playgrounds

Heroes are the showcase entries that justify the WebGL2 carve-out from CLAUDE.md hard rule 8. Each is held to the visual standard codified in `docs/HERO_VISUAL_STANDARD.md` and ships with a CPU mirror under `shared/js/engine/` for invariant testing.

## Selection criteria

1. The phenomenon is visually arresting in three dimensions in a way Canvas2D cannot reproduce.
2. There is a clean closed-form or analytic check that gates the implementation.
3. The didactic surface is wide enough that a reviewer spends more than five minutes interacting.

## Six designated heroes (status as of 2026-05-14 03:00 UTC)

| Slug | Status | Renderer | Invariants | Notes |
|-|-|-|-|-|
| `wave-heightfield-clickable-3d` | shipped | webgl2 + canvas2d fallback | 5/5 | 3D Blinn-Phong heightfield in WebGL2 (shared/js/engine-gl/wave-2d.js, 246 lines): two RGBA16F ping-pong textures, leapfrog step shader, surface render with three-point lighting + ACES + viridis. CPU mirror at shared/js/engine/wave-2d-cpu.js. |
| `lorenz-attractor-3d-ensemble` | shipped | webgl2 + canvas2d fallback | 3/3 | GPU 1024-particle RK4 in fragment shader (shared/js/engine-gl/lorenz-ensemble.js, 240 lines); 32x32 RGBA32F state textures; HDR accumulator with additive splatting + geometric decay; viridis colormap + ACES + vignette. |
| `hydrogen-orbitals-3d` | shipped Canvas2D MVP | canvas2d | 7/7 | Analytic $|\psi_{n,l,m}|^2$ slice with HSV phase + viridis density, CPU mirror uses associated Laguerre + Legendre. WebGL2 volume ray-march on 128^3 voxel grid still queued. |
| `tokamak-plasma-confinement-3d` | shipped Canvas2D MVP | canvas2d | 4/4 | Helical field-line bundle with ITER-like q_a formula. CPU mirror at shared/js/engine/tokamak-cpu.js. WebGL2 tube geometry + plasma volumetric emission queued. |
| `earth-axial-precession-nutation-3d` | shipped Canvas2D MVP | canvas2d | 5/5 | 50.29 arcsec/yr lunisolar precession + 18.6-yr nutation (17.2"/9.2" Δψ/Δε). CPU mirror at shared/js/engine/earth-rotation-cpu.js. WebGL2 textured oblate Earth queued. |
| `schwarzschild-kerr-blackhole-3d` | shipped Canvas2D MVP | canvas2d | 9/9 | Schematic: horizon, photon sphere, ergosphere, ISCO, Planck disk. CPU mirror at shared/js/engine/schwarzschild-kerr-cpu.js. WebGL2 per-pixel null geodesic ray-march queued. |

All six heroes verified, total 33 hero invariants passing. 1327/1327 total tests pass.

## WebGL2 exemption

CLAUDE.md hard rule 8 retains Canvas2D + SVG as the default. WebGL2 is allowed only for `hero_candidate: true` + `renderer: webgl2` playgrounds, each shipping a CPU mirror at `shared/js/engine/<slug>-cpu.js`. The CPU mirror exercises invariants; the GPU path falls back to Canvas2D if WebGL2 init fails (e.g., EXT_color_buffer_float missing). Visual tests run under SwiftShader.

## WebGL2 progress

Two of six heroes are now on WebGL2 (wave-heightfield, lorenz). The other four are scoped Canvas2D MVPs awaiting a follow-up WebGL2 implementation. See `docs/NEEDS-ATTENTION.md`.
