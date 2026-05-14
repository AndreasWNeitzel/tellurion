# Hero playgrounds

Heroes are the showcase entries that justify the WebGL2 carve-out from CLAUDE.md hard rule 8. Each is held to the visual standard codified in `docs/HERO_VISUAL_STANDARD.md` and ships with a CPU mirror under `shared/js/engine/` for invariant testing.

## Selection criteria

1. The phenomenon is visually arresting in three dimensions in a way Canvas2D cannot reproduce.
2. There is a clean closed-form or analytic check that gates the implementation.
3. The didactic surface is wide enough that a reviewer spends more than five minutes interacting.

## Six designated heroes (status as of 2026-05-14 03:13 UTC)

| Slug | Status | Renderer | Invariants | WebGL2 module |
|-|-|-|-|-|
| `wave-heightfield-clickable-3d` | shipped | webgl2 + canvas2d fallback | 5/5 | shared/js/engine-gl/wave-2d.js (246 lines): RGBA16F ping-pong + leapfrog step shader + 3D Blinn-Phong heightfield surface + three-point lighting + ACES. |
| `lorenz-attractor-3d-ensemble` | shipped | webgl2 + canvas2d fallback | 3/3 | shared/js/engine-gl/lorenz-ensemble.js (240 lines): 1024-particle RK4 in fragment shader + HDR additive splat accumulator + geometric decay + viridis + ACES + vignette. |
| `hydrogen-orbitals-3d` | shipped | webgl2 + canvas2d fallback | 7/7 | shared/js/engine-gl/hydrogen-orbital.js (204 lines): 40^3 volume sampled from CPU mirror, uploaded as R16F TEXTURE_3D, 96-step ray-march with density-weighted viridis emission. |
| `tokamak-plasma-confinement-3d` | shipped | webgl2 + canvas2d fallback | 4/4 | shared/js/engine-gl/tokamak.js: translucent torus mesh + helical field-line bundle (LINES) colored by hue + Blinn-Phong + ACES. |
| `earth-axial-precession-nutation-3d` | shipped | webgl2 | 5/5 | shared/js/engine-gl/earth-rotation.js: oblate sphere mesh + 3-octave fractal-noise land/sea/ice procedural texture + Lambertian + atmospheric rim glow + axis line. |
| `schwarzschild-kerr-blackhole-3d` | shipped | webgl2 | 9/9 | shared/js/engine-gl/schwarzschild-kerr.js: per-pixel impact-parameter check + horizon capture + photon-ring highlight + pseudo-lensed disk with Planck blackbody emission + procedural starfield + ACES + vignette. |

All six heroes verified, total 33 hero invariants passing. 1327/1327 total tests pass.

## WebGL2 exemption

CLAUDE.md hard rule 8 retains Canvas2D + SVG as the default. WebGL2 is allowed only for `hero_candidate: true` + `renderer: webgl2` playgrounds, each shipping a CPU mirror at `shared/js/engine/<slug>-cpu.js`. The CPU mirror exercises invariants; the GPU path falls back to Canvas2D if WebGL2 init fails (e.g., EXT_color_buffer_float missing). Visual tests run under SwiftShader.

## Hero invariant coverage

Each hero ships passing invariants exercised against the CPU mirror:

- wave: energy conservation, damping, boundary, Dirichlet BC.
- lorenz: initial ball constraints, attractor centroid (~23.6 in z), spread growth.
- hydrogen: E_n = -13.6 eV/n^2, nodal plane for 2p_z at theta=pi/2, expected r match.
- tokamak: q_a formula, q_axis = q_a / 2 for parabolic, Bt ∝ 1/R.
- earth: 50.29 arcsec/yr precession, 18.6-yr period, 9.2"/17.2" nutation amplitudes.
- schwarzschild-kerr: r_s = 2M, b_crit = 3√3M, Kerr prograde/retrograde ISCO, 4M/b deflection.

GPU paths are not gated by these tests directly; the CPU mirror is canonical, and SwiftShader-based SSIM checks gate visual conformance.

## Future work

`docs/NEEDS-ATTENTION.md` lists remaining polish: hook/one_paragraph copy (Andreas-authored), Phase 5 perf budget, Phase 3 a11y audit script, CPU-vs-GPU agreement tests at 1e-4 / 1000 steps / seed 0xC0FFEE.
