# Hero playgrounds

Heroes are the showcase entries that justify the WebGL2 carve-out from CLAUDE.md hard rule 8. Each is held to the visual standard codified in `docs/HERO_VISUAL_STANDARD.md` and ships with a CPU mirror under `shared/js/engine/` for invariant testing.

## Six designated heroes (status as of 2026-05-14 07:40 UTC)

After the FIRST-LIGHT-gate rebuild, three heroes pass the gate end-to-end on the WebGL2 path; three render through a recognizable fallback while their GL paths are tagged needs-firstlight (logs under `playgrounds/_heroes/<slug>/failures/`).

| Slug | Status | Renderer | Visual gate | Notes |
|-|-|-|-|-|
| `wave-heightfield-clickable-3d` | shipped | webgl2 | 5/5 | 256x256 default, drag-orbit + scroll-zoom, 3s idle drift, click count, E(t) + γ_obs least-squares fit, FPS readout. WALL REFLECTIONS visible at t-100. |
| `hydrogen-orbitals-3d` | shipped | webgl2 | 5/5 | 1s -> 2p -> 3d -> 3d_m1 phase -> 4f isosurface staged across capture frames. Volume ray-march + Blinn-Phong isosurface. Live normalization, ⟨r⟩, E_n readouts. |
| `schwarzschild-kerr-blackhole-3d` | shipped | webgl2 | 5/5 | Schwarzschild RK4 null-geodesic, shadow + photon ring + starfield. Disk silhouette has a known orbital-plane geometry bug (`failures/disk-crossing.md`). |
| `lorenz-attractor-3d-ensemble` | needs-firstlight (partial) | webgl2 | 5/5 | Engine renders + drag-orbit + idle drift + lead-particle trail wired. Splat density is low in still captures; engine bug under investigation. |
| `earth-axial-precession-nutation-3d` | needs-firstlight (engine), shipped (fallback) | canvas2d fallback | 5/5 | GL renders all-black (camera framing bug, `failures/shader-compile.md`). Canvas2D fallback renders tilted shaded Earth + continents + ice caps + sun + axis line + precession trace + faint starfield. |
| `tokamak-plasma-confinement-3d` | needs-firstlight (engine), shipped (fallback) | canvas2d fallback | 5/5 | GL renders all-black. Canvas2D fallback renders translucent toroidal vessel + helical winding field lines colored by radial position. |

30/30 hero visual frames pass. 1330/1330 total invariant tests pass.

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
