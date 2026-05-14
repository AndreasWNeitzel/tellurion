# Hero playgrounds

Heroes are the showcase entries that justify the WebGL2 carve-out from CLAUDE.md hard rule 8. Each is held to the visual standard codified in `docs/HERO_VISUAL_STANDARD.md` and ships with a CPU mirror under `shared/js/engine/` for invariant testing.

## Six designated heroes (status as of 2026-05-14 03:40 UTC)

All 6 heroes ship the full visual-standard pipeline: HDR scene -> threshold + horizontal blur + vertical blur + composite with ACES tonemap + blue-noise dither + vignette. The post-process module is `shared/js/engine-gl/postprocess.js` and is invoked at the end of every hero's render function.

| Slug | Status | Renderer | Invariants | WebGL2 module |
|-|-|-|-|-|
| `wave-heightfield-clickable-3d` | shipped | webgl2 + canvas2d fallback | 5/5 | `engine-gl/wave-2d.js`: RGBA16F ping-pong + leapfrog step + 3D Blinn-Phong heightfield + three-point lighting + bloom on bright crests. |
| `lorenz-attractor-3d-ensemble` | shipped | webgl2 + canvas2d fallback | 3/3 | `engine-gl/lorenz-ensemble.js`: 1024-particle RK4 + HDR additive splat accumulator + geometric decay + viridis + bloom on attractor highlights. |
| `hydrogen-orbitals-3d` | shipped | webgl2 + canvas2d fallback | 7/7 | `engine-gl/hydrogen-orbital.js`: 40^3 R16F TEXTURE_3D volume + 96-step density-weighted ray-march + bloom on bright voxels. |
| `tokamak-plasma-confinement-3d` | shipped | webgl2 + canvas2d fallback | 4/4 | `engine-gl/tokamak.js`: translucent torus mesh + helical field-line bundle + Blinn-Phong + bloom on bright field tubes. |
| `earth-axial-precession-nutation-3d` | shipped | webgl2 | 5/5 | `engine-gl/earth-rotation.js`: oblate sphere + fractal-noise land/sea/ice + Lambertian + atmospheric rim glow + axis line + subtle bloom on lit hemisphere. |
| `schwarzschild-kerr-blackhole-3d` | shipped | webgl2 | 9/9 | `engine-gl/schwarzschild-kerr.js`: per-pixel impact-parameter + horizon capture + photon-ring + Planck disk emission + procedural starfield + bloom on hot disk pixels. |

All six heroes verified, total 33 hero invariants passing. 1327/1327 total tests pass.

## WebGL2 + post-process pipeline

```
hero shader -> RGBA16F sceneFBO (with optional depth attachment)
            -> postprocess.run(sceneFBO.tex)
              -> threshold to bloomA      (knee 0.25 around threshold)
              -> Gaussian h-blur to bloomB
              -> Gaussian v-blur to bloomA
              -> composite scene + bloom + ACES + blue-noise dither + vignette
            -> default framebuffer
```

Threshold ranges per hero: 0.75 (hydrogen volume emission) -> 0.85 (Lorenz, tokamak, BH) -> 0.9-0.95 (Earth, wave). Bloom strength 0.35-0.6.

## WebGL2 exemption

CLAUDE.md hard rule 8 retains Canvas2D + SVG as the default. WebGL2 is allowed only for `hero_candidate: true` + `renderer: webgl2` playgrounds, each shipping a CPU mirror at `shared/js/engine/<slug>-cpu.js`. The CPU mirror exercises invariants; the GPU path falls back to Canvas2D if WebGL2 init fails (e.g., EXT_color_buffer_float missing). Visual tests run under SwiftShader.

## Future work

Remaining polish (`docs/NEEDS-ATTENTION.md`):
- Full Kerr ray-trace (per-pixel RK4 in Boyer-Lindquist with Carter constants).
- Marching-cubes isosurface mode toggle for hydrogen-orbitals-3d.
- Banana-orbit test particles + plasma volumetric emission for tokamak-plasma-confinement-3d.
- Sun + Moon orbit + precession-trace cone for earth-axial-precession-nutation-3d.
- CPU-vs-GPU agreement test (1e-4 after 1000 steps at seed 0xC0FFEE).
